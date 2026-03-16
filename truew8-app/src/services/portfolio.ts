import axios from 'axios';

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
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNotImplementedStatus(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 404 || status === 405;
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

function buildPortfolioFallback(holdings: UserHolding[]): PortfolioSummary[] {
  if (holdings.length === 0) {
    return [];
  }

  const totalInvested = holdings.reduce((sum, holding) => sum + holding.quantity * holding.averagePrice, 0);

  return [
    {
      id: 'default',
      name: 'Minha Carteira',
      description: 'Carteira consolidada do investidor',
      holdingsCount: holdings.length,
      totalInvested,
    },
  ];
}

export async function getPortfolios(): Promise<PortfolioSummary[]> {
  try {
    const { data } = await apiClient.get<PortfolioSummary[]>('/portfolio');
    return data;
  } catch (error) {
    if (!isNotImplementedStatus(error)) {
      throw error;
    }
  }

  const { data } = await apiClient.get<any[]>('/portfolio/holdings');
  return buildPortfolioFallback((data ?? []).map(normalizeHolding));
}

export async function getPortfolioHoldings(portfolioId: string): Promise<UserHolding[]> {
  if (portfolioId !== 'default') {
    try {
      const { data } = await apiClient.get<any[]>(`/portfolio/${portfolioId}/holdings`);
      return (data ?? []).map(normalizeHolding);
    } catch (error) {
      if (!isNotImplementedStatus(error)) {
        throw error;
      }
    }
  }

  const { data } = await apiClient.get<any[]>('/portfolio/holdings');
  return (data ?? []).map(normalizeHolding);
}

export async function addHoldingManual(portfolioId: string, input: AddHoldingInput): Promise<UserHolding> {
  const payload = {
    ticker: input.ticker.trim().toUpperCase(),
    brokerage: input.brokerage.trim(),
    quantity: input.quantity,
    averagePrice: input.averagePrice,
  };

  const candidateUrls = portfolioId === 'default'
    ? ['/portfolio/holdings']
    : [`/portfolio/${portfolioId}/holdings`, '/portfolio/holdings'];

  for (const url of candidateUrls) {
    try {
      const { data } = await apiClient.post<any>(url, payload);
      return normalizeHolding(data);
    } catch (error) {
      if (!isNotImplementedStatus(error)) {
        throw error;
      }
    }
  }

  return {
    id: `local-${Date.now()}`,
    portfolioId,
    ticker: payload.ticker,
    brokerage: payload.brokerage,
    quantity: payload.quantity,
    averagePrice: payload.averagePrice,
    isLocked: false,
  };
}
