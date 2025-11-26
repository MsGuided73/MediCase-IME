/**
 * Security Configuration for Sherlock Health
 * Centralized security settings and constants
 */

export const SECURITY_CONFIG = {
  // Rate Limiting
  RATE_LIMITS: {
    API: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
    },
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // auth attempts per window
    },
    UPLOAD: {
      windowMs: 60 * 1000, // 1 minute
      max: 10, // uploads per minute
    },
    CHAT: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // chat messages per minute
    }
  },

  // File Upload Security
  UPLOAD: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_MIME_TYPES: {
      IMAGES: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic'
      ],
      DOCUMENTS: [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    },
    TEMP_DIR: '/tmp/',
    UPLOAD_DIR: './uploads/'
  },

  // Password Requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },

  // Session Security
  SESSION: {
    SECRET_MIN_LENGTH: 32,
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'strict' as const
  },

  // CORS Settings
  CORS: {
    ALLOWED_ORIGINS: [
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5173'
    ],
    CREDENTIALS: true,
    METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'x-api-key'],
    EXPOSED_HEADERS: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
  },

  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    STYLE_SRC: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    FONT_SRC: ["'self'", "https://fonts.gstatic.com"],
    IMG_SRC: ["'self'", "data:", "https:", "blob:"],
    SCRIPT_SRC: ["'self'", "'unsafe-eval'"], // unsafe-eval needed for Vite dev
    CONNECT_SRC: [
      "'self'",
      "https://api.openai.com",
      "https://api.anthropic.com", 
      "https://api.perplexity.ai",
      "https://api.elevenlabs.io",
      "wss:",
      "ws:"
    ],
    MEDIA_SRC: ["'self'", "blob:"],
    OBJECT_SRC: ["'none'"],
    FRAME_SRC: ["'none'"]
  },

  // Input Validation
  VALIDATION: {
    MAX_STRING_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 1000,
    ALLOWED_HTML_TAGS: [], // No HTML allowed by default
    SUSPICIOUS_PATTERNS: [
      /script/i,
      /javascript/i,
      /vbscript/i,
      /onload/i,
      /onerror/i,
      /<.*>/,
      /union.*select/i,
      /drop.*table/i,
      /insert.*into/i,
      /delete.*from/i,
      /update.*set/i
    ]
  },

  // API Security
  API: {
    MAX_REQUEST_SIZE: '50mb',
    TIMEOUT: 30000, // 30 seconds
    REQUIRE_HTTPS: process.env.NODE_ENV === 'production'
  },

  // Medical Data Security (HIPAA Compliance)
  MEDICAL: {
    ENCRYPTION_REQUIRED: true,
    AUDIT_LOG_REQUIRED: true,
    ACCESS_LOG_RETENTION: 90, // days
    PHI_FIELDS: [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'ssn',
      'medicalRecordNumber'
    ]
  },

  // Security Headers
  HEADERS: {
    HSTS_MAX_AGE: 31536000, // 1 year
    INCLUDE_SUBDOMAINS: true,
    PRELOAD: true,
    NO_SNIFF: true,
    FRAME_DENY: true,
    XSS_PROTECTION: true,
    REFERRER_POLICY: 'strict-origin-when-cross-origin'
  },

  // Monitoring and Alerting
  MONITORING: {
    LOG_FAILED_ATTEMPTS: true,
    ALERT_THRESHOLD: 10, // failed attempts before alert
    BLOCK_THRESHOLD: 50, // failed attempts before temporary block
    BLOCK_DURATION: 60 * 60 * 1000, // 1 hour
    LOG_SUSPICIOUS_ACTIVITY: true
  }
};

/**
 * Environment-specific security overrides
 */
export function getSecurityConfig() {
  const config = { ...SECURITY_CONFIG };
  
  if (process.env.NODE_ENV === 'production') {
    // Production-specific security enhancements
    config.SESSION.SECURE = true;
    config.API.REQUIRE_HTTPS = true;
    config.CSP.SCRIPT_SRC = ["'self'"]; // Remove unsafe-eval in production
    
    // Add production domains if configured
    if (process.env.PRODUCTION_DOMAIN) {
      config.CORS.ALLOWED_ORIGINS.push(process.env.PRODUCTION_DOMAIN);
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    // Development-specific relaxations (minimal)
    config.RATE_LIMITS.API.max = 1000; // Higher limit for development
    config.MONITORING.ALERT_THRESHOLD = 100; // Less sensitive in dev
  }
  
  return config;
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check session secret strength
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < SECURITY_CONFIG.SESSION.SECRET_MIN_LENGTH) {
    errors.push(`Session secret must be at least ${SECURITY_CONFIG.SESSION.SECRET_MIN_LENGTH} characters`);
  }
  
  // Check for default/weak secrets
  const weakSecrets = ['fallback-session-secret', 'your-session-secret-here', 'secret'];
  if (sessionSecret && weakSecrets.includes(sessionSecret)) {
    errors.push('Session secret appears to be a default/weak value');
  }
  
  // Check HTTPS requirement in production
  if (process.env.NODE_ENV === 'production' && !process.env.HTTPS_ENABLED) {
    errors.push('HTTPS should be enabled in production');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Security audit log entry
 */
export interface SecurityAuditLog {
  timestamp: Date;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  userId?: string;
  details: Record<string, any>;
}

/**
 * Log security events
 */
export function logSecurityEvent(event: Omit<SecurityAuditLog, 'timestamp'>): void {
  const logEntry: SecurityAuditLog = {
    timestamp: new Date(),
    ...event
  };
  
  // In production, this should write to a secure audit log
  console.log(`🔒 SECURITY AUDIT: ${JSON.stringify(logEntry)}`);
  
  // For critical events, consider immediate alerting
  if (event.severity === 'critical') {
    console.error(`🚨 CRITICAL SECURITY EVENT: ${event.event}`);
    // TODO: Implement immediate alerting (email, Slack, etc.)
  }
}
