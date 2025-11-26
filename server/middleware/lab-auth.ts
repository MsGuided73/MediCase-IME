/**
 * Laboratory Integration Authentication Middleware
 * Supports OAuth 2.0, Mutual TLS, and API Key authentication for lab systems
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getStorageInstance } from '../storage';

export interface LabAuthenticatedRequest extends Request {
  labSystem?: {
    id: string;
    name: string;
    type: 'LABCORP' | 'QUEST' | 'EPIC' | 'CERNER' | 'ALLSCRIPTS' | 'GENERIC';
    permissions: string[];
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  };
}

/**
 * OAuth 2.0 Bearer Token Authentication for Lab Systems
 */
export const authenticateLabOAuth = async (
  req: LabAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        code: 'MISSING_BEARER_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    // TODO: Replace with Supabase JWT verification
    // For now, return error until proper Supabase integration
    return res.status(501).json({
      error: 'Lab authentication temporarily disabled',
      code: 'LAB_AUTH_DISABLED',
      message: 'Lab system authentication is being migrated to Supabase'
    });
    
    // Get lab system configuration
    const storage = getStorageInstance();
    const labSystem = await storage.getLabSystemById(decoded.sub);
    
    if (!labSystem || !labSystem.isActive) {
      return res.status(401).json({
        error: 'Invalid or inactive lab system',
        code: 'INVALID_LAB_SYSTEM'
      });
    }

    // Check token expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Verify scopes/permissions
    const requiredScope = getRequiredScope(req.path, req.method);
    if (requiredScope && !decoded.scope?.includes(requiredScope)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_SCOPE',
        required: requiredScope,
        provided: decoded.scope
      });
    }

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(labSystem.id, labSystem.rateLimit);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter
      });
    }

    // Attach lab system info to request
    req.labSystem = {
      id: labSystem.id,
      name: labSystem.name,
      type: labSystem.type,
      permissions: decoded.scope || [],
      rateLimit: labSystem.rateLimit
    };

    // Log successful authentication
    console.log(`✅ Lab system authenticated: ${labSystem.name} (${labSystem.type})`);
    
    next();

  } catch (error) {
    console.error('❌ Lab OAuth authentication failed:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Mutual TLS Authentication for High-Security Lab Connections
 */
export const authenticateLabMutualTLS = async (
  req: LabAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if client certificate is present
    const clientCert = req.socket.getPeerCertificate();
    
    if (!clientCert || !clientCert.subject) {
      return res.status(401).json({
        error: 'Client certificate required',
        code: 'MISSING_CLIENT_CERT'
      });
    }

    // Verify certificate is not expired
    const now = new Date();
    const validFrom = new Date(clientCert.valid_from);
    const validTo = new Date(clientCert.valid_to);
    
    if (now < validFrom || now > validTo) {
      return res.status(401).json({
        error: 'Client certificate expired or not yet valid',
        code: 'INVALID_CERT_DATES'
      });
    }

    // Verify certificate against allowed lab systems
    const storage = getStorageInstance();
    const labSystem = await storage.getLabSystemByCertificate(clientCert.fingerprint);
    
    if (!labSystem || !labSystem.isActive) {
      return res.status(401).json({
        error: 'Unknown or inactive client certificate',
        code: 'UNKNOWN_CLIENT_CERT'
      });
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(labSystem.id, labSystem.rateLimit);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter
      });
    }

    req.labSystem = {
      id: labSystem.id,
      name: labSystem.name,
      type: labSystem.type,
      permissions: labSystem.permissions,
      rateLimit: labSystem.rateLimit
    };

    console.log(`✅ Lab system authenticated via mTLS: ${labSystem.name}`);
    next();

  } catch (error) {
    console.error('❌ Mutual TLS authentication failed:', error);
    return res.status(500).json({
      error: 'mTLS authentication service error',
      code: 'MTLS_AUTH_ERROR'
    });
  }
};

/**
 * API Key Authentication for Simple Lab Integrations
 */
