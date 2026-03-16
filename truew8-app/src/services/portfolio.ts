import { apiClient } from '@/src/services/api';

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

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHolding(payload: any): UserHolding {
  return {
    id: String(payload.id),
    portfolioId: payload.portfolioId ? String(payload.portfolioId) : null,
    ticker: String(payload.ticker ?? ''),
    brokerage: String(payload.brokerage ?? 'Sem corretora'),
    market: payload.market ? String(payload.market) : undefined,
    assetType: payload.assetType ? String(payload.assetType) : undefined,
    quantity: toNumber(payload.quantity),
    averagePrice: toNumber(payload.averagePrice),
    isLocked: Boolean(payload.isLocked),
  };
}

export async function getPortfolios(): Promise<PortfolioSummary[]> {
  const { data } = await apiClient.get<PortfolioSummary[]>('/portfolio');
  return data;
}

export async function createPortfolio(input: CreatePortfolioInput = {}): Promise<PortfolioSummary> {
  const { data } = await apiClient.post<PortfolioSummary>('/portfolio', {
    name: input.name,
    description: input.description,
  });
  return data;
}

export async function getPortfolioHoldings(portfolioId: string): Promise<UserHolding[]> {
  const { data } = await apiClient.get<any[]>(`/portfolio/${portfolioId}/holdings`);
  return (data ?? []).map(normalizeHolding);
}

export async function addHoldingManual(portfolioId: string, input: AddHoldingInput): Promise<UserHolding> {
  const payload = {
    ticker: input.ticker.trim().toUpperCase(),
    brokerage: input.brokerage.trim(),
    quantity: input.quantity,
    averagePrice: input.averagePrice,
    market: input.market,
    assetType: input.assetType,
  };

  const { data } = await apiClient.post<any>(`/portfolio/${portfolioId}/holdings`, payload);
  return normalizeHolding(data);
}
