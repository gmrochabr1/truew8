import { expect, test } from '@playwright/test';
import { authenticate, seedApiRoutes } from './helpers/bootstrap';

function centerX(box: { x: number; width: number } | null): number {
  if (!box) {
    return 0;
  }
  return box.x + box.width / 2;
}

test('keeps cascading flow stable across desktop and mobile directions', async ({ page }) => {
  const email = 'ux.cascade@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('VALE3');
  await page.getByTestId('manual-quantity').fill('10');
  await page.getByTestId('manual-average-price').fill('50');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await page.getByTestId('portfolio-rebalance-button').click();
  await expect(page.getByTestId('rebalance-step-1-drawer')).toBeVisible();
  await page.waitForTimeout(450);

  await page.getByTestId('rebalance-deposit-input').fill('100x,5y');
  await expect(page.getByTestId('rebalance-deposit-input')).toHaveValue('100,5');

  await page.getByTestId('rebalance-step-1-continue').press('Enter');
  await expect(page.getByTestId('rebalance-step-2-drawer')).toBeVisible();
  await expect(page.getByTestId('rebalance-step-1-shadow')).toBeVisible();
  await page.waitForTimeout(300);
  await page.getByTestId('rebalance-step-2-continue').press('Enter');
  await expect(page.getByTestId('rebalance-step-3-drawer')).toBeVisible();
  await expect(page.getByTestId('rebalance-step-2-shadow')).toBeVisible();
  await page.waitForTimeout(300);

  const desktopStep1 = await page.getByTestId('rebalance-step-1-drawer').boundingBox();
  const desktopStep2 = await page.getByTestId('rebalance-step-2-drawer').boundingBox();
  const desktopStep3 = await page.getByTestId('rebalance-step-3-drawer').boundingBox();

  expect(desktopStep1).not.toBeNull();
  expect(desktopStep2).not.toBeNull();
  expect(desktopStep3).not.toBeNull();
  expect(Math.abs(centerX(desktopStep1) - centerX(desktopStep2))).toBeLessThanOrEqual(1);
  expect(Math.abs(centerX(desktopStep2) - centerX(desktopStep3))).toBeLessThanOrEqual(1);
  expect((desktopStep1?.y ?? 0) < (desktopStep2?.y ?? 0)).toBeTruthy();
  expect((desktopStep2?.y ?? 0) < (desktopStep3?.y ?? 0)).toBeTruthy();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('rebalance-step-3-drawer')).toBeVisible();
  await page.waitForTimeout(350);

  const mobileStep1 = await page.getByTestId('rebalance-step-1-drawer').boundingBox();
  const mobileStep2 = await page.getByTestId('rebalance-step-2-drawer').boundingBox();
  const mobileStep3 = await page.getByTestId('rebalance-step-3-drawer').boundingBox();

  expect(mobileStep1).not.toBeNull();
  expect(mobileStep2).not.toBeNull();
  expect(mobileStep3).not.toBeNull();
  expect(Math.abs(centerX(mobileStep1) - centerX(mobileStep2))).toBeLessThanOrEqual(1);
  expect(Math.abs(centerX(mobileStep2) - centerX(mobileStep3))).toBeLessThanOrEqual(1);
  expect((mobileStep1?.y ?? 0) < (mobileStep2?.y ?? 0)).toBeTruthy();
  expect((mobileStep2?.y ?? 0) < (mobileStep3?.y ?? 0)).toBeTruthy();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByTestId('rebalance-step-3-drawer')).toBeVisible();
  await page.waitForTimeout(350);

  const desktopAgainStep2 = await page.getByTestId('rebalance-step-2-drawer').boundingBox();
  const desktopAgainStep3 = await page.getByTestId('rebalance-step-3-drawer').boundingBox();
  expect((desktopAgainStep2?.y ?? 0) < (desktopAgainStep3?.y ?? 0)).toBeTruthy();
});

test('validates required deposit and target percentages before advancing steps', async ({ page }) => {
  const email = 'ux.rebalance-validation@truew8.com';
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

  await page.getByTestId('portfolio-rebalance-button').click();
  await expect(page.getByTestId('rebalance-step-1-drawer')).toBeVisible();

  await page.getByTestId('rebalance-step-1-continue').click();
  await expect(page.getByText('Preencha o valor do aporte para continuar.')).toBeVisible();
  await expect(page.getByTestId('rebalance-step-1-shadow')).toHaveCount(0);

  await page.getByTestId('rebalance-deposit-input').fill('100');
  await page.getByTestId('rebalance-step-1-continue').click();
  await expect(page.getByTestId('rebalance-step-2-drawer')).toBeVisible();

  await page.getByTestId('rebalance-target-WEGE3').fill('');
  await page.getByTestId('rebalance-step-2-continue').click();
  await expect(page.getByText('Preencha o percentual alvo de todos os ativos.')).toBeVisible();
  await expect(page.getByTestId('rebalance-step-2-shadow')).toHaveCount(0);

  await page.getByTestId('rebalance-target-WEGE3').fill('90');
  await page.getByTestId('rebalance-step-2-continue').click();
  await expect(page.getByText('A soma dos percentuais alvo deve ser exatamente 100%.')).toBeVisible();
  await expect(page.getByTestId('rebalance-step-2-shadow')).toHaveCount(0);
});

test('shows BUY order with quantity for a single-asset 100% target allocation', async ({ page }) => {
  const email = 'ux.rebalance-buy-single@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.goto('/');

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await page.getByTestId('portfolio-add-manual-fab').click();
  await page.getByTestId('manual-ticker').fill('PETR4');
  await page.getByTestId('manual-quantity').fill('10');
  await page.getByTestId('manual-average-price').fill('50');
  await page.getByTestId('manual-brokerage').fill('XP');
  await page.getByTestId('manual-save-button').click();

  await page.getByTestId('portfolio-rebalance-button').click();
  await page.getByTestId('rebalance-deposit-input').fill('100');
  await page.getByTestId('rebalance-step-1-continue').click();
  await page.getByTestId('rebalance-target-PETR4').fill('100');
  await page.getByTestId('rebalance-step-2-continue').click();
  await expect(page.getByTestId('rebalance-step-3-drawer')).toBeVisible();

  await page.getByTestId('rebalance-calculate-button').click();
  await expect(page.getByText('BUY')).toBeVisible();
  await expect(page.getByText('Qtd: 2')).toBeVisible();
});
