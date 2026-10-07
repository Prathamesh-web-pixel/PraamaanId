/**
 * In-Memory Secure Storage & State Manager
 * Emulates a production database with strict data isolation, bcrypt hashing,
 * account lockout, session management, and encrypted document storage.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { EncryptedPayload, encryptData, generateCryptographicSeal, redactDocumentNumber } from './crypto.js';
import { DocumentAnalysisResult, FaceVerificationResult } from './gemini.js';
import { logAuditEvent } from './audit.js';
import { calculateTrustScore } from './riskEngine.js';

export type UserRole = 'CITIZEN' | 'VERIFIER' | 'OFFICER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  passwordHash: string; // bcrypt hash
  failedLoginAttempts: number;
  lockedUntil?: number; // timestamp
  status?: 'ACTIVE' | 'SUSPENDED';
  phone?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export type BookingStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BookingPriority = 'NORMAL' | 'URGENT' | 'TATKAL' | 'VIP';
export type ServiceType = 
  | 'AADHAAR_REVERIFY' 
  | 'PASSPORT_APOSTILLE' 
  | 'PAN_FRAUD_AUDIT' 
  | 'BIOMETRIC_UPDATE' 
  | 'CITIZEN_ONBOARDING'
  | 'OFFICER_FIELD_INSPECTION';

export interface Booking {
  id: string;
  bookingRef: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  serviceType: ServiceType;
  bookingDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM - 11:00 AM"
  verificationCenter: string;
  status: BookingStatus;
  priority: BookingPriority;
  notes?: string;
  createdById: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  userId: string;
  role: UserRole;
  expiresAt: number; // timestamp
  createdAt: string;
}

export type VerificationStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'FLAGGED_TAMPERED' | 'REJECTED';

export interface VerificationRecord {
  id: string;
  userId: string;
  userEmail: string;
  documentType: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENCE';
  maskedDocumentNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  status: VerificationStatus;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number;
  trustScore: number;
  trustReasons: string[];
  identityConsistencyScore?: number;
  encryptedVaultPayload: EncryptedPayload; // AES-256-GCM encrypted original data/photo
  previewThumbnail: string; // safe redacted preview or badge
  analysis: DocumentAnalysisResult;
  faceMatch?: FaceVerificationResult;
  cryptographicSeal: string; // SHA-256 verifiable seal
  officerDecision?: {
    decidedBy: string;
    decidedAt: string;
    verdict: VerificationStatus;
    remarks: string;
  };
  retentionExpiresAt: number; // timestamp for automatic purge
  createdAt: string;
  updatedAt: string;
}

// In-Memory Collections
const usersMap = new Map<string, User>();
const sessionsMap = new Map<string, Session>();
const verificationsMap = new Map<string, VerificationRecord>();
const bookingsMap = new Map<string, Booking>();

// Account lockout configurations
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Initialize default users with securely hashed passwords
 */
export async function seedInitialUsers() {
  if (usersMap.size > 0) return;

  // Salt rounds: 10 (industry standard for bcrypt)
  const defaultPasswordHash = await bcrypt.hash('Sovereign#2026', 10);
  const adminCsePasswordHash = await bcrypt.hash('09080706', 10);

  const seedUsers: Array<Omit<User, 'failedLoginAttempts'>> = [
    {
      id: 'usr_admin_cse',
      email: 'csedevlopers@gmail.com',
      fullName: 'CSE Developers (Admin)',
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash: adminCsePasswordHash,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_citizen_01',
      email: 'citizen@pramaan.gov.in',
      fullName: 'Vikramaditya Sharma',
      role: 'CITIZEN',
      status: 'ACTIVE',
      passwordHash: defaultPasswordHash,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_verifier_01',
      email: 'verifier@pramaan.gov.in',
      fullName: 'Sunita Rao',
      role: 'VERIFIER',
      passwordHash: defaultPasswordHash,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_officer_01',
      email: 'officer@pramaan.gov.in',
      fullName: 'Col. Rajeshwardas Gupta',
      role: 'OFFICER',
      passwordHash: defaultPasswordHash,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_admin_01',
      email: 'admin@pramaan.gov.in',
      fullName: 'Dr. Ananya Sen',
      role: 'ADMIN',
      passwordHash: defaultPasswordHash,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_superadmin_01',
      email: 'superadmin@pramaan.gov.in',
      fullName: 'Devavrat Joshi (Chief Security Officer)',
      role: 'SUPER_ADMIN',
      passwordHash: defaultPasswordHash,
      createdAt: new Date().toISOString()
    }
  ];

  for (const u of seedUsers) {
    usersMap.set(u.id, {
      ...u,
      failedLoginAttempts: 0
    });
  }

  // Seed sample initial verification records for queue inspection
  seedInitialVerifications();
  // Seed sample initial bookings for admin management
  seedInitialBookings();
}

