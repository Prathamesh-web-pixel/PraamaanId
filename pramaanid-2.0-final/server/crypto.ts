/**
 * Server-Side Cryptographic Service
 * Implements AES-256-GCM authenticated encryption at rest, SHA-256 digital seals,
 * file binary signature (magic bytes) validation, and PII masking.
 */

import crypto from 'crypto';
import { serverEnv } from '../config/env.js';

// Derive 32-byte key from ENCRYPTION_KEY using SHA-256 to ensure exactly 256 bits
const VAULT_KEY = crypto.createHash('sha256').update(serverEnv.ENCRYPTION_KEY).digest();
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

export interface EncryptedPayload {
  iv: string; // hex
  tag: string; // hex (Auth tag for integrity)
  data: string; // hex
  algorithm: string;
}

/**
 * Encrypts arbitrary string or buffer using AES-256-GCM.
 * Prevents unauthorized access or tampering even if storage is inspected.
 */
export function encryptData(plainText: string): EncryptedPayload {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, VAULT_KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted,
    algorithm: ALGORITHM
  };
}

/**
 * Decrypts AES-256-GCM payload. Fails if ciphertext or auth tag has been tampered with.
 */
export function decryptData(payload: EncryptedPayload): string {
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, VAULT_KEY, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(payload.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generates an immutable SHA-256 cryptographic seal for verification certificates.
 */
export function generateCryptographicSeal(data: Record<string, unknown>): string {
  const canonicalString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(canonicalString + serverEnv.SESSION_SECRET).digest('hex');
}

/**
 * Validates binary magic bytes to detect file spoofing (e.g. executable disguised as image).
 */
export function validateFileMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // WEBP: 52 49 46 46 .... 57 45 42 50
  if (mimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // PDF: 25 50 44 46 (%PDF)
  if (mimeType === 'application/pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  return false;
}

/**
 * Mask Indian Aadhaar number (e.g. 1234 5678 9012 -> XXXX-XXXX-9012)
 */
export function maskAadhaar(aadhaar: string): string {
  const cleaned = aadhaar.replace(/[^0-9]/g, '');
  if (cleaned.length < 12) return 'XXXX-XXXX-XXXX';
  const lastFour = cleaned.slice(-4);
  return `XXXX-XXXX-${lastFour}`;
}

/**
 * Mask PAN card (e.g. ABCDE1234F -> XXXXX1234F)
 */
export function maskPAN(pan: string): string {
  const cleaned = pan.toUpperCase().trim();
  if (cleaned.length < 10) return 'XXXXXXXXXX';
  return `XXXXX${cleaned.slice(5)}`;
}

/**
 * Mask Passport Number (e.g. Z1234567 -> ZXXXXXX7)
 */
export function maskPassport(passport: string): string {
  const cleaned = passport.toUpperCase().trim();
  if (cleaned.length < 8) return 'XXXXXXXX';
  return `${cleaned[0]}XXXXXX${cleaned.slice(-1)}`;
}

/**
 * Generic PII Redaction depending on document type
 */
export function redactDocumentNumber(type: string, number: string): string {
  if (!number) return 'REDACTED';
  switch (type.toUpperCase()) {
    case 'AADHAAR':
      return maskAadhaar(number);
    case 'PAN':
      return maskPAN(number);
    case 'PASSPORT':
      return maskPassport(number);
    default:
      if (number.length <= 4) return 'XXXX';
      return 'X'.repeat(number.length - 4) + number.slice(-4);
  }
}
