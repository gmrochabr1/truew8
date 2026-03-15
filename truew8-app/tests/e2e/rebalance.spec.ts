import { expect, test } from '@playwright/test';

test('registers and logs in a new user then shows email on dashboard', async ({ page }) => {
  const email = 'new.user@truew8.com';

  await page.route('**/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'register-token',
        email,
      }),
    });
  });

  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'login-token',
        email,
      }),
    });
  });

  await page.goto('/register');

  await page.getByTestId('register-email-input').fill(email);
  await page.getByTestId('register-password-input').fill('StrongPass123!');
  await page.getByTestId('register-submit-button').click();

  await expect(page.getByTestId('dashboard-user-email')).toContainText(email);

  await page.getByTestId('button-logout').click();

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill('StrongPass123!');
  await page.getByTestId('login-submit-button').click();

  await expect(page.getByTestId('dashboard-user-email')).toContainText(email);
});
