# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quality.spec.ts >> interaction polish >> archiving a goal can be undone @ix-undo
- Location: e2e\quality.spec.ts:58:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('status').filter({ hasText: /Archived/ }).getByRole('button', { name: 'Undo' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - generic [ref=e197]: Overview
          - heading "Dashboard" [level=1] [ref=e198]
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
        - generic [ref=e223]:
          - generic [ref=e224]:
            - generic [ref=e225]:
              - heading "Good evening, Operator" [level=2] [ref=e226]
              - paragraph [ref=e227]: Friday, October 2 - $0 paid this month of $6,000 target
            - generic [ref=e228] [cursor=pointer]:
              - switch "Autopilot standby" [ref=e229]
              - generic [ref=e232]: Autopilot standby
          - region [ref=e233]:
            - generic [ref=e234]:
              - generic [ref=e235]:
                - 'heading "Setup: 6 of 8 steps done" [level=2] [ref=e236]'
                - paragraph [ref=e237]:
                  - text: "Next:"
                  - link "Connect the AI (Gemini)" [ref=e238] [cursor=pointer]:
                    - /url: /settings
              - progressbar "Setup progress" [ref=e239]
              - button "Show steps" [ref=e241]
          - region "Live status" [ref=e242]:
            - generic [ref=e243]:
              - link "Awaiting approval 1 Review before agents continue" [ref=e244] [cursor=pointer]:
                - /url: /command-center
                - generic [ref=e245]: Awaiting approval
                - generic [ref=e246]: "1"
                - generic [ref=e247]: Review before agents continue
              - link "Drafts to review 1 Outreach not yet approved" [ref=e248] [cursor=pointer]:
                - /url: /outreach
                - generic [ref=e249]: Drafts to review
                - generic [ref=e250]: "1"
                - generic [ref=e251]: Outreach not yet approved
              - link "Tasks running 1 0 queued - 1 done" [ref=e252] [cursor=pointer]:
                - /url: /tasks
                - generic [ref=e253]: Tasks running
                - generic [ref=e254]: "1"
                - generic [ref=e255]: 0 queued - 1 done
              - link "Sent today 0 / 15 Email not ready - nothing can send" [ref=e256] [cursor=pointer]:
                - /url: /settings
                - generic [ref=e257]: Sent today
                - generic [ref=e258]:
                  - text: "0"
                  - generic [ref=e259]: / 15
                - generic [ref=e260]: Email not ready - nothing can send
              - link "Failed sends 1 Open Outreach to retry" [ref=e261] [cursor=pointer]:
                - /url: /outreach
                - generic [ref=e262]: Failed sends
                - generic [ref=e263]: "1"
                - generic [ref=e264]: Open Outreach to retry
          - generic [ref=e265]:
            - generic [ref=e266]:
              - generic [ref=e267]: Orbital Network
              - generic [ref=e268]: 11 agents, coordinated by the CEO
            - generic [ref=e269]:
              - generic [ref=e270]: 1 working now
              - button [ref=e272] [cursor=pointer]
            - generic [ref=e275]:
              - button "ARIA" [ref=e289]:
                - generic [ref=e290] [cursor=pointer]
              - button "Alex" [ref=e291] [cursor=pointer]
              - button "Marcus" [ref=e298] [cursor=pointer]
              - button "Sophia" [ref=e305] [cursor=pointer]
              - button "Daniel" [ref=e314] [cursor=pointer]
              - button "Emma" [ref=e322] [cursor=pointer]
              - button "Lucas" [ref=e330] [cursor=pointer]
              - button "Olivia" [ref=e340] [cursor=pointer]
              - button "Ryan" [ref=e348] [cursor=pointer]
              - button "Mia" [ref=e355] [cursor=pointer]
              - button "Leo" [ref=e363] [cursor=pointer]
              - button "Victor" [ref=e371] [cursor=pointer]
          - generic [ref=e380]:
            - region [ref=e381]:
              - generic [ref=e383]:
                - paragraph [ref=e384]: Agents
                - heading "Business overview" [level=2] [ref=e385]
              - generic [ref=e386]:
                - generic [ref=e387]:
                  - generic [ref=e388]: "1"
                  - generic [ref=e389]: Tasks completed
                - generic [ref=e390]:
                  - generic [ref=e391]: "1"
                  - generic [ref=e392]: Need approval
              - generic [ref=e393]:
                - generic [ref=e394]:
                  - definition [ref=e395]: "4"
                  - term [ref=e396]: Leads
                - generic [ref=e397]:
                  - definition [ref=e398]: "0"
                  - term [ref=e399]: Booked
                - generic [ref=e400]:
                  - definition [ref=e401]: "0"
                  - term [ref=e402]: Won
            - region [ref=e403]:
              - generic [ref=e404]:
                - generic [ref=e405]:
                  - paragraph [ref=e406]: Pipeline
                  - heading "Lead funnel" [level=2] [ref=e407]
                - generic [ref=e408]: 4 leads
              - list [ref=e409]:
                - listitem [ref=e410]:
                  - generic [ref=e411]: New
                  - generic [ref=e414]: "2"
                - listitem [ref=e415]:
                  - generic [ref=e416]: Contacted
                  - generic [ref=e419]: "1"
                - listitem [ref=e420]:
                  - generic [ref=e421]: Replied
                  - generic [ref=e424]: "1"
                - listitem [ref=e425]:
                  - generic [ref=e426]: Booked
                  - generic [ref=e428]: "0"
                - listitem [ref=e429]:
                  - generic [ref=e430]: Proposal
                  - generic [ref=e432]: "0"
                - listitem [ref=e433]:
                  - generic [ref=e434]: Won
                  - generic [ref=e436]: "0"
              - paragraph [ref=e437]:
                - text: "Pipeline value (expected + invoiced):"
                - strong [ref=e438]: $0
            - region [ref=e439]:
              - generic [ref=e441]:
                - paragraph [ref=e442]: This month
                - heading "Revenue target" [level=2] [ref=e443]
              - generic [ref=e444]:
                - progressbar "0% of the monthly revenue target" [ref=e445]:
                  - generic [ref=e446]: 0%
                - generic [ref=e447]:
                  - generic [ref=e448]:
                    - term [ref=e449]: Target
                    - definition [ref=e450]: $6,000
                  - generic [ref=e451]:
                    - term [ref=e452]: Paid
                    - definition [ref=e453]: $0
                  - generic [ref=e454]:
                    - term [ref=e455]: Pipeline
                    - definition [ref=e456]: $0
              - paragraph [ref=e457]:
                - link "View revenue" [ref=e458] [cursor=pointer]:
                  - /url: /revenue
          - generic [ref=e459]:
            - region [ref=e460]:
              - generic [ref=e461]:
                - generic [ref=e462]:
                  - paragraph [ref=e463]: Priorities
                  - heading "Goals" [level=2] [ref=e464]
                - generic [ref=e465]: 0 / 0 done
              - generic [ref=e466]:
                - textbox "New goal" [ref=e467]:
                  - /placeholder: Add a goal...
                - button [disabled] [ref=e468]
              - generic [ref=e471]:
                - heading "No goals yet" [level=3] [ref=e477]
                - paragraph [ref=e478]: Write down what has to happen this week; the CEO plans around it.
            - region [ref=e479]:
              - generic [ref=e480]:
                - generic [ref=e481]:
                  - paragraph [ref=e482]: Agents
                  - heading "Active work" [level=2] [ref=e483]
                - link "All tasks" [ref=e484] [cursor=pointer]:
                  - /url: /tasks
              - list [ref=e485]:
                - listitem [ref=e486]:
                  - generic [ref=e487]:
                    - strong [ref=e488]: Research dental clinics in Austin
                    - generic [ref=e489]: Leo - In Progress
                  - generic [ref=e490]: High
                - listitem [ref=e491]:
                  - generic [ref=e492]:
                    - strong [ref=e493]: Draft intro email for Summit Clinic
                    - generic [ref=e494]: Nova - Needs Approval
                  - generic [ref=e495]: Medium
  - button "Open ARIA voice assistant" [ref=e496] [cursor=pointer]
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
> 66  |     await page.getByRole('status').filter({ hasText: /Archived/ }).getByRole('button', { name: 'Undo' }).click();
      |                                                                                                          ^ Error: locator.click: Test timeout of 60000ms exceeded.
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
  151 |       const r = await apiGet(page, p);
  152 |       expect(r.text, p).not.toMatch(secretLike);
  153 |     }
  154 |   });
  155 | 
  156 |   test('prefers-reduced-motion stops infinite animations', async ({ browser }) => {
  157 |     const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  158 |     const page = await ctx.newPage();
  159 |     await signIn(page);
  160 |     await page.goto('/ceo');
  161 |     await page.waitForTimeout(1500);
  162 |     const infinite = await page.evaluate(() => document.getAnimations().filter(a => (a.effect?.getComputedTiming?.().iterations ?? 0) === Infinity && a.playState === 'running').length);
  163 |     expect(infinite).toBe(0);
  164 |     await ctx.close();
  165 |   });
  166 | });
```