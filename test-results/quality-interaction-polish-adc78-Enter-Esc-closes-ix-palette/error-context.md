# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quality.spec.ts >> interaction polish >> Ctrl+K opens the command palette, filters, navigates with Enter, Esc closes @ix-palette
- Location: e2e\quality.spec.ts:13:7

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator: getByRole('combobox', { name: /page or command/i })
Expected: focused
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeFocused" getByRole('combobox', { name: /page or command/i }) with timeout 10000ms
  - waiting for getByRole('combobox', { name: /page or command/i })

```

```yaml
- alert
- link "Skip to main content":
  - /url: "#main-content"
- complementary "Sidebar":
  - text: POSTELOS by Postel Studio
  - button "Close navigation menu"
  - navigation "Primary":
    - paragraph: Overview
    - list "Overview":
      - listitem:
        - link "Dashboard":
          - /url: /
      - listitem:
        - link "CEO Console":
          - /url: /ceo
      - listitem:
        - link "Command Center":
          - /url: /command-center
      - listitem:
        - link "Revenue":
          - /url: /revenue
    - paragraph: Pipeline
    - list "Pipeline":
      - listitem:
        - link "Leads":
          - /url: /leads
      - listitem:
        - link "Outreach":
          - /url: /outreach
      - listitem:
        - link "Follow-ups":
          - /url: /follow-ups
      - listitem:
        - link "Proposals":
          - /url: /proposals
      - listitem:
        - link "Clients":
          - /url: /clients
      - listitem:
        - link "Projects":
          - /url: /projects
    - paragraph: Intelligence
    - list "Intelligence":
      - listitem:
        - link "Memory Vault":
          - /url: /memory
      - listitem:
        - link "Reel Intel":
          - /url: /reel-intel
      - listitem:
        - link "Reel Scripts":
          - /url: /reels
      - listitem:
        - link "Content":
          - /url: /content
      - listitem:
        - link "Reports":
          - /url: /reports
    - paragraph: System
    - list "System":
      - listitem:
        - link "Tasks":
          - /url: /tasks
      - listitem:
        - link "System Status":
          - /url: /health
      - listitem:
        - link "Settings":
          - /url: /settings
  - paragraph: CEO Agent
  - status:
    - link "AI not connected. Add GEMINI_API_KEY to start.":
      - /url: /settings
  - text: O Operator
  - button "Sign out"
- banner:
  - button "Open navigation menu"
  - text: Overview
  - heading "Dashboard" [level=1]
  - button "Search and run commands": Search or run a command...
  - 'link "AI not connected System status: AI not connected"':
    - /url: /settings
  - link "2 items waiting for your approval":
    - /url: /command-center
  - link "Operator - open settings":
    - /url: /settings
    - text: O
