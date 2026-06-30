# paul:init

Initialize a new VELTRIX build task. Runs a requirements walkthrough and creates a structured brief before any code is written.

## What it does

Asks a series of targeted questions to clarify:
- What are we building / fixing?
- Who is it for (Barry, a client, a lead)?
- What does success look like?
- Any constraints (tech stack, deadline, budget)?

Then produces a **task brief** with success criteria before proceeding.

## Usage

Type `/paul:init` and describe the task. Claude will run the walkthrough.

## Example

```
/paul:init Add a new "Reels Tracker" page to Veltrix OS that shows Instagram reel performance metrics pulled from a manual input form backed by Supabase.
```

Claude will respond with:
1. Clarifying questions if needed
2. A structured brief with success criteria
3. A prompt to proceed to `/paul:plan`
