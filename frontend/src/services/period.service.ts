import { api } from './api';
import { AcademicPeriod } from '../types/availability.types';

export const periodService = {
  // Obtiene el periodo activo actual
  getActive: async (): Promise<AcademicPeriod> => {
    const response = await api.get<AcademicPeriod>('/config/period');
    return response.data;
  },

  // (Admin) Cambiar estado de la ventana de carga
  toggleWindow: async (isOpen: boolean): Promise<{ isOpen: boolean }> => {
    const response = await api.patch('/config/window', { isOpen });
    return response.data;
  },

  // (Admin) Actualizar datos del periodo
  updatePeriod: async (data: Partial<AcademicPeriod>): Promise<AcademicPeriod> => {
    const response = await api.put('/config/period', data);
    return response.data;
  }
};