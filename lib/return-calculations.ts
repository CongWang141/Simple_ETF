export type ReturnIndexPoint = { date: string; totalReturnIndex: number };

export function normalizeReturnIndex(points: ReturnIndexPoint[]) {
  const baseIndex = points[0]?.totalReturnIndex;
  if (baseIndex === undefined) return [];
  return points.map((point) => ({
    ...point,
    normalizedReturnPct: Number((((point.totalReturnIndex / baseIndex) - 1) * 100).toFixed(2)),
  }));
}

export type ComparisonOverlay = {
  data: Array<Record<string, string | number>>;
  message: string;
};

export function buildComparisonOverlay(symbols: string[], histories: Record<string, ReturnIndexPoint[]>): ComparisonOverlay {
  if (symbols.length < 2) return { data: [], message: "Select at least two ETFs to compare their shared return history." };
  const commonDates = symbols.reduce<string[] | null>((shared, symbol) => {
    const dates = new Set((histories[symbol] ?? []).map((point) => point.date));
    return shared === null ? [...dates] : shared.filter((date) => dates.has(date));
  }, null)?.sort() ?? [];
  if (!commonDates.length) return { data: [], message: "These ETFs have no overlapping history, so a comparison chart cannot be shown." };

  const values = Object.fromEntries(symbols.map((symbol) => [symbol, new Map((histories[symbol] ?? []).map((point) => [point.date, point.totalReturnIndex]))]));
  const baseDate = commonDates[0];
  const data = commonDates.map((date) => {
    const row: Record<string, string | number> = { date };
    for (const symbol of symbols) {
      const series = values[symbol];
      row[symbol] = Number((((series.get(date)! / series.get(baseDate)!) - 1) * 100).toFixed(2));
    }
    return row;
  });
  return { data, message: `Common history: ${baseDate} to ${commonDates.at(-1)} (${commonDates.length} monthly observations). Each series is rebased to 0% at the common start.` };
}
