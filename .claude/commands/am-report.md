# AM Report

Run VELTRIX's morning command briefing. Pulls live data from the Supabase database and generates a sharp daily briefing via the CEO Agent.

## What it does

- Fetches today's revenue status, pipeline value, and gap
- Identifies the top 3 priority actions for the day
- Lists active leads to contact with personalized angles
- Surfaces follow-ups due today
- Delivers the one move that will have the biggest revenue impact this session

## Steps

1. Call `POST /api/ai/report` (or `/api/ai/command-deck` with `{ "command": "am-report" }`)
2. Display the response from Alex (CEO Agent)
3. Log to Supabase activities table

## Usage

```bash
# From Claude Code terminal
curl -X POST http://localhost:3000/api/ai/command-deck \
  -H "Content-Type: application/json" \
  -d '{"command":"am-report"}'
```

Or just open the Command Deck panel in the VELTRIX dashboard and click **AM Report**.
