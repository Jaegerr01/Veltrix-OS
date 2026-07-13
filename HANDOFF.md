# VELTRIX Command OS — Redesign & Productionization Handoff

_Last updated: 2026-07-13 · Owner: Barry (VELTRIX founder)_

This document condenses the full working context for the "VELTRIX Command OS"
premium redesign + productionization effort. It covers what exists, what was
built, the design system, the data/backend contracts, key decisions, and the
prioritized plan for the remaining work.

---

## 1. Project at a glance

- **What:** VELTRIX Command OS — an always-on AI Command Center. A roster of
  autonomous specialist agents (Sales Director, Outreach, Lead Gen, Marketing,
  Finance, Project Manager, Customer Support, Appointment Setter) orchestrated by
  a central **CEO Agent** the operator (Barry) talks to.
- **Location:** `C:\Users\H.H\.gemini\antigravity\scratch\veltrix-command-os`
- **Stack:** Next.js **16.2.6** (App Router, Turbopack) · React **19** ·
  TypeScript · Tailwind **v4** · Supabase (auth + Postgres, RLS) · Gemini AI ·
  Resend/Nodemailer · Framer Motion · lucide-react.
- **Run dev:** `& "E:\nodejs\npm.ps1" run dev` (or `npx next dev`). A dev server
  typically runs on `http://localhost:3000`. App is gated by Supabase auth
  (`AuthGate`) — you must log in to see the dashboard.
- **Design source:** Claude Design handoff bundle unzipped at
  `C:\Users\H.H\Downloads\veltrix-command-os-design\create-a-complete-design-of-my-veltrix-command-os-dashboard\`
  — primary file `project/VELTRIX Command OS.dc.html` (a `.dc.html` prototype:
  React-like `DCLogic`/`renderVals` + `<sc-for>`/`<sc-if>` + `_ds` design-system
  bundle). The README says: recreate pixel-faithfully in the target stack.

---

## 2. Design system (the visual language)

**Fonts** (Google Fonts): Display = **Bricolage Grotesque**, Body = **Plus Jakarta
Sans**, Mono = **JetBrains Mono**. (The `_ds` tokens originally said Space
Grotesk/Manrope, but the prototype's in-page `<style>` overrode them — we honor the
override.)

**Palette** (deep-space command center):
- Ink surfaces (deepened): `--ink-900 #060410` (app bg) → `--ink-600 #150E30`.
- Brand violet `#8B5CF6` + electric blue `#4F6BFF` → signature `--grad-brand`
  (135deg violet→blue).
- Accents: cyan `#22D3EE`, magenta `#D946EF`. Signal/active green `#2EE6A0`.
  Status: warn `#F5B544`, danger `#FF4D6D`.
- Glassmorphic panels: `--grad-panel` translucent gradient + violet hairline
  borders + `backdrop-filter: blur(18px)` (`.vx-glass`), soft shadows + neon
  glows (`--glow-violet` etc.).

**Where it lives:** `src/app/veltrix-ds.css` — a single ported stylesheet holding
all tokens (colors/effects/spacing/typography), the in-page overrides, the
`.vx-eyebrow` / `.vx-glass` / `.vx-root` helpers, and **all 14 keyframes**
(`vxFadeUp`, `vxOrbDrift`, `vxSpin3d`, `vxHaloBreathe`, `vxRingSpin`,
`vxLineFlow`, `vxDotBlink`, `vxNodeFloat`, `vxScan`, `vxPulseGlow`, `vxFabHalo`,
etc.). It is imported from `globals.css`.

