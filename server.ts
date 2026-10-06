/**
 * Sovereign Production-Grade Backend Server (server.ts)
 * Express server with Vite middleware, Security Headers, Strict CORS,
 * Rate Limiting, Input Validation, AES-256 Encryption, and Role-Based Access Control.
 */

import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { serverEnv } from './config/env.js';
import {
  applySecurityHeaders,
  applySecureCors,
  createRateLimiter,
  authenticate,
  requireAuth,
  requireRole
} from './server/securityMiddleware.js';
import {
  seedInitialUsers,
  getUserByEmail,
  createUser,
  createSession,
  invalidateSession,
  recordFailedLogin,
  resetFailedLogin,
  getAllUsers,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
  updateUserDetails,
  createBooking,
  listBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  createVerificationRecord,
  getVerificationRecord,
  listVerifications,
  updateVerificationDecision,
  updateVerificationTrust,
  updateVerificationIdentityConsistency,
  purgeExpiredRecords,
  UserRole,
  ServiceType,
  BookingStatus,
  BookingPriority
} from './server/storage.js';
import { validateFileMagicBytes } from './server/crypto.js';
import { analyzeIdentityDocument, verifyFaceMatch } from './server/gemini.js';
import { calculateIdentityConsistency } from './server/identityConsistency.js';
import { logAuditEvent, getAuditLogs } from './server/audit.js';
import { performSecurityAudit } from './scripts/security-audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = serverEnv.PORT;
  const isProd = process.env.NODE_ENV === 'production';

  // Seed default sovereign role accounts (Citizen, Verifier, Officer, Admin, Super Admin)
  await seedInitialUsers();

  // 1. Core Security Middlewares
  app.use(applySecurityHeaders);
  app.use(applySecureCors);
  app.use(cookieParser(serverEnv.SESSION_SECRET));
  app.use(express.json({ limit: '10mb' })); // Strict 10MB payload limit
  app.use(authenticate);

  // 2. Rate Limiters
  const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 15,
    message: 'Too many authentication attempts. Please wait 15 minutes.'
  });

  const analysisLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 30,
    message: 'Document analysis rate limit exceeded. Please wait a few moments.'
  });

  const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 120,
    message: 'API rate limit exceeded. Please slow down.'
  });

  app.use('/api', apiLimiter);

  // ==============================================================
  // AUTHENTICATION ENDPOINTS
  // ==============================================================

  const loginSchema = z.object({
    email: z.string().email().max(100),
    password: z.string().min(1).max(100)
  });

  app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Valid email and password required.' });
        return;
      }

      const { email, password } = parsed.data;
      const user = getUserByEmail(email);

      if (!user) {
        // Safe generic error to prevent account enumeration
        logAuditEvent({
          userEmail: email,
          action: 'FAILED_LOGIN_ATTEMPT',
          status: 'FAILURE',
          ipAddress: req.clientIp,
          details: { reason: 'User not found' }
        });
        res.status(401).json({ error: 'Invalid identity credentials provided.' });
        return;
      }

      // Check account lockout
      if (user.lockedUntil && Date.now() < user.lockedUntil) {
        const remainingMinutes = Math.ceil((user.lockedUntil - Date.now()) / 60000);
        logAuditEvent({
          userId: user.id,
          userEmail: user.email,
          role: user.role,
          action: 'FAILED_LOGIN_ATTEMPT',
          status: 'WARNING',
          ipAddress: req.clientIp,
          details: { reason: `Attempt on locked account. Locked for ${remainingMinutes} more minutes.` }
        });
        res.status(423).json({
          error: `Account temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minute(s).`
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        const lockoutStatus = recordFailedLogin(user);
        logAuditEvent({
          userId: user.id,
          userEmail: user.email,
          role: user.role,
          action: 'FAILED_LOGIN_ATTEMPT',
          status: 'FAILURE',
          ipAddress: req.clientIp,
          details: { attempts: user.failedLoginAttempts, isLocked: lockoutStatus.isLocked }
        });

        if (lockoutStatus.isLocked) {
          res.status(423).json({
            error: 'Account locked due to 5 consecutive failed attempts. Please wait 15 minutes.'
          });
          return;
        }

        res.status(401).json({ error: 'Invalid identity credentials provided.' });
        return;
      }

      // Success
      resetFailedLogin(user);
      const session = createSession(user);

      // Set secure HttpOnly session cookie
      res.cookie('pramaan_session', session.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        role: user.role,
        action: 'LOGIN',
        status: 'SUCCESS',
        ipAddress: req.clientIp,
        details: { role: user.role }
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        token: session.token // Provided for header auth in sandboxed iframe contexts
      });
    } catch {
      res.status(500).json({ error: 'Authentication service temporarily unavailable.' });
    }
  });

  const registerSchema = z.object({
    email: z.string().email().max(100),
    fullName: z.string().min(2).max(100),
    password: z.string().min(8, 'Password must be at least 8 characters long.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.')
  });

  app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid registration information.'
        });
        return;
      }

      const { email, fullName, password } = parsed.data;
      const user = await createUser({
        email,
        fullName,
        password,
        role: 'CITIZEN' // New registrations default strictly to CITIZEN
      });

      logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        role: user.role,
        action: 'LOGIN',
        status: 'SUCCESS',
        ipAddress: req.clientIp,
        details: { event: 'New citizen registration' }
      });

      res.status(201).json({
        message: 'Citizen account registered successfully. Please proceed to sign in.',
        user
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = req.cookies?.pramaan_session || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      invalidateSession(token);
    }
    res.clearCookie('pramaan_session');

    if (req.user) {
      logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        role: req.user.role,
        action: 'LOGOUT',
        status: 'SUCCESS',
        ipAddress: req.clientIp
      });
    }

    res.json({ message: 'Signed out successfully.' });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      user: req.user
    });
  });

  // ==============================================================
  // DOCUMENT VERIFICATION & AI FORENSICS ENDPOINTS
  // ==============================================================

  const analyzeDocSchema = z.object({
    imageBase64: z.string().min(100, 'Document image payload required.'),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
    declaredType: z.enum(['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID', 'DRIVING_LICENCE']).optional(),
    maskPII: z.boolean().default(true)
  });

  app.post('/api/documents/upload-and-analyze', requireAuth, analysisLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = analyzeDocSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid upload parameters.' });
        return;
      }

      const { imageBase64, mimeType, declaredType } = parsed.data;

      // Extract raw buffer for magic-byte signature validation
      const base64Data = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');

      // Check max size: 5 MB
      if (fileBuffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'File size exceeds maximum sovereign limit of 5MB.' });
        return;
      }

      // Check binary magic bytes
      const isMagicValid = validateFileMagicBytes(fileBuffer, mimeType);
      if (!isMagicValid) {
        logAuditEvent({
          userId: req.user?.id,
          userEmail: req.user?.email,
          role: req.user?.role,
          action: 'DOCUMENT_UPLOAD',
          status: 'FAILURE',
          ipAddress: req.clientIp,
          details: { error: 'Magic bytes spoofing detected', declaredMime: mimeType }
        });
        res.status(400).json({
          error: 'Security validation failed: File binary header does not match declared MIME signature.'
        });
        return;
      }

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'DOCUMENT_UPLOAD',
        status: 'SUCCESS',
        ipAddress: req.clientIp,
        details: { mimeType, declaredType: declaredType || 'AUTO_DETECT' }
      });

      // Execute AI OCR and Tamper Forensics
      const analysisResult = await analyzeIdentityDocument(base64Data, mimeType, declaredType);

      // Create AES-256-GCM encrypted record
      const record = createVerificationRecord({
        userId: req.user!.id,
        userEmail: req.user!.email,
        documentType: analysisResult.extracted.documentType,
        rawDocumentNumber: analysisResult.extracted.documentNumber,
        fullName: analysisResult.extracted.fullName,
        dateOfBirth: analysisResult.extracted.dateOfBirth,
        gender: analysisResult.extracted.gender,
        analysis: analysisResult,
        rawImagePayload: imageBase64.substring(0, 1000)
      });

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'DOCUMENT_ANALYSIS',
        status: 'SUCCESS',
        resourceId: record.id,
        ipAddress: req.clientIp,
        details: {
          documentType: record.documentType,
          riskLevel: record.riskLevel,
          confidence: record.confidenceScore
        }
      });

      res.status(201).json({
        message: 'Document securely ingested and cryptographically signed.',
        record
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to analyze document.';
      res.status(500).json({ error: message });
    }
  });

  // Face Liveness & Selfie Verification
  const faceVerifySchema = z.object({
    documentImageBase64: z.string().min(100),
    selfieImageBase64: z.string().min(100),
    verificationId: z.string().optional(),
    challengeFrames: z.number().int().min(0).max(6).optional()
  });

  app.post('/api/face/verify', requireAuth, analysisLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = faceVerifySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Document image and live selfie captures required.' });
        return;
      }

      const { documentImageBase64, selfieImageBase64, verificationId, challengeFrames } = parsed.data;
      const result = await verifyFaceMatch(documentImageBase64, selfieImageBase64);
      if (challengeFrames !== undefined) result.challengeFrames = challengeFrames;
      if (challengeFrames === 0) {
        result.livenessPassed = false;
        result.verdict = result.verdict === 'MATCHED' ? 'INCONCLUSIVE' : result.verdict;
        result.notes = 'Demo capture received. A demo frame cannot establish liveness; use the three-frame camera challenge for biometric verification.';
      }
      if ((challengeFrames ?? 0) < 3 && challengeFrames !== undefined) {
        result.livenessPassed = false;
        if (result.verdict === 'MATCHED') result.verdict = 'INCONCLUSIVE';
        result.notes = 'Insufficient liveness challenge frames. Manual review or a complete three-frame challenge is required.';
      }

      if (verificationId) {
        const record = getVerificationRecord(verificationId);
        if (record && (record.userId === req.user?.id || req.user?.role !== 'CITIZEN')) {
          updateVerificationTrust(verificationId, result);
        }
      }

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'FACE_VERIFICATION',
        status: result.verdict === 'MATCHED' ? 'SUCCESS' : 'WARNING',
        resourceId: verificationId,
        ipAddress: req.clientIp,
        details: {
          matchScore: result.matchScore,
          verdict: result.verdict,
          livenessPassed: result.livenessPassed
        }
      });

      res.json({
        message: 'Biometric face match completed.',
        result
      });
    } catch {
      res.status(500).json({ error: 'Biometric verification service error.' });
    }
  });

  // Cross-document identity consistency
  const consistencySchema = z.object({
    verificationIds: z.array(z.string().min(1)).min(2).max(5)
  });

  app.post('/api/identity/consistency', requireAuth, analysisLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = consistencySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Provide between 2 and 5 verification IDs.' });
        return;
      }

      const records = parsed.data.verificationIds
        .map(id => getVerificationRecord(id))
        .filter((record): record is NonNullable<typeof record> => Boolean(record));

      if (records.length !== parsed.data.verificationIds.length) {
        res.status(404).json({ error: 'One or more verification records were not found.' });
        return;
      }

      const unauthorized = records.some(record => record.userId !== req.user?.id && !['VERIFIER', 'OFFICER', 'ADMIN', 'SUPER_ADMIN'].includes(req.user?.role || ''));
      if (unauthorized) {
        res.status(403).json({ error: 'You are not authorized to compare one or more verification records.' });
        return;
      }

      const result = calculateIdentityConsistency(records);

      // Persist the consistency signal on every compared record so the final trust score
      // reflects the cross-document result instead of displaying it as a disconnected widget.
      for (const record of records) {
        updateVerificationIdentityConsistency(record.id, result.score, result.reasons);
      }

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'CROSS_DOCUMENT_VERIFICATION',
        status: result.verdict === 'CONFLICT' ? 'WARNING' : 'SUCCESS',
        ipAddress: req.clientIp,
        details: { documentsChecked: records.length, score: result.score, verdict: result.verdict }
      });

      res.json({ message: 'Cross-document identity consistency check completed.', result });
    } catch {
      res.status(500).json({ error: 'Cross-document verification service error.' });
    }
  });

  // List verification records
  app.get('/api/verifications', requireAuth, (req: Request, res: Response) => {
    const isCitizen = req.user?.role === 'CITIZEN';
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const riskLevel = typeof req.query.riskLevel === 'string' ? req.query.riskLevel : undefined;
    const documentType = typeof req.query.documentType === 'string' ? req.query.documentType : undefined;

    const records = listVerifications({
      userId: isCitizen ? req.user?.id : undefined,
      status,
      riskLevel,
      documentType
    });

    res.json({ records });
  });

  // Public, read-only verification receipt endpoint. Never exposes raw PII.
  app.get('/api/public/verify/:id', (req: Request, res: Response) => {
    const record = getVerificationRecord(req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Verification receipt not found.' });
      return;
    }

    if (record.status !== 'VERIFIED') {
      res.status(409).json({ error: 'This verification receipt is not publicly verifiable yet.' });
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      verification: {
        id: record.id,
        status: record.status,
        documentType: record.documentType,
        maskedDocumentNumber: record.maskedDocumentNumber,
        trustScore: record.trustScore,
        riskLevel: record.riskLevel,
        verifiedAt: record.officerDecision?.decidedAt || record.updatedAt || record.createdAt,
        cryptographicSeal: record.cryptographicSeal
      }
    });
  });

  // Get specific verification record
  app.get('/api/verifications/:id', requireAuth, (req: Request, res: Response) => {
    const record = getVerificationRecord(req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Verification record not found.' });
      return;
    }

    // Role check: Citizens can only inspect their own records
    if (req.user?.role === 'CITIZEN' && record.userId !== req.user.id) {
      logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        role: req.user.role,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        status: 'FAILURE',
        resourceId: req.params.id,
        ipAddress: req.clientIp,
        details: { reason: 'Attempted to access foreign verification record' }
      });
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    res.json({ record });
  });

  // Officer / Verifier decision on record
  const decisionSchema = z.object({
    verdict: z.enum(['VERIFIED', 'REJECTED', 'FLAGGED_TAMPERED']),
    remarks: z.string().min(3).max(500)
  });

  app.post(
    '/api/verifications/:id/decision',
    requireAuth,
    requireRole(['VERIFIER', 'OFFICER', 'ADMIN', 'SUPER_ADMIN']),
    (req: Request, res: Response) => {
      const parsed = decisionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid decision parameters.' });
        return;
      }

      const updated = updateVerificationDecision(req.params.id, {
        officerEmail: req.user!.email,
        verdict: parsed.data.verdict,
        remarks: parsed.data.remarks
      });

      if (!updated) {
        res.status(404).json({ error: 'Verification record not found.' });
        return;
      }

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'VERIFIER_DECISION',
        status: 'SUCCESS',
        resourceId: req.params.id,
        ipAddress: req.clientIp,
        details: {
          verdict: parsed.data.verdict,
          remarks: parsed.data.remarks
        }
      });

      res.json({
        message: 'Verification status successfully committed.',
        record: updated
      });
    }
  );

  // ==============================================================
  // ADMIN & AUDIT ENDPOINTS (Protected by RBAC)
  // ==============================================================

  app.get('/api/admin/users', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
    const users = getAllUsers();
    res.json({ users });
  });

  const roleUpdateSchema = z.object({
    role: z.enum(['CITIZEN', 'VERIFIER', 'OFFICER', 'ADMIN', 'SUPER_ADMIN'])
  });

  app.patch(
    '/api/admin/users/:id/role',
    requireAuth,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    (req: Request, res: Response) => {
      const parsed = roleUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Valid role required.' });
        return;
      }

      const success = updateUserRole(req.params.id, parsed.data.role as UserRole);
      if (!success) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'USER_ROLE_CHANGE',
        status: 'SUCCESS',
        resourceId: req.params.id,
        ipAddress: req.clientIp,
        details: { newRole: parsed.data.role }
      });

      res.json({ message: `Role updated to ${parsed.data.role} successfully.` });
    }
  );

  // Toggle user active / suspended status
  app.patch(
    '/api/admin/users/:id/status',
    requireAuth,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    (req: Request, res: Response) => {
      const result = toggleUserStatus(req.params.id);
      if (!result.success || !result.user) {
        res.status(404).json({ error: 'User registration not found.' });
        return;
      }

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'USER_STATUS_CHANGE',
        status: 'SUCCESS',
        resourceId: req.params.id,
        ipAddress: req.clientIp,
        details: { status: result.user.status }
      });

      res.json({
        message: `User status changed to ${result.user.status}.`,
        user: result.user
      });
    }
  );

  // Delete user registration
  app.delete(
    '/api/admin/users/:id',
    requireAuth,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    (req: Request, res: Response) => {
      if (req.params.id === req.user?.id) {
        res.status(400).json({ error: 'Cannot delete your own active administrator account.' });
        return;
      }

      const deleted = deleteUser(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'User registration not found.' });
        return;
      }

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'USER_DELETED',
        status: 'SUCCESS',
        resourceId: req.params.id,
        ipAddress: req.clientIp,
        details: { deletedUserId: req.params.id }
      });

      res.json({ message: 'User registration successfully deleted.' });
    }
  );

  // ==============================================================
  // ADMIN BOOKING & APPOINTMENT ROUTES
  // ==============================================================

  const bookingCreateSchema = z.object({
    citizenName: z.string().min(2).max(100),
    citizenEmail: z.string().email(),
    citizenPhone: z.string().min(8).max(20),
    serviceType: z.enum([
      'AADHAAR_REVERIFY',
      'PASSPORT_APOSTILLE',
      'PAN_FRAUD_AUDIT',
      'BIOMETRIC_UPDATE',
      'CITIZEN_ONBOARDING',
      'OFFICER_FIELD_INSPECTION'
    ]),
    bookingDate: z.string().min(8), // YYYY-MM-DD
    timeSlot: z.string().min(3),
    verificationCenter: z.string().min(3),
    priority: z.enum(['NORMAL', 'URGENT', 'TATKAL', 'VIP']).optional(),
    notes: z.string().max(500).optional()
  });

  // Get all bookings (with search & filters)
  app.get(
    '/api/admin/bookings',
    requireAuth,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    (req: Request, res: Response) => {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const serviceType = typeof req.query.serviceType === 'string' ? req.query.serviceType : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;

      const bookings = listBookings({ status, serviceType, search });
      res.json({ bookings });
    }
  );

  // Create a new booking from admin end
  app.post(
    '/api/admin/bookings',
    requireAuth,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    (req: Request, res: Response) => {
      const parsed = bookingCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: parsed.error.issues[0]?.message || 'Invalid booking details provided.'
        });
        return;
      }

      const booking = createBooking({
        ...parsed.data,
        createdById: req.user!.id,
        createdByEmail: req.user!.email
      });

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'BOOKING_CREATED',
        status: 'SUCCESS',
        resourceId: booking.id,
        ipAddress: req.clientIp,
        details: {
          bookingRef: booking.bookingRef,
          citizenEmail: booking.citizenEmail,
          serviceType: booking.serviceType
        }
      });

      res.status(201).json({
        message: 'New verification booking created successfully.',
        booking
      });
    }
  );

  // Update booking status or details
  const bookingUpdateSchema = z.object({
    status: z.enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['NORMAL', 'URGENT', 'TATKAL', 'VIP']).optional(),
    notes: z.string().max(500).optional(),
    bookingDate: z.string().optional(),
    timeSlot: z.string().optional(),
    verificationCenter: z.string().optional()
  });

  app.patch(
    '/api/admin/bookings/:id',
    requireAuth,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    (req: Request, res: Response) => {
      const parsed = bookingUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid update payload.' });
        return;
      }

      const updated = updateBooking(req.params.id, parsed.data);
      if (!updated) {
        res.status(404).json({ error: 'Booking record not found.' });
        return;
      }

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'BOOKING_UPDATED',
        status: 'SUCCESS',
        resourceId: req.params.id,
        ipAddress: req.clientIp,
        details: parsed.data
      });

      res.json({
        message: 'Booking updated successfully.',
        booking: updated
      });
    }
  );

  // Delete / cancel booking
  app.delete(
    '/api/admin/bookings/:id',
    requireAuth,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    (req: Request, res: Response) => {
      const deleted = deleteBooking(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Booking record not found.' });
        return;
      }

      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'BOOKING_DELETED',
        status: 'SUCCESS',
        resourceId: req.params.id,
        ipAddress: req.clientIp,
        details: { deletedBookingId: req.params.id }
      });

      res.json({ message: 'Booking record removed successfully.' });
    }
  );

  app.get('/api/admin/audit', requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

    const logs = getAuditLogs({ action, role, status, limit });
    res.json({ logs });
  });

  app.post(
    '/api/admin/purge-retention',
    requireAuth,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    (req: Request, res: Response) => {
      const result = purgeExpiredRecords();
      logAuditEvent({
        userId: req.user?.id,
        userEmail: req.user?.email,
        role: req.user?.role,
        action: 'RETENTION_PURGE',
        status: 'SUCCESS',
        ipAddress: req.clientIp,
        details: { purgedCount: result.purgedCount }
      });
      res.json({
        message: `Retention purge executed. Removed ${result.purgedCount} expired document records.`,
        purgedCount: result.purgedCount
      });
    }
  );

  // Live Security Audit Report API (checks all 15 security dimensions)
  app.get('/api/security/audit-report', requireAuth, (req: Request, res: Response) => {
    const report = performSecurityAudit();
    logAuditEvent({
      userId: req.user?.id,
      userEmail: req.user?.email,
      role: req.user?.role,
      action: 'SECURITY_AUDIT_RUN',
      status: 'SUCCESS',
      ipAddress: req.clientIp,
      details: { summary: report.summary }
    });
    res.json(report);
  });

  // Generic Safe Error Handler (Never leaks stack traces, env vars, or SQL queries in production)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      error: 'An unexpected sovereign system error occurred. Please try again later.'
    });
  });

  // ==============================================================
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC FILES
  // ==============================================================

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PramaanID Portal] Sovereign security server running on port ${PORT}`);
    console.log(`[Security] AES-256 Vault: Active | Rate Limiter: Active | RBAC: Enforced`);
  });
}

startServer().catch(err => {
  console.error('Failed to initialize sovereign application server:', err);
  process.exit(1);
});
