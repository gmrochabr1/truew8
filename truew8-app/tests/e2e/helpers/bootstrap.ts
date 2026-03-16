import type { Page } from '@playwright/test';

const sessionKey = 'truew8.session';
const testVaultKeyBase64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export const seedApiRoutes = async (page: Page) => {
  await page.route('**/portfolio', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'portfolio-1',
            name: 'Principal',
            description: 'Carteira principal',
            holdingsCount: 0,
            totalInvested: 0,
          },
        ]),
      });
      return;
    }

    if (method === 'POST') {
      const payload = route.request().postDataJSON() as { name?: string };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'portfolio-2',
          name: payload?.name ?? 'Nova carteira',
          description: null,
          holdingsCount: 0,
          totalInvested: 0,
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/portfolio/portfolio-1/holdings', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (method === 'POST') {
      const payload = route.request().postDataJSON() as {
        ticker?: string;
        brokerage?: string;
        quantity?: string;
        averagePrice?: string;
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'holding-1',
          portfolioId: 'portfolio-1',
          ticker: payload.ticker,
          brokerage: payload.brokerage,
          quantity: payload.quantity,
          averagePrice: payload.averagePrice,
          isLocked: false,
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/portfolio/portfolio-2/holdings', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
};

export const authenticate = async (page: Page, email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const profileKey = `truew8.vault.profile.${encodeURIComponent(normalizedEmail)}`;
  const persistedKey = `truew8.vault.key.${encodeURIComponent(normalizedEmail)}`;

  await page.addInitScript(
    ({ key, sessionEmail, vaultProfileKey, vaultPersistedKey, vaultKeyBase64 }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          token: 'mock-token',
          email: sessionEmail,
        }),
      );

      window.localStorage.setItem(
        vaultProfileKey,
        JSON.stringify({
          version: 1,
          hasVault: true,
          rememberPin: true,
          biometricEnabled: false,
        }),
      );

      window.localStorage.setItem(
        vaultPersistedKey,
        JSON.stringify({
          version: 1,
          keyBase64: vaultKeyBase64,
        }),
      );
    },
    {
      key: sessionKey,
      sessionEmail: normalizedEmail,
      vaultProfileKey: profileKey,
      vaultPersistedKey: persistedKey,
      vaultKeyBase64: testVaultKeyBase64,
    },
  );
};

export const authenticateSessionOnly = async (page: Page, email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
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
    { key: sessionKey, sessionEmail: normalizedEmail },
  );
};

export const vaultStorageKeys = (email: string) => {
  const normalized = email.trim().toLowerCase();
  return {
    profile: `truew8.vault.profile.${encodeURIComponent(normalized)}`,
    key: `truew8.vault.key.${encodeURIComponent(normalized)}`,
  };
};