> **CSS gotcha (already fixed):** the webfont `@import` must sit at the very top
> of `globals.css` (before Tailwind's rules), NOT inside `veltrix-ds.css` — an
> inlined `@import` after other rules is a hard PostCSS parse error (500 on every
> route). Font imports now live at the top of `globals.css`.

---

## 3. What has been built (Pass 1 — design implementation) ✅ DONE & VERIFIED

All ported faithfully from the prototype. **Backend (`src/lib/**`, `src/app/api/**`)
was left untouched; only the presentation layer changed.**

### Design-system components — `src/components/ds/`
| File | Purpose |
|---|---|
| `VxIcon.tsx` | Exact `ICON_PATHS` line-icon set from the prototype (24-grid, 1.75px stroke). |
| `primitives.tsx` | `Avatar`, `Badge`, `Button`, `Card`, `Input`, `Switch`, `StatCard` — ported from `_ds_bundle.js`. |
| `AmbientBackground.tsx` | Fixed deep-space backdrop: drifting orbs, 3D rings, masked perspective grid. |
| `CeoSphere.tsx` | Canvas particle sphere (1,100-pt fibonacci lattice, tri-color cyan→violet→magenta, pointer-steer, click-pulse). |
| `OrbitalCommand.tsx` | Hero: tilting 3D stage, CEO sphere, 8 orbiting agent nodes, rings, flow lines, scanline. |
| `AgentCard.tsx` | Signature agent tile (glass, glow orb, status dot, metric). |
| `PageHeaderCard.tsx` | Recurring "cmdCard" page header (icon badge + title + stat readouts + action slot). |
| `PlaceholderModule.tsx` | "Module online" placeholder card. |
| `agents.ts` | `AGENT_DEFS`, `STATUS_COLOR/LABEL`, `ACTIVITY_DEFS` seed data. |
| `index.ts` | Barrel export. |

### Shell
- `src/components/Sidebar.tsx` — glass rail, centered wordmark (`/veltrix-logo.png`),
  grouped nav (Dashboard/Command Center/Revenue · Pipeline · Intelligence · System),
  gradient-glow active pills, CEO mini card + sign-out. Auth wiring preserved.
- `src/components/Topbar.tsx` — page eyebrow+title (route-keyed), search, Live Sync
  switch, Create, notifications bell, operator avatar.
- `src/app/layout.tsx` — design grid shell (`sidebar-w 1fr`) + `AmbientBackground`,
  wraps `AuthGate`/`ToastProvider`/`VoiceAssistant`.

### Pages (route → design view)
- `/` → **Dashboard** (orbital hero + Business Overview / Lead Funnel / Revenue
  Target + Today's Goals / Tasks In Progress).
- `/command-center` → **Command Center** (Approval Queue, Goal Cascade, Lead Scraper,
  Live Pipeline, KPI row, Agent Roster + Live Telemetry). _(Absorbed the old `/`
  dashboard's real-data widgets per the design's route mapping.)_
- `/tasks` (kanban) · `/health` (System Status) · `/reports` · `/content` ·
  `/reel-intel` · `/follow-ups` · `/memory` · `/settings` · `/leads` (pipeline) ·
  `/revenue` (analytics).
- `/outreach`, `/proposals`, `/clients`, `/projects` → `PlaceholderModule`.

### Verification (Pass 1)
- `npx tsc --noEmit` clean on all new/changed files.
- All **16 routes return HTTP 200**; design tokens/fonts/keyframes/`.vx-glass`
  confirmed present in the served CSS chunk.

### Known caveats / decisions (Pass 1)
- **Pages currently render the prototype's static/mock data.** Backend is intact
  but not yet wired to the new UI (this is the core of Pass 2).
- The existing `VoiceAssistant` already renders a bottom-right mic orb, so we let
  it fill the design's mic-FAB slot (no duplicate).
- Settings' `<image-slot>` avatar/logo widgets substituted with static styled slots
  (the omelette runtime isn't in this app) — **superseded in Pass 2 by real upload**.
- **3 pre-existing TypeScript errors** in `src/lib/agents/autopilot.ts` and
  `src/lib/entity/approvals.ts` (a `"Failed"` status literal). Unrelated to this
  work; left untouched. They may need fixing before a clean `next build`.

### Assets copied to `public/`
- `veltrix-logo.png` (from the design bundle).
- `loader.jpeg` (glowing violet plasma orb, from `C:\Users\H.H\Downloads\loader.jpeg`)
  — **staged for Pass 2**, not yet wired in.

---

## 4. Backend / data contracts (learned — needed for Pass 2)

Client components call the DB layer directly; it uses the anon Supabase client +
the logged-in session (RLS scopes rows per user). `getUserId()` is internal.

**`import { db } from '@/lib/db'`** — key functions:
- `db.getBusinessProfile()` → `BusinessProfile` incl. `target_monthly_revenue`,
  `current_monthly_revenue` (auto-summed from Paid revenue), `autopilot`.
- `db.updateBusinessProfile({ autopilot, business_name, ... })`.
- `db.getGoals()` / `db.addGoal({title,status,priority,...})` / `db.updateGoal(id,{status})`.
  **No `deleteGoal`** — use `status:'Abandoned'` and filter it out.
- `db.getLeads()` → `Lead[]` (status union below).
- `db.getTasks()` / `db.addTask` / `db.updateTask(id,{status})` / `db.deleteTask(id)`.
- `db.getRevenue()` → `Revenue[]` (amount, status, month YYYY-MM).
- `db.getFollowups()`, `db.getMemories()`, `db.getContentIdeas()`,
  `db.getDailyReports()`, `db.getApprovalRequests()`, `db.getEntityGoals()`, etc.

**Type status unions** (from `src/lib/types.ts`):
- `Lead.status`: New · Researched · Qualified · Contacted · Replied · Call Booked ·
  Proposal Sent · Won · Lost · Follow-up Later.
- `Task.status`: Pending · In Progress · Completed · Blocked · Needs Approval.
  `Task.priority`: Low · Medium · High · Critical.
- `Revenue.status`: Expected · Invoiced · Paid · Overdue · Cancelled.
- `Goal.status`: Pending · In Progress · Completed · Abandoned.

**API routes** (POST; `AuthGate` patches `window.fetch` to attach the Bearer token
for `/api/*`, so plain `fetch` works):
- `POST /api/scraper/run` — body `{ niche, location, limit, research, sheets }` → `{ success, ... }`.
- `POST /api/ai/content` — body `{ topic }` → `{ success, ideas }`.
- `POST /api/reel-intel` — body `{ url, context }` → `{ success, ... }`.
- `POST /api/ai/followup` — body `{ leadId, sequenceDay }` → `{ success, followup }`.

**Auth/UI plumbing:** `useAuth()` from `src/components/AuthGate.tsx` gives
`{ user, signOut, loading }`. `useToast()` from `src/components/Toast.tsx` for
notifications. `LoadingState.tsx` is the shared loader (currently a CSS spinner).

---

## 5. Pass 2 requirements (requested by Barry — IN PROGRESS, code not yet written)

> "Make everything functional — every button, every option. Remove all mock data
> from the Dashboard and wire real data. Add a **color wheel** so the user can set
> their own **Accent Palette**; add **Background color** control and **profile
> picture** upload. The design is overwhelming — **add space between cards**, make
> it premium/sophisticated. Apply the UI/UX to the **login page** too. Change the
> **loader** to `loader.jpeg` all over the dashboard. Make it final, ready to ship.
> No mistakes — the deadline is overdue."

**Status:** research complete (Section 4), `loader.jpeg` copied to `public/`.
**No Pass 2 code has been written yet.** Design approach decided:
- **Appearance system:** a client `AppearanceProvider` (React context) persisting
  `{ accent, background, avatar }` to `localStorage`, applied by writing CSS vars on
  `document.documentElement` (`--violet-400/300/200`, `--grad-brand`, `--glow-violet`,
  `--grad-halo`, `--ink-900` + `body` background). Accent shades derived by mixing
  the chosen hex toward white; avatar stored as a data URL.
- **Color wheel / bg:** native `<input type="color">` (true color wheel) in Settings,
  bound to the provider. Keep the 4 preset theme swatches as quick picks.
- **Profile picture:** `<input type="file">` → read as data URL → provider → shown in
  Topbar + Sidebar + Settings avatar slot.
- **Dashboard real data mapping:** Business Overview (tasks Completed / Needs Approval;
  leads total / Call Booked / Won) · Lead Funnel (counts by lead status, normalized) ·
  Pipeline value (sum of non-Paid/non-Cancelled revenue) · Revenue Target dial
  (`current_monthly_revenue / target_monthly_revenue`) · Today's Goals (real CRUD via
  `db.getGoals/addGoal/updateGoal`, delete = set `Abandoned`) · Tasks In Progress
  (tasks `In Progress`) · greeting line (real date + closed/target).

---

## 6. NEXT PLAN — task list

Priority order. Do explicit asks first, verify after each, don't break the build.

### P0 — Explicitly requested, ship-blocking
1. **AppearanceProvider** — `src/components/ds/AppearanceProvider.tsx` (context +
   localStorage + CSS-var apply + hex→shade helpers). Wrap the shell in `layout.tsx`.
   Export `useAppearance()`.
2. **Loader swap** — rewrite `src/components/LoadingState.tsx` to render `loader.jpeg`
   (pulsing/rotating glow) via `next/image`; add a `VeltrixSpinner` in `ds/` and use it
   for all in-page loading states. Replace remaining CSS/lucide spinners across the app.
3. **Login page redesign** — restyle `AuthGate.tsx` auth screen + "DB config offline"
   screen to the new design (glass card, tokens, wordmark, `VxIcon`, loader). Keep all
   auth logic (`signUp`/`signInWithPassword`/`onAuthStateChange`/fetch-token patch) intact.
4. **Dashboard real data** — rewrite `src/app/page.tsx` to fetch via `db` (Section 5
   mapping), remove ALL mock, add loading (VeltrixSpinner) + empty states. Real goal CRUD;
   autopilot toggle persists via `db.updateBusinessProfile({autopilot})`.
5. **Settings functional** — accent color wheel + background color + profile-picture
   upload wired to `AppearanceProvider`; persist Display Name/Workspace to
   `db.updateBusinessProfile`; keep preset swatches; prefs persist (localStorage).
6. **Show avatar everywhere** — Topbar + Sidebar avatars read `appearance.avatar`.
7. **Spacing / premium polish** — increase the main scroll-area gap (space-8 → ~40px)
   and card-grid gaps; add breathing room; tighten typographic rhythm. Make it feel
   sophisticated, less dense.

### P1 — "Everything functional" (remove remaining mock)
8. **Command Center** — wire Lead Scraper "Run Scrape" → `POST /api/scraper/run` (real
   call, loading, toast, error). Approval Queue → `db.getApprovalRequests` + approve/reject
   via `/api/entity/approvals/[id]`. Goal Cascade "Draft" → `/api/entity/goals`. Live
   Pipeline + KPIs from real leads/revenue. (Roster/Telemetry may stay as agent defs.)
9. **Content** — "Write Posts with AI" → `POST /api/ai/content` `{topic}`; render returned
   `ideas`; draft cards from `db.getContentIdeas()`; "Mark Posted" → `db.updateContentIdea`.
10. **Reel Intel** — "Analyze Reel" → `POST /api/reel-intel` `{url,context}`; render result;
    history from `db` reel-intel history.
11. **Follow-ups** — "Create Draft with AI" → `POST /api/ai/followup` `{leadId,sequenceDay}`;
    lead options from `db.getLeads()`; schedule/log from `db.getFollowups()`.
12. **Tasks** — real board from `db.getTasks()` grouped by status; drag/update status
    via `db.updateTask`; "New Task" creates via `db.addTask`.
13. **Leads** — real pipeline from `db.getLeads()` grouped by status.
14. **Revenue** — real KPIs + trend + channel mix from `db.getRevenue()` / profile.
15. **Memory** — real feed from `db.getMemories()`; connectors → `/api/obsidian/sync`.
16. **Reports** — real daily reports from `db.getDailyReports()`.
17. **System Status** — real health from `/api/health` (integrations + env checklist).

### P2 — Polish & ship
18. Fix the 3 pre-existing `"Failed"` status type errors so `next build` is clean.
19. Full `next build` + click-through every route logged in; fix runtime issues.
20. Responsive/overflow pass; `prefers-reduced-motion` respected.
21. Persist appearance to the Supabase profile (optional upgrade over localStorage).

---

## 7. Verification checklist (run before calling anything "done")
- `npx tsc --noEmit -p tsconfig.json` → no NEW errors (only the 3 known `lib/` ones).
- Dev server: every route 200; log in and click every button/toggle/option.
- Accent wheel + background + avatar persist across reload and recolor the whole app.
- Dashboard shows real numbers (or clean empty states), zero hardcoded mock.
- Loader is `loader.jpeg` everywhere; login page matches the design.
