# VELTRIX — Full-Stack Audit Report
**Date:** 2026-07-03 · **Scope:** Command OS (dashboard), Vortex Solutions MK2 (website), Voicebox, instagram_saves pipeline, Obsidian vault

---

## Verdict on "rebuild everything"

**No rebuild needed.** The architecture is sound: Next.js 16 + Supabase with service-role isolated server-side, RLS already patched (commit 801c188), auth middleware (`requireUser`) and rate limiting already on most routes. A rebuild would burn weeks and reintroduce solved bugs. What it needed was targeted security fixes and production hardening — applied below.

---

## Findings by severity

### 🔴 CRITICAL — fixed or action required

**C1. GitHub token exposed in chat (ACTION REQUIRED — 2 minutes)**
You pasted a live `ghp_…` token into this conversation and it also lives in `.env.local`. Treat it as burned.
→ **Rotate now:** GitHub → Settings → Developer settings → Tokens → revoke and reissue with `repo` scope limited to `veltrix-vault`. Update `.env.local`.

**C2. `/api/test-supabase` — unauthenticated account factory (FIXED)**
Anyone hitting this GET endpoint in production caused the server to create a Supabase user with a **hardcoded password** via the service-role key and sign in. Full account/session exposure.
→ Fix: endpoint now returns 404 when `NODE_ENV=production`. Still works locally for diagnostics.

### 🟠 HIGH — fixed

**H1. Autopilot cron endpoints failed open (`/api/autopilot/run`, `/api/autopilot/daily-brief`)**
The guard was `if (cronSecret && …)` — if `CRON_SECRET` was ever unset in prod, **anyone on the internet could trigger full pipeline runs**: Gemini API spend, outbound emails to leads, DB writes. One URL in a scanner's list away from a runaway bill.
→ Fix: fail closed — production without `CRON_SECRET` returns 503; dev unchanged.

**H2. Website chatbot was never AI on Netlify**
`api/chat.js` is a Vercel-style function. On Netlify, the SPA catch-all redirect (`/* → /index.html`) answered `POST /api/chat` with **HTML**, so `chatApi.js` silently fell back to canned local replies. Every visitor talked to a fake bot; the "powered by Gemini" claim was false on the live site.
→ Fix: new `netlify/functions/chat.mjs` (same validation/rate-limit/CORS logic), `[functions]` block + `/api/chat` redirect added to `netlify.toml` **before** the catch-all.

**H3. CSP blocked the contact form (Vercel)**
`connect-src 'self'` blocked the browser's `fetch` to Supabase (`VITE_SUPABASE_URL/rest/v1/leads`) and the Google Apps Script fallback. Result: lead submit throws → falls to `mailto:hello@veltrix.com` → **leads silently lost**.
→ Fix: `connect-src` now allows `https://*.supabase.co`, `https://script.google.com`, `https://script.googleusercontent.com`.

### 🟡 MEDIUM — fixed or flagged

**M1. `/api/voice/tts` unauthenticated (FIXED)** — anyone could burn TTS compute through the proxy. POST now requires a signed-in operator (`requireUser`); the client already attaches tokens via AuthGate's fetch interceptor, so the UI is unaffected.

**M2. Lead fallback email is a placeholder (FLAGGED)** — `submitLead.js` defaults to `hello@veltrix.com`. If you don't own that inbox, worst-case leads evaporate. Set `VITE_CONTACT_EMAIL` in both Netlify and Vercel env.

**M3. In-memory rate limiting (FLAGGED)** — both apps rate-limit with a `Map`. On serverless, each cold instance has its own map, so limits are advisory, not real. Fine at current traffic; move to Upstash Redis before scale.

**M4. Instagram pipeline fragility (FLAGGED)** — `fetch_saves_simple.py` uses `os.environ["IG_SESSIONID"]` → ugly `KeyError` crash without `.env`; IG session cookies sit in plaintext `.env`. Session cookies expire silently — add a clear "session expired, re-login" message on 401/redirect responses.

**M5. Voicebox defaults to `127.0.0.1:8000` (FLAGGED)** — in any deployed environment without `VOICEBOX_URL`, the voice HUD 503s. Expected for a local companion app, but the dashboard should show "Voicebox offline (local app)" rather than an error state.

### 🟢 LOW

- Voicebox itself is closed-source `.exe` binaries — not auditable; treat as trusted local dependency only, never expose its port publicly.
- `stitch_veltrix_nexus_command_center` is static design mockups — no runtime risk.
- `.env.local` is properly gitignored and not in git history (verified) — good.
- TypeScript strict typecheck: **clean, 0 errors** before and after fixes.

---

## How the business works (from the vault)

VELTRIX sells AI systems to post-revenue SMBs, dental-first: Instagram Reels → DM qualification (4 questions) → **$299 AI Audit** → implementation (**Starter $999 / Growth $2,500**) → **$199–499/mo retainers** → productize each build into vertical templates. BHAG: $50k MRR in 18 months. Core promise: *stop losing the leads you already have* — after-hours calls, slow follow-up, missed bookings.

The two HIGH bugs above sat directly on this funnel: the website chat (top of funnel) and the contact form (conversion point) were both broken in front of users. Those were the ones costing money.

## Production-hardening roadmap (recommended order)

1. **Now:** rotate GitHub token (C1); set `CRON_SECRET`, `VITE_CONTACT_EMAIL`, `ALLOWED_ORIGIN` in deploy envs; redeploy both apps.
2. **This week:** add CI (GitHub Action: `tsc --noEmit` + `next build` + `vite build` on push); add Sentry to both apps; uptime monitor on `/api/health` and the site.
3. **This month:** Upstash-backed rate limiting; Supabase scheduled backups + a tested restore; e2e smoke test (Playwright: load site → send chat message → submit lead → verify row in Supabase).
4. **Before scale:** move autopilot email sends behind an approval queue with a daily cap (protects sender reputation).
