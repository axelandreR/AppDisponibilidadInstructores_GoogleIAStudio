import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AvailabilityScheduler from './components/AvailabilityScheduler';
import { AdminDashboard, InstructorManager, ConfigurationManager } from './components/AdminViews';
import { Role, User, AcademicPeriod, AvailabilityVersion } from './types';
import { MOCK_USERS, INITIAL_PERIOD } from './constants';
import { generateAvailabilityReport, downloadCSV, validatePassword } from './services/utils';
import { Lock, User as UserIcon, Shield, Trash2, Plus, X, CheckSquare, Square, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

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
        if (formData.id && formData.password) {
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
                                            onChange={e => setFormData({ ...formData, id: e.target.value })}
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
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                                        <AlertCircle size={16} className="shrink-0" /> {error}
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
                                        onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">DNI / Documento</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.dni}
                                        onChange={e => setFormData({ ...formData, dni: e.target.value })}
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                                        <AlertCircle size={16} className="shrink-0" /> {error}
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
                                        onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>

                                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                    Requisito: Mínimo 8 caracteres, incluyendo letras y números.
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in">
                                        <AlertCircle size={16} className="shrink-0" /> {error}
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
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [msg, setMsg] = useState({ text: '', type: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ text: '', type: '' });

        if (passwords.new !== passwords.confirm) {
            setMsg({ text: "Error: Las contraseñas no coinciden", type: 'error' });
            return;
        }

        if (!validatePassword(passwords.new)) {
            setMsg({ text: "Error: Mínimo 8 caracteres, al menos 1 letra y 1 número.", type: 'error' });
            return;
        }

        // In a real app, verify current password against DB here
        setMsg({ text: "Éxito: Contraseña actualizada correctamente", type: 'success' });
        setPasswords({ current: '', new: '', confirm: '' });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
                <label className="block text-sm text-slate-600 mb-1">Contraseña Actual</label>
                <input type="password" required className="w-full border p-2 rounded" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
            </div>
            <div>
                <label className="block text-sm text-slate-600 mb-1">Nueva Contraseña</label>
                <input type="password" required className="w-full border p-2 rounded" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} />
                <p className="text-xs text-slate-400 mt-1">Mínimo 8 caracteres, debe incluir letras y números.</p>
            </div>
            <div>
                <label className="block text-sm text-slate-600 mb-1">Confirmar Nueva Contraseña</label>
                <input type="password" required className="w-full border p-2 rounded" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
            </div>
            {msg.text && (
                <p className={`text-sm p-2 rounded ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {msg.text}
                </p>
            )}
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm">Actualizar Contraseña</button>
        </form>
    );
};

// --- Add Admin Modal ---
const AddAdminModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (u: User) => void }) => {
    const [formData, setFormData] = useState({ id: '', name: '', email: '' });
    const [permissions, setPermissions] = useState({
        canManageInstructors: true,
        canViewDashboard: true,
        canManageConfig: false
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: formData.id,
            name: formData.name,
            email: formData.email,
            role: Role.ADMIN,
            active: true,
            permissions
        });
        onClose();
        setFormData({ id: '', name: '', email: '' });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold">Nuevo Administrador</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">ID Usuario</label>
                            <input required className="w-full border p-2 rounded" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                            <input type="email" required className="w-full border p-2 rounded" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
                        <input required className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="bg-slate-50 p-4 rounded border border-slate-200">
                        <p className="text-xs font-bold text-slate-700 mb-3 uppercase">Permisos de Acceso</p>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.canViewDashboard}
                                    onChange={e => setPermissions({ ...permissions, canViewDashboard: e.target.checked })}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Ver Dashboard y Estadísticas</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.canManageInstructors}
                                    onChange={e => setPermissions({ ...permissions, canManageInstructors: e.target.checked })}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Gestionar Instructores (CRUD)</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.canManageConfig}
                                    onChange={e => setPermissions({ ...permissions, canManageConfig: e.target.checked })}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-slate-700">Configuración del Periodo</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Crear Administrador</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main App Logic ---
function App() {
    // --- Global State ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [period, setPeriod] = useState<AcademicPeriod>(INITIAL_PERIOD);
    const [availabilities, setAvailabilities] = useState<AvailabilityVersion[]>([]);
    const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);

    // Stats calculation
    const stats = useMemo(() => {
        const instructors = users.filter(u => u.role === Role.INSTRUCTOR);
        const submitted = new Set(availabilities.filter(a => a.isFinal && a.periodId === period.id).map(a => a.instructorId)).size;
        return {
            totalInstructors: instructors.length,
            submitted: submitted,
            notSubmitted: instructors.length - submitted
        };
    }, [users, availabilities, period.id]);

    // --- Handlers ---
    const handleLogin = (id: string, pass: string) => {
        const user = users.find(u => u.id === id);
        // Mock password validation logic
        if (user && user.active) {
            if (pass === 'admin' || pass === '123456') { // Mock simple passwords
                setCurrentUser(user);
            } else {
                alert("Contraseña incorrecta (Prueba con '123456' o 'admin')");
            }
        } else {
            alert("Usuario no encontrado");
        }
    };

    const handleRecovery = (id: string, dni: string, newPass: string) => {
        // In a real app, this would update the backend
        console.log(`Password updated for user ${id} with DNI ${dni}`);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const saveAvailability = (slots: string[], comments: string) => {
        if (!currentUser) return;

        // Deactivate previous final versions for this user/period because a new save acts as a new submission
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
            isFinal: true // New saves are final by default in this flow
        };

        setAvailabilities([...newAvailabilities, newVersion]);
    };

    const handleMarkAsFinal = (versionId: string) => {
        if (!currentUser) return;

        const newAvailabilities = availabilities.map(a => {
            // If it's the target, make final.
            if (a.id === versionId) return { ...a, isFinal: true };
            // If it belongs to user/period but isn't target, make not final
            if (a.instructorId === currentUser.id && a.periodId === period.id) return { ...a, isFinal: false };
            // Others untouched
            return a;
        });

        setAvailabilities(newAvailabilities);
    };

    const handleAddInstructor = (newUser: User) => {
        setUsers([...users, newUser]);
    };

    const handleUpdateInstructor = (updatedUser: User) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleDeleteInstructor = (id: string) => {
        setUsers(users.filter(u => u.id !== id));
    };

    const handleUpdatePeriod = (newPeriod: AcademicPeriod) => {
        setPeriod(newPeriod);
    };

    const handleDownloadConsolidated = () => {
        const rows = generateAvailabilityReport(users, availabilities);
        downloadCSV('reporte_consolidado.csv', rows);
    };

    // --- Routing Guards & RBAC Logic ---
    const ProtectedRoute = ({
        children,
        allowedRoles,
        requiredPermission
    }: {
        children: React.ReactNode,
        allowedRoles: Role[],
        requiredPermission?: keyof NonNullable<User['permissions']>
    }) => {
        if (!currentUser) return <Navigate to="/login" replace />;

        // 1. Role Check
        if (!allowedRoles.includes(currentUser.role)) return <Navigate to="/" replace />;

        // 2. Super Admin Bypass (RBAC Rule: Super Admin > All)
        if (currentUser.role === Role.SUPER_ADMIN) return <>{children}</>;

        // 3. Granular Permission Check for Admins
        if (requiredPermission && currentUser.role === Role.ADMIN) {
            if (!currentUser.permissions?.[requiredPermission]) {
                // User is Admin but lacks specific area permission
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

                                <div className="bg-white p-6 rounded-lg shadow border">
                                    <h3 className="font-bold mb-4 flex items-center gap-2">
                                        <Lock size={20} className="text-blue-500" />
                                        Seguridad
                                    </h3>
                                    <ChangePasswordForm />
                                </div>
                            </div>
                        </Layout>
                    </ProtectedRoute>
                } />

                {/* Admin Routes with Granular Permissions */}
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]} requiredPermission="canViewDashboard">
                        <Layout user={currentUser!} onLogout={handleLogout} title="Dashboard Administrativo">
                            <AdminDashboard
                                stats={stats}
                                period={period}
                                instructors={users.filter(u => u.role === Role.INSTRUCTOR)}
                                availabilities={availabilities}
                            />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/admin/instructors" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]} requiredPermission="canManageInstructors">
                        <Layout user={currentUser!} onLogout={handleLogout} title="Gestión de Instructores">
                            <InstructorManager
                                instructors={users.filter(u => u.role === Role.INSTRUCTOR)}
                                onAdd={handleAddInstructor}
                                onUpdate={handleUpdateInstructor}
                                onDelete={handleDeleteInstructor}
                            />
                        </Layout>
                    </ProtectedRoute>
                } />

                <Route path="/admin/config" element={
                    <ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]} requiredPermission="canManageConfig">
                        <Layout user={currentUser!} onLogout={handleLogout} title="Configuración del Periodo">
                            <ConfigurationManager period={period} onUpdate={handleUpdatePeriod} />
                        </Layout>
                    </ProtectedRoute>
                } />

                {/* Super Admin Route - Only Role Check needed as it implies all permissions */}
                <Route path="/super/admins" element={
                    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
                        <Layout user={currentUser!} onLogout={handleLogout} title="Gestión de Administradores">
                            <div className="bg-white p-6 rounded-lg shadow-sm border">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-lg text-slate-700">Usuarios Administrativos</h3>
                                    <button
                                        onClick={() => setIsAddAdminModalOpen(true)}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 shadow-sm"
                                    >
                                        <Plus size={16} /> Agregar Admin
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-sm font-semibold text-slate-600">ID</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Nombre</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Rol</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Permisos</th>
                                                <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {users.filter(u => u.role !== Role.INSTRUCTOR).map(admin => (
                                                <tr key={admin.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-sm font-mono">{admin.id}</td>
                                                    <td className="px-4 py-3 text-sm">{admin.name}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${admin.role === Role.SUPER_ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {admin.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500">
                                                        {admin.permissions?.canManageInstructors ? 'Instructores, ' : ''}
                                                        {admin.permissions?.canManageConfig ? 'Config, ' : ''}
                                                        {admin.permissions?.canViewDashboard ? 'Dash' : ''}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        {admin.role !== Role.SUPER_ADMIN && (
                                                            <button onClick={() => handleDeleteInstructor(admin.id)} className="text-red-500 hover:text-red-700">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <AddAdminModal
                                isOpen={isAddAdminModalOpen}
                                onClose={() => setIsAddAdminModalOpen(false)}
                                onSave={handleAddInstructor}
                            />
                        </Layout>
                    </ProtectedRoute>
                } />

            </Routes>
        </HashRouter>
    );
}

export default App;