"use client";

import { useMemo, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { normalizeReturnIndex } from "@/lib/return-calculations";
import { getCalendarDateTicks, getNiceNumericAxis } from "@/lib/chart-axis";
import type { HistoricalObservation, HistoricalValuationObservation } from "@/lib/types";

type ChartMetric = "return" | "price" | "pe" | "pb";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).format(new Date(`${date}T00:00:00Z`)).replaceAll(" ", "-");
}

const metricDetails: Record<ChartMetric, { label: string; title: string; colour: string }> = {
  return: { label: "Cumulative Return", title: "Cumulative Return", colour: "#197047" },
  price: { label: "Price", title: "Closing price", colour: "#2463b7" },
  pe: { label: "P/E", title: "P/E ratio", colour: "#9b4f12" },
  pb: { label: "P/B", title: "P/B ratio", colour: "#80439b" },
};

export function HistoricalReturnChart({ observations, valuations }: { observations: HistoricalObservation[]; valuations: HistoricalValuationObservation[] }) {
  const minimumRange = Math.min(20, observations.length);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(Math.max(0, observations.length - 1));
  const [activeHandle, setActiveHandle] = useState<"start" | "end" | null>(null);
  const rangeRef = useRef<HTMLSpanElement>(null);
  const [metric, setMetric] = useState<ChartMetric>("return");
  const chartData = useMemo(() => {
    const visible = observations.slice(startIndex, endIndex + 1);
    const valuationByDate = new Map(valuations.map((point) => [point.date, point]));
    if (metric === "return") return normalizeReturnIndex(visible).map((point) => ({ date: point.date, label: formatDate(point.date), value: point.normalizedReturnPct }));
    return visible.flatMap((point) => {
      const valuation = valuationByDate.get(point.date);
      const value = metric === "price" ? point.closePrice : metric === "pe" ? valuation?.peRatio : valuation?.pbRatio;
      return value === undefined ? [] : [{ date: point.date, label: formatDate(point.date), value: Number(value.toFixed(2)) }];
    });
  }, [endIndex, metric, observations, startIndex, valuations]);

  const currency = observations.at(-1)?.currency ?? "";
  const numericAxis = useMemo(() => getNiceNumericAxis(chartData.map((point) => point.value)), [chartData]);
  const dateTicks = useMemo(() => getCalendarDateTicks(chartData.map((point) => point.date)), [chartData]);
  const valueFormatter = (value: number) => {
    if (metric === "return") return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    if (metric === "price") return `${value.toFixed(2)} ${currency}`;
    return `${value.toFixed(2)}×`;
  };
  const updateHandle = (handle: "start" | "end", clientX: number) => {
    const bounds = rangeRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const index = Math.round(Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width)) * Math.max(0, observations.length - 1));
    if (handle === "start") setStartIndex(Math.min(index, endIndex - minimumRange + 1));
    else setEndIndex(Math.max(index, startIndex + minimumRange - 1));
  };

  return (
    <section className="chart-card" aria-label="Historical total return chart">
      <div className="chart-header">
        <div>
          <label className="chart-selector" aria-label="Chart measure">
            <select value={metric} onChange={(event) => setMetric(event.target.value as ChartMetric)}>
              {(Object.keys(metricDetails) as ChartMetric[]).map((option) => <option key={option} value={option}>{metricDetails[option].label}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="chart-area">
        {!chartData.length && (metric === "pe" || metric === "pb") ? <p className="empty-state">{metricDetails[metric].label} is not applicable to this asset class.</p> : <ResponsiveContainer height="100%" width="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 16, left: 12 }}>
            <CartesianGrid stroke="#e9eef2" strokeDasharray="2 3" vertical />
            <XAxis axisLine={{ stroke: "#9aa8b6", strokeWidth: 1 }} dataKey="date" dy={8} interval="preserveStartEnd" minTickGap={12} tick={{ fill: "#718096", fontSize: 12 }} tickFormatter={formatDate} tickLine={false} ticks={dateTicks} />
            <YAxis axisLine={{ stroke: "#9aa8b6", strokeWidth: 1 }} domain={numericAxis.domain} ticks={numericAxis.ticks} tickFormatter={(value) => metric === "return" ? `${Number(value).toFixed(2)}%` : metric === "price" ? Number(value).toFixed(2) : `${Number(value).toFixed(2)}×`} tick={{ fill: "#718096", fontSize: 12 }} tickLine={false} width={68} />
            <Tooltip
              contentStyle={{ border: "1px solid #dce4dc", borderRadius: "8px", boxShadow: "0 8px 20px rgba(23,32,51,.10)" }}
              formatter={(value) => [valueFormatter(Number(value)), metricDetails[metric].title]}
              labelFormatter={(_, payload) => payload[0]?.payload.date ?? ""}
            />
            <Line dataKey="value" dot={false} stroke={metricDetails[metric].colour} strokeWidth={2.5} type="monotone" />
          </LineChart>
        </ResponsiveContainer>}
      </div>
      <label className="chart-range">
        <span className="range-inputs" onPointerMove={(event) => { if (activeHandle) updateHandle(activeHandle, event.clientX); }} onPointerUp={() => setActiveHandle(null)} ref={rangeRef}>
          <span className="range-selection" style={{ left: `${(startIndex / Math.max(1, observations.length - 1)) * 100}%`, width: `${((endIndex - startIndex) / Math.max(1, observations.length - 1)) * 100}%` }} />
          {activeHandle === "start" && <span className="range-date-tooltip" style={{ left: `${(startIndex / Math.max(1, observations.length - 1)) * 100}%` }}>{observations[startIndex]?.date}</span>}
          {activeHandle === "end" && <span className="range-date-tooltip" style={{ left: `${(endIndex / Math.max(1, observations.length - 1)) * 100}%` }}>{observations[endIndex]?.date}</span>}
          <button aria-label="Start date" className="range-handle range-handle-start" onKeyDown={(event) => { const amount = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0; if (amount) { event.preventDefault(); setStartIndex((value) => Math.max(0, Math.min(value + amount, endIndex - minimumRange + 1))); } }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setActiveHandle("start"); }} style={{ left: `${(startIndex / Math.max(1, observations.length - 1)) * 100}%` }} type="button"><span aria-hidden="true">↔</span></button>
          <button aria-label="End date" className="range-handle range-handle-end" onKeyDown={(event) => { const amount = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0; if (amount) { event.preventDefault(); setEndIndex((value) => Math.min(observations.length - 1, Math.max(value + amount, startIndex + minimumRange - 1))); } }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setActiveHandle("end"); }} style={{ left: `${(endIndex / Math.max(1, observations.length - 1)) * 100}%` }} type="button"><span aria-hidden="true">↔</span></button>
        </span>
      </label>
      <p className="chart-note">{metric === "return" ? "Rebased to 0% at the start of the selected period." : metric === "price" ? "Displayed on each available trading day without rebasing." : "Derived from the latest quarterly reported valuation snapshot and each available trading-day price."} Synthetic local data through 31 Dec 2025.</p>
    </section>
  );
}
