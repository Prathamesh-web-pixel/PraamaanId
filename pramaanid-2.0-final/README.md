<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/072c3ee7-048b-4f98-b592-4c3efedd906d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## PramaanID 2.0 hackathon scope

This repository is a hackathon prototype, not an official Government of India service. It demonstrates an AI-assisted identity trust workflow: document analysis, explainable trust scoring, cross-document consistency, camera challenge capture, biometric review, cryptographic receipts, and QR-based public verification.

### Important demo limitation
The current storage layer remains in-memory for rapid hackathon iteration. It is not suitable for production persistence or horizontal scaling. Before any real deployment, replace the in-memory repositories with a managed database/object store and conduct a formal security/privacy review.
