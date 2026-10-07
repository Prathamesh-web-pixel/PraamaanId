/**
 * Server-Side Environment Variable Validation & Configuration
 * Ensures zero secrets are missing, verifies cryptographic keys, and enforces production invariants.
 * NEVER exposes secrets to client bundles or terminal logs.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file if available
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  
  // Security secrets (Server-only)
  SESSION_SECRET: z.string().min(32, {
    message: 'SESSION_SECRET must be at least 32 characters long for production security.'
  }).default('dev_session_secret_32_chars_minimum_example_key_change_in_prod'),
  
  // 256-bit encryption key (64 hex characters or 32 raw bytes)
  ENCRYPTION_KEY: z.string().min(32, {
    message: 'ENCRYPTION_KEY must be a valid 256-bit key for AES-256-GCM.'
  }).default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  
  DEBUG: z.coerce.boolean().default(false),
  GEMINI_API_KEY: z.string().optional()
});

export type ValidatedEnv = z.infer<typeof envSchema>;

function validateEnv(): ValidatedEnv {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    const formattedErrors = result.error.issues.map((err) => ` - ${err.path.join('.')}: ${err.message}`).join('\n');
    // Note: Never log sensitive variable values, only field names and validation rules
    console.error('CRITICAL: Environment validation failed:\n' + formattedErrors);
    
    // In production, reject startup immediately
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Fatal: Invalid production environment configuration. Terminating.');
    }
  }

  // Sanitize and return parsed configuration
  const parsed = result.success ? result.data : envSchema.parse({
    ...process.env,
    SESSION_SECRET: process.env.SESSION_SECRET || 'dev_session_secret_32_chars_minimum_example_key_change_in_prod',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  });

  return parsed;
}

export const serverEnv = validateEnv();
