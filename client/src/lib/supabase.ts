import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabase;

// Database types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          date_of_birth: string | null
          gender: string | null
          height_cm: number | null
          weight_kg: number | null
          phone_number: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          is_active: boolean
          last_login: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          date_of_birth?: string | null
          gender?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          phone_number?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          is_active?: boolean
          last_login?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string | null
          gender?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          phone_number?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          is_active?: boolean
          last_login?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed
    }
  }
}

// Helper functions for common auth operations
export const authHelpers = {
  // Sign up with email and password
  signUp: async (email: string, password: string, userData: any) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  getSession: async () => {
    if (!supabase) return { data: { session: null }, error: null }
    
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  // Get current user
  getUser: async () => {
    if (!supabase) return { data: { user: null }, error: null }
    
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  },

  // Reset password
  resetPassword: async (email: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    return { data, error }
  }
}
