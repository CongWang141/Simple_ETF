import "server-only";
import { db } from "@/lib/db";
import type { EtfFilters, EtfSummary, HistoricalObservation, HistoricalValuationObservation } from "@/lib/types";

const summarySelect = `SELECT e.symbol, e.name, e.tracking_index AS trackingIndex, e.market, e.issuer, e.asset_class AS assetClass, e.region, e.currency, e.domicile, e.inception_date AS inceptionDate, e.ter, e.fund_size_million_usd AS fundSizeMillionUsd, e.distribution_policy AS distributionPolicy, e.replication_method AS replicationMethod, e.benchmark_name AS benchmarkName, m.as_of_date AS asOfDate, m.pe_ratio AS peRatio, m.pb_ratio AS pbRatio, m.return_1m_pct AS return1mPct, m.return_3m_pct AS return3mPct, m.return_6m_pct AS return6mPct, m.return_ytd_pct AS returnYtdPct, m.return_1y_pct AS return1yPct, m.return_3y_pct AS return3yPct, m.return_5y_pct AS return5yPct, m.return_since_inception_pct AS returnSinceInceptionPct FROM etfs e JOIN etf_metrics m ON m.etf_id = e.id`;

export function listEtfs(filters: EtfFilters = {}): EtfSummary[] {
  const conditions: string[] = [];
  const parameters: unknown[] = [];
  const filtersToColumns: Array<[keyof EtfFilters, string]> = [["market", "e.market"], ["region", "e.region"], ["issuer", "e.issuer"], ["currency", "e.currency"], ["distributionPolicy", "e.distribution_policy"]];
  for (const [key, column] of filtersToColumns) {
    const value = filters[key];
    if (value !== undefined) { conditions.push(`${column} = ?`); parameters.push(value); }
  }
  if (filters.maxTer !== undefined) { conditions.push("e.ter <= ?"); parameters.push(filters.maxTer); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return db.prepare(`${summarySelect} ${where} ORDER BY e.symbol`).all(...parameters) as EtfSummary[];
}

export function getEtfBySymbol(symbol: string): EtfSummary | undefined {
  return db.prepare(`${summarySelect} WHERE e.symbol = ?`).get(symbol) as EtfSummary | undefined;
}

export function getEtfsBySymbols(symbols: string[]): EtfSummary[] {
  if (!symbols.length) return [];
  return db.prepare(`${summarySelect} WHERE e.symbol IN (${symbols.map(() => "?").join(", ")}) ORDER BY e.symbol`).all(...symbols) as EtfSummary[];
}

export function getHistoricalObservations(symbol: string): HistoricalObservation[] {
  return db.prepare(`SELECT p.date, p.close_price AS closePrice, p.currency, r.monthly_price_return_pct AS monthlyPriceReturnPct, r.monthly_total_return_pct AS monthlyTotalReturnPct, r.total_return_index AS totalReturnIndex, r.cumulative_total_return_pct AS cumulativeTotalReturnPct FROM etfs e JOIN price_history p ON p.etf_id = e.id JOIN return_history r ON r.etf_id = e.id AND r.date = p.date WHERE e.symbol = ? ORDER BY p.date`).all(symbol) as HistoricalObservation[];
}

export function getHistoricalValuations(symbol: string): HistoricalValuationObservation[] {
  return db.prepare(`SELECT v.date, v.pe_ratio AS peRatio, v.pb_ratio AS pbRatio FROM valuation_history v JOIN etfs e ON e.id = v.etf_id WHERE e.symbol = ? ORDER BY v.date`).all(symbol) as HistoricalValuationObservation[];
}
