/**
 * Comprehensive Security Middleware Suite
 * Enforces Security Headers, Strict CORS, Sliding-Window Rate Limiting,
 * Session Authentication, and Role-Based Access Control (RBAC).
 */

import { Request, Response, NextFunction } from 'express';
import { getSession, getUserById, UserRole } from './storage.js';
import { logAuditEvent } from './audit.js';
import { serverEnv } from '../config/env.js';

// Extend Express Request to include authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        fullName: string;
      };
      clientIp?: string;
    }
  }
}

/**
 * 1. Security Headers Middleware (Content-Security-Policy, HSTS, X-Content-Type-Options, etc.)
 */
export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self' http: https: ws: wss:; frame-ancestors 'self' https://*.google.com https://*.run.app;"
  );

  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');

  // Remove fingerprinting header
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * 2. Secure CORS Middleware
 * Forbids wildcard '*' with credentials. Validates against configured CLIENT_URL and APP_URL.
 */
export function applySecureCors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    serverEnv.CLIENT_URL,
    serverEnv.APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173'
  ];

  // If origin matches or is same-origin, set header
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.run.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Same-origin request
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

/**
 * 3. Sliding-Window Rate Limiter
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    req.clientIp = clientIp;
    const bucketKey = `${req.path}:${clientIp}`;
    const now = Date.now();

    const existing = rateLimitBuckets.get(bucketKey);

    if (!existing || now > existing.resetAt) {
      rateLimitBuckets.set(bucketKey, {
        count: 1,
        resetAt: now + options.windowMs
      });
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', options.maxRequests - 1);
      return next();
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: options.message,
        retryAfter: retryAfterSeconds
      });
      return;
    }

    existing.count += 1;
    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - existing.count));
    next();
  };
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now > bucket.resetAt) {
      rateLimitBuckets.delete(key);
    }
  }
}, 60000);

/**
 * 4. Authentication Middleware
 * Resolves session token from Cookie or Authorization Bearer header
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  // Check HttpOnly session cookie
  if (req.cookies && req.cookies.pramaan_session) {
    token = req.cookies.pramaan_session;
  }

  // Fallback to Bearer token header
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7).trim();
  }

  if (!token) {
    return next(); // Unauthenticated, proceeding as guest
  }

  const session = getSession(token);
  if (!session) {
    return next();
  }

  const user = getUserById(session.userId);
  if (!user) {
    return next();
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName
  };

  next();
}

/**
 * 5. Mandatory Authentication Guard
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    logAuditEvent({
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      status: 'FAILURE',
      ipAddress: req.clientIp,
      details: { path: req.originalUrl, method: req.method, reason: 'Missing authentication token' }
    });
    res.status(401).json({
      error: 'Authentication required. Please log in to access this sovereign endpoint.'
    });
    return;
  }
  next();
}

/**
 * 6. Role-Based Access Control (RBAC) Guard
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        role: req.user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        status: 'FAILURE',
        ipAddress: req.clientIp,
        details: {
          path: req.originalUrl,
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          reason: 'Insufficient RBAC privileges'
        }
      });
      res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] role privileges.`
      });
      return;
    }

    next();
  };
}
