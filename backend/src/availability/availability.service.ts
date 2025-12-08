import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { AvailabilityVersion } from '@prisma/client';

// Constantes para validación de tiempo
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const START_HOUR = 7.5; // 7:30 AM
const END_HOUR = 22.5; // 10:30 PM

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea una nueva versión de disponibilidad validando las reglas de negocio.
   */
  async create(instructorId: string, dto: CreateAvailabilityDto) {
    // 1. Validar Periodo y Ventana de Carga
    const period = await (this.prisma as any).academicPeriod.findUnique({
      where: { id: dto.periodId },
    });

    if (!period) {
      throw new NotFoundException('Periodo académico no encontrado');
    }

    if (!period.isOpenForSubmission) {
      // Nota: Aquí se podría permitir bypass si el usuario fuese Admin, 
      // pero por ahora aplicamos regla estricta.
      throw new ForbiddenException('La ventana de carga para este periodo está cerrada.');
    }

    // 2. Ejecutar Algoritmo de Validación de Continuidad (Regla de 2 horas)
    this.validateTimeSlots(dto.slots);

    // 3. Persistir la nueva versión
    // Usamos JSON.stringify o pasamos el array directo dependiendo de la config de Prisma,
    // pero Prisma maneja array de strings a Json[] automáticamente.
    return (this.prisma as any).availabilityVersion.create({
      data: {
        instructorId,
        periodId: dto.periodId,
        slots: dto.slots,
        comments: dto.comments,
        isFinal: false, // Por defecto no es final hasta que se marque
      },
    });
  }

  /**
   * Lista el historial de versiones de un instructor para un periodo.
   */
  async findAllByInstructor(instructorId: string, periodId: string) {
    return (this.prisma as any).availabilityVersion.findMany({
      where: {
        instructorId,
        periodId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtiene una versión específica por ID.
   */
  async findOne(id: string) {
    const version = await (this.prisma as any).availabilityVersion.findUnique({
      where: { id },
      include: { instructor: { select: { name: true, email: true } } }
    });
    if (!version) throw new NotFoundException('Versión de disponibilidad no encontrada');
    return version;
  }

  /**
   * Marca una versión como FINAL.
   * Utiliza una transacción para asegurar que solo exista UNA final por instructor/periodo.
   */
  async markAsFinal(versionId: string, instructorId: string) {
    // Verificar propiedad
    const version = await this.findOne(versionId);
    
    // Verificamos que pertenezca al instructor (o sea un admin impersonando, validado en controller)
    // Aquí asumimos validación básica de consistencia
    if (version.instructorId !== instructorId) {
        throw new ForbiddenException('No puedes marcar como final una versión que no te pertenece');
    }

    const periodId = version.periodId;

    // Transacción ACID
    return (this.prisma as any).$transaction([
      // 1. Desmarcar todas las versiones anteriores de este usuario en este periodo
      (this.prisma as any).availabilityVersion.updateMany({
        where: {
          instructorId,
          periodId,
          isFinal: true,
        },
        data: { isFinal: false },
      }),
      // 2. Marcar la actual como final
      (this.prisma as any).availabilityVersion.update({
        where: { id: versionId },
        data: { isFinal: true },
      }),
    ]);
  }

  /**
   * Obtiene la "Versión Efectiva" (Para Reportes).
   * Estrategia: Buscar Final -> Si no, buscar Última -> Si no, null.
   */
  async getEffectiveVersion(instructorId: string, periodId: string) {
    // Paso 1: Intentar buscar la final
    const finalVersion = await (this.prisma as any).availabilityVersion.findFirst({
      where: { instructorId, periodId, isFinal: true },
    });

    if (finalVersion) return { ...finalVersion, source: 'FINAL_MARKED' };

    // Paso 2: Fallback a la última creada (Borrador reciente)
    const latestVersion = await (this.prisma as any).availabilityVersion.findFirst({
      where: { instructorId, periodId },
      orderBy: { createdAt: 'desc' },
    });

    if (latestVersion) return { ...latestVersion, source: 'LATEST_DRAFT' };

    return null; // Sin datos
  }

  // --- LÓGICA DE VALIDACIÓN PRIVADA ---

  private validateTimeSlots(slots: string[]) {
    // Estructura auxiliar para agrupar por día
    // Mapa: Día -> Array de índices numéricos de 30 min
    const dayMap: Record<string, number[]> = {};

    slots.forEach(slot => {
      const [day, time] = slot.split('-');
      
      if (!DAYS.includes(day)) {
        throw new BadRequestException(`Día inválido en bloque: ${slot}`);
      }
      
      const timeIndex = this.timeToIndex(time);
      if (timeIndex === -1) {
        throw new BadRequestException(`Hora fuera de rango en bloque: ${slot}`);
      }

      if (!dayMap[day]) dayMap[day] = [];
      dayMap[day].push(timeIndex);
    });

    // Validar continuidad por cada día
    for (const day of Object.keys(dayMap)) {
      const indices = dayMap[day].sort((a, b) => a - b);
      
      let maxContinuousBlock = 0;
      let currentRun = 1;

      for (let i = 1; i < indices.length; i++) {
        if (indices[i] === indices[i - 1] + 1) {
          currentRun++;
        } else {
          // Se rompió la cadena, verificar si la anterior fue válida (>4 bloques)
          // OJO: La regla dice "Al menos un tramo de 2 horas".
          // Si queremos obligar a que TODOS los tramos sean de 2 horas, la lógica es distinta.
          // El requisito dice: "Al menos un tramo de 2 horas consecutivas".
          // Interpretación estricta académica: NO deben haber bloques aislados menores a 2 horas ("Huecos").
          // Si tengo [08:00, 08:30] (1h) y luego [14:00...18:00] (4h). El primer bloque es inválido.
          
          if (currentRun < 4) {
             const badStartTime = this.indexToTime(indices[i - currentRun]);
             throw new BadRequestException(`Bloque aislado detectado en ${day} a las ${badStartTime}. Mínimo 2 horas consecutivas (4 bloques).`);
          }
          currentRun = 1;
        }
      }

      // Chequear el último run
      if (currentRun < 4) {
        const badStartTime = this.indexToTime(indices[indices.length - currentRun]);
        throw new BadRequestException(`Bloque aislado detectado en ${day} a las ${badStartTime}. Mínimo 2 horas consecutivas (4 bloques).`);
      }
    }
  }

  // Convierte "07:30" a índice 0, "08:00" a 1...
  private timeToIndex(time: string): number {
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr);
    const m = parseInt(mStr);
    const decimalTime = h + (m / 60);

    if (decimalTime < START_HOUR || decimalTime >= END_HOUR) return -1;
    
    // (7.5 - 7.5) * 2 = 0
    // (8.0 - 7.5) * 2 = 1
    return (decimalTime - START_HOUR) * 2;
  }

  private indexToTime(index: number): string {
      const decimalTime = (index / 2) + START_HOUR;
      const h = Math.floor(decimalTime);
      const m = (decimalTime - h) * 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}