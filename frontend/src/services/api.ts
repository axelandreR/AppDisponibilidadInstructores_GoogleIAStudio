import axios from 'axios';

// URL base del backend (NestJS)
const API_URL = 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request: Inyectar Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response: Manejo global de errores (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend devuelve 401 (Unauthorized), significa token inválido o expirado
    if (error.response && error.response.status === 401) {
      // Evitar loop infinito si ya estamos en login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);