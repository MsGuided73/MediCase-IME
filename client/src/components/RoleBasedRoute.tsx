import React from 'react';
import { Redirect } from 'wouter';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  requireAuth?: boolean;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = '/dashboard',
  requireAuth = true,
}) => {
  const { userProfile, loading: roleLoading } = useUserRole();
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();

  // Show loading spinner while checking authentication and roles
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // If user profile is loaded but role is not in allowed roles
  if (userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Redirect to={fallbackPath} />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

// Convenience components for specific roles
export const PhysicianRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['physician']} fallbackPath="/dashboard">
    {children}
  </RoleBasedRoute>
);

export const PatientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['patient']} fallbackPath="/physician">
    {children}
  </RoleBasedRoute>
);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleBasedRoute allowedRoles={['admin', 'corporate_admin']} fallbackPath="/dashboard">
    {children}
  </RoleBasedRoute>
);
