# Database migrations (apply in the Supabase SQL editor, in this order)

Nothing in this folder is run automatically. Barry applies these by hand.

| Order | File | Purpose |
|------|------|---------|
| 0 | `../supabase_schema.sql` | Base schema for a NEW database. Non-destructive (`create ... if not exists`). Existing production DB: skip. |
| 1 | `2026-10-02_001_send_state.sql` | Adds delivery-proof columns (`provider`, `provider_message_id`, `sent_at`, `error`, `attempts`) to outreach_messages / followups / proposals. |
| 2 | `DATA_CORRECTION_ONE_TIME_NOT_AUTORUN.sql` | ONE-TIME: resets every "Sent"/"Contacted"/"Proposal Sent" row that has no provider message id back to Approved/Draft/New-ish, then adds CHECK constraints so a row can never again be "Sent" without proof. Read the header before running; review the preview selects first. |
| 3 | `2026-10-02_002_core_tables.sql` | `approval_requests`, `entity_goals`, `rate_limit_events` (+ RLS). Supersedes the three older files in `superseded/`. Until this is applied, rate-limited routes fail CLOSED (HTTP 503). |
| 4 | `2026-10-02_003_task_orchestration.sql` | Extra columns on `tasks` for the CEO orchestrator (run_id, depends_on, agent_key, params, error, started/finished). |
| 5 | `2026-10-02_004_memory_vault.sql` | Built-in Memory Vault: `vault_notes` (markdown, tags, pinned, full-text `tsvector`) + `vault_links` ([[wiki-links]]), RLS by user_id. Until applied, /memory shows a clear "apply migration 004" message and agents skip vault journaling. |

`../RESET_DEV_ONLY.sql` drops everything - **development databases only, never production**.
`../fix_leads_schema.sql` is a legacy rebuild script; it now aborts if any of the tables it would drop contain rows.
