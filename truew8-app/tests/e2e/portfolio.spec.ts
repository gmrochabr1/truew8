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

  await expect(page.getByText('Dashboard')).toBeVisible();
  await page.getByTestId('dashboard-locale-menu-trigger').click();
  await expect(page.getByTestId('dashboard-locale-popover')).toBeVisible();
  await page.getByTestId('dashboard-locale-enUS').click();
  await expect(page.getByText('Dashboard')).toBeVisible();
  await expect(page.getByTestId('dashboard-header-logout')).toBeVisible();

  await page.getByTestId('dashboard-locale-menu-trigger').click();
  await page.getByTestId('dashboard-locale-ptBR').click();
  await expect(page.getByText('Dashboard')).toBeVisible();
});

test('opens user personalization menu and persists selected options', async ({ page }) => {
  const email = 'ux.preferences@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('dashboard-user-menu-trigger').click();
  await expect(page.getByTestId('dashboard-user-menu-bottom-sheet')).toBeVisible();

  await page.getByTestId('dashboard-pref-bastter-helper').focus();
  await page.getByTestId('dashboard-pref-bastter-helper').press('Enter');
  await expect(page.getByTestId('dashboard-pref-bastter-helper-content')).toBeVisible();
  await page.getByTestId('dashboard-pref-bastter-helper').press('Enter');

  await page.getByTestId('dashboard-pref-tolerance').fill('7.5');
  await page.getByTestId('dashboard-pref-bastter-mode').focus();
  await page.getByTestId('dashboard-pref-bastter-mode').press('Space');

  await page.getByTestId('dashboard-pref-save').click();
  await expect(page.getByTestId('dashboard-user-menu-bottom-sheet')).toHaveCount(0);
});

test('locks and unlocks portfolio from dashboard card with confirmation modal', async ({ page }) => {
  const email = 'ux.lock-portfolio-dashboard@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');
  await page.getByTestId('portfolio-card-portfolio-1').click();
  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('VALE3');
  await page.getByTestId('manual-quantity').fill('5');
  await page.getByTestId('manual-average-price').fill('40');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();
  await page.getByTestId('portfolio-close-drawer').click();

  await page.getByTestId('portfolio-lock-toggle-portfolio-1').click();
  await expect(page.getByTestId('portfolio-lock-modal')).toBeVisible();
  await page.getByTestId('portfolio-lock-modal-confirm').click();
  await expect(page.getByText('Carteira trancada: ativos congelados para rebalanceamento.')).toBeVisible();

  await page.getByTestId('portfolio-lock-toggle-portfolio-1').click();
  await page.getByTestId('portfolio-lock-modal-confirm').click();
  await expect(page.getByText('Carteira trancada: ativos congelados para rebalanceamento.')).toHaveCount(0);
});

