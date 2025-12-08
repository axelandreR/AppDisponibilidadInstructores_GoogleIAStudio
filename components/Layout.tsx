import React from 'react';
import { LogOut, Calendar, Users, Settings, Shield, Menu, LayoutDashboard } from 'lucide-react';
import { Role, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, title }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const NavItem = ({ icon: Icon, label, hash }: { icon: any, label: string, hash: string }) => (
    <a
      href={hash}
      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
      onClick={() => setSidebarOpen(false)}
    >
      <Icon size={20} />
      <span>{label}</span>
    </a>
  );

  // Helper to check permissions enforcing Role Hierarchy
  // Super Admin bypasses all specific checks. Admin requires specific flags.
  const hasPermission = (permission: keyof NonNullable<User['permissions']>) => {
    if (user.role === Role.SUPER_ADMIN) return true;
    if (user.role === Role.ADMIN) return !!user.permissions?.[permission];
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
              Gestión Académica
            </h1>
            <p className="text-xs text-slate-400 mt-1">v1.0.0 • {user.role.replace('_', ' ')}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {/* INSTRUCTOR MODULES */}
            {user.role === Role.INSTRUCTOR && (
              <>
                <div className="px-4 text-xs font-semibold text-slate-500 uppercase mb-2 mt-2">Instructor</div>
                <NavItem icon={Calendar} label="Mi Disponibilidad" hash="#/availability" />
                <NavItem icon={Settings} label="Mi Perfil" hash="#/profile" />
              </>
            )}

            {/* ADMIN MODULES */}
            {(user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) && (
              <>
                <div className="px-4 text-xs font-semibold text-slate-500 uppercase mb-2 mt-2">Administración</div>
                
                {hasPermission('canViewDashboard') && (
                  <NavItem icon={LayoutDashboard} label="Dashboard" hash="#/admin/dashboard" />
                )}
                
                {hasPermission('canManageInstructors') && (
                  <NavItem icon={Users} label="Instructores" hash="#/admin/instructors" />
                )}
                
                {hasPermission('canManageConfig') && (
                   <NavItem icon={Settings} label="Configuración" hash="#/admin/config" />
                )}
              </>
            )}

            {/* SUPER ADMIN MODULES */}
            {user.role === Role.SUPER_ADMIN && (
              <div className="pt-4 border-t border-slate-700 mt-4">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase mb-2">Sistema</p>
                <NavItem icon={Shield} label="Administradores" hash="#/super/admins" />
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center space-x-3 mb-4 px-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${user.role === Role.SUPER_ADMIN ? 'bg-purple-600' : 'bg-blue-600'}`}>
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-600/10 text-red-400 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 lg:hidden p-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
            <Menu size={24} />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
           <div className="max-w-7xl mx-auto">
             <div className="mb-6 hidden lg:block">
               <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
             </div>
             {children}
           </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;