function seedInitialBookings() {
  if (bookingsMap.size > 0) return;
  const now = Date.now();

  const sampleBookings: Booking[] = [
    {
      id: 'bkg_001',
      bookingRef: 'PRM-BKG-2026-8812',
      citizenName: 'Rohit K. Verma',
      citizenEmail: 'rohit.verma@example.com',
      citizenPhone: '+91 98201 44521',
      serviceType: 'PASSPORT_APOSTILLE',
      bookingDate: '2026-10-12',
      timeSlot: '10:30 AM - 11:30 AM',
      verificationCenter: 'New Delhi Sovereign Node (MeitY HQ Enclave)',
      status: 'CONFIRMED',
      priority: 'TATKAL',
      notes: 'Urgent diplomat visa verification with biometrics matching.',
      createdById: 'usr_admin_cse',
      createdByEmail: 'csedevlopers@gmail.com',
      createdAt: new Date(now - 7200000).toISOString(),
      updatedAt: new Date(now - 7200000).toISOString()
    },
    {
      id: 'bkg_002',
      bookingRef: 'PRM-BKG-2026-7734',
      citizenName: 'Meera S. Kulkarni',
      citizenEmail: 'meera.kulkarni@example.com',
      citizenPhone: '+91 94220 89104',
      serviceType: 'AADHAAR_REVERIFY',
      bookingDate: '2026-10-14',
      timeSlot: '02:00 PM - 03:00 PM',
      verificationCenter: 'Mumbai Western Command Enclave',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      notes: 'Iris and biometric thumbprint re-enrollment validation.',
      createdById: 'usr_admin_cse',
      createdByEmail: 'csedevlopers@gmail.com',
      createdAt: new Date(now - 14400000).toISOString(),
      updatedAt: new Date(now - 3600000).toISOString()
    },
    {
      id: 'bkg_003',
      bookingRef: 'PRM-BKG-2026-9905',
      citizenName: 'Aditya Raj Singhania',
      citizenEmail: 'aditya.singhania@corp.in',
      citizenPhone: '+91 99881 22334',
      serviceType: 'PAN_FRAUD_AUDIT',
      bookingDate: '2026-10-18',
      timeSlot: '11:30 AM - 12:30 PM',
      verificationCenter: 'Bengaluru Tech Sovereignty Center',
      status: 'CONFIRMED',
      priority: 'VIP',
      notes: 'High-value corporate director KYC identity validation.',
      createdById: 'usr_admin_cse',
      createdByEmail: 'csedevlopers@gmail.com',
      createdAt: new Date(now - 28800000).toISOString(),
      updatedAt: new Date(now - 28800000).toISOString()
    }
  ];

  for (const b of sampleBookings) {
    bookingsMap.set(b.id, b);
  }
}

