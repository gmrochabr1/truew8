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

  const holdingsByPortfolio = new Map<string, Array<{
    id: string;
    portfolioId: string;
    ticker: string;
    brokerage: string;
    quantity: string;
    averagePrice: string;
    isLocked: boolean;
  }>>();

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
      const holdings = holdingsByPortfolio.get(portfolioId) ?? [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(holdings),
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
      const createdHolding = {
        id: `holding-${(holdingsByPortfolio.get(portfolioId)?.length ?? 0) + 1}`,
        portfolioId,
        ticker: String(payload.ticker ?? ''),
        brokerage: String(payload.brokerage ?? ''),
        quantity: String(payload.quantity ?? ''),
        averagePrice: String(payload.averagePrice ?? ''),
        isLocked: false,
      };

      const current = holdingsByPortfolio.get(portfolioId) ?? [];
      holdingsByPortfolio.set(portfolioId, [...current, createdHolding]);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createdHolding),
      });
      return;
    }

    await route.continue();
  });

  await page.route('**/rebalance', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const payload = route.request().postDataJSON() as {
      newDeposit?: number;
      currentHoldings?: Array<{ ticker?: string; quantity?: number; price?: number; brokerage?: string | null }>;
      targetPortfolio?: Array<{ ticker?: string; percentage?: number; price?: number; brokerage?: string | null }>;
    };

    const deposit = Number(payload?.newDeposit ?? 0);
    const currentHoldings = payload?.currentHoldings ?? [];
    const targetPortfolio = payload?.targetPortfolio ?? [];

    const currentByTicker = new Map<string, { quantity: number; price: number; brokerage?: string | null }>();
    currentHoldings.forEach((holding) => {
      const ticker = String(holding.ticker ?? '').toUpperCase().trim();
      if (!ticker) {
        return;
      }
      currentByTicker.set(ticker, {
        quantity: Number(holding.quantity ?? 0),
        price: Number(holding.price ?? 0),
        brokerage: holding.brokerage ?? null,
      });
    });

    const currentTotal = currentHoldings.reduce((sum, holding) => {
      return sum + Number(holding.quantity ?? 0) * Number(holding.price ?? 0);
    }, 0);
    const totalPortfolio = currentTotal + deposit;

    const orders = targetPortfolio.map((allocation) => {
      const ticker = String(allocation.ticker ?? '').toUpperCase().trim();
      const percentage = Number(allocation.percentage ?? 0);
      const price = Number(allocation.price ?? 0);
      const current = currentByTicker.get(ticker);
      const currentValue = current ? current.quantity * current.price : 0;
      const targetValue = totalPortfolio * percentage;
      const diffValue = targetValue - currentValue;

      if (Math.abs(diffValue) < 0.01 || price <= 0) {
        return {
          action: 'HOLD',
          ticker,
          quantity: 0,
          estimatedValue: 0,
          brokerage: allocation.brokerage ?? current?.brokerage ?? null,
        };
      }

      const quantity = Math.floor(Math.abs(diffValue) / price);
      if (quantity <= 0) {
        return {
          action: 'HOLD',
          ticker,
          quantity: 0,
          estimatedValue: 0,
          brokerage: allocation.brokerage ?? current?.brokerage ?? null,
        };
      }

      return {
        action: diffValue > 0 ? 'BUY' : 'SELL',
        ticker,
        quantity,
        estimatedValue: Number((quantity * price).toFixed(2)),
        brokerage: allocation.brokerage ?? current?.brokerage ?? null,
      };
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ orders }),
    });
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

  let customization = {
    baseCurrency: 'BRL',
    toleranceValue: 10,
    allowSells: true,
    theme: 'LIGHT',
    availableBaseCurrencies: ['BRL', 'USD'],
    availableThemes: ['LIGHT', 'DARK'],
  };

  await page.route('**/preferences/customization', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(customization),
      });
      return;
    }

    if (method === 'PUT') {
      const payload = route.request().postDataJSON() as {
        baseCurrency?: string;
        toleranceValue?: number;
        allowSells?: boolean;
        theme?: string;
      };

      customization = {
        ...customization,
        baseCurrency: payload.baseCurrency === 'USD' ? 'USD' : 'BRL',
        toleranceValue: Number.isFinite(payload.toleranceValue) ? Number(payload.toleranceValue) : customization.toleranceValue,
        allowSells: typeof payload.allowSells === 'boolean' ? payload.allowSells : customization.allowSells,
        theme: payload.theme === 'DARK' ? 'DARK' : 'LIGHT',
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(customization),
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
