/**
 * Environment Variable Validation and Configuration
 * This module validates required environment variables and provides defaults
 */

export interface EnvConfig {
  // Server Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  // Database
  DATABASE_URL?: string;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // AI API Keys
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;



  // Application Configuration
  APP_NAME: string;
  APP_VERSION: string;



  // CORS
  CORS_ORIGIN: string;

  // Feature Flags
  ENABLE_AI_DIAGNOSIS: boolean;
  ENABLE_MEDICATION_TRACKING: boolean;
  ENABLE_VOICE_NOTES: boolean;

  // Development
  DEBUG: boolean;
  LOG_LEVEL: string;
}

/**
 * Validates and returns environment configuration
 */
export function validateEnv(): EnvConfig {
  const env = process.env;
  
  // Required environment variables for Supabase
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredVars.filter(key => !env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Missing Supabase environment variables: ${missing.join(', ')}`);
    console.warn('   Some features may not work properly without proper Supabase configuration.');
  }
  
  // Validate AI API keys (at least one should be present)
  const aiKeys = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'PERPLEXITY_API_KEY'];
  const hasAnyAiKey = aiKeys.some(key => env[key]);
  
  if (!hasAnyAiKey) {
    console.warn('⚠️  No AI API keys configured. Some features will be disabled.');
    console.warn('   Please set at least one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, PERPLEXITY_API_KEY');
  }
  
  return {
    // Server Configuration
    NODE_ENV: (env.NODE_ENV as any) || 'development',
    PORT: parseInt(env.PORT || '5000', 10),

    // Database
    DATABASE_URL: env.DATABASE_URL,

    // Supabase
    SUPABASE_URL: env.VITE_SUPABASE_URL || env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY!,

    // AI API Keys
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    PERPLEXITY_API_KEY: env.PERPLEXITY_API_KEY,
    ELEVENLABS_API_KEY: env.ELEVENLABS_API_KEY,



    // Application Configuration
    APP_NAME: env.APP_NAME || 'Sherlock Health',
    APP_VERSION: env.APP_VERSION || '1.0.0',



    // CORS
    CORS_ORIGIN: env.CORS_ORIGIN || 'http://localhost:5000',

    // Feature Flags
    ENABLE_AI_DIAGNOSIS: env.ENABLE_AI_DIAGNOSIS !== 'false',
    ENABLE_MEDICATION_TRACKING: env.ENABLE_MEDICATION_TRACKING !== 'false',
    ENABLE_VOICE_NOTES: env.ENABLE_VOICE_NOTES === 'true',

    // Development
    DEBUG: env.DEBUG === 'true',
    LOG_LEVEL: env.LOG_LEVEL || 'info',
  };
}

/**
 * Logs the current environment configuration (without sensitive data)
 */
export function logEnvStatus(config: EnvConfig): void {
  console.log('\n🔧 Environment Configuration:');
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Port: ${config.PORT}`);
  console.log(`   App: ${config.APP_NAME} v${config.APP_VERSION}`);
  console.log(`   Database: ${config.DATABASE_URL ? '✅ Configured' : '❌ Not configured'}`);

  console.log('\n🗄️  Supabase:');
  console.log(`   Supabase URL: ${config.SUPABASE_URL ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Anon Key: ${config.SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Service Role: ${config.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Not configured'}`);

  console.log('\n🤖 AI Services:');
  console.log(`   Anthropic Claude: ${config.ANTHROPIC_API_KEY ? '✅ Available' : '❌ Not configured'}`);
  console.log(`   OpenAI GPT: ${config.OPENAI_API_KEY ? '✅ Available' : '❌ Not configured'}`);
  console.log(`   Perplexity: ${config.PERPLEXITY_API_KEY ? '✅ Available' : '❌ Not configured'}`);
  console.log(`   ElevenLabs Voice: ${config.ELEVENLABS_API_KEY ? '✅ Available' : '❌ Not configured'}`);
  
  console.log('\n🎛️  Feature Flags:');
  console.log(`   AI Diagnosis: ${config.ENABLE_AI_DIAGNOSIS ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Medication Tracking: ${config.ENABLE_MEDICATION_TRACKING ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Voice Notes: ${config.ENABLE_VOICE_NOTES ? '✅ Enabled' : '❌ Disabled'}`);
  
  console.log('');
}

// Export the validation function - config will be created in server/index.ts after dotenv loading
