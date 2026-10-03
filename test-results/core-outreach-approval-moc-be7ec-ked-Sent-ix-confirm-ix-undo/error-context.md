# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core.spec.ts >> outreach approval (mock provider only - nothing can be sent) >> approve is undoable, send needs a confirm dialog, and with no email provider the draft is NOT marked Sent @ix-confirm @ix-undo
- Location: e2e\core.spec.ts:93:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('status').filter({ hasText: 'Draft approved (not sent yet)' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('status').filter({ hasText: 'Draft approved (not sent yet)' }) with timeout 10000ms
  - waiting for getByRole('status').filter({ hasText: 'Draft approved (not sent yet)' })

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
  - text: Pipeline
  - heading "Outreach" [level=1]
  - button "Search and run commands": Search or run a command...
  - 'link "AI not connected System status: AI not connected"':
    - /url: /settings
  - link "2 items waiting for your approval":
    - /url: /command-center
  - link "Operator - open settings":
    - /url: /settings
    - text: O
- main:
  - region "Setup reminder":
    - paragraph: Setup incomplete - 6 of 8 steps done
    - paragraph: "Next: Connect the AI (Gemini). GEMINI_API_KEY is not set - the CEO agent and ARIA cannot think without it."
    - link "Fix it":
      - /url: /settings
    - button "Dismiss setup reminder"
  - heading "Outreach Sequences" [level=2]
  - text: Manage automated and manual customer outreach drafts, review queues, and channel deliveries. 0 DRAFTS 1 APPROVED - NOT SENT 1 FAILED 1 CONFIRMED SENT
  - button "Compose Message"
  - button "Draft"
  - button "Ready / Failed"
  - button "Sent"
  - text: No outreach messages in this folder.
- button "Open ARIA voice assistant":
  - img
- region "Notifications"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { signIn, resetMock } from './helpers';
  3   | import { rows, apiGet } from './util';
  4   | 
  5   | test.beforeEach(async ({ page }) => {
  6   |   await resetMock(true);
  7   |   await signIn(page);
  8   | });
  9   | 
  10  | test.describe('login', () => {
  11  |   test('anonymous visitor sees the login form, native validation blocks empty submit, valid credentials reach the dashboard @sec-auth @state-form', async ({ browser }) => {
  12  |     const ctx = await browser.newContext();
  13  |     const page = await ctx.newPage();
  14  |     await page.goto('/');
  15  |     await expect(page.getByRole('heading', { level: 1 })).toContainText('Postel');
  16  |     const email = page.getByLabel('Email Address');
  17  |     await page.getByRole('button', { name: 'LOGIN' }).click();
  18  |     expect(await email.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  19  |     await email.fill('qa-owner@example.com');
  20  |     await page.getByLabel('Password').fill('correct-horse-battery');
  21  |     await page.getByRole('button', { name: 'LOGIN' }).click();
  22  |     await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  23  |     await ctx.close();
  24  |   });
  25  | 
  26  |   test('protected API refuses anonymous calls with 401 and no data @sec-auth', async ({ request }) => {
  27  |     for (const p of ['/api/workspace/status', '/api/memory', '/api/entity/approvals']) {
  28  |       const res = await request.get(p);
  29  |       expect(res.status(), p).toBe(401);
  30  |       expect(await res.text()).not.toMatch(/Northside|qa-owner/);
  31  |     }
  32  |   });
  33  | });
  34  | 
  35  | test.describe('navigation', () => {
  36  |   test('sidebar groups, active page, skip link and per-page titles @ia-nav', async ({ page }) => {
  37  |     await page.goto('/');
  38  |     const nav = page.getByRole('navigation', { name: /main|primary|app/i }).first();
  39  |     await expect(nav).toBeVisible();
  40  |     for (const g of ['Overview', 'Pipeline', 'Intelligence', 'System']) await expect(nav.getByText(g, { exact: true })).toBeVisible();
  41  |     await nav.getByRole('link', { name: 'Leads' }).click();
  42  |     await expect(page).toHaveURL(/\/leads$/);
  43  |     await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
  44  |     await expect(page).toHaveTitle(/Leads · PostelOS/);
  45  |     await expect(nav.getByRole('link', { name: 'Leads' })).toHaveAttribute('aria-current', 'page');
  46  |     // skip link is the first tab stop and moves focus to <main>
  47  |     await page.goto('/leads');
  48  |     await page.keyboard.press('Tab');
  49  |     const skip = page.getByRole('link', { name: /skip to/i });
  50  |     await expect(skip).toBeFocused();
  51  |     await page.keyboard.press('Enter');
  52  |     await expect(page.locator('#main-content')).toBeFocused();
  53  |   });
  54  | });
  55  | 
  56  | test.describe('CEO console', () => {
  57  |   test('without an AI key the console says so plainly (no fake agent output, no stack trace) @state-error', async ({ page }) => {
  58  |     await page.goto('/ceo');
  59  |     await expect(page.getByRole('heading', { level: 1, name: 'CEO Console' })).toBeVisible();
  60  |     const alert = page.getByRole('alert').filter({ hasText: /AI is not connected/i });
  61  |     await expect(alert).toBeVisible();
  62  |     await expect(alert).toContainText('GEMINI_API_KEY');
  63  |     const body = await page.locator('main').innerText();
  64  |     expect(body).not.toMatch(/at (Object|async|Module)\.|node_modules|TypeError|ReferenceError/);
  65  |   });
  66  | });
  67  | 
  68  | test.describe('vault', () => {
  69  |   test('create, edit, search and delete a note (CRUD) with a confirm dialog before delete', async ({ page }) => {
  70  |     await page.goto('/memory');
  71  |     await expect(page.getByRole('heading', { level: 1, name: 'Memory Vault' })).toBeVisible();
  72  |     await page.getByRole('button', { name: '+ New note' }).first().click();
  73  |     await page.getByLabel('Note title').fill('E2E decision log');
  74  |     await page.getByPlaceholder(/Write markdown here/).fill('We decided to keep sends behind approval. #e2e');
  75  |     await page.getByRole('button', { name: /^Save/ }).click();
  76  |     await expect(page.getByText('Saved "E2E decision log".')).toBeVisible();
  77  |     await expect.poll(async () => (await rows('vault_notes')).filter(r => r.title === 'E2E decision log').length).toBe(1);
  78  | 
  79  |     await page.getByLabel('Note title').fill('E2E decision log v2');
  80  |     await page.getByRole('button', { name: /^Save/ }).click();
  81  |     await expect(page.getByText('Saved "E2E decision log v2".')).toBeVisible();
  82  | 
  83  |     await page.getByRole('button', { name: 'Delete', exact: true }).click();
  84  |     const dialog = page.getByRole('dialog', { name: /Delete "E2E decision log v2"/ });
  85  |     await expect(dialog).toBeVisible();
  86  |     await dialog.getByRole('button', { name: 'Delete note' }).click();
  87  |     await expect(page.getByText('Note deleted.')).toBeVisible();
  88  |     await expect.poll(async () => (await rows('vault_notes')).filter(r => String(r.title).startsWith('E2E decision log')).length).toBe(0);
  89  |   });
  90  | });
  91  | 
  92  | test.describe('outreach approval (mock provider only - nothing can be sent)', () => {
  93  |   test('approve is undoable, send needs a confirm dialog, and with no email provider the draft is NOT marked Sent @ix-confirm @ix-undo', async ({ page }) => {
  94  |     await page.goto('/outreach');
  95  |     await expect(page.getByRole('heading', { level: 1, name: 'Outreach' })).toBeVisible();
  96  |     const before = (await rows('outreach_messages')).filter(r => r.status === 'Sent').length;
  97  | 
  98  |     // Approve -> toast with Undo
  99  |     await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
  100 |     const toast = page.getByRole('status').filter({ hasText: 'Draft approved (not sent yet)' });
> 101 |     await expect(toast).toBeVisible();
      |                         ^ Error: expect(locator).toBeVisible() failed
  102 |     await toast.getByRole('button', { name: 'Undo' }).click();
  103 |     await expect.poll(async () => (await rows('outreach_messages')).filter(r => r.status === 'Draft').length).toBeGreaterThan(0);
  104 | 
  105 |     // Send -> confirm dialog; cancelling sends nothing
  106 |     const send = page.getByRole('button', { name: 'Approve & send' }).first();
  107 |     await send.click();
  108 |     const dlg = page.getByRole('dialog', { name: 'Send this message?' });
  109 |     await expect(dlg).toBeVisible();
  110 |     await dlg.getByRole('button', { name: 'Cancel' }).click();
  111 |     await expect(dlg).toBeHidden();
  112 |     expect((await rows('outreach_messages')).filter(r => r.status === 'Sent').length).toBe(before);
  113 | 
  114 |     // Confirm -> honest failure because no provider is configured; still not Sent
  115 |     await send.click();
  116 |     await dlg.getByRole('button', { name: 'Send now' }).click();
  117 |     await expect(page.getByRole('status').filter({ hasText: /not (configured|connected|ready)|no email provider|NOT sent|could not|failed/i }).first()).toBeVisible({ timeout: 15000 });
  118 |     expect((await rows('outreach_messages')).filter(r => r.status === 'Sent').length).toBe(before);
  119 |   });
  120 | });
  121 | 
  122 | test.describe('settings', () => {
  123 |   test('health panel names exactly what is missing and every switch has an accessible name @ia-settings-health', async ({ page }) => {
  124 |     await page.goto('/settings');
  125 |     await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  126 |     const health = page.locator('section[aria-labelledby="onboarding-title"]');
  127 |     await expect(health).toContainText('Workspace health');
  128 |     await expect(health).toContainText('GEMINI_API_KEY');
  129 |     const switches = page.getByRole('switch');
  130 |     const n = await switches.count();
  131 |     expect(n).toBeGreaterThan(0);
  132 |     for (let i = 0; i < n; i++) {
  133 |       const name = await switches.nth(i).getAttribute('aria-label');
  134 |       expect(name, `switch #${i} needs an aria-label`).toBeTruthy();
  135 |     }
  136 |     // the status API never leaks secret values, only variable names
  137 |     const api = await apiGet(page, '/api/workspace/status');
  138 |     expect(api.status).toBe(200);
  139 |     expect(api.text).not.toMatch(/AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|re_[A-Za-z0-9]{20,}|service_role/);
  140 |   });
  141 | });
  142 | 
```