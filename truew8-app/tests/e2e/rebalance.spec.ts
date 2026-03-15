import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const sessionKey = 'truew8.session';

const authenticate = async (page: import('@playwright/test').Page, email: string) => {
  await page.addInitScript(
    ({ key, sessionEmail }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          token: 'mock-token',
          email: sessionEmail,
        }),
      );
    },
    { key: sessionKey, sessionEmail: email },
  );
};

test('shows dashboard with cofre state and allows strategy selection', async ({ page }) => {
  const email = 'ux.dashboard@truew8.com';
  await authenticate(page, email);

  await page.goto('/');

  await expect(page.getByTestId('dashboard-user-email').first()).toContainText(email);
  await expect(page.getByTestId('dashboard-total-patrimony')).toBeVisible();

  await page.getByTestId('lock-toggle-WEGE3').click();

  await page.locator('[data-testid="open-rebalance-wizard"]:visible').first().click();
  await expect(page.getByText('Qual a sua estrategia hoje?')).toBeVisible();

  await page.locator('[data-testid="strategy-quick-deposit"]:visible').first().click();

  await expect(page.getByTestId('quick-deposit-input')).toBeVisible();
  await expect(page.getByLabel('quick-target-WEGE3')).toHaveCount(0);
});

test('validates quick deposit total and processes sync portfolio flow', async ({ page }) => {
  const email = 'ux.sync@truew8.com';
  await authenticate(page, email);

  await page.goto('/');

  await page.locator('[data-testid="open-rebalance-wizard"]:visible').first().click();
  await page.locator('[data-testid="strategy-quick-deposit"]:visible').first().click();

  await expect(page.getByTestId('quick-generate-orders')).toHaveAttribute('aria-disabled', 'true');

  await page.getByLabel('quick-target-PETR4').fill('40');
  await page.getByLabel('quick-target-VALE3').fill('60');

  await expect(page.getByTestId('quick-deposit-total-target')).toContainText('100.00%');
  await expect(page.getByTestId('quick-generate-orders')).toBeEnabled();

  await page.getByTestId('quick-generate-orders').click();

  await expect(page.getByTestId('dashboard-user-email').first()).toContainText(email);

  await page.locator('[data-testid="open-rebalance-wizard"]:visible').first().click();
  await page.locator('[data-testid="strategy-sync-portfolio"]:visible').first().click();

  await expect(page.getByTestId('sync-total-weight')).toContainText('100.00%');
  await page.getByLabel('sync-weight-portfolio-1').fill('70');
  await page.getByLabel('sync-weight-portfolio-2').fill('30');
  await expect(page.getByTestId('sync-total-weight')).toContainText('100.00%');

  await page.getByTestId('sync-process-rebalance').click();
  await expect(page.getByTestId('dashboard-user-email').first()).toContainText(email);
});
