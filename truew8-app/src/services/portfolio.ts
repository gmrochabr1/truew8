import { apiClient } from '@/src/services/api';
import { decryptVaultValue, encryptVaultValue } from '@/src/services/cryptoService';

let vaultKeyGetter: () => string | null = () => null;

export function setPortfolioVaultKeyGetter(getter: () => string | null): void {
  vaultKeyGetter = getter;
}

type HoldingCipherDTO = {
  id: string;
  portfolioId?: string | null;
  ticker: string;
  brokerage: string;
  market?: string;
  assetType?: string;
  quantity: string;
  averagePrice: string;
  isLocked: boolean;
};

export type UserHolding = {
  id: string;
  portfolioId?: string | null;
  ticker: string;
  brokerage: string;
  market?: string;
  assetType?: string;
  quantity: number;
  averagePrice: number;
  isLocked: boolean;
};

export type PortfolioSummary = {
  id: string;
  name: string;
  description?: string | null;
  holdingsCount: number;
  totalInvested: number;
};

export type AddHoldingInput = {
  ticker: string;
  brokerage: string;
  quantity: number;
  averagePrice: number;
  market?: 'B3' | 'NYSE' | 'NASDAQ' | 'TSX' | 'LSE' | 'EURONEXT' | 'XETRA' | 'TSE' | 'HKEX' | 'ASX' | 'CRYPTO' | 'FOREX';
  assetType?: 'STOCK' | 'FII' | 'CRYPTO' | 'FIXED_INCOME';
};

export type CreatePortfolioInput = {
  name?: string;
  description?: string;
};

export type UpdatePortfolioInput = {
  name?: string;
  description?: string;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return 0;
  }

  const sanitized = raw.replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
  if (!sanitized) {
    return 0;
  }

  const hasComma = sanitized.includes(',');
  const hasDot = sanitized.includes('.');
  let normalized = sanitized;

  if (hasComma && hasDot) {
    const lastComma = sanitized.lastIndexOf(',');
    const lastDot = sanitized.lastIndexOf('.');
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';

    normalized = sanitized
      .replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.');
  } else if (hasComma) {
    normalized = sanitized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = sanitized.replace(/,/g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function normalizeHolding(payload: HoldingCipherDTO): Promise<UserHolding> {
  const rawKey = vaultKeyGetter();
  if (!rawKey) {
    throw new Error('Cofre bloqueado. Desbloqueie o PIN para acessar holdings.');
  }

  const [ticker, brokerage, quantityRaw, averagePriceRaw] = await Promise.all([
    decryptVaultValue(String(payload.ticker ?? ''), rawKey),
    decryptVaultValue(String(payload.brokerage ?? ''), rawKey),
    decryptVaultValue(String(payload.quantity ?? ''), rawKey),
    decryptVaultValue(String(payload.averagePrice ?? ''), rawKey),
  ]);

  return {
    id: String(payload.id),
    portfolioId: payload.portfolioId ? String(payload.portfolioId) : null,
    ticker: String(ticker ?? ''),
    brokerage: String(brokerage ?? 'Sem corretora'),
    market: payload.market ? String(payload.market) : undefined,
    assetType: payload.assetType ? String(payload.assetType) : undefined,
    quantity: toNumber(quantityRaw),
    averagePrice: toNumber(averagePriceRaw),
    isLocked: Boolean(payload.isLocked),
  };
}

export async function getPortfolios(): Promise<PortfolioSummary[]> {
  const { data } = await apiClient.get<PortfolioSummary[]>('/portfolio');
  const normalized = (data ?? []).map((item) => ({
    id: String(item.id),
    name: String(item.name ?? ''),
    description: item.description ?? null,
    holdingsCount: toNumber(item.holdingsCount),
    totalInvested: toNumber(item.totalInvested),
  }));

  const enriched = await Promise.all(
    normalized.map(async (portfolio) => {
      try {
        const holdings = await getPortfolioHoldings(portfolio.id);
        const totalInvested = holdings.reduce((sum, holding) => sum + holding.quantity * holding.averagePrice, 0);
        return {
          ...portfolio,
          holdingsCount: holdings.length,
          totalInvested,
        };
      } catch {
        // Keep API fallback values if holdings fetch/decrypt fails for this portfolio.
        return portfolio;
      }
    }),
  );

  return enriched;
}

export async function createPortfolio(input: CreatePortfolioInput = {}): Promise<PortfolioSummary> {
  const { data } = await apiClient.post<PortfolioSummary>('/portfolio', {
    name: input.name,
    description: input.description,
  });
  return data;
}

export async function updatePortfolio(portfolioId: string, input: UpdatePortfolioInput): Promise<PortfolioSummary> {
  const { data } = await apiClient.patch<PortfolioSummary>(`/portfolio/${portfolioId}`, {
    name: input.name,
    description: input.description,
  });
  return data;
}

export async function deletePortfolio(portfolioId: string): Promise<void> {
  await apiClient.delete(`/portfolio/${portfolioId}`);
}

export async function getPortfolioHoldings(portfolioId: string): Promise<UserHolding[]> {
  const { data } = await apiClient.get<HoldingCipherDTO[]>(`/portfolio/${portfolioId}/holdings`);
  const normalized = await Promise.all((data ?? []).map(normalizeHolding));
  return normalized;
}

export async function addHoldingManual(portfolioId: string, input: AddHoldingInput): Promise<UserHolding> {
  const rawKey = vaultKeyGetter();
  if (!rawKey) {
    throw new Error('Cofre bloqueado. Desbloqueie o PIN para adicionar ativos.');
  }

  const normalizedTicker = input.ticker.trim().toUpperCase();
  const normalizedBrokerage = input.brokerage.trim();

  const [tickerCipher, brokerageCipher, quantityCipher, averagePriceCipher] = await Promise.all([
    encryptVaultValue(normalizedTicker, rawKey),
    encryptVaultValue(normalizedBrokerage, rawKey),
    encryptVaultValue(String(input.quantity), rawKey),
    encryptVaultValue(String(input.averagePrice), rawKey),
  ]);

  const payload: Omit<HoldingCipherDTO, 'id' | 'portfolioId' | 'isLocked'> & { market?: AddHoldingInput['market']; assetType?: AddHoldingInput['assetType'] } = {
    ticker: tickerCipher,
    brokerage: brokerageCipher,
    quantity: quantityCipher,
    averagePrice: averagePriceCipher,
    market: input.market,
    assetType: input.assetType,
  };

  const { data } = await apiClient.post<HoldingCipherDTO>(`/portfolio/${portfolioId}/holdings`, payload);
  return normalizeHolding(data);
}
