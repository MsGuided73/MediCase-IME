/**
 * Authentication Setup Script
 * This script helps you choose and configure your authentication system
 */

import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

async function checkCurrentAuth() {
  console.log('🔐 Current Authentication Setup:\n');

  // Check Supabase configuration
  const hasSupabase = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY;
  console.log(`Supabase Auth: ${hasSupabase ? '✅ Configured' : '❌ Not configured'}`);

  return { hasSupabase };
}

async function testSupabaseAuth() {
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.log('❌ Supabase not configured');
    return false;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Test connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Supabase auth test failed:', error.message);
      return false;
    }

    console.log('✅ Supabase auth is working');
    return true;
  } catch (error: any) {
    console.log('❌ Supabase auth test failed:', error.message);
    return false;
  }
}

function showAuthOptions() {
  console.log('\n🎯 Authentication System:\n');

  console.log('🚀 Supabase Auth (Current System)');
  console.log('   ✅ Built-in email verification');
  console.log('   ✅ Password reset functionality');
  console.log('   ✅ Social login support');
  console.log('   ✅ Row Level Security (RLS)');
  console.log('   ✅ Session management');
  console.log('   ✅ Real-time subscriptions');
  console.log('   ✅ Automatic token refresh');
}

function showNextSteps(hasSupabase: boolean) {
  console.log('\n📋 Next Steps:\n');

  if (!hasSupabase) {
    console.log('1. 🗄️  Complete Supabase setup:');
    console.log('   - Follow supabase-setup.md');
    console.log('   - Add VITE_SUPABASE_URL and keys to .env.local');
    console.log('   - Run: npm run db:push');
  } else {
    console.log('1. ✅ Supabase is configured and ready!');
    console.log('   - Authentication: Supabase Auth');
    console.log('   - Database: Supabase PostgreSQL');
    console.log('   - Current setup uses SupabaseAuthProvider');
  }

  console.log('\n2. 🧪 Test your setup:');
  console.log('   npm run test:db    # Test database');
  console.log('   npm run dev:win    # Start application');
}

async function main() {
  console.log('🔐 Authentication Setup Assistant\n');

  const { hasSupabase } = await checkCurrentAuth();

  if (hasSupabase) {
    console.log('\n🧪 Testing Supabase Auth...');
    await testSupabaseAuth();
  }

  showAuthOptions();
  showNextSteps(hasSupabase);

  console.log('\n📖 Documentation:');
  console.log('   supabase-setup.md  - Complete Supabase setup guide');
  console.log('   database-setup.md  - Database configuration options');
  console.log('   setup-secrets.md   - API key configuration');
}

main().catch(console.error);
