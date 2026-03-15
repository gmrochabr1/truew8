import React, { createContext, useContext, useMemo, useState } from 'react';

export type PortfolioAsset = {
  id: string;
  ticker: string;
  quantity: number;
  avgPrice: number;
  locked: boolean;
};

type PortfolioContextValue = {
  assets: PortfolioAsset[];
  totalPatrimony: number;
  toggleAssetLock: (assetId: string) => void;
  unlockedAssets: PortfolioAsset[];
};

const initialAssets: PortfolioAsset[] = [
  { id: 'asset-1', ticker: 'PETR4', quantity: 120, avgPrice: 36.8, locked: false },
  { id: 'asset-2', ticker: 'VALE3', quantity: 80, avgPrice: 64.5, locked: false },
  { id: 'asset-3', ticker: 'ITUB4', quantity: 140, avgPrice: 29.2, locked: true },
  { id: 'asset-4', ticker: 'WEGE3', quantity: 45, avgPrice: 42.1, locked: false },
];

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<PortfolioAsset[]>(initialAssets);

  const toggleAssetLock = (assetId: string) => {
    setAssets((previous) =>
      previous.map((asset) => (asset.id === assetId ? { ...asset, locked: !asset.locked } : asset)),
    );
  };

  const totalPatrimony = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.quantity * asset.avgPrice, 0);
  }, [assets]);

  const unlockedAssets = useMemo(() => {
    return assets.filter((asset) => !asset.locked);
  }, [assets]);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      assets,
      totalPatrimony,
      toggleAssetLock,
      unlockedAssets,
    }),
    [assets, totalPatrimony, unlockedAssets],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used inside PortfolioProvider');
  }
  return context;
}
