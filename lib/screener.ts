import type { EtfSummary } from "./types";

export type FilterKey = "assetClass" | "region" | "issuer" | "currency" | "distributionPolicy";
export type SortKey = "fundSizeMillionUsd" | "return1yPct" | "return3yPct" | "ter" | "name";
export type ScreenerFilters = Partial<Record<FilterKey, string>>;

export function filterAndSortEtfs(etfs: EtfSummary[], filters: ScreenerFilters, maxTer: string, sortKey: SortKey, sortDirection: "asc" | "desc") {
  return [...etfs]
    .filter((etf) => (Object.entries(filters) as [FilterKey, string][]).every(([key, value]) => !value || etf[key] === value))
    .filter((etf) => !maxTer || etf.ter <= Number(maxTer))
    .sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      const comparison = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });
}
