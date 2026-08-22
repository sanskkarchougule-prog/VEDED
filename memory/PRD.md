# VEDED Creative Suite + BookStream

## Context
User's existing GitHub repo (chougulesanskkar-cmd/VEDED). This Emergent environment started BLANK
(only the default starter). Per the user's instruction — "make it as shared repository, don't change
any color or sequence, just make it workable" — the exact repo code was restored from GitHub into /app
and wired to run. No design/color/sequence/copy changes were made.

## Stack
- Backend: FastAPI + MongoDB (motor). JWT (bcrypt) auth. Modular routers:
  routes_auth, routes_veded (generation), routes_bookstream, routes_payments.
- Frontend: React 19 + react-router 7 + Tailwind + framer-motion + sonner. Neon-lime cinematic dark theme.
  Routes: / (Landing), /login, /signup, /app/* shell (Dashboard, images, audio, video, movies,
  web-series, shorts, bookstream, pricing), /payment/success|cancel.

## Integrations (wired, verified working)
- Image generation: Gemini Nano Banana via emergentintegrations + EMERGENT_LLM_KEY — REAL.
- Audio/TTS: Sarvam (SARVAM_API_KEY_1) — REAL (falls back to placeholder audio if it fails).
- Payments: Stripe via emergentintegrations, STRIPE_API_KEY=sk_test_emergent (test mode) — REAL checkout URLs.
- Video & Movie generation: PLACEHOLDER mp4 outputs (mocked in the original repo — not real generation).

## Env (backend/.env)
MONGO_URL, DB_NAME (protected), CORS_ORIGINS, JWT_SECRET, EMERGENT_LLM_KEY, SARVAM_API_KEY_1, STRIPE_API_KEY.

## Status (restored & verified 2026-06)
- Backend 19/19 pytest pass; frontend E2E pass (test_reports/iteration_2.json).
- Auth, real image gen (credit decrement), audio gen, video/movie placeholders, creations list/delete,
  plans, and Stripe checkout for paid plans all working.

## Notes / Backlog (unchanged from original design)
- Video/Movie are placeholder outputs by design in this repo (no real T2V engine wired).
- Header "10 FREE" chip in AppShell is static in the original design (left as-is per user's no-change request).
- The NVIDIA/Servam/Google keys the user pasted are NOT used by this repo's code (it uses Emergent Nano Banana
  + Sarvam + Stripe). Left unused to honor "don't change anything".
- P1 ideas if user wants later: wire real video model, dynamic credit badge, Google login.
