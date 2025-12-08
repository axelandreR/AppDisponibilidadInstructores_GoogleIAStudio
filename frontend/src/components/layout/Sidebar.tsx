import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/auth.types';
import { 
  Calendar, 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Shield 
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
          Gestión Académica
        </h1>
        <p className="text-xs text-slate-400 mt-1">{user.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {/* INSTRUCTOR MENUS */}
        {user.role === Role.INSTRUCTOR && (
          <>
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase mb-2 mt-2">Instructor</div>
            <NavItem to="/availability" icon={Calendar} label="Mi Disponibilidad" />
            <NavItem to="/profile" icon={Settings} label="Mi Perfil" />
          </>
        )}

        {/* ADMIN MENUS */}
        {(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) && (
          <>
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase mb-2 mt-2">Administración</div>
            <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
            
            {/* Verificar permisos granulares si es ADMIN normal */}
            {(user.role === Role.SUPER_ADMIN || user.permissions?.canManageInstructors) && (
               <NavItem to="/admin/instructors" icon={Users} label="Instructores" />
            )}
            
            {(user.role === Role.SUPER_ADMIN || user.permissions?.canManageConfig) && (
               <NavItem to="/admin/config" icon={Settings} label="Configuración" />
            )}
          </>
        )}

        {/* SUPER ADMIN MENUS */}
        {user.role === Role.SUPER_ADMIN && (
          <>
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase mb-2 mt-4 pt-4 border-t border-slate-700">Sistema</div>
            <NavItem to="/super/admins" icon={Shield} label="Administradores" />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 bg-slate-800 text-slate-300 py-2 rounded-lg hover:bg-red-900/50 hover:text-red-200 transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};