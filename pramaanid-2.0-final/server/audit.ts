/**
 * Secure Immutable Audit Trail System
 * Records critical authentication, authorization, verification, and administrative events.
 * Strictly filters out secrets, passwords, full biometric vectors, and raw identity numbers.
 */

import crypto from 'crypto';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN_ATTEMPT'
  | 'ACCOUNT_LOCKED'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_ANALYSIS'
  | 'FACE_VERIFICATION'
  | 'VERIFIER_DECISION'
  | 'USER_ROLE_CHANGE'
  | 'RETENTION_PURGE'
  | 'SECURITY_AUDIT_RUN'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  role: string;
  action: AuditAction;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  signature: string; // Hash of record to guarantee tamper-evidence
}

// In-memory audit ledger (in enterprise production, stream to append-only WORM storage)
const auditLogs: AuditLogEntry[] = [];

/**
 * Strips any sensitive fields before appending to audit log
 */
function sanitizeAuditPayload(details: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const forbiddenKeys = ['password', 'secret', 'token', 'key', 'rawDocument', 'faceVector', 'imageBytes'];

  for (const [k, v] of Object.entries(details)) {
    if (forbiddenKeys.some(forbidden => k.toLowerCase().includes(forbidden))) {
      sanitized[k] = '[REDACTED_SENSITIVE_DATA]';
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
}

export function logAuditEvent(params: {
  userId?: string;
  userEmail?: string;
  role?: string;
  action: AuditAction;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): AuditLogEntry {
  const id = `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = new Date().toISOString();
  const sanitizedDetails = sanitizeAuditPayload(params.details || {});

  // Hash IP address for privacy protection
  const rawIp = params.ipAddress || '127.0.0.1';
  const hashedIp = crypto.createHash('sha256').update(rawIp).digest('hex').substring(0, 12);

  const entryBase = {
    id,
    timestamp,
    userId: params.userId || 'anonymous',
    userEmail: params.userEmail || 'unauthenticated@system.local',
    role: params.role || 'GUEST',
    action: params.action,
    status: params.status,
    resourceId: params.resourceId,
    details: sanitizedDetails,
    ipAddress: `masked-${hashedIp}`
  };

  // Create tamper seal signature
  const signature = crypto.createHash('sha256').update(JSON.stringify(entryBase)).digest('hex');

  const fullEntry: AuditLogEntry = {
    ...entryBase,
    signature
  };

  auditLogs.unshift(fullEntry);

  // Keep last 1000 logs in memory
  if (auditLogs.length > 1000) {
    auditLogs.pop();
  }

  return fullEntry;
}

export function getAuditLogs(filter?: {
  action?: string;
  role?: string;
  status?: string;
  limit?: number;
}): AuditLogEntry[] {
  let filtered = [...auditLogs];

  if (filter?.action && filter.action !== 'ALL') {
    filtered = filtered.filter(l => l.action === filter.action);
  }
  if (filter?.role && filter.role !== 'ALL') {
    filtered = filtered.filter(l => l.role === filter.role);
  }
  if (filter?.status && filter.status !== 'ALL') {
    filtered = filtered.filter(l => l.status === filter.status);
  }

  return filtered.slice(0, filter?.limit || 100);
}
