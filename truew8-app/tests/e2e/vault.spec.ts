import { expect, test } from '@playwright/test';

import {
  authenticateSessionOnly,
  seedApiRoutes,
  vaultStorageKeys,
} from './helpers/bootstrap';

test('shows vault creation barrier and unlocks app after valid PIN creation', async ({ page }) => {
  const email = 'ux.vault-create@truew8.com';
  await seedApiRoutes(page);
  await authenticateSessionOnly(page, email);

  await page.goto('/');

  await expect(page.getByText('Configurar Cofre')).toBeVisible();
  await expect(page.getByText('Seus dados financeiros sao criptografados no seu dispositivo.')).toBeVisible();

  await page.getByTestId('vault-pin-input').fill('123456');
  await page.getByTestId('vault-pin-confirm-input').fill('123450');
  await page.getByTestId('vault-submit-button').click();
  await expect(page.getByText('A confirmacao do PIN nao confere.')).toBeVisible();

  await page.getByTestId('vault-pin-confirm-input').fill('123456');
  await page.getByTestId('vault-submit-button').click();
  await expect(page.getByTestId('dashboard-header-logout')).toBeVisible();
});

test('does not persist vault key when remember toggle is disabled', async ({ page }) => {
  const email = 'ux.vault-volatile@truew8.com';
  const keys = vaultStorageKeys(email);

  await seedApiRoutes(page);
  await authenticateSessionOnly(page, email);

  await page.goto('/');
  await expect(page.getByText('Configurar Cofre')).toBeVisible();

  await page.getByTestId('vault-pin-input').fill('123456');
  await page.getByTestId('vault-pin-confirm-input').fill('123456');
  await page.getByTestId('vault-submit-button').click();
  await expect(page.getByTestId('dashboard-header-logout')).toBeVisible();

  const persisted = await page.evaluate(({ profileKey, secretKey }) => {
    return {
      profileRaw: window.localStorage.getItem(profileKey),
      keyRaw: window.localStorage.getItem(secretKey),
    };
  }, { profileKey: keys.profile, secretKey: keys.key });

  expect(persisted.profileRaw).not.toBeNull();
  expect(persisted.keyRaw).toBeNull();

  const profile = JSON.parse(persisted.profileRaw ?? '{}') as { rememberPin?: boolean };
  expect(profile.rememberPin).toBeFalsy();
});

test('persists vault key when remember toggle is enabled', async ({ page }) => {
  const email = 'ux.vault-persist@truew8.com';
  const keys = vaultStorageKeys(email);

  await seedApiRoutes(page);
  await authenticateSessionOnly(page, email);

  await page.goto('/');
  await expect(page.getByText('Configurar Cofre')).toBeVisible();

  await page.getByTestId('vault-remember-switch').click();
  await page.getByTestId('vault-pin-input').fill('123456');
  await page.getByTestId('vault-pin-confirm-input').fill('123456');
  await page.getByTestId('vault-submit-button').click();
  await expect(page.getByTestId('dashboard-header-logout')).toBeVisible();

  const persisted = await page.evaluate(({ profileKey, secretKey }) => {
    return {
      profileRaw: window.localStorage.getItem(profileKey),
      keyRaw: window.localStorage.getItem(secretKey),
    };
  }, { profileKey: keys.profile, secretKey: keys.key });

  expect(persisted.profileRaw).not.toBeNull();
  expect(persisted.keyRaw).not.toBeNull();

  const profile = JSON.parse(persisted.profileRaw ?? '{}') as {
    rememberPin?: boolean;
    keyFingerprint?: string;
  };

  expect(profile.rememberPin).toBeTruthy();
  expect(typeof profile.keyFingerprint).toBe('string');
});

test('requires login before showing vault setup after registration', async ({ page }) => {
  const email = 'ux.register-login-first@truew8.com';
  await seedApiRoutes(page);

  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'unauthorized' }),
    });
  });

  await page.route('**/auth/register', async (route) => {
    const payload = route.request().postDataJSON() as { email?: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        email: payload.email ?? email,
        token: 'register-token',
      }),
    });
  });

  await page.route('**/auth/logout', async (route) => {
    await route.fulfill({
      status: 204,
      contentType: 'application/json',
      body: '',
    });
  });

  await page.route('**/auth/login', async (route) => {
    const payload = route.request().postDataJSON() as { email?: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        email: payload.email ?? email,
        token: 'login-token',
      }),
    });
  });

  await page.goto('/register');

  await page.getByTestId('register-email-input').fill(email);
  await page.getByTestId('register-password-input').fill('SenhaForte123');
  await page.getByTestId('register-submit-button').click();

  await expect(page.getByTestId('login-submit-button')).toBeVisible();
  await expect(page.getByText('Configurar Cofre')).toHaveCount(0);

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill('SenhaForte123');
  await page.getByTestId('login-submit-button').click();

  await expect(page.getByText('Configurar Cofre')).toBeVisible();
});