- main:
  - heading "Good evening, Operator" [level=2]
  - paragraph: Friday, October 2 - $0 paid this month of $6,000 target
  - switch "Autopilot standby"
  - text: Autopilot standby
  - 'region "Setup: 6 of 8 steps done"':
    - 'heading "Setup: 6 of 8 steps done" [level=2]'
    - paragraph:
      - text: "Next:"
      - link "Connect the AI (Gemini)":
        - /url: /settings
    - progressbar "Setup progress"
    - button "Show steps"
  - region "Live status":
    - link "Awaiting approval 1 Review before agents continue":
      - /url: /command-center
    - link "Drafts to review 1 Outreach not yet approved":
      - /url: /outreach
    - link "Tasks running 1 0 queued - 1 done":
      - /url: /tasks
    - link "Sent today 0 / 15 Email not ready - nothing can send":
      - /url: /settings
    - link "Failed sends 1 Open Outreach to retry":
      - /url: /outreach
  - text: Orbital Network 11 agents, coordinated by the CEO 1 working now
  - button "Open CEO Console"
  - button "ARIA"
  - button "Alex"
  - button "Marcus"
  - button "Sophia"
  - button "Daniel"
  - button "Emma"
  - button "Lucas"
  - button "Olivia"
  - button "Ryan"
  - button "Mia"
  - button "Leo"
  - button "Victor"
  - region "Business overview":
    - paragraph: Agents
    - heading "Business overview" [level=2]
    - text: 1 Tasks completed 1 Need approval
    - definition: "4"
    - term: Leads
    - definition: "0"
    - term: Booked
    - definition: "0"
    - term: Won
  - region "Lead funnel":
    - paragraph: Pipeline
    - heading "Lead funnel" [level=2]
    - text: 4 leads
    - list:
      - listitem: New 2
      - listitem: Contacted 1
      - listitem: Replied 1
      - listitem: Booked 0
      - listitem: Proposal 0
      - listitem: Won 0
    - paragraph:
      - text: "Pipeline value (expected + invoiced):"
      - strong: $0
  - region "Revenue target":
    - paragraph: This month
    - heading "Revenue target" [level=2]
    - progressbar "0% of the monthly revenue target": 0%
    - term: Target
    - definition: $6,000
    - term: Paid
    - definition: $0
    - term: Pipeline
    - definition: $0
    - paragraph:
      - link "View revenue":
        - /url: /revenue
  - region "Goals":
    - paragraph: Priorities
    - heading "Goals" [level=2]
    - text: 0 / 0 done
    - textbox "New goal":
      - /placeholder: Add a goal...
    - button "Add" [disabled]
    - heading "No goals yet" [level=3]
    - paragraph: Write down what has to happen this week; the CEO plans around it.
  - region "Active work":
    - paragraph: Agents
    - heading "Active work" [level=2]
    - link "All tasks":
      - /url: /tasks
    - list:
      - listitem:
        - strong: Research dental clinics in Austin
        - text: Leo - In Progress High
      - listitem:
        - strong: Draft intro email for Summit Clinic
        - text: Nova - Needs Approval Medium
- button "Open ARIA voice assistant":
  - img
