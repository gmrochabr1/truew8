import type { Page } from '@playwright/test';

const sessionKey = 'truew8.session';
const testVaultKeyBase64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

export const seedApiRoutes = async (page: Page) => {
  const portfolios: Array<{
    id: string;
    name: string;
    description: string | null;
    holdingsCount: number;
    totalInvested: number;
  }> = [
    {
      id: 'portfolio-1',
      name: 'Principal',
      description: 'Carteira principal',
      holdingsCount: 0,
      totalInvested: 0,
    },
  ];

  await page.route('**/portfolio', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(portfolios),
      });
      return;
    }

    if (method === 'POST') {
      const payload = route.request().postDataJSON() as { name?: string };
      const nextId = `portfolio-${portfolios.length + 1}`;
      const created = {
        id: nextId,
        name: payload?.name?.trim() ? payload.name.trim() : `Nova carteira ${portfolios.length + 1}`,
        description: null,
        holdingsCount: 0,
        totalInvested: 0,
      };
      portfolios.push(created);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/portfolio/*', async (route) => {
    const method = route.request().method();
    const requestUrl = route.request().url();
    const portfolioId = requestUrl.split('/portfolio/')[1]?.split('/')[0] ?? '';

    if (method === 'DELETE') {
      const index = portfolios.findIndex((item) => item.id === portfolioId);
      if (index === -1) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Portfolio not found' }),
        });
        return;
      }

      portfolios.splice(index, 1);
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (method === 'PATCH') {
      const payload = route.request().postDataJSON() as { name?: string; description?: string | null };
      const portfolio = portfolios.find((item) => item.id === portfolioId);

      if (!portfolio) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Portfolio not found' }),
        });
        return;
      }

      if (typeof payload?.name === 'string' && payload.name.trim()) {
        portfolio.name = payload.name.trim();
      }
      if (payload?.description !== undefined) {
        portfolio.description = payload.description ? String(payload.description) : null;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(portfolio),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/portfolio/*/holdings', async (route) => {
    const method = route.request().method();
    const requestUrl = route.request().url();
    const portfolioId = requestUrl.split('/portfolio/')[1]?.split('/')[0] ?? '';

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
          portfolioId,
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

  await page.route('**/preferences/locale', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          selectedLocale: 'pt-BR',
          effectiveLocale: 'pt-BR',
          availableLocales: ['pt-BR', 'en-US'],
        }),
      });
      return;
    }

    if (method === 'PUT') {
      const payload = route.request().postDataJSON() as { locale?: string };
      const locale = payload?.locale === 'en-US' ? 'en-US' : 'pt-BR';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          selectedLocale: locale,
          effectiveLocale: locale,
          availableLocales: ['pt-BR', 'en-US'],
        }),
      });
      return;
    }

    await route.continue();
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
