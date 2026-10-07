/**
 * Sovereign AI Engine powered by Google Gemini (@google/genai)
 * Implements Identity Document OCR, Tamper & Forgery Detection, and Face Comparison.
 * Strictly executes on server side; API keys are never exposed to browser.
 */

import { GoogleGenAI } from '@google/genai';
import { serverEnv } from '../config/env.js';

// Initialize Gemini client with mandatory User-Agent header
const apiKey = process.env.GEMINI_API_KEY || serverEnv.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

export interface ExtractedDocumentData {
  documentType: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENCE';
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
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceScore: number; // 0 - 100
  fontConsistencyScore: number; // 0 - 100
  hologramAuthenticityScore: number; // 0 - 100
  photoBoxIntegrityScore: number; // 0 - 100
  tamperFlags: string[];
  forensicNotes: string;
}

export interface DocumentAnalysisResult {
  extracted: ExtractedDocumentData;
  forensics: TamperForensicReport;
  rawTextPreview?: string;
}

export interface FaceVerificationResult {
  matchScore: number; // 0 - 100
  verdict: 'MATCHED' | 'INCONCLUSIVE' | 'MISMATCH';
  confidence: number;
  livenessPassed: boolean;
  notes: string;
  challengeFrames?: number;
}

/**
 * Analyzes an identity document using Gemini Vision OCR and Forensic checks
 */
export async function analyzeIdentityDocument(
  imageBase64: string,
  mimeType: string,
  declaredType?: string
): Promise<DocumentAnalysisResult> {
  // Strip data:image/...;base64, prefix if present
  const pureBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

  if (ai) {
    try {
      const prompt = `You are an AI-assisted identity document analysis engine for the PramaanID hackathon prototype.
Examine this uploaded identity document image with forensic precision.

Perform two tasks:
1. OCR Data Extraction: Extract the exact document type (one of: AADHAAR, PAN, PASSPORT, VOTER_ID, DRIVING_LICENCE), document number, full legal name, date of birth (YYYY-MM-DD or DD/MM/YYYY), gender (Male/Female/Other), address (if visible), father's name (if visible), issue/expiry dates.
2. Tamper & Forgery Forensics: Look for anomalies such as font discrepancies, digital copy-paste artifacts around numbers, photo overlay borders, skewed watermarks, mismatched text alignments, or pixelation anomalies.

Output strictly valid JSON with this exact schema:
{
  "extracted": {
    "documentType": "AADHAAR" | "PAN" | "PASSPORT" | "VOTER_ID" | "DRIVING_LICENCE",
    "documentNumber": string,
    "fullName": string,
    "dateOfBirth": string,
    "gender": string,
    "address": string,
    "fatherName": string,
    "expiryDate": string,
    "issueDate": string
  },
  "forensics": {
    "overallRisk": "LOW" | "MEDIUM" | "HIGH",
    "confidenceScore": number (0-100),
    "fontConsistencyScore": number (0-100),
    "hologramAuthenticityScore": number (0-100),
    "photoBoxIntegrityScore": number (0-100),
    "tamperFlags": [string],
    "forensicNotes": string
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: pureBase64
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      const parsed = JSON.parse(responseText.trim());
      if (parsed.extracted && parsed.forensics) {
        return parsed as DocumentAnalysisResult;
      }
    } catch (err) {
      console.warn('Gemini vision API analysis encountered an issue, invoking sovereign forensic engine fallback:', err);
    }
  }

  // Fail closed: never fabricate a successful verification when the AI service is unavailable.
  return generateAiUnavailableAnalysis(declaredType || 'AADHAAR');
}

/**
 * Compares document photo with live camera selfie for biometric verification
 */
export async function verifyFaceMatch(
  docImageBase64: string,
  selfieImageBase64: string
): Promise<FaceVerificationResult> {
  const cleanDoc = docImageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
  const cleanSelfie = selfieImageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

  if (ai) {
    try {
      const prompt = `Compare these two facial images for biometric identity verification:
Image 1: Facial portrait cropped from official government identity document.
Image 2: Live selfie captured from the applicant's camera.

Assess the document portrait against the live-capture contact sheet. The live capture is a short challenge-response sequence with multiple frames.
1. Compare facial geometry and stable features across the document portrait and live frames.
2. Look for liveness evidence across frames: natural pose/lighting variation, consistent facial structure, and signs of a flat replay/printed image.
3. Treat liveness as INCONCLUSIVE if the evidence is insufficient. Do not claim biometric certainty.

Output strictly valid JSON:
{
  "matchScore": number (0-100),
  "verdict": "MATCHED" | "INCONCLUSIVE" | "MISMATCH",
  "confidence": number (0-100),
  "livenessPassed": boolean,
  "challengeFrames": number,
  "notes": string
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanDoc
                }
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanSelfie
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '';
      const parsed = JSON.parse(text.trim());
      if (parsed.matchScore !== undefined) {
        return { ...parsed, challengeFrames: Number(parsed.challengeFrames || 1) } as FaceVerificationResult;
      }
    } catch (err) {
      console.warn('Gemini face verification error, falling back to local biometric metric engine:', err);
    }
  }

  // Fail closed: an unavailable AI service must never produce a fabricated biometric match.
  return {
    matchScore: 0,
    verdict: 'INCONCLUSIVE',
    confidence: 0,
    livenessPassed: false,
    notes: 'AI biometric verification is unavailable. Manual review is required; no match or liveness result was fabricated.',
    challengeFrames: 0
  };
}

/**
 * Safe fallback used when the AI service is unavailable.
 * This intentionally fails closed instead of returning fabricated identity data.
 */
function generateAiUnavailableAnalysis(type: string): DocumentAnalysisResult {
  const normalized = type.toUpperCase();
  const documentType = normalized.includes('PAN')
    ? 'PAN'
    : normalized.includes('PASSPORT')
      ? 'PASSPORT'
      : normalized.includes('VOTER')
        ? 'VOTER_ID'
        : normalized.includes('DRIVING')
          ? 'DRIVING_LICENCE'
          : 'AADHAAR';

  return {
    extracted: {
      documentType,
      documentNumber: '',
      fullName: '',
      dateOfBirth: '',
      gender: '',
    },
    forensics: {
      overallRisk: 'HIGH',
      confidenceScore: 0,
      fontConsistencyScore: 0,
      hologramAuthenticityScore: 0,
      photoBoxIntegrityScore: 0,
      tamperFlags: ['AI_UNAVAILABLE', 'MANUAL_REVIEW_REQUIRED'],
      forensicNotes: 'Automated AI verification is unavailable. No authenticity claim was made. Route this document to manual review.'
    }
  };
}
