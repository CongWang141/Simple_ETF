"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { normalizeReturnIndex } from "@/lib/return-calculations";
import type { HistoricalObservation, HistoricalValuationObservation } from "@/lib/types";

type Period = "1Y" | "3Y" | "5Y" | "Max";
type ChartMetric = "return" | "price" | "pe" | "pb";

const periodLengths: Record<Exclude<Period, "Max">, number> = { "1Y": 13, "3Y": 37, "5Y": 61 };

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(new Date(`${date}T00:00:00`));
}

const metricDetails: Record<ChartMetric, { label: string; title: string; colour: string }> = {
  return: { label: "Total return", title: "Total return", colour: "#197047" },
  price: { label: "Price", title: "Closing price", colour: "#2463b7" },
  pe: { label: "P/E", title: "P/E ratio", colour: "#9b4f12" },
  pb: { label: "P/B", title: "P/B ratio", colour: "#80439b" },
};

export function HistoricalReturnChart({ observations, valuations }: { observations: HistoricalObservation[]; valuations: HistoricalValuationObservation[] }) {
  const [period, setPeriod] = useState<Period>("5Y");
  const [metric, setMetric] = useState<ChartMetric>("return");
  const chartData = useMemo(() => {
    const visible = period === "Max" ? observations : observations.slice(-periodLengths[period]);
    const valuationByDate = new Map(valuations.map((point) => [point.date, point]));
    if (metric === "return") return normalizeReturnIndex(visible).map((point) => ({ date: point.date, label: formatDate(point.date), value: point.normalizedReturnPct }));
    return visible.flatMap((point) => {
      const valuation = valuationByDate.get(point.date);
      const value = metric === "price" ? point.closePrice : metric === "pe" ? valuation?.peRatio : valuation?.pbRatio;
      return value === undefined ? [] : [{ date: point.date, label: formatDate(point.date), value: Number(value.toFixed(2)) }];
    });
  }, [metric, observations, period, valuations]);

  const finalValue = chartData.at(-1)?.value ?? 0;
  const currency = observations.at(-1)?.currency ?? "";
  const valueFormatter = (value: number) => {
    if (metric === "return") return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    if (metric === "price") return `${value.toFixed(2)} ${currency}`;
    return `${value.toFixed(2)}×`;
  };

  return (
    <section className="chart-card" aria-label="Historical total return chart">
      <div className="chart-header">
        <div>
          <label className="chart-selector">
            <span>Plot</span>
            <select value={metric} onChange={(event) => setMetric(event.target.value as ChartMetric)}>
              {(Object.keys(metricDetails) as ChartMetric[]).map((option) => <option key={option} value={option}>{metricDetails[option].label}</option>)}
            </select>
          </label>
          <h2>{metricDetails[metric].title}</h2>
          <p className={metric === "return" && finalValue < 0 ? "chart-return negative" : "chart-return positive"}>
            {valueFormatter(finalValue)}
          </p>
        </div>
        <div className="period-selector" aria-label="Chart period">
          {(["1Y", "3Y", "5Y", "Max"] as Period[]).map((option) => (
            <button className={option === period ? "period-active" : ""} key={option} onClick={() => setPeriod(option)} type="button">
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-area">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
            <XAxis dataKey="label" minTickGap={34} tick={{ fill: "#718096", fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(value) => metric === "return" ? `${value}%` : metric === "price" ? `${value}` : `${value}×`} tick={{ fill: "#718096", fontSize: 12 }} tickLine={false} axisLine={false} width={52} />
            <Tooltip
              contentStyle={{ border: "1px solid #dce4dc", borderRadius: "8px", boxShadow: "0 8px 20px rgba(23,32,51,.10)" }}
              formatter={(value) => [valueFormatter(Number(value)), metricDetails[metric].title]}
              labelFormatter={(_, payload) => payload[0]?.payload.date ?? ""}
            />
            <Line dataKey="value" dot={false} stroke={metricDetails[metric].colour} strokeWidth={2.5} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">{metric === "return" ? "Rebased to 0% at the start of the selected period." : metric === "price" ? "Displayed at each month-end without rebasing." : "Derived from the latest quarterly reported valuation snapshot and each month-end price."} Synthetic local data through 31 Dec 2025.</p>
    </section>
  );
}
