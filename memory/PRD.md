# VEDED — AI Creative Studio & Streaming Platform

## Original Problem Statement
Import GitHub repo (was empty Emergent starter). Build a working app using user-provided AI model keys (NVIDIA NIM: FLUX.1, Stable Diffusion, Wan 2.2, LLM; Sarvam; Google). Keys must live server-side and be secure. Provide pricing with a credit system and 40% profit on every subscription. Payments via UPI number 9673856312 (show app name "VEDED", not personal name) + Razorpay. App should create images, video, audio/audiobooks, movies, web series, reels, and a bookstream for uploads — watched by people via subscription. Login: email/password + Google.

## Architecture
- Backend: FastAPI + MongoDB (motor). JWT (Bearer, localStorage) auth. NVIDIA hosted APIs via httpx.
- Frontend: React + Tailwind + framer-motion + lucide + sonner. Dark cinematic theme (Clash Display / Manrope).
- AI: `ai_client.py` calls NVIDIA hosted GenAI (FLUX.1-dev/schnell image) + integrate.api LLM chat. Keys only in backend/.env.

## Integration status (verified against real APIs)
- ✅ Image generation: FLUX.1-dev (primary), flux-schnell (fast) — REAL, working.
- ✅ Chat/Prompt Lab: NVIDIA meta/llama LLM — REAL, working (qwen slug not in account catalog; using llama).
- ❌ Video (Wan 2.2): NVIDIA offers it ONLY as a downloadable/self-hosted GPU NIM — NO hosted cloud API. Endpoint returns 503 "coming soon"; no credits charged.
- ❌ Stable Diffusion XL: NVIDIA function not enabled for this account (404). Omitted.
- ⏳ Sarvam/Riva audio (audiobooks), Movies, Web Series, Bookstream uploads: UI scaffolded, backend not yet built.
- ⏳ Google login: not yet implemented (email/password live).
- ⏳ Razorpay: wired but disabled (no keys); UPI manual flow is the live payment path.

## Credits & Pricing (40% profit margin encoded server-side)
- Plans (INR/mo): Free ₹0/60cr, Starter ₹199/600cr, Pro ₹499/1800cr (popular), Studio ₹999/4200cr.
- Credit packs: 300/₹99, 800/₹249, 2000/₹499.
- Image costs: flux-dev 6cr, flux-schnell 3cr; chat 1cr.
- /api/pricing returns cost_basis and profit per plan (margin 0.40).

## Payments
- UPI manual: initiate → QR (upi://pay to 9673856312@upi, payee display "VEDED") + reference note → user submits UTR → admin approves at /admin → credits/plan applied.
- Admin: admin@veded.app / VededAdmin@2026.

## Implemented (2026-06)
- Auth (register/login/me, JWT). Studio (image gen live, prompt lab, video/audio "coming soon"). Gallery + publish. Discover feed. Pricing. Billing (UPI QR + history). Admin approvals. Reels view (feed of published/mock). Landing.
- Tested: backend 20/20 pytest pass; frontend flows pass (iteration_1.json).

## Backlog / Next
- P1: Google login; real Razorpay (needs keys); Sarvam audiobook generation.
- P1: Self-hosted GPU or alternative hosted provider for Wan 2.2 video.
- P2: Bookstream uploads (object storage) + creator monetization/payout; Movies & Web Series long-form; subscription auto-expiry/renewal; per-item paywall streaming.
- P2: internal retry/backoff tuning; move credit constants to config.
