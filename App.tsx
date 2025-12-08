import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AvailabilityScheduler from './components/AvailabilityScheduler';
import { AdminDashboard, InstructorManager, ConfigurationManager } from './components/AdminViews';
import { Role, User, AcademicPeriod, AvailabilityVersion } from './types';
import { MOCK_USERS, INITIAL_PERIOD } from './constants';
import { validatePassword } from './services/utils';
import { Lock, User as UserIcon, AlertCircle, ArrowRight, ArrowLeft, CheckSquare, Plus, Trash2, X } from 'lucide-react';

// --- Authentication Component ---
const Login = ({ onLogin, onRecovery }: { onLogin: (id: string, pass: string) => void, onRecovery: (id: string, dni: string, newPass: string) => void }) => {
  const [view, setView] = useState<'login' | 'recovery_step1' | 'recovery_step2'>('login');
  const [formData, setFormData] = useState({ id: '', password: '', dni: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetState = () => {
      setFormData({ id: '', password: '', dni: '', newPassword: '', confirmPassword: '' });
      setError('');
      setSuccess('');
      setView('login');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if(formData.id && formData.password) {
        onLogin(formData.id, formData.password);
    } else {
        setError('Por favor completa todos los campos.');
    }
  };

  const handleRecoveryStep1 = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!formData.id || !formData.dni) {
          setError('Ingresa tu ID y DNI para validar tu identidad.');
          return;
      }
      // Simulate Validation logic (In real app, this calls API)
      const mockUser = MOCK_USERS.find(u => u.id === formData.id && u.dni === formData.dni);
      if (mockUser) {
          setView('recovery_step2');
      } else {
          setError('Los datos proporcionados no coinciden con nuestros registros.');
      }
  };

  const handleRecoveryStep2 = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      if (formData.newPassword !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden.');
          return;
      }
      
      if (!validatePassword(formData.newPassword)) {
          setError('La contraseña debe tener al menos 8 caracteres, letras y números.');
          return;
      }

      onRecovery(formData.id, formData.dni, formData.newPassword);
      setSuccess('Contraseña actualizada correctamente. Inicia sesión.');
      setTimeout(() => {
          resetState();
      }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
         <div className="bg-slate-900 p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Sistema de Disponibilidad</h1>
            <p className="text-slate-400 text-sm">Gestión Académica de Instructores</p>
         </div>
         <div className="p-8">
            
            {/* VIEW: LOGIN */}
            {view === 'login' && (
                <>
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">Iniciar Sesión</h2>
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ID de Usuario</label>
                            <div className="relative">
                            <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Ej. INST001"
                                value={formData.id}
                                onChange={e => setFormData({...formData, id: e.target.value})}
                            />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                            <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                                <AlertCircle size={16} className="shrink-0"/> {error}
                            </div>
                        )}

                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                            Ingresar
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => { setError(''); setView('recovery_step1'); }} 
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                </>
            )}

            {/* VIEW: RECOVERY STEP 1 (Identity) */}
            {view === 'recovery_step1' && (
                <>
                     <div className="mb-6">
                        <button onClick={resetState} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm mb-2">
                            <ArrowLeft size={14} /> Volver
                        </button>
                        <h2 className="text-xl font-semibold text-slate-800 text-center">Recuperación de Acceso</h2>
                        <p className="text-sm text-slate-500 text-center mt-1">Paso 1: Validación de Identidad</p>
                    </div>

                    <form onSubmit={handleRecoveryStep1} className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                            Ingresa tu ID de usuario y tu número de DNI registrado para validar tu identidad.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ID de Usuario</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.id}
                                onChange={e => setFormData({...formData, id: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">DNI / Documento</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.dni}
                                onChange={e => setFormData({...formData, dni: e.target.value})}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                                <AlertCircle size={16} className="shrink-0"/> {error}
                            </div>
                        )}

                        <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm flex justify-center items-center gap-2">
                            Validar Identidad <ArrowRight size={16} />
                        </button>
                    </form>
                </>
            )}

            {/* VIEW: RECOVERY STEP 2 (New Password) */}
            {view === 'recovery_step2' && !success && (
                <>
                    <h2 className="text-xl font-semibold text-slate-800 text-center mb-1">Establecer Contraseña</h2>
                    <p className="text-sm text-slate-500 text-center mb-6">Paso 2: Crea tu nueva clave de acceso</p>

                    <form onSubmit={handleRecoveryStep2} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                            <input 
                                type="password" 
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.newPassword}
                                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
                            <input 
                                type="password" 
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                            />
                        </div>
                        
                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                            Requisito: Mínimo 8 caracteres, incluyendo letras y números.
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                                <AlertCircle size={16} className="shrink-0"/> {error}
                            </div>
                        )}

                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                            Cambiar y Acceder
                        </button>
                    </form>
                </>
            )}
            
            {/* SUCCESS STATE */}
            {success && (
                <div className="text-center animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckSquare size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">¡Contraseña Actualizada!</h3>
                    <p className="text-slate-500 text-sm">{success}</p>
                </div>
            )}

         </div>
      </div>
    </div>
  );
};

const ChangePasswordForm = () => {
    // ... existing implementation
    return <div>(Formulario de Cambio de Contraseña)</div>
};