- region "Notifications"
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { signIn, resetMock } from './helpers';
  3   | import { rows, apiGet } from './util';
  4   | 
  5   | test.beforeEach(async ({ page }) => {
  6   |   await resetMock(true);
  7   |   await signIn(page);
  8   | });
  9   | 
  10  | const insideDialog = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  11  | 
  12  | test.describe('interaction polish', () => {
  13  |   test('Ctrl+K opens the command palette, filters, navigates with Enter, Esc closes @ix-palette', async ({ page }) => {
  14  |     await page.goto('/');
  15  |     await page.keyboard.press('Control+K');
  16  |     const box = page.getByRole('combobox', { name: /page or command/i });
> 17  |     await expect(box).toBeFocused();
      |                       ^ Error: expect(locator).toBeFocused() failed
  18  |     await box.fill('reel');
  19  |     await expect(page.getByRole('option').first()).toContainText(/Reel/);
  20  |     await page.keyboard.press('Enter');
  21  |     await expect(page).toHaveURL(/\/reel/);
  22  |     await page.keyboard.press('Control+K');
  23  |     await expect(box).toBeVisible();
  24  |     await page.keyboard.press('Escape');
  25  |     await expect(box).toBeHidden();
  26  |   });
  27  | 
  28  |   test('? documents the keyboard shortcuts and g-then-key navigates @ix-shortcuts', async ({ page }) => {
  29  |     await page.goto('/');
  30  |     await page.locator('body').click({ position: { x: 5, y: 300 } });
  31  |     await page.keyboard.press('Shift+/');
  32  |     const dlg = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  33  |     await expect(dlg).toBeVisible();
  34  |     await expect(dlg).toContainText(/Ctrl|Cmd/);
  35  |     await page.keyboard.press('Escape');
  36  |     await expect(dlg).toBeHidden();
  37  |     await page.keyboard.press('g');
  38  |     await page.keyboard.press('l');
  39  |     await expect(page).toHaveURL(/\/leads$/);
  40  |   });
  41  | 
  42  |   test('dialogs trap focus, close on Escape and return focus to the opener @a11y-modal', async ({ page }) => {
  43  |     await page.goto('/clients');
  44  |     await expect(page.getByRole('heading', { level: 1, name: 'Clients' })).toBeVisible();
  45  |     const opener = page.getByRole('button', { name: /register|add|new client/i }).first();
  46  |     await opener.focus();
  47  |     await page.keyboard.press('Enter');
  48  |     const dlg = page.getByRole('dialog');
  49  |     await expect(dlg).toBeVisible();
  50  |     expect(await insideDialog(page)).toBe(true);
  51  |     for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); expect(await insideDialog(page), `Tab #${i + 1} escaped the dialog`).toBe(true); }
  52  |     for (let i = 0; i < 5; i++) { await page.keyboard.press('Shift+Tab'); expect(await insideDialog(page)).toBe(true); }
  53  |     await page.keyboard.press('Escape');
  54  |     await expect(dlg).toBeHidden();
  55  |     await expect(opener).toBeFocused();
  56  |   });
  57  | 
  58  |   test('archiving a goal can be undone @ix-undo', async ({ page }) => {
  59  |     await page.goto('/');
  60  |     await page.getByLabel('New goal').fill('Book 3 discovery calls');
  61  |     await page.getByRole('button', { name: /^Add$/ }).click();
  62  |     const item = page.getByText('Book 3 discovery calls', { exact: true });
  63  |     await expect(item).toBeVisible();
  64  |     await page.getByRole('button', { name: 'Archive goal "Book 3 discovery calls"' }).click();
  65  |     await expect(item).toBeHidden();
  66  |     await page.getByRole('status').filter({ hasText: /Archived/ }).getByRole('button', { name: 'Undo' }).click();
  67  |     await expect(item).toBeVisible();
  68  |   });
  69  | });
  70  | 
  71  | test.describe('designed states', () => {
  72  |   test('slow data shows a skeleton (status region), not a blank page or spinner-only @state-skeleton', async ({ page }) => {
  73  |     await page.route('**/rest/v1/leads*', async route => { await new Promise(r => setTimeout(r, 2500)); await route.continue(); });
  74  |     await page.goto('/leads');
  75  |     const sk = page.getByRole('status').filter({ hasText: /Loading/i }).first();
  76  |     await expect(sk).toBeVisible();
  77  |     await expect(sk).toBeHidden({ timeout: 15000 });
  78  |     await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
  79  |   });
  80  | 
  81  |   test('an empty workspace shows an empty state with a clear next action @state-empty', async ({ page }) => {
  82  |     await resetMock(false);
  83  |     await page.goto('/leads');
  84  |     await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
  85  |     const main = page.locator('main');
  86  |     await expect(main).toContainText(/no leads|nothing here|get started|add your first/i);
  87  |     await expect(main.getByRole('button', { name: /add|import|scout|new/i }).first()).toBeVisible();
  88  |   });
  89  | 
  90  |   test('a failing backend produces an honest error, never a stack trace or fake rows @state-error', async ({ page }) => {
  91  |     await page.route('**/rest/v1/leads*', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'boom', code: 'XX000' }) }));
  92  |     await page.goto('/leads');
  93  |     await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
  94  |     await page.waitForTimeout(1500);
  95  |     const text = await page.locator('main').innerText();
  96  |     expect(text).not.toMatch(/Northside Dental|at (Object|async|Module)\.|node_modules|TypeError/);
  97  |     await expect(page.getByRole('alert').or(page.getByText(/could not|unavailable|failed|try again/i)).first()).toBeVisible();
  98  |   });
  99  | 
  100 |   test('forms validate inline and disable while busy @state-form', async ({ page }) => {
  101 |     await page.goto('/clients');
  102 |     await page.getByRole('button', { name: /register|add|new client/i }).first().click();
  103 |     const dlg = page.getByRole('dialog');
  104 |     await dlg.getByRole('button', { name: /save|register|add|create/i }).last().click();
  105 |     await expect(dlg.getByText('Business name is required.')).toBeVisible();
  106 |   });
  107 | });
  108 | 
  109 | test.describe('information architecture', () => {
  110 |   test('dashboard shows REAL status: approvals waiting, drafts, running tasks, send cap @ia-dashboard', async ({ page }) => {
  111 |     await page.goto('/');
  112 |     const strip = page.getByRole('region', { name: 'Live status' });
  113 |     await expect(strip).toBeVisible();
  114 |     const pending = (await rows('approval_requests')).filter(r => String(r.status).toLowerCase() === 'pending').length;
  115 |     const needs = (await rows('tasks')).filter(r => r.status === 'Needs Approval').length;
  116 |     const tile = strip.getByRole('link', { name: /Awaiting approval/ });
  117 |     await expect(tile).toContainText(String(pending + needs));
```