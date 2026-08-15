export type Etf = { symbol: string; name: string; trackingIndex: string; market: string; issuer: string; assetClass: string; region: string; currency: string; domicile: string; inceptionDate: string; ter: number; fundSizeMillionUsd: number; distributionPolicy: string; replicationMethod: string; benchmarkName: string };
export type EtfMetrics = { asOfDate: string; peRatio: number; pbRatio: number; return1mPct: number; return3mPct: number; return6mPct: number; returnYtdPct: number; return1yPct: number; return3yPct: number; return5yPct: number; returnSinceInceptionPct: number };
export type EtfSummary = Etf & EtfMetrics;
export type EtfFilters = { market?: string; region?: string; issuer?: string; currency?: string; distributionPolicy?: string; maxTer?: number };
export type HistoricalObservation = { date: string; closePrice: number; currency: string; monthlyPriceReturnPct: number; monthlyTotalReturnPct: number; totalReturnIndex: number; cumulativeTotalReturnPct: number };