test('shows locked holdings in new deposit base list with closed lock icon', async ({ page }) => {
  const email = 'ux.locked-in-rebalance@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');
  await page.getByTestId('portfolio-card-portfolio-1').click();

  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('WEGE3');
  await page.getByTestId('manual-quantity').fill('10');
  await page.getByTestId('manual-average-price').fill('50');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('VALE3');
  await page.getByTestId('manual-quantity').fill('5');
  await page.getByTestId('manual-average-price').fill('60');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await page.getByTestId('holding-lock-toggle-holding-1').click();
  await expect(page.getByTestId('holding-lock-modal')).toBeVisible();
  await page.getByTestId('holding-lock-modal-confirm').click();

  await page.getByTestId('portfolio-rebalance-button').click();
  await page.getByTestId('rebalance-deposit-input').fill('1000');
  await page.getByTestId('rebalance-step-1-continue').click();

  await expect(page.getByTestId('rebalance-locked-WEGE3')).toBeVisible();
    await expect(page.getByText(/Ativo trancado/i)).toBeVisible();
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

test('keeps user, locale and logout controls aligned in hero', async ({ page }) => {
  const email = 'ux.hero-actions@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  const userButton = page.getByTestId('dashboard-user-menu-trigger');
  const logoutButton = page.getByTestId('dashboard-header-logout');
  const localeTrigger = page.getByTestId('dashboard-locale-menu-trigger');

  const userBox = await userButton.boundingBox();
  const logoutBox = await logoutButton.boundingBox();
  const localeBox = await localeTrigger.boundingBox();

  expect(userBox).not.toBeNull();
  expect(logoutBox).not.toBeNull();
  expect(localeBox).not.toBeNull();
  expect((userBox?.x ?? 0)).toBeLessThan(localeBox?.x ?? 0);
  expect((localeBox?.x ?? 0)).toBeLessThan(logoutBox?.x ?? 0);
  expect(Math.abs((localeBox?.y ?? 0) - (logoutBox?.y ?? 0))).toBeLessThanOrEqual(2);
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
  await page.getByTestId('manual-average-price').fill('459');
  await expect(page.getByTestId('manual-quantity')).toHaveValue('10,25');
  await expect(page.getByTestId('manual-average-price')).toHaveValue('4,59');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await expect(page.getByText('WEGE3')).toBeVisible();
  await expect(page.getByText('Corretora: XP')).toBeVisible();
});

test('blocks duplicate manual holdings within the same portfolio', async ({ page }) => {
  const email = 'ux.manual-duplicate@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('WEGE3');
  await page.getByTestId('manual-quantity').fill('10');
  await page.getByTestId('manual-average-price').fill('50');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('WEGE3');
  await page.getByTestId('manual-quantity').fill('2');
  await page.getByTestId('manual-average-price').fill('45');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await expect(page.getByText('Este ativo já existe nesta carteira.')).toBeVisible();
  await expect(page.getByText('WEGE3')).toHaveCount(1);
});

test('opens desktop drawers as centered bottom sheets with bounded width', async ({ page }) => {
  const email = 'ux.desktop-drawer-bounds@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.setViewportSize({ width: 1440, height: 920 });
  await page.goto('/');

  await page.getByTestId('dashboard-create-portfolio-card').click();
  const createDrawerBox = await page.getByTestId('dashboard-create-portfolio-drawer').boundingBox();
  expect(createDrawerBox).not.toBeNull();
  expect(createDrawerBox?.width ?? 0).toBeLessThanOrEqual(1024);
  expect(createDrawerBox?.x ?? 0).toBeGreaterThan(0);
  expect(createDrawerBox?.y ?? 0).toBeGreaterThan(0);

  await page.getByText('Cancelar').first().click();
  await page.getByTestId('dashboard-create-portfolio-card').click();
  await page.getByTestId('dashboard-create-portfolio-confirm').click();

  const detailDrawerBox = await page.getByTestId('portfolio-detail-drawer').boundingBox();
  expect(detailDrawerBox).not.toBeNull();
  expect(detailDrawerBox?.width ?? 0).toBeLessThanOrEqual(1024);
  expect(detailDrawerBox?.x ?? 0).toBeGreaterThan(0);
  expect(detailDrawerBox?.y ?? 0).toBeGreaterThan(0);

  await page.getByTestId('portfolio-add-manual-fab').click();
  const manualDrawerBox = await page.getByTestId('portfolio-manual-drawer').boundingBox();
  expect(manualDrawerBox).not.toBeNull();
  expect(manualDrawerBox?.width ?? 0).toBeLessThanOrEqual(1024);
  expect(manualDrawerBox?.x ?? 0).toBeGreaterThan(0);
  expect(manualDrawerBox?.y ?? 0).toBeGreaterThan(0);
});

test.use({ viewport: { width: 390, height: 844 } });

test('keeps hero title readable on compact portrait without vertical wrapping', async ({ page }) => {
  const email = 'ux.mobile-hero@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  const title = page.getByText('Dashboard');
  await expect(title).toBeVisible();

  const titleBox = await title.boundingBox();
  expect(titleBox).not.toBeNull();
  expect(titleBox?.height ?? 0).toBeLessThan(140);

  const logoutBox = await page.getByTestId('dashboard-header-logout').boundingBox();
  const localeBox = await page.getByTestId('dashboard-locale-menu-trigger').boundingBox();
  expect(logoutBox).not.toBeNull();
  expect(localeBox).not.toBeNull();
  expect((localeBox?.y ?? 0)).toBeGreaterThanOrEqual(logoutBox?.y ?? 0);
});

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

test('applies right-to-left numeric mask according to selected locale in average price field', async ({ page }) => {
  const email = 'ux.locale-mask@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('dashboard-locale-menu-trigger').click();
  await page.getByTestId('dashboard-locale-enUS').click();

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await page.getByTestId('portfolio-add-manual-fab').click();

  await page.getByTestId('manual-average-price').type('123456');
  await expect(page.getByTestId('manual-average-price')).toHaveValue('1,234.56');
});

test('keeps average price mask localized in pt-BR', async ({ page }) => {
  const email = 'ux.locale-mask-ptbr@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await page.getByTestId('portfolio-add-manual-fab').click();

  await page.getByTestId('manual-average-price').type('123456');
  await expect(page.getByTestId('manual-average-price')).toHaveValue('1.234,56');
});

test('shows individual asset lock confirmation only on first time by default', async ({ page }) => {
  const email = 'ux.holding-lock-first-time@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');
  await page.getByTestId('portfolio-card-portfolio-1').click();

  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('PETR4');
  await page.getByTestId('manual-quantity').fill('10');
  await page.getByTestId('manual-average-price').fill('30');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await page.getByTestId('holding-lock-toggle-holding-1').click();
  await expect(page.getByTestId('holding-lock-modal')).toBeVisible();
  await expect(page.getByText(/Esta confirmação será exibida somente na primeira vez/i)).toBeVisible();
  await page.getByTestId('holding-lock-modal-confirm').click();
  await expect(page.getByTestId('portfolio-holding-card-holding-1').getByText('Trancado')).toBeVisible();

  await page.getByTestId('holding-lock-toggle-holding-1').click();
  await expect(page.getByTestId('holding-lock-modal')).toHaveCount(0);
  await expect(page.getByText('Trancado')).toHaveCount(0);
});

