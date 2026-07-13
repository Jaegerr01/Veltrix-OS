# VELTRIX Command OS — Setup & Go-Live Guide

This is the exact path from "deployed but inert" to "fully autonomous." Your **code is sound** — the only thing standing between you and a working pipeline is **credentials + configuration**. Work top to bottom.

> ✅ **Self-check at any point:** visit **`/health`** in the app (or `/api/health` for raw JSON). It shows green/red for every integration and lists exactly what's still missing. Drive everything to green.

---

## 1. Google Gemini — the agents' brains 🧠 *(do this first, it's free)*

Without this, every agent fails at step 1 and the whole pipeline stalls.

1. Go to **https://aistudio.google.com/app/apikey**
2. Click **Create API key** → copy it.
3. You'll add it as `GEMINI_API_KEY` in step 4.

---

## 2. Supabase — the database 🗄️

1. Create a free project at **https://supabase.com**.
2. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (secret!) → `SUPABASE_SERVICE_ROLE_KEY`
3. Open **SQL Editor → New query**, paste the entire contents of **`supabase_schema.sql`** (in this repo), and **Run**. This creates the `leads`, `notes`, `agent_memory`, and other tables.
   - If you later see a leads-table error on `/health`, also run **`fix_leads_schema.sql`**.

---

## 3. Email delivery — Gmail (primary) or Resend (fallback) ✉️

The OS sends through **Gmail first** when configured, falling back to Resend. Every autonomous send passes through guardrails (kill switch → blacklist → daily cap) in `src/lib/email/send.ts`.

### 3a. Gmail (recommended for getting started)

1. Google Account → **Security → 2-Step Verification** (enable it) → **App passwords**.
2. Create an app password, then set in `.env.local` / Netlify:
   - `GMAIL_USER` — your Gmail address
   - `GMAIL_APP_PASSWORD` — the 16-character app password
   - `GMAIL_FROM_NAME` — optional display name, e.g. `Barry from VELTRIX`
3. ⚠️ Gmail deliverability reality check: personal Gmail sending cold outreach gets flagged fast above ~50/day. Keep `OUTREACH_DAILY_CAP` low (default 15) and warm up gradually. For scale, move to a verified domain on Resend or Google Workspace.

### 3b. Outreach guardrails (all optional, sane defaults)

| Variable | Default | What it does |
|---|---|---|
| `OUTREACH_SEND_ENABLED` | `true` | Set `false` = kill switch. Drafts still get created; nothing sends. |
| `OUTREACH_DAILY_CAP` | `15` | Max autonomous sends per day (counted from Sent messages). |
| `OUTREACH_BLACKLIST` | empty | Comma-separated emails/domains never to contact, e.g. `gov,edu,rival.com`. |

### 3c. Resend (fallback / scale path)

1. Sign up free at **https://resend.com**.
2. **API Keys → Create API Key** → copy → this is `RESEND_API_KEY`.
3. **Domains → Add Domain** and verify yours (add the DNS records they give you).
   - Set `RESEND_FROM_EMAIL` to something on that domain, e.g. `VELTRIX <hello@yourdomain.com>`.
   - ⚠️ **Until a domain is verified**, Resend only lets you email **your own account address**. Outreach to leads will be rejected. Domain verification is what unlocks real outreach.
4. Set `NOTIFY_EMAIL` to the address where YOU want pre-call briefs and daily reports (e.g. your Gmail).

---

## 4. Netlify — set the environment variables ⚙️

In **Netlify → Site configuration → Environment variables**, add each of these:

| Variable | Value | From |
|---|---|---|
| `GEMINI_API_KEY` | your Gemini key | Step 1 |
| `NEXT_PUBLIC_SUPABASE_URL` | project URL | Step 2 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | Step 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | Step 2 |
| `RESEND_API_KEY` | Resend key | Step 3 |
| `RESEND_FROM_EMAIL` | `VELTRIX <hello@yourdomain.com>` | Step 3 |
| `NOTIFY_EMAIL` | your inbox | Step 3 |
| `CRON_SECRET` | any long random string you invent | — |
| `NEXT_PUBLIC_SITE_URL` | your live URL, e.g. `https://velltrixos.netlify.app` | — |

Then **Deploys → Trigger deploy → Clear cache and deploy site** so the new vars take effect.

---

## 5. Verify 🔍

1. Visit **`/health`** → every card should be **LIVE** and the banner **"All systems operational."**
2. Add a test lead (Leads page) with **your own email** as the contact.
3. The autonomous pipeline runs every 30 min — or trigger it manually (see below).

---

## 6. How the autonomy works (so you know what to expect)

- **`netlify/functions/pipeline-cron.mts`** fires every 30 minutes → calls `/api/autopilot/run`.
- **`netlify/functions/daily-brief.mts`** fires daily at 22:00 UTC → emails your daily brief.
- `/api/autopilot/run` walks every lead through the state machine, each agent acting at its stage:

| Stage | Agent | Lead status | Action |
|---|---|---|---|
| 1 | Daniel (Research) | `New` | Researches + scores the lead |
| 2 | Emma (Outreach) | `Qualified` (score ≥ 7) | Drafts + **emails** outreach |
| 3 | Lucas (Follow-up) | `Contacted` | Sends day 3/7/14/30 follow-ups |
| 4 | Olivia (Proposal) | `Replied` | Generates + sends a proposal |
| 5 | Alex (CEO) | `Call Booked` | Writes your pre-call brief + emails you |

**Manual trigger** (for testing without waiting 30 min):
```bash
curl -X POST https://YOUR-SITE/api/autopilot/run \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Common gotchas

- **"Outreach not sending"** → almost always `RESEND_API_KEY` missing or domain unverified. `/health` will tell you which.
- **"Agents do nothing"** → `GEMINI_API_KEY` missing → leads never leave `New`. Check `/health`.
- **Leads don't load** → Supabase keys missing or `supabase_schema.sql` not run.
- **Pipeline never runs on its own** → `CRON_SECRET` not set, or the site hasn't been redeployed since adding env vars.

---

## 7. Voice agent (ARIA) — important architecture note 🎙️

`/api/voice/tts` proxies to a **"Voicebox"** server via `VOICEBOX_URL` (default `http://127.0.0.1:8000`). Voicebox is a **local Python app** (the `Voicebox` folder). This means:

- **On your own machine** (`npm run dev`): start `voicebox-server.exe` first, create a voice profile, and voice works.
- **In production (Netlify)**: `127.0.0.1` points at Netlify's server, not yours — so **voice cannot work in production as-is.** You have two options:
  1. **Host Voicebox publicly** (e.g. Railway) and set `VOICEBOX_URL` to that URL (+ optional `VOICEBOX_PROFILE_ID`).
  2. **Switch to a cloud TTS** like ElevenLabs (already in your stack) — a small change to `/api/voice/tts`. Tell Claude to do this if you'd rather not self-host.

Quick check: visit `/api/voice/tts` (GET) — it returns Voicebox connectivity status.
