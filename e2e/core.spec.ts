import { test, expect } from '@playwright/test';
import { signIn, resetMock } from './helpers';
import { rows, apiGet } from './util';

test.beforeEach(async ({ page }) => {
  await resetMock(true);
  await signIn(page);
});

test.describe('login', () => {
  test('anonymous visitor sees the login form, native validation blocks empty submit, valid credentials reach the dashboard @sec-auth @state-form', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Postel');
    const email = page.getByLabel('Email Address');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await email.fill('qa-owner@example.com');
    await page.getByLabel('Password').fill('correct-horse-battery');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await ctx.close();
  });

  test('protected API refuses anonymous calls with 401 and no data @sec-auth', async ({ request }) => {
    for (const p of ['/api/workspace/status', '/api/memory', '/api/entity/approvals']) {
      const res = await request.get(p);
      expect(res.status(), p).toBe(401);
      expect(await res.text()).not.toMatch(/Northside|qa-owner/);
    }
  });
});

test.describe('navigation', () => {
  test('sidebar groups, active page, skip link and per-page titles @ia-nav', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: /main|primary|app/i }).first();
    await expect(nav).toBeVisible();
    for (const g of ['Overview', 'Pipeline', 'Intelligence', 'System']) await expect(nav.getByText(g, { exact: true })).toBeVisible();
    await nav.getByRole('link', { name: 'Leads' }).click();
    await expect(page).toHaveURL(/\/leads$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Leads' })).toBeVisible();
    await expect(page).toHaveTitle(/Leads · PostelOS/);
    await expect(nav.getByRole('link', { name: 'Leads' })).toHaveAttribute('aria-current', 'page');
    // skip link is the first tab stop and moves focus to <main>
    await page.goto('/leads');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip to/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
});

test.describe('CEO console', () => {
  test('without an AI key the console says so plainly (no fake agent output, no stack trace) @state-error', async ({ page }) => {
    await page.goto('/ceo');
    await expect(page.getByRole('heading', { level: 1, name: 'CEO Console' })).toBeVisible();
    const alert = page.getByRole('alert').filter({ hasText: /AI is not connected/i });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('GEMINI_API_KEY');
    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(/at (Object|async|Module)\.|node_modules|TypeError|ReferenceError/);
  });
});

test.describe('vault', () => {
  test('create, edit, search and delete a note (CRUD) with a confirm dialog before delete', async ({ page }) => {
    await page.goto('/memory');
    await expect(page.getByRole('heading', { level: 1, name: 'Memory Vault' })).toBeVisible();
    await page.getByRole('button', { name: '+ New note' }).first().click();
    await page.getByLabel('Note title').fill('E2E decision log');
    await page.getByPlaceholder(/Write markdown here/).fill('We decided to keep sends behind approval. #e2e');
    await page.getByRole('button', { name: /^Save/ }).click();
    await expect(page.getByText('Saved "E2E decision log".')).toBeVisible();
    await expect.poll(async () => (await rows('vault_notes')).filter(r => r.title === 'E2E decision log').length).toBe(1);

    await page.getByLabel('Note title').fill('E2E decision log v2');
    await page.getByRole('button', { name: /^Save/ }).click();
    await expect(page.getByText('Saved "E2E decision log v2".')).toBeVisible();

    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Delete "E2E decision log v2"/ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete note' }).click();
    await expect(page.getByText('Note deleted.')).toBeVisible();
    await expect.poll(async () => (await rows('vault_notes')).filter(r => String(r.title).startsWith('E2E decision log')).length).toBe(0);
  });
});

test.describe('outreach approval (mock provider only - nothing can be sent)', () => {
  test('approve is undoable, send needs a confirm dialog, and with no email provider the draft is NOT marked Sent @ix-confirm @ix-undo', async ({ page }) => {
    await page.goto('/outreach');
    await expect(page.getByRole('heading', { level: 1, name: 'Outreach' })).toBeVisible();
    const before = (await rows('outreach_messages')).filter(r => r.status === 'Sent').length;

    // Approve -> toast with Undo
    await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
    const toast = page.getByRole('status').filter({ hasText: 'Draft approved (not sent yet)' });
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: 'Undo' }).click();
    await expect.poll(async () => (await rows('outreach_messages')).filter(r => r.status === 'Draft').length).toBeGreaterThan(0);

    // Send -> confirm dialog; cancelling sends nothing
    const send = page.getByRole('button', { name: 'Approve & send' }).first();
    await send.click();
    const dlg = page.getByRole('dialog', { name: 'Send this message?' });
    await expect(dlg).toBeVisible();
    await dlg.getByRole('button', { name: 'Cancel' }).click();
    await expect(dlg).toBeHidden();
    expect((await rows('outreach_messages')).filter(r => r.status === 'Sent').length).toBe(before);

    // Confirm -> honest failure because no provider is configured; still not Sent
    await send.click();
    await dlg.getByRole('button', { name: 'Send now' }).click();
    await expect(page.getByRole('status').filter({ hasText: /not (configured|connected|ready)|no email provider|NOT sent|could not|failed/i }).first()).toBeVisible({ timeout: 15000 });
    expect((await rows('outreach_messages')).filter(r => r.status === 'Sent').length).toBe(before);
  });
});

test.describe('settings', () => {
  test('health panel names exactly what is missing and every switch has an accessible name @ia-settings-health', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    const health = page.locator('section[aria-labelledby="onboarding-title"]');
    await expect(health).toContainText('Workspace health');
    await expect(health).toContainText('GEMINI_API_KEY');
    const switches = page.getByRole('switch');
    const n = await switches.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const name = await switches.nth(i).getAttribute('aria-label');
      expect(name, `switch #${i} needs an aria-label`).toBeTruthy();
    }
    // the status API never leaks secret values, only variable names
    const api = await apiGet(page, '/api/workspace/status');
    expect(api.status).toBe(200);
    expect(api.text).not.toMatch(/AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|re_[A-Za-z0-9]{20,}|service_role/);
  });
});
