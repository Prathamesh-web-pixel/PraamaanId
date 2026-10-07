/**
 * Shared Type Definitions for PramaanID Portal
 */

export type UserRole = 'CITIZEN' | 'VERIFIER' | 'OFFICER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status?: 'ACTIVE' | 'SUSPENDED';
  createdAt?: string;
  lastLoginAt?: string;
  phone?: string;
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

export type DocumentType = 'AADHAAR' | 'PAN' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENCE';
export type VerificationStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'FLAGGED_TAMPERED' | 'REJECTED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ExtractedDocumentData {
  documentType: DocumentType;
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  fatherName?: string;
  expiryDate?: string;
  issueDate?: string;
}

export interface TamperForensicReport {
  overallRisk: RiskLevel;
  confidenceScore: number;
  fontConsistencyScore: number;
  hologramAuthenticityScore: number;
  photoBoxIntegrityScore: number;
  tamperFlags: string[];
  forensicNotes: string;
}

export interface FaceVerificationResult {
  matchScore: number;
  verdict: 'MATCHED' | 'INCONCLUSIVE' | 'MISMATCH';
  confidence: number;
  livenessPassed: boolean;
  notes: string;
  challengeFrames?: number;
}

export interface VerificationRecord {
  id: string;
  userId: string;
  userEmail: string;
  documentType: DocumentType;
  maskedDocumentNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  status: VerificationStatus;
  riskLevel: RiskLevel;
  confidenceScore: number;
  trustScore: number;
  trustReasons: string[];
  identityConsistencyScore?: number;
  previewThumbnail: string;
  analysis: {
    extracted: ExtractedDocumentData;
    forensics: TamperForensicReport;
  };
  faceMatch?: FaceVerificationResult;
  cryptographicSeal: string;
  officerDecision?: {
    decidedBy: string;
    decidedAt: string;
    verdict: VerificationStatus;
    remarks: string;
  };
  retentionExpiresAt: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  role: string;
  action: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  signature: string;
}

export interface AuditCheckItem {
  name: string;
  category: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  description: string;
  remediation?: string;
}

export interface SecurityReport {
  checks: AuditCheckItem[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
  };
}
