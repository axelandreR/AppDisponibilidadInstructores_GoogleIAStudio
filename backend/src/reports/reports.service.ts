import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AvailabilityService } from '../availability/availability.service';
import { User, AvailabilityVersion } from '@prisma/client';

// Interfaces para tipado interno del reporte
interface ReportRow {
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  periodId: string;
  status: 'FINAL' | 'BORRADOR' | 'PENDIENTE';
  day: string;
  startTime: string;
  endTime: string;
  comments: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private usersService: UsersService,
    private availabilityService: AvailabilityService,
  ) {}

  /**
   * Genera el CSV para un reporte individual
   */
  async generateIndividualReport(instructorId: string, periodId: string): Promise<string> {
    const user = await this.usersService.findOne(instructorId);
    if (!user) throw new NotFoundException('Instructor no encontrado');

    // Obtener versión efectiva (Final > Última > Null)
    const effectiveVersion = await this.availabilityService.getEffectiveVersion(instructorId, periodId);
    
    const rows = this.processVersionToRows(user, periodId, effectiveVersion);
    return this.convertToCSV(rows);
  }

  /**
   * Genera el CSV para el reporte consolidado de TODOS los instructores
   */
  async generateConsolidatedReport(periodId: string): Promise<string> {
    // 1. Obtener todos los instructores (en un caso real, usar paginación o streams si son miles)
    // Usamos el servicio de users, asumiendo que podemos filtrar por rol si es necesario,
    // o traemos todos y filtramos aquí. Por simplicidad, traemos todos.
    const allUsers = (await (this.usersService as any).prisma.user.findMany({
      where: { role: 'INSTRUCTOR', isActive: true },
      orderBy: { name: 'asc' }
    })) as User[];

    let allRows: ReportRow[] = [];

    // 2. Iterar y procesar (Esto podría optimizarse con una sola query compleja, 
    // pero reutilizar la lógica de negocio garantiza consistencia).
    for (const user of allUsers) {
      const effectiveVersion = await this.availabilityService.getEffectiveVersion(user.id, periodId);
      const rows = this.processVersionToRows(user, periodId, effectiveVersion);
      allRows = [...allRows, ...rows];
    }

    return this.convertToCSV(allRows);
  }

  // --- LÓGICA DE TRANSFORMACIÓN DE DATOS ---

  /**
   * Transforma una Versión de Disponibilidad (con slots tipo "Lunes-08:00") 
   * en filas planas con rangos de tiempo ("Lunes", "08:00", "09:00").
   */
  private processVersionToRows(user: User, periodId: string, version: any): ReportRow[] {
    const baseData = {
      instructorId: user.id,
      instructorName: user.name,
      instructorEmail: user.email,
      periodId: periodId,
    };

    if (!version) {
      return [{
        ...baseData,
        status: 'PENDIENTE',
        day: '-',
        startTime: '-',
        endTime: '-',
        comments: '',
      }];
    }

    const status = version.isFinal ? 'FINAL' : 'BORRADOR';
    // Condensar los slots ("Lunes-08:00", "Lunes-08:30") en rangos
    const ranges = this.condenseSlots(version.slots as string[]);

    if (ranges.length === 0) {
        return [{
            ...baseData,
            status,
            day: 'SIN DISPONIBILIDAD',
            startTime: '-',
            endTime: '-',
            comments: version.comments || '',
        }];
    }

    return ranges.map(range => ({
      ...baseData,
      status,
      day: range.day,
      startTime: range.start,
      endTime: range.end,
      comments: version.comments ? version.comments.replace(/\n/g, ' ') : '', // Sanitizar saltos de línea
    }));
  }

  /**
   * Convierte array de filas en string CSV
   */
  private convertToCSV(rows: ReportRow[]): string {
    const header = [
      'ID Instructor', 
      'Nombre', 
      'Email', 
      'Periodo', 
      'Estado', 
      'Día', 
      'Hora Inicio', 
      'Hora Fin', 
      'Observaciones'
    ].join(',');

    const body = rows.map(row => [
      `"${row.instructorId}"`,
      `"${row.instructorName}"`,
      `"${row.instructorEmail}"`,
      `"${row.periodId}"`,
      `"${row.status}"`,
      `"${row.day}"`,
      `"${row.startTime}"`,
      `"${row.endTime}"`,
      `"${row.comments || ''}"`
    ].join(',')).join('\n');

    return `${header}\n${body}`;
  }

  /**
   * Algoritmo para agrupar bloques de 30 min en rangos continuos
   * Entrada: ["Lunes-08:00", "Lunes-08:30", "Lunes-10:00"]
   * Salida: [{day: "Lunes", start: "08:00", end: "09:00"}, {day: "Lunes", start: "10:00", end: "10:30"}]
   */
  private condenseSlots(slots: string[]): { day: string, start: string, end: string }[] {
    if (!slots || slots.length === 0) return [];

    // 1. Agrupar por día y convertir hora a minutos para ordenar
    const slotsByDay: Record<string, number[]> = {};
    
    slots.forEach(slot => {
      const [day, time] = slot.split('-');
      const [hh, mm] = time.split(':').map(Number);
      const minutes = hh * 60 + mm; // 08:00 -> 480
      
      if (!slotsByDay[day]) slotsByDay[day] = [];
      slotsByDay[day].push(minutes);
    });

    const result = [];

    // 2. Procesar cada día
    for (const day of Object.keys(slotsByDay)) {
      const times = slotsByDay[day].sort((a, b) => a - b);
      
      let start = times[0];
      let prev = times[0];

      for (let i = 1; i < times.length; i++) {
        // Si el bloque actual NO es 30 min después del anterior, se rompe la cadena
        if (times[i] !== prev + 30) {
          result.push(this.createRange(day, start, prev + 30));
          start = times[i];
        }
        prev = times[i];
      }
      // Agregar el último rango
      result.push(this.createRange(day, start, prev + 30));
    }

    return result;
  }

  private createRange(day: string, startMin: number, endMin: number) {
    const format = (m: number) => {
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      return `${hh}:${mm}`;
    };
    return { day, start: format(startMin), end: format(endMin) };
  }
}