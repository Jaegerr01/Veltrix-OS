# paul:unify

Reconcile and close the loop after `/paul:apply`. Verifies the implementation is complete and consistent.

## What it does

1. Reviews all changed files against the original plan
2. Checks for any missed steps or broken imports
3. Ensures types, components, and API routes are consistent
4. Runs a final build check (if applicable)
5. Summarizes what was built and marks the task complete

## Usage

```
/paul:unify
```

## Output

```
PAUL UNIFY — [task name]
✓ Step 1: API route created and exports correctly
✓ Step 2: Type added to types.ts
✓ Step 3: Page renders and imports from correct paths
✓ Step 4: Sidebar link added

All steps verified. Task complete.
Next: commit and push, or start a new task with /paul:init
```
