"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildComparisonOverlay, calculateTotalReturnForDateRange, findVerticallyClosestSeries } from "@/lib/return-calculations";
import { getCalendarDateTicks, getNiceNumericAxis } from "@/lib/chart-axis";
import type { EtfSummary, HistoricalObservation, HistoricalValuationObservation } from "@/lib/types";

type NumericMetricKey = "peRatio" | "ter" | "fundSizeMillionUsd" | "return1mPct" | "returnYtdPct" | "return1yPct" | "return3yPct" | "return5yPct";
type ComparisonMetric = { key: NumericMetricKey; title: string; suffix: string; isReturn?: boolean };
type ChartMetric = "return" | "price" | "pe" | "pb";
type AnnualReturnColumn = { key: "ytd" | number; label: string; startDate: string; endDate: string };

const metrics: ComparisonMetric[] = [
  { key: "peRatio", title: "P/E", suffix: "×" },
  { key: "ter", title: "TER", suffix: "%" },
  { key: "fundSizeMillionUsd", title: "Fund size", suffix: "m USD" },
  { key: "return1mPct", title: "1M Return", suffix: "%", isReturn: true },
  { key: "returnYtdPct", title: "YTD Return", suffix: "%", isReturn: true },
  { key: "return1yPct", title: "1Y Return", suffix: "%", isReturn: true },
  { key: "return3yPct", title: "3Y Return", suffix: "%", isReturn: true },
  { key: "return5yPct", title: "5Y Return", suffix: "%", isReturn: true },
];

const lineColors = ["#197047", "#2463b7", "#b95a15", "#8d3ca6", "#b23b46", "#0f7e91", "#6c6214", "#7b4c37"];
const chartDetails: Record<ChartMetric, { label: string; colour: string }> = {
  return: { label: "Cumulative Return", colour: "#197047" },
  price: { label: "Price", colour: "#2463b7" },
  pe: { label: "P/E", colour: "#b95a15" },
  pb: { label: "P/B", colour: "#8d3ca6" },
};

function formatChartDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).format(new Date(`${date}T00:00:00Z`)).replaceAll(" ", "-");
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()).replaceAll(" ", "-");
}

