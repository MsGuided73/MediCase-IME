/**
 * Security Audit Middleware for Sherlock Health
 * Monitors and logs security-related events
 */

import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent, SECURITY_CONFIG } from '../config/security';

interface SecurityMetrics {
  failedAttempts: Map<string, { count: number; lastAttempt: Date }>;
  suspiciousIPs: Set<string>;
  blockedIPs: Map<string, Date>;
}

const securityMetrics: SecurityMetrics = {
  failedAttempts: new Map(),
  suspiciousIPs: new Set(),
  blockedIPs: new Map()
};

/**
 * Main security audit middleware
 */
export const securityAudit = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  
  // Check if IP is blocked
  if (isIPBlocked(clientIP)) {
    logSecurityEvent({
      event: 'blocked_ip_attempt',
      severity: 'high',
      ip: clientIP,
      userAgent: req.get('User-Agent'),
      details: { url: req.url, method: req.method }
    });
    
    return res.status(429).json({
      error: 'Access temporarily blocked',
      message: 'Too many security violations detected'
    });
  }
  
  // Monitor for suspicious patterns
  const suspiciousActivity = detectSuspiciousActivity(req);
  if (suspiciousActivity.detected) {
    handleSuspiciousActivity(req, suspiciousActivity);
  }
  
  // Log authentication attempts
  if (req.path.includes('/auth/')) {
    logAuthenticationAttempt(req);
  }
  
  // Monitor response for security events
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    // Log failed authentication
    if (req.path.includes('/auth/') && res.statusCode >= 400) {
      handleFailedAuthentication(req, res.statusCode);
    }
    
    // Log suspicious response patterns
    if (res.statusCode === 401 || res.statusCode === 403) {
      logSecurityEvent({
        event: 'unauthorized_access_attempt',
        severity: 'medium',
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        details: {
          url: req.url,
          method: req.method,
          statusCode: res.statusCode,
          duration
        }
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Get client IP address
 */
function getClientIP(req: Request): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();
}

/**
 * Check if IP is currently blocked
 */
function isIPBlocked(ip: string): boolean {
  const blockExpiry = securityMetrics.blockedIPs.get(ip);
  if (!blockExpiry) return false;
  
  if (Date.now() > blockExpiry.getTime()) {
    securityMetrics.blockedIPs.delete(ip);
    return false;
  }
  
  return true;
}

/**
 * Detect suspicious activity patterns
 */
function detectSuspiciousActivity(req: Request): { detected: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check for suspicious patterns in URL and body
  const requestData = JSON.stringify({
    url: req.url,
    query: req.query,
    body: req.body
  });
  
  for (const pattern of SECURITY_CONFIG.VALIDATION.SUSPICIOUS_PATTERNS) {
    if (pattern.test(requestData)) {
      reasons.push(`Suspicious pattern detected: ${pattern.source}`);
    }
  }
  
  // Check for rapid requests from same IP
  const clientIP = getClientIP(req);
  const now = Date.now();
  const recentRequests = getRecentRequests(clientIP);
  
  if (recentRequests.length > 50) { // More than 50 requests in tracking window
    reasons.push('Excessive request rate detected');
  }
  
  // Check for unusual user agent patterns
  const userAgent = req.get('User-Agent') || '';
  if (isSuspiciousUserAgent(userAgent)) {
    reasons.push('Suspicious user agent detected');
  }
  
  // Check for common attack patterns
  if (req.url.includes('..') || req.url.includes('%2e%2e')) {
    reasons.push('Directory traversal attempt detected');
  }
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > SECURITY_CONFIG.UPLOAD.MAX_FILE_SIZE) {
    reasons.push('Oversized request detected');
  }
  
  return {
    detected: reasons.length > 0,
    reasons
  };
}

/**
 * Handle suspicious activity
 */
function handleSuspiciousActivity(req: Request, activity: { detected: boolean; reasons: string[] }) {
  const clientIP = getClientIP(req);
  
  logSecurityEvent({
    event: 'suspicious_activity_detected',
    severity: 'high',
    ip: clientIP,
    userAgent: req.get('User-Agent'),
    details: {
      url: req.url,
      method: req.method,
      reasons: activity.reasons,
      headers: sanitizeHeaders(req.headers)
    }
  });
  
  // Mark IP as suspicious
  securityMetrics.suspiciousIPs.add(clientIP);
  
  // Increment failed attempts counter
  incrementFailedAttempts(clientIP);
}

/**
 * Log authentication attempts
 */
function logAuthenticationAttempt(req: Request) {
  const clientIP = getClientIP(req);
  
  logSecurityEvent({
    event: 'authentication_attempt',
    severity: 'low',
    ip: clientIP,
    userAgent: req.get('User-Agent'),
    details: {
      endpoint: req.path,
      method: req.method,
      hasEmail: !!req.body?.email
    }
  });
}

/**
 * Handle failed authentication
 */
function handleFailedAuthentication(req: Request, statusCode: number) {
  const clientIP = getClientIP(req);
  
  logSecurityEvent({
    event: 'authentication_failed',
    severity: 'medium',
    ip: clientIP,
    userAgent: req.get('User-Agent'),
    details: {
      endpoint: req.path,
      statusCode,
      email: req.body?.email ? '[REDACTED]' : undefined
    }
  });
  
  incrementFailedAttempts(clientIP);
}

/**
 * Increment failed attempts counter and handle blocking
 */
function incrementFailedAttempts(ip: string) {
  const current = securityMetrics.failedAttempts.get(ip) || { count: 0, lastAttempt: new Date() };
  current.count++;
  current.lastAttempt = new Date();
  
  securityMetrics.failedAttempts.set(ip, current);
  
  // Check if we should block this IP
  if (current.count >= SECURITY_CONFIG.MONITORING.BLOCK_THRESHOLD) {
    const blockUntil = new Date(Date.now() + SECURITY_CONFIG.MONITORING.BLOCK_DURATION);
    securityMetrics.blockedIPs.set(ip, blockUntil);
    
    logSecurityEvent({
      event: 'ip_blocked',
      severity: 'critical',
      ip,
      details: {
        failedAttempts: current.count,
        blockDuration: SECURITY_CONFIG.MONITORING.BLOCK_DURATION,
        blockUntil
      }
    });
  } else if (current.count >= SECURITY_CONFIG.MONITORING.ALERT_THRESHOLD) {
    logSecurityEvent({
      event: 'high_failed_attempts',
      severity: 'high',
      ip,
      details: {
        failedAttempts: current.count,
        threshold: SECURITY_CONFIG.MONITORING.ALERT_THRESHOLD
      }
    });
  }
}

/**
 * Get recent requests from IP (simplified implementation)
 */
function getRecentRequests(ip: string): any[] {
  // In a real implementation, this would use Redis or similar
  // For now, return empty array
  return [];
}

/**
 * Check if user agent is suspicious
 */
function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /^$/,
    /null/i
  ];
  
  // Allow legitimate bots but flag others
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i
  ];
  
  if (legitimateBots.some(pattern => pattern.test(userAgent))) {
    return false;
  }
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Sanitize headers for logging (remove sensitive data)
 */
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized['x-api-key'];
  
  return sanitized;
}

