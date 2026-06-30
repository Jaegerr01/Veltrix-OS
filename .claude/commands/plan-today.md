# Plan Today

Builds a prioritized daily execution schedule based on the current revenue gap, active lead pipeline, and pending tasks.

## What it does

- Reads live revenue gap and pipeline from Supabase
- Identifies the 5 highest-leverage actions for today
- Orders them by execution priority with time estimates
- Outputs a clean daily schedule Barry can follow immediately

## Steps

1. Call `POST /api/ai/command-deck` with `{ "command": "plan-today" }`
2. Alex (CEO Agent) synthesizes pipeline + tasks into a daily execution plan
3. Automatically creates tasks in Supabase for each action item

## Usage

```bash
curl -X POST http://localhost:3000/api/ai/command-deck \
  -H "Content-Type: application/json" \
  -d '{"command":"plan-today"}'
```
