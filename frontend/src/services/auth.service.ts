import { api } from './api';
import { LoginResponse } from '../types/auth.types';

export const authService = {
  login: async (id: string, password: string): Promise<LoginResponse> => {
    // El backend espera { id, password } según el DTO
    const response = await api.post<LoginResponse>('/auth/login', { id, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Opcional: Obtener perfil actualizado
  getProfile: async () => {
      const response = await api.get('/auth/me');
      return response.data;
  }
};