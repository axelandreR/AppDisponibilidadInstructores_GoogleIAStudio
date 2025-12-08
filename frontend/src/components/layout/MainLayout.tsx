import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Outlet renderiza la página hija correspondiente a la ruta */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};