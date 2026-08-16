"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatFundSize, formatPercent, formatTer } from "@/lib/formatters";
import { filterAndSortEtfs } from "@/lib/screener";
import type { EtfSummary } from "@/lib/types";
import type { FilterKey, SortKey } from "@/lib/screener";

const filterLabels: Record<FilterKey, string> = {
  assetClass: "Asset class",
  region: "Region",
  country: "Country",
  industry: "Industry",
  strategy: "Strategy",
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
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("fundSizeMillionUsd");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filterOptions = useMemo(() => Object.fromEntries(
    (Object.keys(filterLabels) as FilterKey[]).map((key) => [key, [...new Set(etfs.map((etf) => etf[key]).filter((value): value is string => Boolean(value)))].sort()]),
  ) as Record<FilterKey, string[]>, [etfs]);

  const results = useMemo(() => filterAndSortEtfs(etfs, filters, sortKey, sortDirection), [etfs, filters, sortDirection, sortKey]);

  function updateFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters({});
  }

  function toggleComparison(symbol: string) {
    setCompareSymbols((current) => {
      if (current.includes(symbol)) return current.filter((item) => item !== symbol);
      return current.length === 8 ? current : [...current, symbol];
    });
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

      <div className="table-wrap results-window">
        <table>
          <thead>
            <tr>
              <th>ETF</th>
              <th>Index</th>
              <th>Country</th>
              <th>TER</th>
              <th>Fund size</th>
              <th>1Y return</th>
              <th>3Y return</th>
              <th className="compare-column">Compare</th>
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
                <td>{etf.country}</td>
                <td>{formatTer(etf.ter)}</td>
                <td>{formatFundSize(etf.fundSizeMillionUsd)}</td>
                <td><Metric value={etf.return1yPct} /></td>
                <td><Metric value={etf.return3yPct} /></td>
                <td className="compare-column">{(() => {
                  const isSelected = compareSymbols.includes(etf.symbol);
                  const isBlocked = !isSelected && compareSymbols.length === 8;
                  return <span className="compare-control"><input aria-label={isBlocked ? `Cannot select ${etf.symbol}: maximum 8 ETFs can be compared` : `Select ${etf.symbol} for comparison`} checked={isSelected} disabled={isBlocked} onChange={() => toggleComparison(etf.symbol)} title={isBlocked ? "Maximum 8 ETFs can be compared" : undefined} type="checkbox" />{isBlocked && <span aria-hidden="true" className="compare-limit-indicator">×</span>}</span>;
                })()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results.length && <p className="empty-state">No ETFs match these filters. Try resetting one or more filters.</p>}
      </div>
      <div className="compare-action">
        <span>{compareSymbols.length} of 8 ETFs selected</span>
        {compareSymbols.length >= 2 ? <Link className="compare-button" href={`/compare?symbols=${compareSymbols.join(",")}`}>Compare selected ETFs →</Link> : <span className="compare-button compare-button-disabled">Select at least 2 ETFs to compare</span>}
      </div>
    </section>
  );
}
