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
