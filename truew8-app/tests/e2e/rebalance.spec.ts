import { expect, test } from '@playwright/test';
import { authenticate, seedApiRoutes } from './helpers/bootstrap';

test('keeps cascading flow stable across desktop and mobile directions', async ({ page }) => {
  const email = 'ux.cascade@truew8.com';
  await seedApiRoutes(page);
  await authenticate(page, email);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByTestId('portfolio-card-portfolio-1').click();
  await page.getByTestId('portfolio-rebalance-button').click();
  await expect(page.getByTestId('rebalance-step-1-drawer')).toBeVisible();
  await page.waitForTimeout(450);

  await page.getByTestId('rebalance-step-1-continue').press('Enter');
  await expect(page.getByTestId('rebalance-step-2-drawer')).toBeVisible();
  await page.waitForTimeout(300);
  await page.getByTestId('rebalance-step-2-continue').press('Enter');
  await expect(page.getByTestId('rebalance-step-3-drawer')).toBeVisible();
  await page.waitForTimeout(300);

  const desktopStep1 = await page.getByTestId('rebalance-step-1-drawer').boundingBox();
  const desktopStep2 = await page.getByTestId('rebalance-step-2-drawer').boundingBox();
  const desktopStep3 = await page.getByTestId('rebalance-step-3-drawer').boundingBox();

  expect(desktopStep1).not.toBeNull();
  expect(desktopStep2).not.toBeNull();
  expect(desktopStep3).not.toBeNull();
  expect((desktopStep1?.x ?? 0) < (desktopStep2?.x ?? 0)).toBeTruthy();
  expect((desktopStep2?.x ?? 0) < (desktopStep3?.x ?? 0)).toBeTruthy();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('rebalance-step-3-drawer')).toBeVisible();
  await page.waitForTimeout(350);

  const mobileStep1 = await page.getByTestId('rebalance-step-1-drawer').boundingBox();
  const mobileStep2 = await page.getByTestId('rebalance-step-2-drawer').boundingBox();
  const mobileStep3 = await page.getByTestId('rebalance-step-3-drawer').boundingBox();

  expect(mobileStep1).not.toBeNull();
  expect(mobileStep2).not.toBeNull();
  expect(mobileStep3).not.toBeNull();
  expect((mobileStep1?.y ?? 0) < (mobileStep2?.y ?? 0)).toBeTruthy();
  expect((mobileStep2?.y ?? 0) < (mobileStep3?.y ?? 0)).toBeTruthy();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByTestId('rebalance-step-3-drawer')).toBeVisible();
  await page.waitForTimeout(350);

  const desktopAgainStep2 = await page.getByTestId('rebalance-step-2-drawer').boundingBox();
  const desktopAgainStep3 = await page.getByTestId('rebalance-step-3-drawer').boundingBox();
  expect((desktopAgainStep2?.x ?? 0) < (desktopAgainStep3?.x ?? 0)).toBeTruthy();
});