export const authenticateLabAPIKey = async (
  req: LabAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'MISSING_API_KEY'
      });
    }

    // Hash the API key for lookup
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const storage = getStorageInstance();
    const labSystem = await storage.getLabSystemByAPIKey(hashedKey);
    
    if (!labSystem || !labSystem.isActive) {
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Check if API key is expired
    if (labSystem.apiKeyExpiry && new Date() > new Date(labSystem.apiKeyExpiry)) {
      return res.status(401).json({
        error: 'API key expired',
        code: 'API_KEY_EXPIRED'
      });
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(labSystem.id, labSystem.rateLimit);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfter
      });
    }

    req.labSystem = {
      id: labSystem.id,
      name: labSystem.name,
      type: labSystem.type,
      permissions: labSystem.permissions,
      rateLimit: labSystem.rateLimit
    };

    console.log(`✅ Lab system authenticated via API key: ${labSystem.name}`);
    next();

  } catch (error) {
    console.error('❌ API key authentication failed:', error);
    return res.status(500).json({
      error: 'API key authentication service error',
      code: 'API_KEY_AUTH_ERROR'
    });
  }
};

/**
 * Combined authentication middleware that supports multiple auth methods
 */
export const authenticateLabSystem = async (
  req: LabAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Try OAuth 2.0 first
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return authenticateLabOAuth(req, res, next);
  }
  
  // Try API key
  if (req.headers['x-api-key']) {
    return authenticateLabAPIKey(req, res, next);
  }
  
  // Try mutual TLS
  if (req.socket.getPeerCertificate()?.subject) {
    return authenticateLabMutualTLS(req, res, next);
  }
  
  // No valid authentication method found
  return res.status(401).json({
    error: 'Authentication required',
    code: 'NO_AUTH_METHOD',
    supportedMethods: ['Bearer Token', 'API Key', 'Mutual TLS']
  });
};

// Helper functions
function getRequiredScope(path: string, method: string): string | null {
  const scopeMap: Record<string, string> = {
    'POST /api/webhooks/lab-results': 'lab:results:write',
    'GET /api/webhooks/lab-results/status': 'lab:status:read',
    'POST /api/webhooks/lab-results/labcorp': 'lab:results:write',
    'POST /api/webhooks/lab-results/quest': 'lab:results:write'
  };
  
  const key = `${method} ${path}`;
  return scopeMap[key] || null;
}

async function checkRateLimit(labSystemId: string, limits: any): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Implementation would use Redis or similar for distributed rate limiting
  // For now, return allowed for all requests
  return { allowed: true };
}

/**
 * Patient Consent Verification Middleware
 */
export const verifyPatientConsent = async (
  req: LabAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.body.patientId || extractPatientIdFromFHIR(req.body);
    
    if (!patientId) {
      return res.status(400).json({
        error: 'Patient ID required for consent verification',
        code: 'MISSING_PATIENT_ID'
      });
    }

    const storage = getStorageInstance();
    const consent = await storage.getPatientLabConsent(patientId, req.labSystem?.id);
    
    if (!consent || !consent.isActive) {
      return res.status(403).json({
        error: 'Patient has not consented to lab data sharing',
        code: 'NO_PATIENT_CONSENT',
        patientId
      });
    }

    // Check if consent covers the specific lab system
    if (consent.allowedSystems && !consent.allowedSystems.includes(req.labSystem?.id)) {
      return res.status(403).json({
        error: 'Patient consent does not cover this lab system',
        code: 'INSUFFICIENT_CONSENT',
        patientId,
        labSystem: req.labSystem?.name
      });
    }

    next();

  } catch (error) {
    console.error('❌ Patient consent verification failed:', error);
    return res.status(500).json({
      error: 'Consent verification service error',
      code: 'CONSENT_SERVICE_ERROR'
    });
  }
};

function extractPatientIdFromFHIR(fhirBundle: any): string | null {
  // Extract patient ID from FHIR bundle
  const patientEntry = fhirBundle.entry?.find((entry: any) => 
    entry.resource?.resourceType === 'Patient'
  );
  
  return patientEntry?.resource?.id || null;
}
