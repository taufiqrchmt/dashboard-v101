import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import type { UserRole } from '@shared/types';
interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const profile = useAuthStore((state) => state.profile);
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect to their dashboard if they try to access a page they don't have permission for
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}