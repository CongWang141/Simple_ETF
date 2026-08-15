"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { normalizeReturnIndex } from "@/lib/return-calculations";
import type { HistoricalObservation } from "@/lib/types";

type Period = "1Y" | "3Y" | "5Y" | "Max";

const periodLengths: Record<Exclude<Period, "Max">, number> = { "1Y": 13, "3Y": 37, "5Y": 61 };

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(new Date(`${date}T00:00:00`));
}

export function HistoricalReturnChart({ observations }: { observations: HistoricalObservation[] }) {
  const [period, setPeriod] = useState<Period>("5Y");
  const chartData = useMemo(() => {
    const visible = period === "Max" ? observations : observations.slice(-periodLengths[period]);
    return normalizeReturnIndex(visible).map((point) => ({
      date: point.date,
      label: formatDate(point.date),
      returnPct: point.normalizedReturnPct,
    }));
  }, [observations, period]);

  const finalReturn = chartData.at(-1)?.returnPct ?? 0;

  return (
    <section className="chart-card" aria-label="Historical total return chart">
      <div className="chart-header">
        <div>
          <p className="section-label">Historical return</p>
          <h2>Total return</h2>
          <p className={finalReturn >= 0 ? "chart-return positive" : "chart-return negative"}>
            {finalReturn >= 0 ? "+" : ""}{finalReturn.toFixed(2)}%
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
            <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: "#718096", fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip
              contentStyle={{ border: "1px solid #dce4dc", borderRadius: "8px", boxShadow: "0 8px 20px rgba(23,32,51,.10)" }}
              formatter={(value) => [`${Number(value).toFixed(2)}%`, "Total return"]}
              labelFormatter={(_, payload) => payload[0]?.payload.date ?? ""}
            />
            <Line dataKey="returnPct" dot={false} stroke="#197047" strokeWidth={2.5} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">Rebased to 0% at the start of the selected period. Synthetic total-return data through 31 Dec 2025.</p>
    </section>
  );
}