function seedInitialVerifications() {
  const now = Date.now();
  const sample1Encrypted = encryptData(JSON.stringify({
    rawNumber: '9845 2314 9021',
    address: 'Flat 402, Shivam Enclave, Baner Road, Pune, Maharashtra 411045'
  }));

  const seal1 = generateCryptographicSeal({
    id: 'ver_001',
    docType: 'AADHAAR',
    number: 'XXXX-XXXX-9021',
    name: 'ROHAN CHANDRAKANT PATIL'
  });

  const rec1: VerificationRecord = {
    id: 'ver_001',
    userId: 'usr_citizen_01',
    userEmail: 'citizen@pramaan.gov.in',
    documentType: 'AADHAAR',
    maskedDocumentNumber: 'XXXX-XXXX-9021',
    fullName: 'ROHAN CHANDRAKANT PATIL',
    dateOfBirth: '1989-04-27',
    gender: 'Male',
    status: 'VERIFIED',
    riskLevel: 'LOW',
    confidenceScore: 99,
    trustScore: 99,
    trustReasons: ['No high-risk signal was detected in the available checks.'],
    encryptedVaultPayload: sample1Encrypted,
    previewThumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="%231e293b"/><text x="10" y="35" fill="%2394a3b8" font-size="10">AADHAAR</text></svg>',
    analysis: {
      extracted: {
        documentType: 'AADHAAR',
        documentNumber: 'XXXX-XXXX-9021',
        fullName: 'ROHAN CHANDRAKANT PATIL',
        dateOfBirth: '1989-04-27',
        gender: 'Male'
      },
      forensics: {
        overallRisk: 'LOW',
        confidenceScore: 99,
        fontConsistencyScore: 97,
        hologramAuthenticityScore: 98,
        photoBoxIntegrityScore: 99,
        tamperFlags: [],
        forensicNotes: 'UIDAI security pattern & Verhoeff algorithm valid.'
      }
    },
    faceMatch: {
      matchScore: 96,
      verdict: 'MATCHED',
      confidence: 97,
      livenessPassed: true,
      notes: 'Biometric facial features match applicant selfie.'
    },
    cryptographicSeal: seal1,
    officerDecision: {
      decidedBy: 'officer@pramaan.gov.in',
      decidedAt: new Date(now - 3600000).toISOString(),
      verdict: 'VERIFIED',
      remarks: 'Automated + Manual Officer review passed.'
    },
    retentionExpiresAt: now + 30 * 86400000,
    createdAt: new Date(now - 7200000).toISOString(),
    updatedAt: new Date(now - 3600000).toISOString()
  };

  // Sample 2: Flagged suspicious ID
  const sample2Encrypted = encryptData(JSON.stringify({
    rawNumber: 'ABCDE1111Q',
    mismatch: 'Font size variance detected in Tax Assessee Number field'
  }));
  const seal2 = generateCryptographicSeal({ id: 'ver_002', docType: 'PAN', number: 'XXXXX1111Q' });

  const rec2: VerificationRecord = {
    id: 'ver_002',
    userId: 'usr_citizen_02',
    userEmail: 'applicant.external@example.com',
    documentType: 'PAN',
    maskedDocumentNumber: 'XXXXX1111Q',
    fullName: 'ALOK MANOHAR JADHAV',
    dateOfBirth: '1985-02-12',
    gender: 'Male',
    status: 'FLAGGED_TAMPERED',
    riskLevel: 'HIGH',
    confidenceScore: 61,
    trustScore: 42,
    trustReasons: ['Font kerning inconsistency on PAN alphanumeric string', 'Photo border edge demonstrates digital cloning artifacts'],
    encryptedVaultPayload: sample2Encrypted,
    previewThumbnail: '',
    analysis: {
      extracted: {
        documentType: 'PAN',
        documentNumber: 'XXXXX1111Q',
        fullName: 'ALOK MANOHAR JADHAV',
        dateOfBirth: '1985-02-12',
        gender: 'Male'
      },
      forensics: {
        overallRisk: 'HIGH',
        confidenceScore: 61,
        fontConsistencyScore: 42,
        hologramAuthenticityScore: 35,
        photoBoxIntegrityScore: 48,
        tamperFlags: [
          'Font kerning inconsistency on PAN alphanumeric string',
          'Photo border edge demonstrates digital cloning artifacts',
          'Hologram optic reflection angle anomalous'
        ],
        forensicNotes: 'Potential synthetic document generation or secondary font alteration.'
      }
    },
    cryptographicSeal: seal2,
    retentionExpiresAt: now + 30 * 86400000,
    createdAt: new Date(now - 14400000).toISOString(),
    updatedAt: new Date(now - 14400000).toISOString()
  };

  verificationsMap.set(rec1.id, rec1);
  verificationsMap.set(rec2.id, rec2);
}

