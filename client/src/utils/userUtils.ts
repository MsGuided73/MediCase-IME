import { User } from '@supabase/supabase-js';

/**
 * Utility functions for handling user data and display
 */

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
}

/**
 * Extract user profile information from Supabase User object
 */
export function getUserProfile(user: User | null): UserProfile | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || '',
    firstName: user.user_metadata?.firstName || user.user_metadata?.first_name || '',
    lastName: user.user_metadata?.lastName || user.user_metadata?.last_name || '',
    fullName: user.user_metadata?.fullName || user.user_metadata?.full_name || '',
    avatarUrl: user.user_metadata?.avatarUrl || user.user_metadata?.avatar_url || '',
  };
}

/**
 * Get user's display name with fallbacks
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'User';

  const profile = getUserProfile(user);
  if (!profile) return 'User';

  // Try full name first
  if (profile.fullName) return profile.fullName;

  // Try first + last name
  if (profile.firstName && profile.lastName) {
    return `${profile.firstName} ${profile.lastName}`;
  }

  // Try just first name
  if (profile.firstName) return profile.firstName;

  // Try email username
  if (profile.email) {
    const emailUsername = profile.email.split('@')[0];
    return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
  }

  return 'User';
}

/**
 * Get user's first name with fallbacks
 */
export function getUserFirstName(user: User | null): string {
  if (!user) return '';

  const profile = getUserProfile(user);
  if (!profile) return '';

  if (profile.firstName) return profile.firstName;

  // Try extracting from full name
  if (profile.fullName) {
    return profile.fullName.split(' ')[0];
  }

  // Try email username
  if (profile.email) {
    const emailUsername = profile.email.split('@')[0];
    return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
  }

  return '';
}

/**
 * Get user initials for avatar display
 */
export function getUserInitials(user: User | null): string {
  if (!user) return 'U';

  const profile = getUserProfile(user);
  if (!profile) return 'U';

  // Try first + last name initials
  if (profile.firstName && profile.lastName) {
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  }

  // Try full name initials
  if (profile.fullName) {
    const names = profile.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  }

  // Try first name initial
  if (profile.firstName) {
    return profile.firstName.charAt(0).toUpperCase();
  }

  // Try email initial
  if (profile.email) {
    return profile.email.charAt(0).toUpperCase();
  }

  return 'U';
}

/**
 * Legacy function for backward compatibility
 */
export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'U';
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}
