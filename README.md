# PostelOS

**PostelOS — the AI command center by Postel Studio.**

An always-on AI command center: a roster of specialist agents (CEO/Chief of Staff, Revenue, Sales, Lead Research, Outreach, Follow-up, Proposal, Content, Delivery, Memory, Reel Intel) coordinated by one operator console. It handles the lead pipeline end to end (scrape → research → outreach → proposal → approval queue → guarded send), tracks revenue against a target, keeps a searchable memory vault synced from Obsidian, and speaks through a voice assistant.

> Formerly "Veltrix Command OS". Rebranded to PostelOS / Postel Studio — see [Rebrand notes](#rebrand-notes).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase (auth + Postgres + RLS) · Google Gemini · Resend / Nodemailer · Framer Motion · Vitest. Deploys on Netlify (`netlify.toml`).

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in real values — never commit .env.local
npm run dev                  # http://localhost:3000
```

The app is gated by Supabase auth (`AuthGate`): sign up / sign in on the login screen. Visit `/health` for a green/red integration checklist. Full go-live walkthrough: [SETUP.md](./SETUP.md).

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Vitest suite |
| `npm run lint` | ESLint (`eslint src`-scoped ignores in `eslint.config.mjs`) |

## Environment

See [`.env.example`](./.env.example) for every variable (Supabase, Gemini, Resend, Voicebox, Obsidian sync, cron secret, site URL). Brand-related placeholders:

- `NEXT_PUBLIC_SUPPORT_EMAIL` – contact shown in the UI. Defaults to `hello@postel.studio`, an **unverified placeholder**.
- `OWNER_EMAIL` – optional server-side owner contact (falls back to `NOTIFY_EMAIL`).
- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` – throwaway dev-only credentials for the `/api/test-supabase` diagnostic and `seed-supabase.ts`. Nothing is hardcoded.

## Brand & design system

- **Identity:** deep black + electric purple (violet `#8B5CF6` → neon `#B14CFF` → magenta-purple `#C026D3`), white type, geometric sans (Outfit for display, Plus Jakarta Sans for UI). Blue/cyan survive only as minor info accents.
- **Tokens:** `src/app/postel-ds.css` (single source of truth) bridged to Tailwind in `src/app/globals.css`. The internal CSS prefix `vx-` is kept on purpose.
- **Components:** `src/components/ds/*` — `PostelMark` (vector monogram), `PostelLogo` (lockup), `PostelSpinner` (loader), `AmbientBackground`, `OrbitalCommand`, `CeoSphere`, primitives.
- **Assets:** `public/brand/` — original splash / logos, derived `postel-mark*.png|svg`, `postel-og.png`. App icons: `src/app/favicon.ico`, `icon.png`, `apple-icon.png`.
- **Copy constants:** `src/lib/brand.ts`.

## Project docs

[SETUP.md](./SETUP.md) · [HANDOFF.md](./HANDOFF.md) · [AUDIT_REPORT.md](./AUDIT_REPORT.md) · [CLAUDE.md](./CLAUDE.md) · [AGENTS.md](./AGENTS.md)

## Rebrand notes

Intentionally **not** renamed (names that are tied to external systems or stored data): the GitHub repo slug, the Obsidian vault repo / `Entity/VELTRIX Constitution.md` note path, the local `veltrix_maps_scraper.py` script, Supabase project/URLs, DB table & column names, and the legacy `vx_*` localStorage keys. Rename these deliberately, together with whatever they point at.