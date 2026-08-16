"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Bar, BarChart, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildComparisonOverlay, findVerticallyClosestSeries } from "@/lib/return-calculations";
import type { EtfSummary, HistoricalObservation, HistoricalValuationObservation } from "@/lib/types";

type NumericMetricKey = "peRatio" | "ter" | "fundSizeMillionUsd" | "return1mPct" | "returnYtdPct" | "return1yPct" | "return3yPct" | "return5yPct";
type ComparisonMetric = { key: NumericMetricKey; title: string; suffix: string; isReturn?: boolean };
type ChartMetric = "return" | "price" | "pe" | "pb";

const metrics: ComparisonMetric[] = [
  { key: "peRatio", title: "P/E", suffix: "×" },
  { key: "ter", title: "TER", suffix: "%" },
  { key: "fundSizeMillionUsd", title: "Fund size", suffix: "m USD" },
  { key: "return1mPct", title: "1M return", suffix: "%", isReturn: true },
  { key: "returnYtdPct", title: "YTD return", suffix: "%", isReturn: true },
  { key: "return1yPct", title: "1Y return", suffix: "%", isReturn: true },
  { key: "return3yPct", title: "3Y return", suffix: "%", isReturn: true },
  { key: "return5yPct", title: "5Y return", suffix: "%", isReturn: true },
];

const lineColors = ["#197047", "#2463b7", "#b95a15", "#8d3ca6", "#b23b46", "#0f7e91", "#6c6214", "#7b4c37"];
const chartDetails: Record<ChartMetric, { label: string; colour: string }> = {
  return: { label: "Cumulative Return", colour: "#197047" },
  price: { label: "Price", colour: "#2463b7" },
  pe: { label: "P/E", colour: "#b95a15" },
  pb: { label: "P/B", colour: "#8d3ca6" },
};

function formatChartDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(new Date(`${date}T00:00:00`));
}

type ComparisonTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey?: string | number; value?: string | number }>;
  etfs: EtfSummary[];
  metric: ChartMetric;
  symbol: string | null;
};

function ComparisonTooltip({ active, label, payload, etfs, metric, symbol }: ComparisonTooltipProps) {
  if (!active) return null;
  const entry = payload?.find((item) => item.dataKey === symbol) ?? payload?.[0];
  if (!entry) return null;
  const etf = etfs.find((item) => item.symbol === entry.dataKey);
  const suffix = metric === "return" ? "%" : metric === "price" ? "" : "×";
  return <div className="comparison-tooltip"><strong>{etf?.name ?? String(entry.dataKey)}</strong><span>{Number(entry.value).toFixed(2)}{suffix}</span><small>{label}</small></div>;
}

function buildMetricOverlay(symbols: string[], histories: Record<string, HistoricalObservation[]>, valuations: Record<string, HistoricalValuationObservation[]>, metric: ChartMetric) {
  if (metric === "return") return buildComparisonOverlay(symbols, histories);
  const valuesBySymbol = Object.fromEntries(symbols.map((symbol) => {
    const source = metric === "price"
      ? histories[symbol].map((point) => [point.date, point.closePrice] as const)
      : valuations[symbol].map((point) => [point.date, metric === "pe" ? point.peRatio : point.pbRatio] as const);
    return [symbol, new Map(source)];
  }));
  const commonDates = symbols.reduce<string[] | null>((shared, symbol) => {
    const dates = new Set(valuesBySymbol[symbol].keys());
    return shared === null ? [...dates] : shared.filter((date) => dates.has(date));
  }, null)?.sort() ?? [];
  if (!commonDates.length) return { data: [], message: `The selected ETFs have no common ${chartDetails[metric].label} history.` };
  return {
    data: commonDates.map((date) => Object.fromEntries([["date", date], ...symbols.map((symbol) => [symbol, valuesBySymbol[symbol].get(date)!])])),
    message: `Common history: ${commonDates[0]} to ${commonDates.at(-1)} (${commonDates.length} daily observations).`,
  };
}