// User & Auth operations
export function getUserByEmail(email: string): User | undefined {
  const normalized = email.toLowerCase().trim();
  for (const user of usersMap.values()) {
    if (user.email.toLowerCase() === normalized) {
      return user;
    }
  }
  return undefined;
}

export function getUserById(id: string): User | undefined {
  return usersMap.get(id);
}

export function getAllUsers(): Array<Omit<User, 'passwordHash'>> {
  return Array.from(usersMap.values()).map(u => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = u;
    return safe;
  });
}

export async function createUser(data: {
  email: string;
  fullName: string;
  password: string;
  role?: UserRole;
}): Promise<Omit<User, 'passwordHash'>> {
  const existing = getUserByEmail(data.email);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const id = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const newUser: User = {
    id,
    email: data.email.toLowerCase().trim(),
    fullName: data.fullName.trim(),
    role: data.role || 'CITIZEN',
    passwordHash,
    failedLoginAttempts: 0,
    createdAt: new Date().toISOString()
  };

  usersMap.set(id, newUser);
  
  // Return safe representation without passwordHash
  const { passwordHash: _, ...safeUser } = newUser;
  return safeUser;
}

export function updateUserRole(userId: string, newRole: UserRole): boolean {
  const user = usersMap.get(userId);
  if (!user) return false;
  user.role = newRole;
  return true;
}

export function recordFailedLogin(user: User): { isLocked: boolean; lockUntil?: number } {
  user.failedLoginAttempts += 1;
  if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    user.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      action: 'ACCOUNT_LOCKED',
      status: 'WARNING',
      details: { reason: `Locked out due to ${MAX_FAILED_ATTEMPTS} consecutive failed login attempts.` }
    });
    return { isLocked: true, lockUntil: user.lockedUntil };
  }
  return { isLocked: false };
}

export function resetFailedLogin(user: User) {
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date().toISOString();
}

// Session operations
export function createSession(user: User): Session {
  // Use cryptographically secure 256-bit random token
  const token = crypto.randomBytes(32).toString('hex');
  const session: Session = {
    token,
    userId: user.id,
    role: user.role,
    expiresAt: Date.now() + SESSION_TTL_MS,
    createdAt: new Date().toISOString()
  };

  sessionsMap.set(token, session);
  return session;
}

export function getSession(token: string): Session | undefined {
  if (!token) return undefined;
  const session = sessionsMap.get(token);
  if (!session) return undefined;

  // Check expiration
  if (Date.now() > session.expiresAt) {
    sessionsMap.delete(token);
    return undefined;
  }

  return session;
}

export function invalidateSession(token: string): boolean {
  return sessionsMap.delete(token);
}

