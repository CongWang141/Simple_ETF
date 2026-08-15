export type Etf = { symbol: string; name: string; trackingIndex: string; market: string; country: string; issuer: string; assetClass: string; region: string; industry: string | null; strategy: string | null; currency: string; domicile: string; inceptionDate: string; ter: number; fundSizeMillionUsd: number; distributionPolicy: string; replicationMethod: string; benchmarkName: string };
export type EtfMetrics = { asOfDate: string; peRatio: number | null; pbRatio: number | null; return1mPct: number; return3mPct: number; return6mPct: number; returnYtdPct: number; return1yPct: number; return3yPct: number; return5yPct: number; returnSinceInceptionPct: number };
export type EtfSummary = Etf & EtfMetrics;
export type EtfFilters = { assetClass?: string; region?: string; country?: string; industry?: string; strategy?: string; distributionPolicy?: string };
export type HistoricalObservation = { date: string; closePrice: number; currency: string; monthlyPriceReturnPct: number; monthlyTotalReturnPct: number; totalReturnIndex: number; cumulativeTotalReturnPct: number };
export type HistoricalValuationObservation = { date: string; peRatio: number; pbRatio: number };