function SmallMetricChart({ etfs, metric }: { etfs: EtfSummary[]; metric: ComparisonMetric }) {
  const data = etfs.flatMap((etf) => etf[metric.key] === null ? [] : [{ symbol: etf.symbol, value: etf[metric.key] }]);
  return (
    <section className="mini-chart-card">
      <h2>{metric.title}</h2>
      <div className="mini-chart">
        {!data.length ? <p className="empty-state">Not applicable to this asset class.</p> : <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <XAxis dataKey="symbol" tick={{ fill: "#6c7888", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#6c7888", fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
            {metric.isReturn && <ReferenceLine stroke="#b9c6bc" y={0} />}
            <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} ${metric.suffix}`, metric.title]} />
            <Bar dataKey="value" maxBarSize={32} radius={[3, 3, 0, 0]}>
              {data.map((entry) => <Cell fill={metric.isReturn ? Number(entry.value) >= 0 ? "#197047" : "#b23b46" : "#2463b7"} key={entry.symbol} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>}
      </div>
    </section>
  );
}

function EmptyComparison() {
  return <div className="comparison-empty"><strong>Select at least two ETFs on the screener</strong><span>Return to the screener, choose up to eight ETFs with the comparison checkboxes, then open this page again.</span></div>;
}

export function EtfComparison({ etfs, histories, valuationHistories, initialSelectedSymbols }: { etfs: EtfSummary[]; histories: Record<string, HistoricalObservation[]>; valuationHistories: Record<string, HistoricalValuationObservation[]>; initialSelectedSymbols?: string[] }) {
  const selectedSymbols = useMemo(() => initialSelectedSymbols?.length ? initialSelectedSymbols : ["USST01", "USST02"], [initialSelectedSymbols]);
  const selectedEtfs = etfs.filter((etf) => selectedSymbols.includes(etf.symbol));
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(Number.MAX_SAFE_INTEGER);
  const [activeHandle, setActiveHandle] = useState<"start" | "end" | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("return");
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const rangeRef = useRef<HTMLSpanElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const overlay = useMemo(() => {
    const result = buildMetricOverlay(selectedEtfs.map((etf) => etf.symbol), histories, valuationHistories, chartMetric);
    return { ...result, data: result.data.map((point) => ({ ...point, label: formatChartDate(String(point.date)) })) };
  }, [chartMetric, histories, selectedEtfs, valuationHistories]);

  const minimumRange = Math.min(20, overlay.data.length);
  const overlayRows = overlay.data as Array<Record<string, string | number>>;
  const safeEndIndex = Math.min(endIndex, Math.max(0, overlay.data.length - 1));
  const visibleOverlay = overlay.data.slice(startIndex, safeEndIndex + 1);
  const visibleRows = visibleOverlay as Array<Record<string, string | number>>;
  const comparisonYDomain = useMemo((): [number, number] => {
    const values = visibleRows.flatMap((row) => selectedSymbols.map((symbol) => Number(row[symbol])).filter(Number.isFinite));
    if (!values.length) return [0, 1];
    const low = Math.min(...values);
    const high = Math.max(...values);
    const padding = (high - low || Math.max(1, Math.abs(high) * 0.1)) * 0.06;
    return [low - padding, high + padding];
  }, [selectedSymbols, visibleRows]);
  const updateHandle = (handle: "start" | "end", clientX: number) => {
    const bounds = rangeRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const index = Math.round(Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width)) * Math.max(0, overlay.data.length - 1));
    if (handle === "start") setStartIndex(Math.min(index, safeEndIndex - minimumRange + 1));
    else setEndIndex(Math.max(index, startIndex + minimumRange - 1));
  };
  const selectVerticallyClosest = (state: { activeTooltipIndex?: string | number | null; activeCoordinate?: { y?: number } }) => {
    const index = Number(state.activeTooltipIndex);
    const cursorY = state.activeCoordinate?.y;
    const chartHeight = chartRef.current?.clientHeight;
    if (!Number.isInteger(index) || cursorY === undefined || !chartHeight || !visibleRows[index]) return;
    const plotTop = 12;
    const plotBottom = chartHeight - 32;
    const values = Object.fromEntries(selectedSymbols.map((symbol) => [symbol, Number(visibleRows[index][symbol])]));
    setHoveredSymbol(findVerticallyClosestSeries(values, cursorY, comparisonYDomain, plotTop, plotBottom));
  };

  return (
    <main className="page-shell comparison-page" id="main-content">
      <Link className="back-link" href="/">← Back to screener</Link>
      <header className="comparison-heading">
        <div><p className="eyebrow">ETF comparison</p><h1>Compare your short list.</h1></div>
        <p>Showing the ETFs selected on the screener. Returns are total returns, as of 31 Dec 2025.</p>
      </header>

      {selectedEtfs.length < 2 ? <EmptyComparison /> : <>
        <section className="mini-chart-grid" aria-label="Comparison metric charts">
          {metrics.map((metric) => <SmallMetricChart etfs={selectedEtfs} key={metric.key} metric={metric} />)}
        </section>
        <section className="comparison-line-card">
          <div className="chart-header"><div>
            <label className="chart-selector" aria-label="Comparison chart measure">
              <select value={chartMetric} onChange={(event) => setChartMetric(event.target.value as ChartMetric)}>
                {(Object.keys(chartDetails) as ChartMetric[]).map((option) => <option key={option} value={option}>{chartDetails[option].label}</option>)}
              </select>
            </label>
            <div className="comparison-chart-legend" aria-label="ETF legend">
              {selectedEtfs.map((etf, index) => <span key={etf.symbol}><i style={{ background: lineColors[index] }} />{etf.symbol}</span>)}
            </div>
          </div></div>
          {overlay.data.length ? <><div className="comparison-line-chart" ref={chartRef}>
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={visibleOverlay} margin={{ top: 12, right: 16, bottom: 0, left: 0 }} onMouseLeave={() => setHoveredSymbol(null)} onMouseMove={selectVerticallyClosest}>
                <XAxis dataKey="date" minTickGap={34} tick={{ fill: "#718096", fontSize: 12 }} tickFormatter={formatChartDate} tickLine={false} axisLine={false} />
                <YAxis domain={comparisonYDomain} orientation="right" tickFormatter={(value) => chartMetric === "return" ? `${value}%` : chartMetric === "price" ? `${value}` : `${value}×`} tick={{ fill: "#718096", fontSize: 12 }} tickLine={false} axisLine={false} width={54} />
                <Tooltip content={<ComparisonTooltip etfs={selectedEtfs} metric={chartMetric} symbol={hoveredSymbol} />} />
                {selectedEtfs.map((etf, index) => <Line activeDot={{ r: 5 }} dataKey={etf.symbol} dot={false} key={etf.symbol} opacity={!hoveredSymbol || hoveredSymbol === etf.symbol ? 1 : 0.65} stroke={hoveredSymbol && hoveredSymbol !== etf.symbol ? "#aeb8c2" : lineColors[index]} strokeWidth={hoveredSymbol === etf.symbol ? 3.5 : 2.3} type="monotone" />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <label className="chart-range comparison-range">
            <span className="range-inputs" onPointerMove={(event) => { if (activeHandle) updateHandle(activeHandle, event.clientX); }} onPointerUp={() => setActiveHandle(null)} ref={rangeRef}>
              <span className="range-selection" style={{ left: `${(startIndex / Math.max(1, overlay.data.length - 1)) * 100}%`, width: `${((safeEndIndex - startIndex) / Math.max(1, overlay.data.length - 1)) * 100}%` }} />
              <span className="range-bound-label range-bound-start" style={{ left: `${(startIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }}>Start</span>
              <span className="range-bound-label range-bound-end" style={{ left: `${(safeEndIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }}>End</span>
              {activeHandle === "start" && <span className="range-date-tooltip" style={{ left: `${(startIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }}>{String(overlayRows[startIndex]?.date ?? "")}</span>}
              {activeHandle === "end" && <span className="range-date-tooltip" style={{ left: `${(safeEndIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }}>{String(overlayRows[safeEndIndex]?.date ?? "")}</span>}
              <button aria-label="Comparison start date" className="range-handle range-handle-start" onKeyDown={(event) => { const amount = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0; if (amount) { event.preventDefault(); setStartIndex((value) => Math.max(0, Math.min(value + amount, safeEndIndex - minimumRange + 1))); } }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setActiveHandle("start"); }} style={{ left: `${(startIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }} type="button"><span aria-hidden="true">↔</span></button>
              <button aria-label="Comparison end date" className="range-handle range-handle-end" onKeyDown={(event) => { const amount = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0; if (amount) { event.preventDefault(); setEndIndex((value) => Math.min(overlay.data.length - 1, Math.max(value + amount, startIndex + minimumRange - 1))); } }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setActiveHandle("end"); }} style={{ left: `${(safeEndIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }} type="button"><span aria-hidden="true">↔</span></button>
            </span>
          </label>
          <p className="common-history-message">{overlay.message}</p></> : <p className="common-history-message">{overlay.message}</p>}
        </section>
      </>}
    </main>
  );
}