// --- Add Admin Modal ---
const AddAdminModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (u: User) => void }) => {
    // ... existing implementation
    return null;
};

// --- Main App Logic ---
function App() {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [period, setPeriod] = useState<AcademicPeriod>(INITIAL_PERIOD);
  const [availabilities, setAvailabilities] = useState<AvailabilityVersion[]>([]);
  
  // --- Handlers ---
  const handleLogin = (id: string, pass: string) => {
    const user = users.find(u => u.id === id);
    if (user && user.active) {
      if(pass === 'admin' || pass === '123456') { 
        setCurrentUser(user);
      } else {
        alert("Contraseña incorrecta (Prueba con '123456' o 'admin')");
      }
    } else {
      alert("Usuario no encontrado");
    }
  };

  const handleRecovery = (id: string, dni: string, newPass: string) => {
    console.log(`Password updated for user ${id} with DNI ${dni}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const saveAvailability = (slots: string[], comments: string) => {
    if (!currentUser) return;
    
    const newAvailabilities = availabilities.map(a => 
       (a.instructorId === currentUser.id && a.periodId === period.id) 
       ? { ...a, isFinal: false } 
       : a
    );

    const newVersion: AvailabilityVersion = {
      id: Date.now().toString(),
      instructorId: currentUser.id,
      periodId: period.id,
      timestamp: new Date().toISOString(),
      slots,
      comments,
      isFinal: true 
    };

    setAvailabilities([...newAvailabilities, newVersion]);
  };

  const handleMarkAsFinal = (versionId: string) => {
      if (!currentUser) return;
      const newAvailabilities = availabilities.map(a => {
          if (a.id === versionId) return { ...a, isFinal: true };
          if (a.instructorId === currentUser.id && a.periodId === period.id) return { ...a, isFinal: false };
          return a;
      });
      setAvailabilities(newAvailabilities);
  };

  // --- Routing Guards & RBAC Logic ---
  const ProtectedRoute = ({ 
    children, 
    allowedRoles, 
    requiredPermission 
  }: { 
    children?: React.ReactNode, 
    allowedRoles: Role[], 
    requiredPermission?: keyof NonNullable<User['permissions']> 
  }) => {
    if (!currentUser) return <Navigate to="/login" replace />;
    if (!allowedRoles.includes(currentUser.role)) return <Navigate to="/" replace />;
    if (currentUser.role === Role.SUPER_ADMIN) return <>{children}</>;
    if (requiredPermission && currentUser.role === Role.ADMIN) {
        if (!currentUser.permissions?.[requiredPermission]) {
            return <Navigate to="/" replace />;
        }
    }
    return <>{children}</>;
  };

  // --- Render ---
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          !currentUser ? <Login onLogin={handleLogin} onRecovery={handleRecovery} /> : <Navigate to="/" replace />
        } />
        
        <Route path="/" element={
           currentUser ? (
              currentUser.role === Role.INSTRUCTOR ? <Navigate to="/availability" /> : <Navigate to="/admin/dashboard" />
           ) : <Navigate to="/login" />
        } />

        {/* Instructor Routes */}
        <Route path="/availability" element={
          <ProtectedRoute allowedRoles={[Role.INSTRUCTOR]}>
            <Layout user={currentUser!} onLogout={handleLogout} title="Dashboard de Instructor">
               <AvailabilityScheduler 
                 user={currentUser!} 
                 period={period} 
                 onSave={saveAvailability}
                 onMarkFinal={handleMarkAsFinal}
                 previousVersions={availabilities.filter(a => a.instructorId === currentUser?.id && a.periodId === period.id)}
               />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={[Role.INSTRUCTOR]}>
             <Layout user={currentUser!} onLogout={handleLogout} title="Mi Perfil">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <UserIcon size={20} className="text-blue-500" />
                            Datos del Instructor
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-500 block">Nombre:</span> {currentUser?.name}</div>
                            <div><span className="text-slate-500 block">Email:</span> {currentUser?.email}</div>
                            <div><span className="text-slate-500 block">ID:</span> {currentUser?.id}</div>
                            <div><span className="text-slate-500 block">Rol:</span> {currentUser?.role}</div>
                            <div><span className="text-slate-500 block">DNI:</span> {currentUser?.dni}</div>
                        </div>
                    </div>
                </div>
             </Layout>
          </ProtectedRoute>
        } />

        {/* Admin Routes - No longer passing props! Components fetch their own data. */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]} requiredPermission="canViewDashboard">
            <Layout user={currentUser!} onLogout={handleLogout} title="Dashboard Administrativo">
               <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/instructors" element={
          <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]} requiredPermission="canManageInstructors">
            <Layout user={currentUser!} onLogout={handleLogout} title="Gestión de Instructores">
               <InstructorManager />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin/config" element={
          <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]} requiredPermission="canManageConfig">
            <Layout user={currentUser!} onLogout={handleLogout} title="Configuración del Periodo">
               <ConfigurationManager />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Super Admin Route */}
        <Route path="/super/admins" element={
           <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
             <Layout user={currentUser!} onLogout={handleLogout} title="Gestión de Administradores">
                <div className="p-4 text-center text-slate-500">
                    Módulo de Gestión de Administradores (WIP)
                </div>
             </Layout>
           </ProtectedRoute>
        } />

      </Routes>
    </HashRouter>
  );
}

export default App;