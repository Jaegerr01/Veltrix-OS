# WK Review

End-of-week debrief. Synthesizes the week's wins, revenue progress, pipeline movement, and key lessons into a structured review.

## What it does

- Summarizes weekly revenue closed vs target
- Reviews pipeline changes (new leads, proposals sent, deals won/lost)
- Lists tasks completed vs still pending
- Surfaces the biggest lesson learned this week
- Sets the #1 goal for next week

## Steps

1. Call `POST /api/ai/command-deck` with `{ "command": "wk-review" }`
2. Alex (CEO Agent) generates the weekly debrief from Supabase data
3. Saved as a `Decision` memory for future reference

## Usage

```bash
curl -X POST http://localhost:3000/api/ai/command-deck \
  -H "Content-Type: application/json" \
  -d '{"command":"wk-review"}'
```
