# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: quality.spec.ts >> information architecture >> dashboard shows REAL status: approvals waiting, drafts, running tasks, send cap @ia-dashboard
- Location: e2e\quality.spec.ts:110:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('region', { name: 'Live status' }).getByRole('link', { name: /Awaiting approval/ })
Expected substring: "2"
Received string:    "Awaiting approval1Review before agents continue"
Timeout: 10000ms

Call log:
  - Expect "toContainText" getByRole('region', { name: 'Live status' }).getByRole('link', { name: /Awaiting approval/ }) with timeout 10000ms
  - waiting for getByRole('region', { name: 'Live status' }).getByRole('link', { name: /Awaiting approval/ })
    24 × locator resolved to <a class="vx-stat" data-tone="warn" href="/command-center">…</a>
       - unexpected value "Awaiting approval1Review before agents continue"

```

```yaml
- link "Awaiting approval 1 Review before agents continue":
  - /url: /command-center
```

# Test source

```ts
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
> 117 |     await expect(tile).toContainText(String(pending + needs));
      |                        ^ Error: expect(locator).toContainText(expected) failed
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
  167 | 
```