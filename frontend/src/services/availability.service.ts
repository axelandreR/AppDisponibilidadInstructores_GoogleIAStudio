import { api } from './api';
import { AvailabilityVersion, CreateAvailabilityDto } from '../types/availability.types';

export const availabilityService = {
  // Obtener historial del instructor logueado
  getMyHistory: async (periodId: string): Promise<AvailabilityVersion[]> => {
    const response = await api.get<AvailabilityVersion[]>(`/availability/my-history?periodId=${periodId}`);
    return response.data;
  },

  // Crear nueva versión (Guardar)
  create: async (data: CreateAvailabilityDto): Promise<AvailabilityVersion> => {
    const response = await api.post<AvailabilityVersion>('/availability', data);
    return response.data;
  },

  // Marcar como final
  markAsFinal: async (versionId: string): Promise<void> => {
    await api.patch(`/availability/${versionId}/final`);
  }
};