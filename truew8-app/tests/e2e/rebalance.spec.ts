import { expect, test } from '@playwright/test';

test('renders rebalance result table after submitting the form', async ({ page }) => {
  await page.route('**/api/v1/rebalance', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orders: [
          {
            action: 'BUY',
            ticker: 'PETR4',
            quantity: 100,
            estimatedValue: 3000,
          },
        ],
      }),
    });
  });

  await page.goto('/');

  await page.getByTestId('input-deposit').fill('1500');
  await page.getByTestId('holding-ticker-0').fill('PETR4');
  await page.getByTestId('holding-quantity-0').fill('100');
  await page.getByTestId('holding-price-0').fill('30');
  await page.getByTestId('target-ticker-0').fill('PETR4');
  await page.getByTestId('target-percentage-0').fill('1');
  await page.getByTestId('target-price-0').fill('30');

  await page.getByTestId('button-submit-rebalance').click();

  await expect(page.getByTestId('rebalance-results-table')).toBeVisible();
  await expect(page.getByText('PETR4')).toBeVisible();
  await expect(page.getByText('COMPRAR')).toBeVisible();
});
