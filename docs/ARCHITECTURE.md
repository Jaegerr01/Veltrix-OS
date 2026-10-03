# PostelOS - Architecture (Phase 2, "real behaviour, no fake data")

PostelOS is a single-owner operating system for an agency (Next.js 16 App Router + Supabase + Gemini). One rule
drives the whole design: **the UI only shows what the database can prove.** Nothing is "Sent" unless a mail
provider returned a message id.

## 1. Data flow

```
 Barry (typing)            Barry (voice)             Cron (every 30 min)         Buttons on pages
 /ceo CEO Console   ARIA (VoiceAssistant.tsx)   netlify/functions/pipeline-cron   Outreach / Follow-ups / Proposals
        |                       |                          |                                |
        v                       v                          v                                |
   POST /api/ceo  <-------------+               POST /api/autopilot/run                    |
   (NDJSON stream)  source:'ceo'|'aria'          (Bearer CRON_SECRET, constant-time)       |
        |                                                  |                                |
        v                                                  v                                |
 lib/orchestrator/plan.ts  -- Gemini JSON plan, zod-validated (no fake fallback) --+        |
        |   (untrusted lead text is fenced: lib/ai/untrusted.ts)                    |        |
        v                                                                          v        |
 `tasks` rows (owner agent_key, priority, due, depends_on, requires_approval, run_id)       |
        |                                                                                   |
        v                                                                                   |
 lib/agents/executor.ts  runAgentLogic()  <- the ONE executor (router.ts, pipeline.ts, /api/ai/* wrappers all call it)
        |   writes DRAFTS only (outreach_messages / followups / proposals = Draft) + approval_requests
        v                                                                                   |
 Approval Queue (/approvals) or "Approve & send" button <-----------------------------------+
        |
        v
 lib/entity/approvals.ts -> lib/email/delivery.ts (approveAndDeliver / deliverRecord)
        |   guardrails (lib/email/send.ts): OUTREACH_SEND_ENABLED kill switch, daily cap (confirmed sends only),
        |   blacklist, recipient validity, retries/backoff for transient errors
        v
 Provider: Resend | Gmail OAuth2 | Gmail SMTP app-password   (lib/email/{resend,gmail}.ts)  -> provider message id
        v
 Row becomes Sent (provider + provider_message_id + sent_at)  or  Failed (error text, attempts, Retry button)
```

## 2. Send-state machine (outreach_messages, followups, proposals)

`Draft -> Pending Approval -> Approved -> Sending -> Sent | Failed`

* **Sent** is written in exactly one place (`lib/email/delivery.ts`), and only with `provider_message_id` + `sent_at`.
  A CHECK constraint (added by `DATA_CORRECTION_ONE_TIME_NOT_AUTORUN.sql`) enforces this in the database.
* **Failed** keeps the provider's error text; Retry goes back through the same guardrails.
* Kill switch off / cap reached / blacklisted -> the row stays **Approved** (not sent) with an explanation.
* `markManuallySent` (provider `manual`, id `manual:<id>`) is the only non-provider route: the owner attests that they sent
  it themselves outside the app (never allowed for the Email channel). Counted as "manual", not as a delivery.
* Lead statuses (`Contacted`, `Proposal Sent`) are only advanced after a confirmed Sent.
* The daily cap counts only confirmed, non-manual sends.

## 3. Agents (11 core + catalogue)

| Key | Name | Role |
|-----|------|------|
| ceo | Alex | Orchestrator persona; decomposes Barry's instruction (`lib/orchestrator`) |
| revenue | Marcus | Revenue / pipeline analysis |
| sales | Sophia | Lead qualification & call prep |
| leadResearch | Daniel | Lead research & scoring |
| outreach | Emma | Drafts first-touch emails (draft only) |
| followup | Lucas | Drafts follow-ups (draft only, approval required) |
| proposal | Olivia | Drafts proposals (draft only, approval required) |
| content | Ryan | Content ideas / scripts |
| delivery | Mia | Client delivery tracking |
| memory | Leo | Notes / memory |
| scraper | Victor | Lead scraping |

232 specialist personas live in `src/lib/agents/catalogue`. Agent activity shown in the UI is **derived from `tasks` rows only**
(`lib/agentActivity.ts`); there are no hard-coded metrics.

## 4. Who triggers what

| Trigger | Entry point | What happens |
|---------|-------------|--------------|
| Barry types in CEO Console | `POST /api/ceo` | plan -> tasks -> executor -> streamed progress; outward-facing steps create approval requests |
| Barry speaks to ARIA | `VoiceAssistant.tsx` -> `askCeoOnce(..., 'aria')` -> `/api/ceo` | same pipeline; reply spoken by ElevenLabs (if configured) or browser `speechSynthesis` |
| Queued tasks after a time-boxed run | `POST /api/ceo/continue` | resumes queued tasks (serverless time budget `ORCHESTRATOR_BUDGET_MS`) |
| Cron | `POST /api/autopilot/run`, `/api/autopilot/daily-brief` | pipeline stages create drafts + approvals; never sends |
| Approve & send / Retry | `POST /api/{outreach,followups,proposals}/send`, `/api/entity/approvals/[id]` | the only path to a provider |
| Settings -> Email -> "Send test email to myself" | `POST /api/email/test` | sends to `OWNER_EMAIL` only |
| Settings -> "Test AI connection" | `GET /api/ceo/status?ping=1` | live Gemini probe |

## 5. Security model

* `requireUser` = valid Supabase JWT **and** email == `OWNER_EMAIL` (single-owner allowlist). Public sign-up is off unless `NEXT_PUBLIC_ALLOW_SIGNUP=true`.
* The browser fetch interceptor attaches the JWT only to same-origin `/api/` calls.
* Cron endpoints use constant-time compare of `CRON_SECRET`; missing secret in production = 503.
* Rate limiting (`rate_limit_events`) fails **closed** on send/AI routes.
* zod validation on every POST/PATCH route; untrusted lead/scraped text is fenced inside prompts.
* Security headers in `next.config.ts` (CSP is Report-Only -> `/api/csp-report`).

## 6. Voice (ARIA)

Web Speech API (Chrome/Edge/Safari, HTTPS or localhost) for speech-to-text; Firefox shows an explicit "unsupported" message and
typed input remains available. States: idle / listening / thinking / speaking / error. Status questions read `/api/ceo/status`
(database counts) - never invented. Events: `postelos-toggle-voice`, `postelos-ask-agent`, `postelos-voice-status`.
