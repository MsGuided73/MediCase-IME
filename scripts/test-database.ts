/**
 * Supabase Database Connection Testing Script
 * This script tests Supabase connectivity and validates table access
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

interface TestResult {
  success: boolean;
  message: string;
  details?: string[];
}

async function testSupabaseEnvironment(): Promise<TestResult> {
  console.log('🔧 Checking Supabase Environment Variables...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const results = [
    `VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`,
    `VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`,
    `SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`
  ];

  results.forEach(result => console.log(`   ${result}`));

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      success: false,
      message: 'Missing required Supabase environment variables',
      details: [
        'Please add the following to your .env.local file:',
        'VITE_SUPABASE_URL=your-supabase-project-url',
        'VITE_SUPABASE_ANON_KEY=your-supabase-anon-key',
        'SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key'
      ]
    };
  }

  return { success: true, message: 'Environment variables configured' };
}

async function testSupabaseClientConnection(): Promise<TestResult> {
  console.log('\n🔗 Testing Supabase Client Connection (Anonymous Key)...');

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test basic connectivity with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        message: 'Client connection failed',
        details: [error.message]
      };
    }

    console.log('   ✅ Client connection successful');
    return { success: true, message: 'Client connection working' };

  } catch (error: any) {
    return {
      success: false,
      message: 'Client connection error',
      details: [error.message]
    };
  }
}

async function testSupabaseAdminConnection(): Promise<TestResult> {
  console.log('\n🔗 Testing Supabase Admin Connection (Service Role Key)...');

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    console.log('   ⚠️  Service role key not configured - skipping admin test');
    return { success: true, message: 'Service role key not configured (optional)' };
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test admin access
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return {
        success: false,
        message: 'Admin connection failed',
        details: [error.message]
      };
    }

    console.log('   ✅ Admin connection successful');
    return { success: true, message: 'Admin connection working' };

  } catch (error: any) {
    return {
      success: false,
      message: 'Admin connection error',
      details: [error.message]
    };
  }
}

async function testTableAccess(): Promise<TestResult> {
  console.log('\n📋 Testing Core Table Access...');

  const coreTable = ['users', 'symptom_entries', 'prescriptions', 'medical_history'];
  const results: string[] = [];
  let allSuccessful = true;

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    for (const table of coreTable) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
          results.push(`${table}: Failed - ${error.message}`);
          allSuccessful = false;
        } else {
          console.log(`   ✅ ${table}: Accessible`);
          results.push(`${table}: Accessible`);
        }
      } catch (err: any) {
        console.log(`   ❌ ${table}: Error - ${err.message}`);
        results.push(`${table}: Error - ${err.message}`);
        allSuccessful = false;
      }
    }

    return {
      success: allSuccessful,
      message: allSuccessful ? 'All core tables accessible' : 'Some tables have access issues',
      details: results
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Table access test failed',
      details: [error.message]
    };
  }
}

async function testRowLevelSecurity(): Promise<TestResult> {
  console.log('\n🔒 Testing Row Level Security (RLS)...');

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test unauthenticated access to users table (should return empty or restricted)
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .limit(10);

    if (error) {
      // Check if it's an RLS-related error
      if (error.message.includes('RLS') || error.message.includes('policy') || error.code === 'PGRST301') {
        console.log('   ✅ RLS is active - unauthenticated access properly blocked');
        return { success: true, message: 'Row Level Security is working' };
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
        return { success: false, message: 'Unexpected RLS behavior', details: [error.message] };
      }
    } else {
      // Check if we got any actual user data
      if (!data || data.length === 0) {
        console.log('   ✅ RLS is active - no user data returned to unauthenticated client');
        return { success: true, message: 'Row Level Security is working - no data leaked' };
      } else {
        // We got user data without authentication - this could be a problem
        console.log(`   ⚠️  Warning: Got ${data.length} user records without authentication`);
        console.log('   📝 This might be expected if users table is empty or has public test data');

        // Check if the data contains sensitive information
        const hasSensitiveData = data.some(user => user.email || user.id);
        if (hasSensitiveData) {
          console.log('   ❌ RLS may not be working - sensitive user data accessible');
          return { success: false, message: 'RLS may not be properly configured', details: [`Got ${data.length} user records with sensitive data`] };
        } else {
          console.log('   ✅ RLS appears to be working - no sensitive data in response');
          return { success: true, message: 'Row Level Security appears to be working' };
        }
      }
      console.log('   ⚠️  Warning: Unauthenticated access to users table succeeded');
      return {
        success: false,
        message: 'RLS may not be properly configured',
        details: ['Unauthenticated access to users table was allowed']
      };
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'RLS test failed',
      details: [error.message]
    };
  }
}

async function main() {
  console.log('🗄️  Testing Supabase Database Connection...\n');

  const tests = [
    testSupabaseEnvironment,
    testSupabaseClientConnection,
    testSupabaseAdminConnection,
    testTableAccess,
    testRowLevelSecurity
  ];

  const results: TestResult[] = [];
  let allPassed = true;

  for (const test of tests) {
    const result = await test();
    results.push(result);
    if (!result.success) {
      allPassed = false;
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.message}`);
    if (result.details && !result.success) {
      result.details.forEach(detail => console.log(`      ${detail}`));
    }
  });

  if (allPassed) {
    console.log('\n🎉 All tests passed! Supabase is ready for development.');
    console.log('\n🚀 You can now run:');
    console.log('   npm run dev:win');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your Supabase configuration.');
    console.log('\n📖 Next steps:');
    console.log('   1. Verify your Supabase project is active');
    console.log('   2. Check your API keys in .env.local');
    console.log('   3. Ensure RLS policies are properly configured');
    console.log('   4. Run: npm run db:push (if tables are missing)');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
