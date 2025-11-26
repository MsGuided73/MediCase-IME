import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // AI Service API Keys
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  perplexityApiKey: process.env.PERPLEXITY_API_KEY || '',
  
  // Voice Service Configuration
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  

  
  // File Upload Configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB default for large medical records
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per window
  
  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Health Check
  healthCheckPath: '/health',
  
  // API Configuration
  apiPrefix: '/api',
  
  // Session Configuration
  sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours
  
  // External Services
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  
  // Feature Flags
  enableVoiceFeatures: process.env.ENABLE_VOICE_FEATURES === 'true',
  enableChatFeatures: process.env.ENABLE_CHAT_FEATURES === 'true',
  enableLabProcessing: process.env.ENABLE_LAB_PROCESSING !== 'false', // Default to true
  
  // OCR Configuration
  tesseractWorkerPath: process.env.TESSERACT_WORKER_PATH || '/node_modules/tesseract.js/dist/worker.min.js',
  tesseractCorePath: process.env.TESSERACT_CORE_PATH || '/node_modules/tesseract.js-core/tesseract-core.wasm.js',
  
  // Lab Processing Configuration
  labProcessingTimeout: parseInt(process.env.LAB_PROCESSING_TIMEOUT || '300000'), // 5 minutes
  maxConcurrentProcessing: parseInt(process.env.MAX_CONCURRENT_PROCESSING || '3'),
  
  // AI Analysis Configuration
  aiAnalysisTimeout: parseInt(process.env.AI_ANALYSIS_TIMEOUT || '60000'), // 1 minute
  aiConfidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '0.7'),
  
  // Clinical Reference Configuration
  clinicalReferenceUpdateInterval: parseInt(process.env.CLINICAL_REFERENCE_UPDATE_INTERVAL || '86400000'), // 24 hours
  
  // WebSocket Configuration
  websocketPort: parseInt(process.env.WEBSOCKET_PORT || '3001'),
  websocketPath: process.env.WEBSOCKET_PATH || '/socket.io',
  
  // Cache Configuration
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheTtl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour
  
  // Monitoring
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
  
  // Security
  enableHelmet: process.env.ENABLE_HELMET !== 'false',
  enableCsrf: process.env.ENABLE_CSRF === 'true',
  
  // Email Configuration (if needed)
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  
  // Backup Configuration
  backupEnabled: process.env.BACKUP_ENABLED === 'true',
  backupInterval: parseInt(process.env.BACKUP_INTERVAL || '86400000'), // 24 hours
  backupRetention: parseInt(process.env.BACKUP_RETENTION || '7'), // 7 days
};

// Validation function to check required environment variables
export function validateConfig(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Helper function to get database URL
export function getDatabaseUrl(): string {
  if (config.supabaseUrl && config.supabaseServiceKey) {
    return config.supabaseUrl;
  }
  throw new Error('Database configuration is incomplete');
}

// Helper function to check if AI services are configured
export function getConfiguredAIServices(): string[] {
  const services: string[] = [];
  
  if (config.anthropicApiKey) services.push('anthropic');
  if (config.openaiApiKey) services.push('openai');
  if (config.perplexityApiKey) services.push('perplexity');
  
  return services;
}

// Helper function to get upload configuration
export function getUploadConfig() {
  return {
    maxFileSize: config.maxFileSize,
    uploadDir: config.uploadDir,
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff'
    ]
  };
}

export default config;
