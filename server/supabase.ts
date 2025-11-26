import { createClient } from '@supabase/supabase-js';

let _supabase: any = null;
let _supabaseAuth: any = null;
let _initialized = false;

function initializeSupabase() {
  if (_initialized) return;

  // Get Supabase configuration from environment (after dotenv is loaded)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Create Supabase client for server-side operations (if configured)
  _supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

  // Create Supabase client for auth operations (if configured)
  _supabaseAuth = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

  _initialized = true;

  // For demo purposes, we'll create a mock client if Supabase isn't configured
  if (!_supabase) {
    console.log('🔧 Running in demo mode - Supabase not configured');
  }
}

// Lazy getters that initialize on first access
export const supabase = new Proxy({}, {
  get(target, prop) {
    initializeSupabase();
    return _supabase ? _supabase[prop] : null;
  }
});

export const supabaseAuth = new Proxy({}, {
  get(target, prop) {
    initializeSupabase();
    return _supabaseAuth ? _supabaseAuth[prop] : null;
  }
});

// Direct access functions for null checks
export function getSupabaseClient() {
  initializeSupabase();
  return _supabase;
}

export function getSupabaseAuthClient() {
  initializeSupabase();
  return _supabaseAuth;
}