test('keeps individual asset lock confirmation when enabled in preferences', async ({ page }) => {
  const email = 'ux.holding-lock-always-confirm@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');
  await page.getByTestId('dashboard-user-menu-trigger').click();
  await page.getByTestId('dashboard-pref-lock-confirmation-mode').click();
  await page.getByTestId('dashboard-pref-save').click();

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('VALE3');
  await page.getByTestId('manual-quantity').fill('5');
  await page.getByTestId('manual-average-price').fill('50');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await page.getByTestId('holding-lock-toggle-holding-1').click();
  await expect(page.getByTestId('holding-lock-modal')).toBeVisible();
  await page.getByTestId('holding-lock-modal-confirm').click();

  await page.getByTestId('holding-lock-toggle-holding-1').click();
  await expect(page.getByTestId('holding-lock-modal')).toBeVisible();
});

test('hides portfolio lock icon on dashboard when portfolio has no assets', async ({ page }) => {
  const email = 'ux.portfolio-lock-hidden-empty@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');
  await expect(page.getByTestId('portfolio-lock-toggle-portfolio-1')).toHaveCount(0);
});

test('blocks new deposit when entire portfolio is locked and shows message', async ({ page }) => {
  const email = 'ux.locked-portfolio-block-deposit@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');
  await page.getByTestId('portfolio-card-portfolio-1').click();

  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('ITUB4');
  await page.getByTestId('manual-quantity').fill('12');
  await page.getByTestId('manual-average-price').fill('20');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await page.getByTestId('portfolio-toggle-lock-button').click();
  await expect(page.getByTestId('portfolio-lock-modal')).toBeVisible();
  await page.getByTestId('portfolio-lock-modal-confirm').click();

  await page.getByTestId('portfolio-rebalance-button').click();
  await expect(page.getByText('Não é possível fazer aporte enquanto a carteira inteira estiver trancada.')).toBeVisible();
  await expect(page.getByTestId('rebalance-step-1-drawer')).toHaveCount(0);
});

test('opens FAQ from hero for lock guidance', async ({ page }) => {
  const email = 'ux.faq-open@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');
  await page.getByTestId('dashboard-header-faq').click();

  await expect(page.getByTestId('dashboard-faq-bottom-sheet')).toBeVisible();
  await expect(page.getByText(/O que acontece ao trancar um ativo\?/i)).toBeVisible();
});
