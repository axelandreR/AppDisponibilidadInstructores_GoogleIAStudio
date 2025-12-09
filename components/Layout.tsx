import React, { useState } from 'react';
import { LogOut, LayoutDashboard, Users, Settings, Shield, User as UserIcon, Lock, Menu, X } from 'lucide-react';
import { Role, User } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define navigation tabs based on roles
  const getTabs = () => {
    const tabs = [];

    if (user.role === Role.INSTRUCTOR) {
      tabs.push({ id: 'availability', label: 'Mi Disponibilidad', icon: LayoutDashboard, path: '/availability' });
      tabs.push({ id: 'profile', label: 'Mi Perfil', icon: UserIcon, path: '/profile' });
    } else {
      // Admin tabs
      if (user.role === Role.SUPER_ADMIN || user.permissions?.canViewDashboard) {
        tabs.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' });
      }
      if (user.role === Role.SUPER_ADMIN || user.permissions?.canManageInstructors) {
        tabs.push({ id: 'instructors', label: 'Instructores', icon: Users, path: '/admin/instructors' });
      }
      if (user.role === Role.SUPER_ADMIN || user.permissions?.canManageConfig) {
        tabs.push({ id: 'config', label: 'Configuración', icon: Settings, path: '/admin/config' });
      }
      if (user.role === Role.SUPER_ADMIN) {
        tabs.push({ id: 'admins', label: 'Administradores', icon: Shield, path: '/super/admins' });
      }
    }
    return tabs;
  };

  const tabs = getTabs();

  // Helper function to map Roles to readable text
  const getRoleName = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN: return 'Super Administrador';
      case Role.ADMIN: return 'Administrador';
      case Role.INSTRUCTOR: return 'Instructor';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">Panel de Administración</h1>
            <p className="text-sm text-slate-400 font-medium">{getRoleName(user.role)}</p>
          </div>
        </div>

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button className="flex items-center gap-2 text-purple-600 text-sm font-semibold hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-purple-100">
            <Lock size={16} />
            Cambiar Contraseña
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-slate-600 text-sm font-semibold hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors border border-slate-200"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Navigation Tabs (Desktop) */}
      <div className="bg-white px-6 border-b border-gray-100 shadow-sm hidden md:block">
        <div className="flex gap-8">
          {tabs.map(tab => {
            const isActive = location.pathname.includes(tab.path);
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`
                      flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-all
                      ${isActive
                    ? 'border-slate-800 text-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}
                    `}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 absolute w-full z-30 shadow-lg">
          <nav className="flex flex-col gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { navigate(tab.path); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium ${location.pathname.includes(tab.path) ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
            <hr className="my-2 border-slate-100" />
            <button
              onClick={onLogout}
              className="flex items-center gap-3 p-3 text-red-600 font-medium text-sm"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
};

export default Layout;