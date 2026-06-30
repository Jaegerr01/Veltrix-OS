# paul:plan

Create an executable plan for the current task. Auto-routes to the right complexity level:
- **quick-fix** — bug fix or small tweak (1-3 files)
- **standard** — new feature or page (3-8 files)
- **complex** — new module, agent, or major integration (8+ files)

## What it does

1. Reads the brief from `/paul:init` or the current task description
2. Determines complexity tier
3. Outputs a step-by-step implementation plan with file paths and change descriptions
4. Awaits your approval before any code is written

## Usage

```
/paul:plan [optional: describe task if not already initialized]
```

## Output format

```
PAUL PLAN — [task name]
Complexity: standard
Files to change: 4

Step 1: Create src/app/api/reels/route.ts — CRUD endpoints for reel metrics
Step 2: Add Reel interface to src/lib/types.ts
Step 3: Create src/app/reels/page.tsx — Reels Tracker page
Step 4: Add "Reels" nav link to src/components/Sidebar.tsx

Approve to execute? → /paul:apply
```