// Verification record operations
export function createVerificationRecord(params: {
  userId: string;
  userEmail: string;
  documentType: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENCE';
  rawDocumentNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  analysis: DocumentAnalysisResult;
  faceMatch?: FaceVerificationResult;
  rawImagePayload?: string;
  retentionDays?: number;
}): VerificationRecord {
  const id = `ver_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = Date.now();
  const retentionMs = (params.retentionDays || 30) * 86400000;

  const maskedNumber = redactDocumentNumber(params.documentType, params.rawDocumentNumber);
  
  // Encrypt raw document data using AES-256-GCM
  const encryptedVaultPayload = encryptData(JSON.stringify({
    rawNumber: params.rawDocumentNumber,
    fullName: params.fullName,
    dateOfBirth: params.dateOfBirth,
    gender: params.gender,
    imageSnapshot: params.rawImagePayload ? params.rawImagePayload.substring(0, 1000) : ''
  }));

  const trust = calculateTrustScore(params.analysis, params.faceMatch);

  const cryptographicSeal = generateCryptographicSeal({
    id,
    documentType: params.documentType,
    maskedNumber,
    fullName: params.fullName,
    confidence: params.analysis.forensics.confidenceScore,
    risk: trust.riskLevel
  });

  const status: VerificationStatus = trust.riskLevel === 'HIGH'
    ? 'FLAGGED_TAMPERED'
    : (params.faceMatch && params.faceMatch.verdict === 'MATCHED') ? 'VERIFIED' : 'PENDING_REVIEW';

  const record: VerificationRecord = {
    id,
    userId: params.userId,
    userEmail: params.userEmail,
    documentType: params.documentType,
    maskedDocumentNumber: maskedNumber,
    fullName: params.fullName,
    dateOfBirth: params.dateOfBirth,
    gender: params.gender,
    status,
    riskLevel: trust.riskLevel,
    confidenceScore: params.analysis.forensics.confidenceScore,
    trustScore: trust.trustScore,
    trustReasons: trust.reasons,
    identityConsistencyScore: undefined,
    encryptedVaultPayload,
    previewThumbnail: params.rawImagePayload ? params.rawImagePayload.substring(0, 500) : '',
    analysis: params.analysis,
    faceMatch: params.faceMatch,
    cryptographicSeal,
    retentionExpiresAt: now + retentionMs,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  verificationsMap.set(id, record);
  return record;
}

export function updateVerificationTrust(id: string, faceMatch: FaceVerificationResult): VerificationRecord | undefined {
  const record = verificationsMap.get(id);
  if (!record) return undefined;

  const trust = calculateTrustScore(record.analysis, faceMatch, record.identityConsistencyScore);
  record.faceMatch = faceMatch;
  record.trustScore = trust.trustScore;
  record.trustReasons = trust.reasons;
  record.riskLevel = trust.riskLevel;
  record.confidenceScore = record.analysis.forensics.confidenceScore;
  if (trust.riskLevel === 'HIGH') {
    record.status = 'FLAGGED_TAMPERED';
  } else if (faceMatch.verdict === 'MATCHED' && faceMatch.livenessPassed) {
    record.status = 'VERIFIED';
  } else {
    record.status = 'PENDING_REVIEW';
  }
  record.updatedAt = new Date().toISOString();
  return record;
}

export function updateVerificationIdentityConsistency(id: string, identityScore: number, identityReasons: string[]): VerificationRecord | undefined {
  const record = verificationsMap.get(id);
  if (!record) return undefined;

  record.identityConsistencyScore = Math.max(0, Math.min(100, Math.round(identityScore)));
  const trust = calculateTrustScore(record.analysis, record.faceMatch, record.identityConsistencyScore);
  record.trustScore = trust.trustScore;
  record.trustReasons = [...new Set([...trust.reasons, ...identityReasons])].slice(0, 8);
  record.riskLevel = trust.riskLevel;
  if (trust.riskLevel === 'HIGH') {
    record.status = 'FLAGGED_TAMPERED';
  } else if (record.faceMatch?.verdict === 'MATCHED' && record.faceMatch.livenessPassed && record.identityConsistencyScore >= 90) {
    record.status = 'VERIFIED';
  } else {
    record.status = 'PENDING_REVIEW';
  }
  record.updatedAt = new Date().toISOString();
  return record;
}

export function getVerificationRecord(id: string): VerificationRecord | undefined {
  return verificationsMap.get(id);
}

export function listVerifications(filter?: {
  userId?: string;
  status?: string;
  riskLevel?: string;
  documentType?: string;
}): VerificationRecord[] {
  let list = Array.from(verificationsMap.values());

  if (filter?.userId) {
    list = list.filter(v => v.userId === filter.userId);
  }
  if (filter?.status && filter.status !== 'ALL') {
    list = list.filter(v => v.status === filter.status);
  }
  if (filter?.riskLevel && filter.riskLevel !== 'ALL') {
    list = list.filter(v => v.riskLevel === filter.riskLevel);
  }
  if (filter?.documentType && filter.documentType !== 'ALL') {
    list = list.filter(v => v.documentType === filter.documentType);
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateVerificationDecision(
  id: string,
  decision: {
    officerEmail: string;
    verdict: VerificationStatus;
    remarks: string;
  }
): VerificationRecord | undefined {
  const rec = verificationsMap.get(id);
  if (!rec) return undefined;

  rec.status = decision.verdict;
  rec.updatedAt = new Date().toISOString();
  rec.officerDecision = {
    decidedBy: decision.officerEmail,
    decidedAt: new Date().toISOString(),
    verdict: decision.verdict,
    remarks: decision.remarks
  };

  return rec;
}

export function purgeExpiredRecords(): { purgedCount: number } {
  const now = Date.now();
  let count = 0;
  for (const [id, rec] of verificationsMap.entries()) {
    if (rec.retentionExpiresAt <= now) {
      verificationsMap.delete(id);
      count++;
    }
  }
  return { purgedCount: count };
}

// User Management Operations for Admin
export function deleteUser(userId: string): boolean {
  return usersMap.delete(userId);
}

export function toggleUserStatus(userId: string): { success: boolean; user?: Omit<User, 'passwordHash'> } {
  const u = usersMap.get(userId);
  if (!u) return { success: false };
  u.status = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
  const { passwordHash: _, ...safe } = u;
  return { success: true, user: safe };
}

export function updateUserDetails(userId: string, data: {
  fullName?: string;
  role?: UserRole;
  status?: 'ACTIVE' | 'SUSPENDED';
  phone?: string;
}): Omit<User, 'passwordHash'> | undefined {
  const u = usersMap.get(userId);
  if (!u) return undefined;
  if (data.fullName) u.fullName = data.fullName.trim();
  if (data.role) u.role = data.role;
  if (data.status) u.status = data.status;
  if (data.phone !== undefined) u.phone = data.phone;
  const { passwordHash: _, ...safe } = u;
  return safe;
}

// Booking Management Operations for Admin
export function createBooking(data: {
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  serviceType: ServiceType;
  bookingDate: string;
  timeSlot: string;
  verificationCenter: string;
  priority?: BookingPriority;
  notes?: string;
  createdById: string;
  createdByEmail: string;
}): Booking {
  const id = `bkg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingRef = `PRM-BKG-2026-${randomSuffix}`;

  const newBooking: Booking = {
    id,
    bookingRef,
    citizenName: data.citizenName.trim(),
    citizenEmail: data.citizenEmail.toLowerCase().trim(),
    citizenPhone: data.citizenPhone.trim(),
    serviceType: data.serviceType,
    bookingDate: data.bookingDate,
    timeSlot: data.timeSlot,
    verificationCenter: data.verificationCenter,
    status: 'CONFIRMED',
    priority: data.priority || 'NORMAL',
    notes: data.notes?.trim() || '',
    createdById: data.createdById,
    createdByEmail: data.createdByEmail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  bookingsMap.set(id, newBooking);
  return newBooking;
}

export function listBookings(filter?: {
  status?: string;
  serviceType?: string;
  search?: string;
}): Booking[] {
  let list = Array.from(bookingsMap.values());

  if (filter?.status && filter.status !== 'ALL') {
    list = list.filter(b => b.status === filter.status);
  }
  if (filter?.serviceType && filter.serviceType !== 'ALL') {
    list = list.filter(b => b.serviceType === filter.serviceType);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(b => 
      b.citizenName.toLowerCase().includes(q) ||
      b.citizenEmail.toLowerCase().includes(q) ||
      b.bookingRef.toLowerCase().includes(q) ||
      b.verificationCenter.toLowerCase().includes(q)
    );
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBooking(id: string): Booking | undefined {
  return bookingsMap.get(id);
}

export function updateBooking(id: string, updates: {
  status?: BookingStatus;
  priority?: BookingPriority;
  notes?: string;
  bookingDate?: string;
  timeSlot?: string;
  verificationCenter?: string;
}): Booking | undefined {
  const b = bookingsMap.get(id);
  if (!b) return undefined;

  if (updates.status) b.status = updates.status;
  if (updates.priority) b.priority = updates.priority;
  if (updates.notes !== undefined) b.notes = updates.notes;
  if (updates.bookingDate) b.bookingDate = updates.bookingDate;
  if (updates.timeSlot) b.timeSlot = updates.timeSlot;
  if (updates.verificationCenter) b.verificationCenter = updates.verificationCenter;
  b.updatedAt = new Date().toISOString();

  return b;
}

export function deleteBooking(id: string): boolean {
  return bookingsMap.delete(id);
}

