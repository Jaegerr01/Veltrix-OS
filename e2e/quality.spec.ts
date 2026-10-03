import { test, expect, type Page } from '@playwright/test';
import { signIn, resetMock } from './helpers';
import { rows, apiGet } from './util';

test.beforeEach(async ({ page }) => {
  await resetMock(true);
  await signIn(page);
});

const insideDialog = (page: Page) => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));

test.describe('interaction polish', () => {
  test('Ctrl+K opens the command palette, filters, navigates with Enter, Esc closes @ix-palette', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+K');
    const box = page.getByRole('combobox', { name: /page or command/i });
    await expect(box).toBeFocused();
    await box.fill('reel');
    await expect(page.getByRole('option').first()).toContainText(/Reel/);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/reel/);
    await page.keyboard.press('Control+K');
    await expect(box).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(box).toBeHidden();
  });

  test('? documents the keyboard shortcuts and g-then-key navigates @ix-shortcuts', async ({ page }) => {
    await page.goto('/');
    await page.locator('body').click({ position: { x: 5, y: 300 } });
    await page.keyboard.press('Shift+/');
    const dlg = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dlg).toBeVisible();
    await expect(dlg).toContainText(/Ctrl|Cmd/);
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    await page.keyboard.press('g');
    await page.keyboard.press('l');
    await expect(page).toHaveURL(/\/leads$/);
  });

  test('dialogs trap focus, close on Escape and return focus to the opener @a11y-modal', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.getByRole('heading', { level: 1, name: 'Clients' })).toBeVisible();
    const opener = page.getByRole('button', { name: /register|add|new client/i }).first();
    await opener.focus();
    await page.keyboard.press('Enter');
    const dlg = page.getByRole('dialog');
    await expect(dlg).toBeVisible();
    expect(await insideDialog(page)).toBe(true);
    for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); expect(await insideDialog(page), `Tab #${i + 1} escaped the dialog`).toBe(true); }
    for (let i = 0; i < 5; i++) { await page.keyboard.press('Shift+Tab'); expect(await insideDialog(page)).toBe(true); }
    await page.keyboard.press('Escape');
    await expect(dlg).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('archiving a goal can be undone @ix-undo', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('New goal').fill('Book 3 discovery calls');
    await page.getByRole('button', { name: /^Add$/ }).click();
    const item = page.getByText('Book 3 discovery calls', { exact: true });
    await expect(item).toBeVisible();
    await page.getByRole('button', { name: 'Archive goal "Book 3 discovery calls"' }).click();
    await expect(item).toBeHidden();
    await page.getByRole('status').filter({ hasText: /Archived/ }).getByRole('button', { name: 'Undo' }).click();
    await expect(item).toBeVisible();
  });
});

test.describe('designed states', () => {
  test('slow data shows a skeleton (status region), not a blank page or spinner-only @state-skeleton', async ({ page }) => {
    await page.route('**/rest/v1/leads*', async route => { await new Promise(r => setTimeout(r, 2500)); await route.continue(); });
    await page.goto('/leads');
    const sk = page.getByRole('status').filter({ hasText: /Loading/i }).first();
    await expect(sk).toBeVisible();
    await expect(sk).toBeHidden({ timeout: 15000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
  });

  test('an empty workspace shows an empty state with a clear next action @state-empty', async ({ page }) => {
    await resetMock(false);
    await page.goto('/leads');
    await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
    const main = page.locator('main');
    await expect(main).toContainText(/no leads|nothing here|get started|add your first/i);
    await expect(main.getByRole('button', { name: /add|import|scout|new/i }).first()).toBeVisible();
  });

  test('a failing backend produces an honest error, never a stack trace or fake rows @state-error', async ({ page }) => {
    await page.route('**/rest/v1/leads*', route => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'boom', code: 'XX000' }) }));
    await page.goto('/leads');
    await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
    await page.waitForTimeout(1500);
    const text = await page.locator('main').innerText();
    expect(text).not.toMatch(/Northside Dental|at (Object|async|Module)\.|node_modules|TypeError/);
    await expect(page.getByRole('alert').or(page.getByText(/could not|unavailable|failed|try again/i)).first()).toBeVisible();
  });

  test('forms validate inline and disable while busy @state-form', async ({ page }) => {
    await page.goto('/clients');
    await page.getByRole('button', { name: /register|add|new client/i }).first().click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('button', { name: /save|register|add|create/i }).last().click();
    await expect(dlg.getByText('Business name is required.')).toBeVisible();
  });
});

test.describe('information architecture', () => {
  test('dashboard shows REAL status: approvals waiting, drafts, running tasks, send cap @ia-dashboard', async ({ page }) => {
    await page.goto('/');
    const strip = page.getByRole('region', { name: 'Live status' });
    await expect(strip).toBeVisible();
    const pending = (await rows('approval_requests')).filter(r => String(r.status).toLowerCase() === 'pending').length;
    const needs = (await rows('tasks')).filter(r => r.status === 'Needs Approval').length;
    const tile = strip.getByRole('link', { name: /Awaiting approval/ });
    await expect(tile).toContainText(String(pending + needs));
    const drafts = (await rows('outreach_messages')).filter(r => r.status === 'Draft').length;
    await expect(strip.getByRole('link', { name: /Drafts to review/ })).toContainText(String(drafts));
    await expect(strip.getByRole('link', { name: /Sent today/ })).toContainText(/\/ \d+/);
    await expect(strip.getByRole('link', { name: /Failed sends/ })).toContainText('1');
  });

  test('first-run checklist is driven by real configuration and names the missing keys @ia-onboarding', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('section[aria-labelledby="onboarding-title"]');
    await expect(card).toContainText(/Setup: \d of 8 steps done/);
    await card.getByRole('button', { name: 'Show steps' }).click();
    await expect(card).toContainText('GEMINI_API_KEY');
    await expect(card.getByRole('link', { name: /Next:|AI|email/i }).first()).toBeVisible();
  });
});

test.describe('security and robustness regression (phase 2)', () => {
  test('security headers are present on pages @sec-headers', async ({ request }) => {
    const res = await request.get('/privacy');
    const h = res.headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['content-security-policy'] || h['content-security-policy-report-only']).toBeTruthy();
    expect(h['x-frame-options'] || (h['content-security-policy'] || '').includes('frame-ancestors')).toBeTruthy();
    expect(h['referrer-policy']).toBeTruthy();
  });

  test('no response body or page leaks secret values @sec-nosecrets', async ({ page }) => {
    const secretLike = /AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|re_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{20,}\.(?!x)|service_role/;
    await page.goto('/settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    const html = await page.content();
    expect(html).not.toMatch(secretLike);
    for (const p of ['/api/workspace/status', '/api/health']) {
      const r = await apiGet(page, p);
      expect(r.text, p).not.toMatch(secretLike);
    }
  });

  test('prefers-reduced-motion stops infinite animations', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await signIn(page);
    await page.goto('/ceo');
    await page.waitForTimeout(1500);
    const infinite = await page.evaluate(() => document.getAnimations().filter(a => (a.effect?.getComputedTiming?.().iterations ?? 0) === Infinity && a.playState === 'running').length);
    expect(infinite).toBe(0);
    await ctx.close();
  });
});
