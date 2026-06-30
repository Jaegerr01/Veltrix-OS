# paul:apply

Execute an approved PAUL plan. Implements the code changes defined in `/paul:plan` step by step.

## What it does

1. Executes each step from the approved plan in sequence
2. Creates or edits files precisely as specified
3. Reports progress after each step
4. Stops and asks if a blocker is hit

## Usage

```
/paul:apply
```

Or apply a specific step:
```
/paul:apply step-2
```

## Rules

- Never skips steps without flagging it
- Surgical changes only — touches only what the plan specifies
- If a file doesn't exist, creates it; if it does, edits the minimum required section
- After all steps complete, prompts to run `/paul:unify`
