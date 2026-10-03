# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quality.spec.ts >> interaction polish >> dialogs trap focus, close on Escape and return focus to the opener @a11y-modal
- Location: e2e\quality.spec.ts:42:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]
  - link "Skip to main content" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - complementary "Sidebar" [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e10]:
          - generic [ref=e11]: POSTELOS
          - generic [ref=e12]: by Postel Studio
        - button "Close navigation menu" [ref=e13] [cursor=pointer]
      - navigation "Primary" [ref=e18]:
        - paragraph [ref=e19]: Overview
        - list "Overview" [ref=e20]:
          - listitem [ref=e21]:
            - link "Dashboard" [ref=e22] [cursor=pointer]:
              - /url: /
          - listitem [ref=e31]:
            - link "CEO Console" [ref=e32] [cursor=pointer]:
              - /url: /ceo
          - listitem [ref=e38]:
            - link "Command Center" [ref=e39] [cursor=pointer]:
              - /url: /command-center
          - listitem [ref=e45]:
            - link "Revenue" [ref=e46] [cursor=pointer]:
              - /url: /revenue
        - paragraph [ref=e52]: Pipeline
        - list "Pipeline" [ref=e53]:
          - listitem [ref=e54]:
            - link "Leads" [ref=e55] [cursor=pointer]:
              - /url: /leads
          - listitem [ref=e63]:
            - link "Outreach" [ref=e64] [cursor=pointer]:
              - /url: /outreach
          - listitem [ref=e71]:
            - link "Follow-ups" [ref=e72] [cursor=pointer]:
              - /url: /follow-ups
          - listitem [ref=e81]:
            - link "Proposals" [ref=e82] [cursor=pointer]:
              - /url: /proposals
          - listitem [ref=e89]:
            - link "Clients" [ref=e90] [cursor=pointer]:
              - /url: /clients
          - listitem [ref=e97]:
            - link "Projects" [ref=e98] [cursor=pointer]:
              - /url: /projects
        - paragraph [ref=e104]: Intelligence
        - list "Intelligence" [ref=e105]:
          - listitem [ref=e106]:
            - link "Memory Vault" [ref=e107] [cursor=pointer]:
              - /url: /memory
          - listitem [ref=e114]:
            - link "Reel Intel" [ref=e115] [cursor=pointer]:
              - /url: /reel-intel
          - listitem [ref=e123]:
            - link "Reel Scripts" [ref=e124] [cursor=pointer]:
              - /url: /reels
          - listitem [ref=e131]:
            - link "Content" [ref=e132] [cursor=pointer]:
              - /url: /content
          - listitem [ref=e138]:
            - link "Reports" [ref=e139] [cursor=pointer]:
              - /url: /reports
        - paragraph [ref=e144]: System
        - list "System" [ref=e145]:
          - listitem [ref=e146]:
            - link "Tasks" [ref=e147] [cursor=pointer]:
              - /url: /tasks
          - listitem [ref=e155]:
            - link "System Status" [ref=e156] [cursor=pointer]:
              - /url: /health
          - listitem [ref=e162]:
            - link "Settings" [ref=e163] [cursor=pointer]:
              - /url: /settings
      - generic [ref=e170]:
        - paragraph [ref=e178]: CEO Agent
        - status [ref=e179]:
          - link "AI not connected. Add GEMINI_API_KEY to start." [ref=e180] [cursor=pointer]:
            - /url: /settings
        - generic [ref=e181]:
          - generic [ref=e182]: O
          - generic [ref=e186]: Operator
          - button "Sign out" [ref=e187] [cursor=pointer]
    - generic [ref=e188]:
      - banner [ref=e189]:
        - button "Open navigation menu" [ref=e190] [cursor=pointer]
        - generic [ref=e196]:
          - generic [ref=e197]: Pipeline
          - heading "Clients" [level=1] [ref=e198]
        - button "Search and run commands" [ref=e199] [cursor=pointer]:
          - generic [ref=e203]: Search or run a command...
          - generic [ref=e205]: Ctrl K
        - generic [ref=e206]:
          - 'link "AI not connected System status: AI not connected" [ref=e207] [cursor=pointer]':
            - /url: /settings
            - generic [ref=e209]: AI not connected
            - generic [ref=e210]: "System status: AI not connected"
          - link "2 items waiting for your approval" [ref=e211] [cursor=pointer]:
            - /url: /command-center
            - generic [aria-hidden] [ref=e215]: "2"
          - link "Operator - open settings" [ref=e216] [cursor=pointer]:
            - /url: /settings
            - generic [ref=e217]: O
      - main [ref=e221]:
        - region "Setup reminder" [ref=e222]:
          - generic [ref=e225]:
            - paragraph [ref=e226]: Setup incomplete - 6 of 8 steps done
            - paragraph [ref=e227]: "Next: Connect the AI (Gemini). GEMINI_API_KEY is not set - the CEO agent and ARIA cannot think without it."
          - link "Fix it" [ref=e228] [cursor=pointer]:
            - /url: /settings
          - button "Dismiss setup reminder" [ref=e229] [cursor=pointer]
        - generic [ref=e234]:
          - generic [ref=e236]:
            - generic [ref=e241]:
              - heading "Clients Directory" [level=2] [ref=e242]
              - generic [ref=e243]: Your corporate book of business — service catalogs, active recurring revenue retainers, and client health metrics.
            - generic [ref=e244]:
              - generic [ref=e245]:
                - text: "1"
                - generic [ref=e246]: TOTAL CLIENTS
              - generic [ref=e247]:
                - text: $400/mo
                - generic [ref=e248]: RECURRING RETAINER
              - generic [ref=e249]:
                - text: $3.2K
                - generic [ref=e250]: TOTAL CONTRACT VALUE
            - button "Add Client" [ref=e251] [cursor=pointer]
          - 'button "CLIENT ID: 40000000 ACTIVE Cedar Wellness QA Contact: Jo Marsh PRODUCT Website redesign RETAINER $400/mo" [ref=e254]':
            - generic [ref=e255]:
              - generic [ref=e256]: "CLIENT ID: 40000000"
              - generic [ref=e257]: ACTIVE
            - heading "Cedar Wellness QA" [level=3] [ref=e258]
            - paragraph [ref=e259]: "Contact: Jo Marsh"
            - generic [ref=e260]:
              - generic [ref=e261]:
                - generic [ref=e262]: PRODUCT
                - generic [ref=e263]: Website redesign
              - generic [ref=e264]:
                - generic [ref=e265]: RETAINER
                - generic [ref=e266]: $400/mo
          - dialog "Register new client profile" [ref=e267]:
            - generic [ref=e268]:
              - generic [ref=e269]:
                - heading "Register New Client Profile" [level=3] [ref=e270]
                - button "Close dialog" [active] [ref=e271] [cursor=pointer]: ×
              - generic [ref=e272]:
                - generic [ref=e273]:
                  - generic [ref=e274]: Business / Company Name *
                  - textbox "e.g. Austin Dental Care" [ref=e275]
                - generic [ref=e276]:
                  - generic [ref=e277]: Contact Name
                  - textbox "e.g. Dr. Jane Smith" [ref=e278]
                - generic [ref=e279]:
                  - generic [ref=e280]: Website
                  - textbox "e.g. https://smithdental.com" [ref=e281]
                - generic [ref=e282]:
                  - generic [ref=e283]: Email
                  - textbox "e.g. contact@smithdental.com" [ref=e284]
                - generic [ref=e285]:
                  - generic [ref=e286]: Phone
                  - textbox "e.g. 512-555-0199" [ref=e287]
                - generic [ref=e288]:
                  - generic [ref=e289]: Service Purchased
                  - combobox "Service purchased" [ref=e290]:
                    - option "AI Website System" [selected]
                    - option "AI Receptionist Voice/Chatbot"
                    - option "AI Branding Package"
                    - option "Custom Autopilot System"
                - generic [ref=e291]:
                  - generic [ref=e292]: Monthly Retainer ($)
                  - spinbutton "e.g. 250" [ref=e293]: "0"
                - generic [ref=e294]:
                  - generic [ref=e295]: Contract Total Value ($)
                  - spinbutton "e.g. 1500" [ref=e296]: "1500"
                - generic [ref=e297]:
                  - generic [ref=e298]: Status
                  - combobox "Client status" [ref=e299]:
                    - option "Active" [selected]
                    - option "Inactive"
                    - option "Completed"
              - button "Ratify Client Contract" [ref=e300] [cursor=pointer]
  - button "Open ARIA voice assistant" [ref=e301] [cursor=pointer]
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
  17  |     await expect(box).toBeFocused();
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
> 50  |     expect(await insideDialog(page)).toBe(true);
      |                                      ^ Error: expect(received).toBe(expected) // Object.is equality
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
  118 |     const drafts = (await rows('outreach_messages')).filter(r => r.status === 'Draft').length;
  119 |     await expect(strip.getByRole('link', { name: /Drafts to review/ })).toContainText(String(drafts));
  120 |     await expect(strip.getByRole('link', { name: /Sent today/ })).toContainText(/\/ \d+/);
  121 |     await expect(strip.getByRole('link', { name: /Failed sends/ })).toContainText('1');
  122 |   });
  123 | 
  124 |   test('first-run checklist is driven by real configuration and names the missing keys @ia-onboarding', async ({ page }) => {
  125 |     await page.goto('/');
  126 |     const card = page.locator('section[aria-labelledby="onboarding-title"]');
  127 |     await expect(card).toContainText(/Setup: \d of 8 steps done/);
  128 |     await card.getByRole('button', { name: 'Show steps' }).click();
  129 |     await expect(card).toContainText('GEMINI_API_KEY');
  130 |     await expect(card.getByRole('link', { name: /Next:|AI|email/i }).first()).toBeVisible();
  131 |   });
  132 | });
  133 | 
  134 | test.describe('security and robustness regression (phase 2)', () => {
  135 |   test('security headers are present on pages @sec-headers', async ({ request }) => {
  136 |     const res = await request.get('/privacy');
  137 |     const h = res.headers();
  138 |     expect(h['x-content-type-options']).toBe('nosniff');
  139 |     expect(h['content-security-policy'] || h['content-security-policy-report-only']).toBeTruthy();
  140 |     expect(h['x-frame-options'] || (h['content-security-policy'] || '').includes('frame-ancestors')).toBeTruthy();
  141 |     expect(h['referrer-policy']).toBeTruthy();
  142 |   });
  143 | 
  144 |   test('no response body or page leaks secret values @sec-nosecrets', async ({ page }) => {
  145 |     const secretLike = /AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|re_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}\.(?!x)|service_role/;
  146 |     await page.goto('/settings');
  147 |     await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  148 |     const html = await page.content();
  149 |     expect(html).not.toMatch(secretLike);
  150 |     for (const p of ['/api/workspace/status', '/api/health']) {
```