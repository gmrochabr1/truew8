import { apiClient } from '@/src/services/api';

export type RebalanceHolding = {
  ticker: string;
  quantity: number;
  price: number;
};

export type RebalanceAllocation = {
  ticker: string;
  percentage: number;
  price: number;
};

export type RebalanceRequest = {
  newDeposit: number;
  currentHoldings?: RebalanceHolding[];
  targetPortfolio: RebalanceAllocation[];
};

export type RebalanceOrder = {
  action: 'BUY' | 'SELL' | 'HOLD';
  ticker: string;
  quantity: number;
  estimatedValue: number;
  brokerage?: string | null;
};

export type RebalanceResponse = {
  orders: RebalanceOrder[];
};

export async function calculateRebalance(payload: RebalanceRequest): Promise<RebalanceResponse> {
  const { data } = await apiClient.post<RebalanceResponse>('/rebalance', payload);
  return data;
}
