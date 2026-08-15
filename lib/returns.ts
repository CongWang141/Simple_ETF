import "server-only";
import { db } from "@/lib/db";

export type NormalizedReturnPoint = {
  symbol: string;
  date: string;
  totalReturnIndex: number;
  normalizedReturnPct: number;
};

/** Returns chart-ready total-return data rebased to 100 at the selected start date. */
export function getNormalizedReturnSeries(symbols: string[]): NormalizedReturnPoint[] {
  if (!symbols.length) return [];
  const placeholders = symbols.map(() => "?").join(", ");
  return db.prepare(`
    WITH selected_history AS (
      SELECT e.symbol, r.date, r.total_return_index AS totalReturnIndex,
        FIRST_VALUE(r.total_return_index) OVER (PARTITION BY e.symbol ORDER BY r.date) AS startingIndex
      FROM return_history r
      JOIN etfs e ON e.id = r.etf_id
      WHERE e.symbol IN (${placeholders})
    )
    SELECT symbol, date, totalReturnIndex,
      ROUND((totalReturnIndex / startingIndex - 1) * 100, 4) AS normalizedReturnPct
    FROM selected_history
    ORDER BY date, symbol
  `).all(...symbols) as NormalizedReturnPoint[];
}
