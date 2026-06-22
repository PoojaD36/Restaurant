'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: {
  children: React.ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check if user has required role OR is in allowed roles list
  const hasRequiredRole = requiredRole && user?.role === requiredRole;
  const hasAllowedRole = allowedRoles && allowedRoles.includes(user?.role || '');
  const needsRoleCheck = requiredRole || allowedRoles;

  if (needsRoleCheck && !hasRequiredRole && !hasAllowedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Access Denied. Insufficient permissions.</div>
      </div>
    );
  }

  return <>{children}</>;
}