function getAnnualReturnColumns(currentYear: number): AnnualReturnColumn[] {
  return [
    { key: "ytd", label: "YTD", startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` },
    ...Array.from({ length: 8 }, (_, offset) => {
      const year = currentYear - offset - 1;
      return { key: year, label: String(year), startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    }),
  ];
}

function formatCompactInteger(value: number) {
  const rounded = Math.round(value);
  if (Math.abs(rounded) >= 1_000_000) return `${Math.round(rounded / 1_000_000)}M`;
  if (Math.abs(rounded) >= 1_000) return `${Math.round(rounded / 1_000)}K`;
  return String(rounded);
}

function formatSmallTick(value: number, metric: ComparisonMetric, step: number) {
  if (metric.key === "fundSizeMillionUsd") return Math.abs(value) >= 1_000 ? `$${(value / 1_000).toFixed(step < 1_000 ? 1 : 0)}B` : `$${Math.round(value)}M`;
  if (metric.key === "ter") return value.toFixed(2);
  if (metric.key === "peRatio") return `${value.toFixed(2)}×`;
  return formatCompactInteger(value);
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
  const numericAxis = metric.key === "ter"
    ? getNiceNumericAxis([0, 1], 6)
    : getNiceNumericAxis(data.map((entry) => Number(entry.value)), 4);
  return (
    <section className="mini-chart-card">
      <h2>{metric.title === "Fund size" ? "Fund Size" : metric.title}</h2>
      <div className="mini-chart">
        {!data.length ? <p className="empty-state">Not applicable to this asset class.</p> : <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 12, bottom: 0 }}>
            <XAxis axisLine={{ stroke: "#9aa8b6", strokeWidth: 1 }} dataKey="symbol" tick={{ fill: "#6c7888", fontSize: 10 }} tickLine={false} />
            <YAxis domain={numericAxis.domain} ticks={numericAxis.ticks} tickFormatter={(value) => formatSmallTick(Number(value), metric, numericAxis.step)} tick={{ fill: "#6c7888", fontSize: 10 }} tickLine={false} width={54} />
            {metric.isReturn && <ReferenceLine stroke="#b9c6bc" y={0} />}
            <Tooltip allowEscapeViewBox={{ x: false, y: false }} contentStyle={{ border: "1px solid #dce4dc", borderRadius: "8px", boxShadow: "0 8px 20px rgba(23,32,51,.10)" }} cursor={false} formatter={(value) => [`${Number(value).toFixed(2)} ${metric.suffix}`, metric.title]} />
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
  const comparisonAxis = useMemo(() => getNiceNumericAxis(visibleRows.flatMap((row) => selectedSymbols.map((symbol) => Number(row[symbol])).filter(Number.isFinite))), [selectedSymbols, visibleRows]);
  const comparisonYDomain = comparisonAxis.domain;
  const comparisonDateTicks = useMemo(() => getCalendarDateTicks(visibleRows.map((row) => String(row.date))), [visibleRows]);
  const annualReturnColumns = useMemo(() => getAnnualReturnColumns(new Date().getFullYear()), []);
  const annualReturnRows = useMemo(() => selectedEtfs.map((etf) => ({
    etf,
    returns: annualReturnColumns.map((column) => {
      if (column.key !== "ytd" && etf.inceptionDate > column.startDate) return null;
      return calculateTotalReturnForDateRange(histories[etf.symbol] ?? [], column.startDate, column.endDate);
    }),
  })), [annualReturnColumns, histories, selectedEtfs]);
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
        <h1>Compare your short list</h1>
        <p>Showing the ETFs selected on the screener. Comparison based on the data as of {formatCurrentDate()}.</p>
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
          </div></div>
          {overlay.data.length ? <><div className="comparison-line-chart" ref={chartRef}>
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={visibleOverlay} margin={{ top: 12, right: 12, bottom: 16, left: 12 }} onMouseLeave={() => setHoveredSymbol(null)} onMouseMove={selectVerticallyClosest}>
                <CartesianGrid stroke="#e9eef2" strokeDasharray="2 3" vertical />
                <XAxis axisLine={{ stroke: "#9aa8b6", strokeWidth: 1 }} dataKey="date" dy={8} interval="preserveStartEnd" minTickGap={12} tick={{ fill: "#718096", fontSize: 12 }} tickFormatter={formatChartDate} tickLine={false} ticks={comparisonDateTicks} />
                <YAxis axisLine={{ stroke: "#9aa8b6", strokeWidth: 1 }} domain={comparisonYDomain} ticks={comparisonAxis.ticks} tickFormatter={(value) => chartMetric === "return" ? `${Number(value).toFixed(2)}%` : chartMetric === "price" ? Number(value).toFixed(2) : `${Number(value).toFixed(2)}×`} tick={{ fill: "#718096", fontSize: 12 }} tickLine={false} width={68} />
                <Tooltip content={<ComparisonTooltip etfs={selectedEtfs} metric={chartMetric} symbol={hoveredSymbol} />} />
                {selectedEtfs.map((etf, index) => <Line activeDot={{ r: 5 }} dataKey={etf.symbol} dot={false} key={etf.symbol} opacity={!hoveredSymbol || hoveredSymbol === etf.symbol ? 1 : 0.65} stroke={hoveredSymbol && hoveredSymbol !== etf.symbol ? "#aeb8c2" : lineColors[index]} strokeWidth={hoveredSymbol === etf.symbol ? 3.5 : 2.3} type="monotone" />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <label className="chart-range comparison-range">
            <span className="range-inputs" onPointerMove={(event) => { if (activeHandle) updateHandle(activeHandle, event.clientX); }} onPointerUp={() => setActiveHandle(null)} ref={rangeRef}>
              <span className="range-selection" style={{ left: `${(startIndex / Math.max(1, overlay.data.length - 1)) * 100}%`, width: `${((safeEndIndex - startIndex) / Math.max(1, overlay.data.length - 1)) * 100}%` }} />
              {activeHandle === "start" && <span className="range-date-tooltip" style={{ left: `${(startIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }}>{String(overlayRows[startIndex]?.date ?? "")}</span>}
              {activeHandle === "end" && <span className="range-date-tooltip" style={{ left: `${(safeEndIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }}>{String(overlayRows[safeEndIndex]?.date ?? "")}</span>}
              <button aria-label="Comparison start date" className="range-handle range-handle-start" onKeyDown={(event) => { const amount = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0; if (amount) { event.preventDefault(); setStartIndex((value) => Math.max(0, Math.min(value + amount, safeEndIndex - minimumRange + 1))); } }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setActiveHandle("start"); }} style={{ left: `${(startIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }} type="button"><span aria-hidden="true">↔</span></button>
              <button aria-label="Comparison end date" className="range-handle range-handle-end" onKeyDown={(event) => { const amount = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0; if (amount) { event.preventDefault(); setEndIndex((value) => Math.min(overlay.data.length - 1, Math.max(value + amount, startIndex + minimumRange - 1))); } }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setActiveHandle("end"); }} style={{ left: `${(safeEndIndex / Math.max(1, overlay.data.length - 1)) * 100}%` }} type="button"><span aria-hidden="true">↔</span></button>
            </span>
          </label>
          <p className="common-history-message">{overlay.message}</p></> : <p className="common-history-message">{overlay.message}</p>}
        </section>
        <section className="annual-returns-card" aria-labelledby="annual-returns-heading">
          <h2 id="annual-returns-heading">Annual returns</h2>
          <div className="annual-returns-table-wrap">
            <table className="annual-returns-table">
              <thead><tr><th>ETF</th>{annualReturnColumns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
              <tbody>{annualReturnRows.map(({ etf, returns }) => <tr key={etf.symbol}>
                <td>{etf.name}</td>
                {returns.map((value, index) => <td className={value === null ? "" : value > 0 ? "positive" : value < 0 ? "negative" : ""} key={annualReturnColumns[index].key}>{value === null ? "-" : `${value.toFixed(2)}%`}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      </>}
    </main>
  );
}