/**
 * Clean up old entries (should be called periodically)
 */
export function cleanupSecurityMetrics() {
  const now = Date.now();
  const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours
  
  // Clean up old failed attempts
  for (const [ip, data] of securityMetrics.failedAttempts.entries()) {
    if (now - data.lastAttempt.getTime() > cleanupThreshold) {
      securityMetrics.failedAttempts.delete(ip);
    }
  }
  
  // Clean up expired blocks
  for (const [ip, blockUntil] of securityMetrics.blockedIPs.entries()) {
    if (now > blockUntil.getTime()) {
      securityMetrics.blockedIPs.delete(ip);
    }
  }
  
  // Clean up old suspicious IPs
  // In a real implementation, this would be more sophisticated
  if (securityMetrics.suspiciousIPs.size > 1000) {
    securityMetrics.suspiciousIPs.clear();
  }
}

/**
 * Get security metrics for monitoring
 */
export function getSecurityMetrics() {
  return {
    failedAttempts: securityMetrics.failedAttempts.size,
    suspiciousIPs: securityMetrics.suspiciousIPs.size,
    blockedIPs: securityMetrics.blockedIPs.size,
    activeBlocks: Array.from(securityMetrics.blockedIPs.entries()).map(([ip, blockUntil]) => ({
      ip,
      blockUntil
    }))
  };
}
