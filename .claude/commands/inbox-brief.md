# Inbox Brief

Scans VELTRIX CRM for all items that need a response or attention — replied leads, pending proposals, overdue follow-ups, and active client updates.

## What it does

- Summarizes leads that have replied or need a response
- Lists proposals awaiting client feedback
- Flags follow-ups due today
- Highlights any client delivery blockers

## Steps

1. Call `POST /api/ai/command-deck` with `{ "command": "inbox-brief" }`
2. CEO Agent (Alex) synthesizes the CRM state into a concise action-oriented brief
3. Results appear in the Command Deck panel

## Usage

```bash
curl -X POST http://localhost:3000/api/ai/command-deck \
  -H "Content-Type: application/json" \
  -d '{"command":"inbox-brief"}'
```
