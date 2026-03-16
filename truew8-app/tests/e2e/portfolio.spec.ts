import { expect, test } from '@playwright/test';

import { authenticate, seedApiRoutes } from './helpers/bootstrap';

test('toggles password visibility on login', async ({ page }) => {
  await page.goto('/login');

  const passwordInput = page.getByTestId('login-password-input');
  const visibilityToggle = page.getByTestId('login-password-visibility-toggle');

  await passwordInput.fill('SenhaSegura123');
  await expect(passwordInput).toHaveAttribute('type', 'password');

  await visibilityToggle.click();
  await expect(passwordInput).toHaveAttribute('type', 'text');

  await visibilityToggle.click();
  await expect(passwordInput).toHaveAttribute('type', 'password');
});

test('switches locale globally from dashboard', async ({ page }) => {
  const email = 'ux.locale@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await expect(page.getByText('Visao Consolidada')).toBeVisible();
  await page.getByTestId('dashboard-locale-enUS').click();
  await expect(page.getByText('Consolidated View')).toBeVisible();
  await expect(page.getByText('Sign out')).toBeVisible();

  await page.getByTestId('dashboard-locale-ptBR').click();
  await expect(page.getByText('Visao Consolidada')).toBeVisible();
});

test('moves logout to dashboard top bar and logs out', async ({ page }) => {
  const email = 'ux.logout@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await expect(page.getByTestId('dashboard-header-logout')).toBeVisible();
  await page.getByTestId('dashboard-header-logout').click();
  await expect(page.getByTestId('login-submit-button')).toBeVisible();
});

test('creates a new portfolio, opens detail with name and keeps dashboard list updated', async ({ page }) => {
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
  await expect(page).toHaveURL(/\/portfolio\/portfolio-2(\?.*)?$/);
  await expect(page.getByTestId('portfolio-detail-drawer').getByText('Acoes de Crescimento')).toBeVisible();

  await page.getByTestId('portfolio-close-drawer').click();
  await expect(page.getByTestId('portfolio-card-portfolio-2').getByText('Acoes de Crescimento')).toBeVisible();
});

test('edits portfolio name from detail drawer and reflects change', async ({ page }) => {
  const email = 'ux.rename-portfolio@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await expect(page.getByTestId('portfolio-detail-drawer').getByText('Principal')).toBeVisible();

  await page.getByTestId('portfolio-edit-name-button').click();
  await expect(page.getByTestId('portfolio-edit-name-input')).toBeVisible();
  await page.getByTestId('portfolio-edit-name-input').fill('Carteira Renomeada');
  await page.getByTestId('portfolio-edit-name-save').click();

  await expect(page.getByText('Carteira Renomeada')).toBeVisible();

  await page.getByTestId('portfolio-close-drawer').click();
  await expect(page.getByText('Carteira Renomeada')).toBeVisible();
});

test('deletes portfolio after confirmation modal and returns to dashboard', async ({ page }) => {
  const email = 'ux.delete-portfolio@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');
  await page.getByTestId('portfolio-card-portfolio-1').click();

  await page.getByTestId('portfolio-delete-button').click();
  await expect(page.getByTestId('portfolio-delete-modal')).toBeVisible();

  await page.getByTestId('portfolio-delete-modal-confirm').click();
  await expect(page).toHaveURL(/\/dashboard(\?.*)?$/);
  await page.getByText('Atualizar').click();
  await expect(page.getByTestId('portfolio-card-portfolio-1')).toHaveCount(0);
});

test('keeps rebalance button disabled when there are no holdings', async ({ page }) => {
  const email = 'ux.rebalance-disabled@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');
  await page.getByTestId('portfolio-card-portfolio-1').click();

  const rebalanceButton = page.getByTestId('portfolio-rebalance-button');
  await expect(rebalanceButton).toHaveAttribute('aria-disabled', 'true');
  await rebalanceButton.click({ force: true });
  await expect(page.getByTestId('rebalance-step-1-drawer')).toHaveCount(0);
});

test('adds manual holding using drawer flow', async ({ page }) => {
  const email = 'ux.manual@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await expect(page.getByTestId('portfolio-add-manual-fab')).toBeVisible();

  await page.getByTestId('portfolio-add-manual-fab').click();
  await expect(page.getByTestId('manual-ticker')).toBeVisible();

  await page.getByTestId('manual-ticker').fill('WEGE3');
  await page.getByTestId('manual-quantity').fill('10abc,25');
  await page.getByTestId('manual-average-price').fill('45,9xx');
  await expect(page.getByTestId('manual-quantity')).toHaveValue('10,25');
  await expect(page.getByTestId('manual-average-price')).toHaveValue('45,9');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await expect(page.getByText('WEGE3')).toBeVisible();
  await expect(page.getByText('Corretora: XP')).toBeVisible();
});

test.use({ viewport: { width: 390, height: 844 } });

test('opens drawers from bottom on compact portrait screens without covering entire dashboard', async ({ page }) => {
  const email = 'ux.mobile-drawer@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('dashboard-create-portfolio-card').click();
  const createDrawerBox = await page.getByTestId('dashboard-create-portfolio-drawer').boundingBox();
  expect(createDrawerBox).not.toBeNull();
  expect(createDrawerBox?.x).toBeLessThanOrEqual(1);
  expect(createDrawerBox?.y ?? 0).toBeGreaterThan(0);

  await page.getByTestId('dashboard-create-portfolio-confirm').click();
  await expect(page.getByTestId('portfolio-add-manual-fab')).toBeVisible();

  const detailDrawerBox = await page.getByTestId('portfolio-detail-drawer').boundingBox();
  expect(detailDrawerBox).not.toBeNull();
  expect(detailDrawerBox?.x).toBeLessThanOrEqual(1);
  expect(detailDrawerBox?.y ?? 0).toBeGreaterThan(0);

  await page.getByTestId('portfolio-add-manual-fab').click();
  const manualDrawerBox = await page.getByTestId('portfolio-manual-drawer').boundingBox();
  expect(manualDrawerBox).not.toBeNull();
  expect(manualDrawerBox?.x).toBeLessThanOrEqual(1);
  expect(manualDrawerBox?.y ?? 0).toBeGreaterThan(0);

  await page.getByText('Cancelar').first().click();

  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('PETR4');
  await page.getByTestId('manual-quantity').fill('2');
  await page.getByTestId('manual-average-price').fill('30');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();
  await expect(page.getByTestId('portfolio-manual-drawer')).toHaveCount(0);

  await page.getByTestId('portfolio-rebalance-button').click();
  const rebalanceStepOne = page.getByTestId('rebalance-step-1-drawer');
  await expect(rebalanceStepOne).toBeVisible();

  const rebalanceDrawerBox = await rebalanceStepOne.boundingBox();
  expect(rebalanceDrawerBox).not.toBeNull();
  expect(rebalanceDrawerBox?.y ?? 0).toBeGreaterThan(0);

  await page.getByTestId('rebalance-deposit-input').fill('1000');
  await expect(page.getByTestId('rebalance-deposit-input')).toHaveValue('1000');
});
