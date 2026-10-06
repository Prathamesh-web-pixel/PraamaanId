# PramaanID 2.0 - First Refactor

## Change 01: Fail-closed AI fallback

- Removed fabricated deterministic success results when Gemini is unavailable.
- Document analysis now returns `HIGH` risk with `AI_UNAVAILABLE` and `MANUAL_REVIEW_REQUIRED` flags.
- Biometric verification now returns `INCONCLUSIVE`, zero confidence, and `livenessPassed: false` when AI verification is unavailable.
- This prevents the application from claiming a document or person is verified when the verification engine did not actually run.

## Next implementation order

1. Trust/Risk score engine
2. Cross-document identity consistency
3. Explainable verification report
4. QR verification receipt
5. Final demo/UI polish

## Step 2 - Explainable Trust Score
- Added server-side `riskEngine.ts`.
- Trust score aggregates document confidence, visual consistency, security-feature signal, photo integrity, face match and liveness when available.
- Added human-readable trust reasons and signal scores to verification records.
- Face verification now recalculates the record trust score and status.
- AI_UNAVAILABLE remains fail-closed at trust score 0 / HIGH risk / manual review.

- Added citizen-facing explainable Trust Score card with score bar and top risk reasons.

## Step 3 — Cross-Document Identity Consistency
- Added `/api/identity/consistency` endpoint.
- Added deterministic identity-field comparison for name, DOB and gender.
- Added citizen UI action to compare the current document against their other verification records.
- Added explainable conflict reporting and audit logging.

## Step 4 — Public QR Verification Receipt
- Added public read-only `/verify/:id` receipt page.
- Added `/api/public/verify/:id` endpoint with strict PII minimization.
- Added dependency-free-in-app QR generation via `qrcode.react` for verified receipts.
- Public endpoint rejects non-VERIFIED records and sends `Cache-Control: no-store`.
- Public receipt exposes only verification ID, document type, masked number, trust score, risk level, timestamp, and cryptographic seal.

## Final consolidation
- Added three-frame camera challenge workflow: look straight, turn left, turn right.
- Demo selfie is explicitly marked as non-liveness and can never produce a verified biometric result.
- Gemini face analysis now accepts a contact-sheet challenge sequence and returns challenge frame count.
- Trust scoring now incorporates cross-document identity consistency when available.
- Cross-document results are persisted into verification records and can change the final status to review/flagged.
- Public QR verification remains read-only and PII-minimized.
- Replaced government-authority wording with hackathon-prototype wording.
- Documented the remaining in-memory storage limitation.
