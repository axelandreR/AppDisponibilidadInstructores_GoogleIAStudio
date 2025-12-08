import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth.types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles definidos, verificar si el usuario tiene uno de ellos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir a su home default según su rol real para evitar "Access Denied" seco
    const redirectPath = user.role === Role.INSTRUCTOR ? '/availability' : '/admin/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};