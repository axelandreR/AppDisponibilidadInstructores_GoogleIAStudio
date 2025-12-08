import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { AvailabilityPage } from './pages/instructor/AvailabilityPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { Role } from './types/auth.types';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas Privadas */}
          <Route element={<MainLayout />}>
            
            {/* Rutas Instructor */}
            <Route element={<ProtectedRoute allowedRoles={[Role.INSTRUCTOR]} />}>
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/profile" element={<div>Perfil de Usuario (WIP)</div>} />
            </Route>

            {/* Rutas Admin / Super Admin */}
            <Route element={<ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]} />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/instructors" element={<div>Gestión Instructores (WIP)</div>} />
              <Route path="/admin/config" element={<div>Configuración (WIP)</div>} />
            </Route>

            {/* Rutas Super Admin */}
            <Route element={<ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]} />}>
              <Route path="/super/admins" element={<div>Gestión Admins (WIP)</div>} />
            </Route>

          </Route>

          {/* Redirección raíz por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;