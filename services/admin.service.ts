import { api } from './api';
import { DashboardStats, InstructorRow } from '../types';
import { MOCK_USERS } from '../constants'; // Fallback

export const adminService = {
  /**
   * Get Dashboard Stats
   */
  getDashboardStats: async (periodId: string): Promise<DashboardStats> => {
    try {
        // Real endpoint: return (await api.get(`/reports/dashboard?periodId=${periodId}`)).data;
        // Mocking for frontend demo:
        return {
            totalInstructors: 15,
            submittedFinal: 8,
            draftOnly: 4,
            pending: 3
        };
    } catch (e) {
        return { totalInstructors: 0, submittedFinal: 0, draftOnly: 0, pending: 0 };
    }
  },

  /**
   * Get Instructors List with Status
   */
  getInstructorsList: async (): Promise<InstructorRow[]> => {
    try {
        // Real endpoint: const response = await api.get('/users/instructors');
        // Mock data logic for demonstration
        const mockInstructors = MOCK_USERS.filter(u => u.role === 'INSTRUCTOR').map(u => ({
            ...u,
            hasFinalVersion: Math.random() > 0.5,
            hasDraft: true,
            lastUpdate: new Date().toISOString()
        }));
        return mockInstructors;
    } catch (e) {
        return [];
    }
  }
};
