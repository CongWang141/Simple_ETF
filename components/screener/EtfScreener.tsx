"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatFundSize, formatPercent, formatTer } from "@/lib/formatters";
import type { EtfSummary } from "@/lib/types";

type FilterKey = "assetClass" | "region" | "issuer" | "currency" | "distributionPolicy";
type SortKey = "fundSizeMillionUsd" | "return1yPct" | "return3yPct" | "ter" | "name";

const filterLabels: Record<FilterKey, string> = {
  assetClass: "Asset class",
  region: "Region",
  issuer: "Issuer",
  currency: "Currency",
  distributionPolicy: "Distribution",
};

const sortLabels: Record<SortKey, string> = {
  fundSizeMillionUsd: "Fund size",
  return1yPct: "1Y return",
  return3yPct: "3Y return",
  ter: "TER",
  name: "Name",
};

function Metric({ value }: { value: number }) {
  return <span className={value >= 0 ? "metric metric-positive" : "metric metric-negative"}>{formatPercent(value)}</span>;
}

export function EtfScreener({ etfs }: { etfs: EtfSummary[] }) {
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [maxTer, setMaxTer] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fundSizeMillionUsd");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filterOptions = useMemo(() => Object.fromEntries(
    (Object.keys(filterLabels) as FilterKey[]).map((key) => [key, [...new Set(etfs.map((etf) => etf[key]))].sort()]),
  ) as Record<FilterKey, string[]>, [etfs]);

  const results = useMemo(() => etfs
    .filter((etf) => (Object.entries(filters) as [FilterKey, string][]).every(([key, value]) => !value || etf[key] === value))
    .filter((etf) => !maxTer || etf.ter <= Number(maxTer))
    .sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      const comparison = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));
      return sortDirection === "asc" ? comparison : -comparison;
    }), [etfs, filters, maxTer, sortDirection, sortKey]);

  function updateFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters({});
    setMaxTer("");
  }

  return (
    <section className="screener" aria-label="ETF screener">
      <div className="filter-bar">
        <div className="filter-grid">
          {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
            <label className="control" key={key}>
              <span>{filterLabels[key]}</span>
              <select value={filters[key] ?? ""} onChange={(event) => updateFilter(key, event.target.value)}>
                <option value="">All</option>
                {filterOptions[key].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ))}
          <label className="control">
            <span>Maximum TER</span>
            <select value={maxTer} onChange={(event) => setMaxTer(event.target.value)}>
              <option value="">Any fee</option>
              <option value="0.2">0.20% or less</option>
              <option value="0.3">0.30% or less</option>
              <option value="0.5">0.50% or less</option>
            </select>
          </label>
        </div>
        <button className="text-button" onClick={resetFilters} type="button">Reset filters</button>
      </div>

      <div className="results-toolbar">
        <p><strong>{results.length}</strong> of {etfs.length} illustrative ETFs</p>
        <div className="sort-controls">
          <label className="inline-control">
            <span>Sort by</span>
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
              {(Object.keys(sortLabels) as SortKey[]).map((key) => <option key={key} value={key}>{sortLabels[key]}</option>)}
            </select>
          </label>
          <button className="sort-button" onClick={() => setSortDirection((value) => value === "asc" ? "desc" : "asc")} type="button">
            {sortDirection === "asc" ? "Ascending ↑" : "Descending ↓"}
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ETF</th>
              <th>Index</th>
              <th>Region</th>
              <th>TER</th>
              <th>Fund size</th>
              <th>1Y return</th>
              <th>3Y return</th>
            </tr>
          </thead>
          <tbody>
            {results.map((etf) => (
              <tr key={etf.symbol}>
                <td>
                  <Link className="etf-link" href={`/etfs/${etf.symbol}`}>
                    <strong>{etf.symbol}</strong>
                    <span>{etf.name}</span>
                  </Link>
                </td>
                <td>{etf.trackingIndex}</td>
                <td>{etf.region}</td>
                <td>{formatTer(etf.ter)}</td>
                <td>{formatFundSize(etf.fundSizeMillionUsd)}</td>
                <td><Metric value={etf.return1yPct} /></td>
                <td><Metric value={etf.return3yPct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results.length && <p className="empty-state">No ETFs match these filters. Try resetting one or more filters.</p>}
      </div>
    </section>
  );
}
