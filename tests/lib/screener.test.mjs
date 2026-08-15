import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScriptModule } from "../helpers/load-typescript.mjs";

const { filterAndSortEtfs } = await loadTypeScriptModule("lib/screener.ts");
const etfs = [
  { symbol: "LOW", name: "Low fee", region: "Global", issuer: "Atlas", currency: "USD", assetClass: "Equity", distributionPolicy: "Accumulating", ter: 0.1, fundSizeMillionUsd: 500, return1yPct: 8, return3yPct: 22 },
  { symbol: "HIGH", name: "Higher fee", region: "China", issuer: "Horizon", currency: "CNY", assetClass: "Equity", distributionPolicy: "Distributing", ter: 0.5, fundSizeMillionUsd: 800, return1yPct: -2, return3yPct: 15 },
  { symbol: "MID", name: "Mid fee", region: "Global", issuer: "Atlas", currency: "USD", assetClass: "Equity", distributionPolicy: "Accumulating", ter: 0.2, fundSizeMillionUsd: 300, return1yPct: 12, return3yPct: 18 },
];

test("applies multiple screener filters and TER limit", () => {
  const result = filterAndSortEtfs(etfs, { region: "Global", currency: "USD" }, "0.15", "name", "asc");
  assert.deepEqual(result.map((etf) => etf.symbol), ["LOW"]);
});

test("sorts result copies without mutating the source collection", () => {
  const result = filterAndSortEtfs(etfs, {}, "", "return1yPct", "desc");
  assert.deepEqual(result.map((etf) => etf.symbol), ["MID", "LOW", "HIGH"]);
  assert.deepEqual(etfs.map((etf) => etf.symbol), ["LOW", "HIGH", "MID"]);
});
