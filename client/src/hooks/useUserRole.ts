import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';

export type UserRole = 'patient' | 'physician' | 'admin' | 'corporate_admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
  specialty?: string;
  licenseNumber?: string;
}

export const useUserRole = () => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // First check if user profile exists in our users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile && !error) {
        setUserProfile({
          id: profile.id.toString(),
          role: profile.role || 'patient',
          firstName: profile.first_name,
          lastName: profile.last_name,
          organizationId: profile.organization_id,
          specialty: profile.specialty,
          licenseNumber: profile.license_number,
        });
      } else {
        // If no profile exists, create default patient profile
        const defaultProfile: UserProfile = {
          id: user?.id || '',
          role: 'patient',
          firstName: user?.user_metadata?.first_name,
          lastName: user?.user_metadata?.last_name,
        };
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set default patient role on error
      setUserProfile({
        id: user?.id || '',
        role: 'patient',
        firstName: user?.user_metadata?.first_name,
        lastName: user?.user_metadata?.last_name,
      });
    } finally {
      setLoading(false);
    }
  };

  const isRole = (role: UserRole) => {
    return userProfile?.role === role;
  };

  const isPhysician = () => {
    return userProfile?.role === 'physician';
  };

  const isPatient = () => {
    return userProfile?.role === 'patient';
  };

  const isAdmin = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'corporate_admin';
  };

  return {
    userProfile,
    loading,
    isRole,
    isPhysician,
    isPatient,
    isAdmin,
    refreshProfile: fetchUserProfile,
  };
};
