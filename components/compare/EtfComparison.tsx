"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EtfSummary, HistoricalObservation } from "@/lib/types";

type NumericMetricKey = "peRatio" | "pbRatio" | "return1mPct" | "return3mPct" | "returnYtdPct" | "return1yPct" | "return3yPct" | "return5yPct";
type ComparisonMetric = { key: NumericMetricKey; title: string; suffix: string; isReturn?: boolean };

const metrics: ComparisonMetric[] = [
  { key: "peRatio", title: "P/E", suffix: "×" },
  { key: "pbRatio", title: "P/B", suffix: "×" },
  { key: "return1mPct", title: "1M return", suffix: "%", isReturn: true },
  { key: "return3mPct", title: "3M return", suffix: "%", isReturn: true },
  { key: "returnYtdPct", title: "YTD return", suffix: "%", isReturn: true },
  { key: "return1yPct", title: "1Y return", suffix: "%", isReturn: true },
  { key: "return3yPct", title: "3Y return", suffix: "%", isReturn: true },
  { key: "return5yPct", title: "5Y return", suffix: "%", isReturn: true },
];

const lineColors = ["#197047", "#2463b7", "#b95a15", "#8d3ca6", "#b23b46", "#0f7e91", "#6c6214", "#7b4c37"];

function formatChartDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(new Date(`${date}T00:00:00`));
}

function SmallMetricChart({ etfs, metric }: { etfs: EtfSummary[]; metric: ComparisonMetric }) {
  const data = etfs.map((etf) => ({ symbol: etf.symbol, value: etf[metric.key] }));
  return (
    <section className="mini-chart-card">
      <h2>{metric.title}</h2>
      <div className="mini-chart">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <XAxis dataKey="symbol" tick={{ fill: "#6c7888", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#6c7888", fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
            {metric.isReturn && <ReferenceLine stroke="#b9c6bc" y={0} />}
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}${metric.suffix}`, metric.title]} />
            <Bar dataKey="value" fill="#2c7a55" maxBarSize={32} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function EmptyComparison() {
  return <div className="comparison-empty"><strong>Select at least two ETFs</strong><span>Choose up to eight ETFs to reveal their metrics and common-history performance chart.</span></div>;
}

export function EtfComparison({ etfs, histories }: { etfs: EtfSummary[]; histories: Record<string, HistoricalObservation[]> }) {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(["USP500", "USN100"]);
  const selectedEtfs = etfs.filter((etf) => selectedSymbols.includes(etf.symbol));

  const overlay = useMemo(() => {
    if (selectedEtfs.length < 2) return { data: [], message: "Select at least two ETFs to compare their shared return history." };
    const selectedHistories = selectedEtfs.map((etf) => histories[etf.symbol] ?? []);
    const commonDates = selectedHistories.reduce<string[] | null>((shared, history) => {
      const dates = new Set(history.map((point) => point.date));
      return shared === null ? [...dates] : shared.filter((date) => dates.has(date));
    }, null)?.sort() ?? [];
    if (!commonDates.length) return { data: [], message: "These ETFs have no overlapping history, so a comparison chart cannot be shown." };

    const valueBySymbol = Object.fromEntries(selectedEtfs.map((etf) => [etf.symbol, new Map((histories[etf.symbol] ?? []).map((point) => [point.date, point.totalReturnIndex]))]));
    const baseDate = commonDates[0];
    const data = commonDates.map((date) => {
      const row: Record<string, string | number> = { date, label: formatChartDate(date) };
      for (const etf of selectedEtfs) {
        const series = valueBySymbol[etf.symbol];
        row[etf.symbol] = Number((((series.get(date)! / series.get(baseDate)!) - 1) * 100).toFixed(2));
      }
      return row;
    });
    return { data, message: `Common history: ${baseDate} to ${commonDates.at(-1)} (${commonDates.length} monthly observations). Each series is rebased to 0% at the common start.` };
  }, [histories, selectedEtfs]);

  function toggle(symbol: string) {
    setSelectedSymbols((current) => {
      if (current.includes(symbol)) return current.filter((item) => item !== symbol);
      if (current.length === 8) return current;
      return [...current, symbol];
    });
  }

  return (
    <main className="page-shell comparison-page">
      <Link className="back-link" href="/">← Back to screener</Link>
      <header className="comparison-heading">
        <div><p className="eyebrow">ETF comparison</p><h1>Compare your short list.</h1></div>
        <p>Choose two to eight illustrative ETFs. Returns are total returns, as of 31 Dec 2025.</p>
      </header>

      <section className="selection-card">
        <div className="selection-card-header"><div><p className="section-label">Selection</p><h2>{selectedSymbols.length} of 8 ETFs selected</h2></div><button type="button" className="text-button" onClick={() => setSelectedSymbols([])}>Clear selection</button></div>
        <div className="etf-picker">
          {etfs.map((etf) => {
            const checked = selectedSymbols.includes(etf.symbol);
            const disabled = !checked && selectedSymbols.length === 8;
            return <label className={checked ? "picker-option selected" : "picker-option"} key={etf.symbol}>
              <input checked={checked} disabled={disabled} onChange={() => toggle(etf.symbol)} type="checkbox" />
              <span><strong>{etf.symbol}</strong>{etf.name}</span>
            </label>;
          })}
        </div>
      </section>

      {selectedEtfs.length < 2 ? <EmptyComparison /> : <>
        <section className="mini-chart-grid" aria-label="Comparison metric charts">
          {metrics.map((metric) => <SmallMetricChart etfs={selectedEtfs} key={metric.key} metric={metric} />)}
        </section>
        <section className="comparison-line-card">
          <div className="chart-header"><div><p className="section-label">Historical return</p><h2>Normalized total-return comparison</h2></div></div>
          <p className="common-history-message">{overlay.message}</p>
          {overlay.data.length ? <div className="comparison-line-chart">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={overlay.data} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
                <XAxis dataKey="label" minTickGap={34} tick={{ fill: "#718096", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: "#718096", fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`]} labelFormatter={(_, payload) => payload[0]?.payload.date ?? ""} />
                <Legend />
                {selectedEtfs.map((etf, index) => <Line dataKey={etf.symbol} dot={false} key={etf.symbol} stroke={lineColors[index]} strokeWidth={2.3} type="monotone" />)}
              </LineChart>
            </ResponsiveContainer>
          </div> : null}
        </section>
      </>}
    </main>
  );
}
