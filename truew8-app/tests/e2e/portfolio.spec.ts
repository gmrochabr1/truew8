import { expect, test } from '@playwright/test';

import { authenticate, seedApiRoutes } from './helpers/bootstrap';

test('moves logout to dashboard top bar and logs out', async ({ page }) => {
  const email = 'ux.logout@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await expect(page.getByTestId('dashboard-header-logout')).toBeVisible();
  await page.getByTestId('dashboard-header-logout').click();
  await expect(page.getByTestId('login-submit-button')).toBeVisible();
});

test('creates a new portfolio via right drawer without closing on input focus', async ({ page }) => {
  const email = 'ux.new-portfolio@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('dashboard-create-portfolio-card').click();
  await expect(page.getByTestId('dashboard-create-portfolio-name')).toBeVisible();

  await page.getByTestId('dashboard-create-portfolio-name').click();
  await page.getByTestId('dashboard-create-portfolio-name').fill('Acoes de Crescimento');
  await expect(page.getByTestId('dashboard-create-portfolio-name')).toBeVisible();

  await page.getByTestId('dashboard-create-portfolio-confirm').click();
  await expect(page.getByTestId('portfolio-add-manual-fab')).toBeVisible();
  await expect(page).toHaveURL(/\/portfolio\/portfolio-2$/);
});

test('adds manual holding using right drawer flow', async ({ page }) => {
  const email = 'ux.manual@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await expect(page.getByTestId('portfolio-add-manual-fab')).toBeVisible();

  await page.getByTestId('portfolio-add-manual-fab').click();
  await expect(page.getByTestId('manual-ticker')).toBeVisible();

  await page.getByTestId('manual-ticker').fill('WEGE3');
  await page.getByTestId('manual-quantity').fill('10');
  await page.getByTestId('manual-average-price').fill('45');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await expect(page.getByText('WEGE3')).toBeVisible();
  await expect(page.getByText('Corretora: XP')).toBeVisible();
});
