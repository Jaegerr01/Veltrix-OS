@AGENTS.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## VELTRIX COMMAND OS

**Stack:** Next.js 16.2.6 · React 19 · Tailwind 4 · Supabase · Gemini AI · ElevenLabs · Framer Motion

**DB:** Supabase at `sxueyuqpqeqvzuzhrhxo.supabase.co` — schema in `supabase_schema.sql`

**Dev server:** `npm run dev` via `& "E:\nodejs\npm.ps1" run dev` from the project root.

---

## Agentic OS — Brain Layer

**Obsidian Vault:** `E:\Vetrix-app\Veltrix`

The vault is the VELTRIX knowledge brain. Notes sync to Supabase `memories` table via:
- API: `POST /api/obsidian/sync`
- UI: "Sync Obsidian Brain" button in the Command Deck panel

To add knowledge: create `.md` files in the Obsidian vault, then hit Sync.

---

## Command Deck

Five operator commands available in the dashboard and as Claude Code slash commands:

| Command | Slash | What it does |
|---|---|---|
| AM Report | `/am-report` | Morning briefing — revenue, priorities, leads to contact |
| Inbox Brief | `/inbox-brief` | Scan for replies, proposals due, follow-ups |
| Trend Scan | `/trend-scan` | Weekly AI/agency trend intelligence + content angles |
| Plan Today | `/plan-today` | Prioritized daily execution schedule |
| WK Review | `/wk-review` | End-of-week debrief and next-week goal |

API endpoint: `POST /api/ai/command-deck` with `{ "command": "<id>" }`

---

## PAUL Framework (Build Commands)

PAUL is the structured build workflow for this project. Use these commands when implementing features:

| Command | What it does |
|---|---|
| `/paul:init` | Requirements walkthrough — define the task before any code |
| `/paul:plan` | Executable step-by-step plan (auto-routes quick-fix/standard/complex) |
| `/paul:apply` | Execute an approved plan |
| `/paul:unify` | Verify implementation, close the loop |

**Rule:** Always run `/paul:init` → `/paul:plan` → approve → `/paul:apply` → `/paul:unify` for any non-trivial feature.

---

## AI Agents

| Key | Name | Role |
|---|---|---|
| `ceo` | Alex | Chief of Staff — coordinates all agents |
| `revenue` | Marcus | Financial analyst — revenue modeling |
| `sales` | Sophia | Sales strategy + objection scripts |
| `leadResearch` | Daniel | Lead qualification + scoring |
| `outreach` | Emma | Cold outreach copy |
| `followup` | Lucas | Follow-up sequences |
| `proposal` | Olivia | Proposal writing |
| `content` | Ryan | Social media content |
| `delivery` | Mia | Project delivery manager |
| `memory` | Leo | Knowledge graph custodian |

**CEO Agent delegation syntax:** `[RUN_AGENT: agentKey, {"param": "value"}]`

---

## Key File Map

```
src/
  app/
    page.tsx                    ← Main dashboard (Revenue + Pipeline + Command Deck + Vitals)
    api/
      ai/
        command/route.ts        ← General AI command routing
        command-deck/route.ts   ← Command Deck 5-action handler
        report/route.ts         ← Daily report generator
      obsidian/
        sync/route.ts           ← Obsidian vault → Supabase memory sync
  components/
    CommandDeck.tsx             ← 5-button operator command panel + Obsidian sync
    SystemVitals.tsx            ← BHAG tracker + live metrics
    Sidebar.tsx                 ← Navigation
    VoiceAssistant.tsx          ← ElevenLabs voice HUD
  lib/
    agents/agents.ts            ← All 10 agent configs + prompts
    agents/router.ts            ← Agent routing logic
    db.ts                       ← Supabase data layer
    gemini.ts                   ← Gemini AI client
    types.ts                    ← All TypeScript interfaces
```
