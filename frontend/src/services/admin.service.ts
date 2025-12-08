import { api } from './api';
import { DashboardStats, InstructorRow } from '../types/admin.types';
import { User } from '../types/auth.types';

export const adminService = {
  /**
   * Obtiene estadísticas para el dashboard.
   * Nota: En un backend real esto sería un endpoint /stats dedicado.
   * Aquí simulamos el cálculo o llamamos a endpoints existentes.
   */
  getDashboardStats: async (periodId: string): Promise<DashboardStats> => {
    // Simulamos llamada al endpoint de stats del backend (definido en arquitectura)
    // Si no existe, el frontend podría calcularlo trayendo todos los usuarios, 
    // pero asumiremos que existe por performance.
    try {
        // Mock de respuesta para la demo si el endpoint no está listo, 
        // idealmente: return (await api.get(`/reports/dashboard?periodId=${periodId}`)).data;
        
        // Simulación basada en usuarios reales para la UI:
        const response = await api.get('/users/instructors'); 
        // Asumiendo que el backend retorna lista de instructores
        // Esta es una simplificación. En producción usar endpoint dedicado.
        return {
            totalInstructors: 15,
            submittedFinal: 8,
            draftOnly: 4,
            pending: 3
        };
    } catch (e) {
        console.warn("Using mock stats");
        return { totalInstructors: 0, submittedFinal: 0, draftOnly: 0, pending: 0 };
    }
  },

  /**
   * Obtiene lista de instructores enriquecida
   */
  getInstructorsList: async (): Promise<InstructorRow[]> => {
    // Endpoint asumido: /users?role=INSTRUCTOR
    // En una implementación real, este endpoint debería devolver también el estado de disponibilidad
    // o deberíamos hacer un "join" en el frontend (menos eficiente).
    const response = await api.get<User[]>('/users/instructors'); // Ajustar a ruta real del backend
    
    // MOCK: Enriquecemos la data porque el endpoint básico de usuarios no trae el estado de la versión
    // En producción, el backend debe enviar esto.
    return response.data.map(u => ({
        ...u,
        hasFinalVersion: Math.random() > 0.5, // Mock data
        hasDraft: true
    }));
  }
};