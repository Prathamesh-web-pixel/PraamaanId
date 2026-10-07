import type { VerificationRecord } from './storage.js';

export interface IdentityConsistencyResult {
  score: number;
  verdict: 'CONSISTENT' | 'REVIEW' | 'CONFLICT';
  documentsChecked: number;
  matchedFields: string[];
  conflicts: Array<{ field: string; documents: string[]; values: string[] }>;
  reasons: string[];
}

const clean = (value?: string) => (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const display = (value?: string) => (value || '').trim();

export function calculateIdentityConsistency(records: VerificationRecord[]): IdentityConsistencyResult {
  if (records.length < 2) {
    return { score: 0, verdict: 'REVIEW', documentsChecked: records.length, matchedFields: [], conflicts: [], reasons: ['At least two documents are required for cross-document verification.'] };
  }

  const fields: Array<{ key: 'fullName' | 'dateOfBirth' | 'gender'; label: string; weight: number }> = [
    { key: 'fullName', label: 'Full name', weight: 50 },
    { key: 'dateOfBirth', label: 'Date of birth', weight: 35 },
    { key: 'gender', label: 'Gender', weight: 15 }
  ];

  let totalWeight = 0;
  let earnedWeight = 0;
  const matchedFields: string[] = [];
  const conflicts: IdentityConsistencyResult['conflicts'] = [];

  for (const field of fields) {
    const values = records.map(r => clean(r[field.key])).filter(Boolean);
    const unique = [...new Set(values)];
    if (unique.length === 0) continue;
    totalWeight += field.weight;
    if (unique.length === 1) {
      earnedWeight += field.weight;
      matchedFields.push(field.label);
    } else {
      conflicts.push({
        field: field.label,
        documents: records.map(r => `${r.documentType} (${r.maskedDocumentNumber})`),
        values: records.map(r => display(r[field.key]) || 'Not available')
      });
    }
  }

  const score = totalWeight ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const verdict = score >= 90 ? 'CONSISTENT' : score >= 70 ? 'REVIEW' : 'CONFLICT';
  const reasons: string[] = [];
  if (matchedFields.length) reasons.push(`${matchedFields.join(', ')} consistent across submitted documents.`);
  for (const conflict of conflicts) reasons.push(`${conflict.field} mismatch detected across documents.`);
  if (!conflicts.length) reasons.push('No identity-field conflict detected in the available data.');

  return { score, verdict, documentsChecked: records.length, matchedFields, conflicts, reasons };
}
