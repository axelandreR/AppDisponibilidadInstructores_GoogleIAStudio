import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/auth.types';
import { Button } from '../../components/ui/Button';
import { Lock, User as UserIcon, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.id || !formData.password) {
      setError('Por favor complete todos los campos');
      return;
    }

    try {
      await login(formData.id, formData.password);
      
      // Leer el usuario directamente del storage recién actualizado o esperar a que el contexto se actualice.
      // Aquí, asumimos que el login fue exitoso.
      // Para redirección robusta, lo ideal es obtener el usuario de la respuesta del login.
      // Como login() es void en el contexto, leemos del storage temporalmente para decidir.
      const userStr = localStorage.getItem('user');
      if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === Role.INSTRUCTOR) {
              navigate('/availability');
          } else {
              navigate('/admin/dashboard');
          }
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
          setError('Credenciales inválidas o cuenta inactiva.');
      } else {
          setError('Error de conexión con el servidor.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Sistema de Disponibilidad</h1>
          <p className="text-slate-400 text-sm">Gestión Académica de Instructores</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">Iniciar Sesión</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID de Usuario</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej. INST-001"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Ingresar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};