import type { DocumentAnalysisResult, FaceVerificationResult } from './gemini.js';

export type TrustRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TrustScoreResult {
  trustScore: number;
  riskLevel: TrustRiskLevel;
  reasons: string[];
  signalScores: {
    documentConfidence: number;
    fontConsistency: number;
    hologramSignal: number;
    photoIntegrity: number;
    faceMatch?: number;
    liveness?: number;
  };
}

/**
 * Explainable, deterministic risk aggregation.
 * This is intentionally a signal aggregator, not a claim of forensic certainty.
 */
export function calculateTrustScore(
  analysis: DocumentAnalysisResult,
  faceMatch?: FaceVerificationResult,
  identityConsistencyScore?: number
): TrustScoreResult {
  const f = analysis.forensics;
  const reasons: string[] = [];
  const scores: Array<{ value: number; weight: number; label: string }> = [];

  const safe = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  };

  const documentConfidence = safe(f.confidenceScore);
  const fontConsistency = safe(f.fontConsistencyScore);
  const hologramSignal = safe(f.hologramAuthenticityScore);
  const photoIntegrity = safe(f.photoBoxIntegrityScore);

  scores.push({ value: documentConfidence, weight: 25, label: 'Document analysis confidence' });
  scores.push({ value: fontConsistency, weight: 15, label: 'Visual text consistency' });
  scores.push({ value: hologramSignal, weight: 10, label: 'Security-feature visual signal' });
  scores.push({ value: photoIntegrity, weight: 10, label: 'Photo-region integrity' });

  if (identityConsistencyScore !== undefined) {
    const identityScore = safe(identityConsistencyScore);
    scores.push({ value: identityScore, weight: 20, label: 'Cross-document identity consistency' });
    if (identityScore < 90) reasons.push(`Cross-document identity consistency is ${identityScore}/100.`);
  }

  if (faceMatch) {
    const faceScore = safe(faceMatch.matchScore);
    const livenessScore = faceMatch.livenessPassed ? 100 : 0;
    scores.push({ value: faceScore, weight: identityConsistencyScore !== undefined ? 20 : 25, label: 'Face match' });
    scores.push({ value: livenessScore, weight: identityConsistencyScore !== undefined ? 10 : 15, label: 'Liveness' });

    if (faceMatch.verdict === 'MISMATCH') reasons.push('Face does not sufficiently match the document portrait.');
    if (faceMatch.verdict === 'INCONCLUSIVE') reasons.push('Face verification is inconclusive and requires review.');
    if (!faceMatch.livenessPassed) reasons.push('Liveness challenge was not passed.');
  } else {
    reasons.push('Biometric verification is pending; score is document-only.');
  }

  if (f.tamperFlags.length > 0) {
    reasons.push(...f.tamperFlags.slice(0, 3));
  }
  if (documentConfidence < 70) reasons.push('AI/document analysis confidence is below the preferred threshold.');
  if (fontConsistency < 70) reasons.push('Text/font consistency signal is below the preferred threshold.');
  if (hologramSignal < 70) reasons.push('Security-feature visual signal is weak or inconclusive.');
  if (photoIntegrity < 70) reasons.push('Photo-region integrity signal is weak or inconclusive.');
  if (!reasons.length) reasons.push('No high-risk signal was detected in the available checks.');

  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const trustScore = totalWeight === 0
    ? 0
    : Math.round(scores.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight);

  const riskLevel: TrustRiskLevel = trustScore >= 80 ? 'LOW' : trustScore >= 60 ? 'MEDIUM' : 'HIGH';

  // Fail closed when the AI engine explicitly reports that automated analysis is unavailable.
  if (f.tamperFlags.includes('AI_UNAVAILABLE')) {
    return {
      trustScore: 0,
      riskLevel: 'HIGH',
      reasons: ['Automated AI verification is unavailable.', 'Manual review is required; no authenticity claim was made.'],
      signalScores: { documentConfidence, fontConsistency, hologramSignal, photoIntegrity }
    };
  }

  return {
    trustScore,
    riskLevel,
    reasons: [...new Set(reasons)],
    signalScores: {
      documentConfidence,
      fontConsistency,
      hologramSignal,
      photoIntegrity,
      ...(faceMatch ? { faceMatch: safe(faceMatch.matchScore), liveness: faceMatch.livenessPassed ? 100 : 0 } : {})
    }
  };
}
