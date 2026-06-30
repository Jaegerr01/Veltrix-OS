# Trend Scan

Weekly intelligence scan on AI automation, web design, and digital agency trends — surfaces content opportunities and positioning angles for VELTRIX.

## What it does

- Identifies top 3 emerging trends in AI + web services
- Surfaces 2 content angle opportunities for LinkedIn/Instagram authority posts
- Highlights competitor moves or industry shifts worth knowing

## Steps

1. Call `POST /api/ai/command-deck` with `{ "command": "trend-scan" }`
2. Ryan (Content Agent) synthesizes trend intelligence with a VELTRIX positioning lens
3. Results saved as a memory note for future reference

## Usage

```bash
curl -X POST http://localhost:3000/api/ai/command-deck \
  -H "Content-Type: application/json" \
  -d '{"command":"trend-scan"}'
```
