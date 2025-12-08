import { api } from './api';
import { AcademicPeriod } from '../types';

export const periodService = {
  // Get active period
  getActive: async (): Promise<AcademicPeriod> => {
    // Mocking response for demo if backend not connected
    try {
        const response = await api.get<AcademicPeriod>('/config/period');
        return response.data;
    } catch (e) {
        // Fallback mock
        return {
            id: '2024-1',
            name: 'Ciclo 2024-1 (Mock)',
            startDate: '2024-03-01',
            endDate: '2024-07-15',
            isActive: true,
            isOpenForSubmission: true
        };
    }
  },

  // Toggle submission window
  toggleWindow: async (isOpen: boolean): Promise<{ isOpen: boolean }> => {
    const response = await api.patch('/config/window', { isOpen });
    return response.data;
  },

  // Update period details
  updatePeriod: async (data: Partial<AcademicPeriod>): Promise<AcademicPeriod> => {
    const response = await api.put('/config/period', data);
    return response.data;
  }
};
