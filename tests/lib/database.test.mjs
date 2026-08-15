import assert from "node:assert/strict";
import Database from "better-sqlite3";
import test from "node:test";

const db = new Database("data/simple_etf.sqlite", { readonly: true, fileMustExist: true });

test("reads ETF facts, metrics, and complete history from SQLite", () => {
  const etf = db.prepare("SELECT e.symbol, m.pe_ratio AS peRatio FROM etfs e JOIN etf_metrics m ON m.etf_id = e.id WHERE e.symbol = ?").get("USST01");
  assert.equal(etf.symbol, "USST01");
  assert.ok(etf.peRatio > 0);
  const count = db.prepare("SELECT COUNT(*) AS count FROM return_history r JOIN etfs e ON e.id = r.etf_id WHERE e.symbol = ?").get("USST01");
  assert.ok(count.count > 2_000);
  const valuationCount = db.prepare("SELECT COUNT(*) AS count FROM valuation_history v JOIN etfs e ON e.id = v.etf_id WHERE e.symbol = ?").get("USST01");
  assert.equal(valuationCount.count, count.count);
  const betweenReports = db.prepare("SELECT date, pe_ratio AS peRatio FROM valuation_history v JOIN etfs e ON e.id = v.etf_id WHERE e.symbol = ? AND v.date IN (?, ?) ORDER BY v.date").all("USST01", "2025-10-30", "2025-11-28");
  assert.equal(betweenReports.length, 2);
  assert.notEqual(betweenReports[0].peRatio, betweenReports[1].peRatio);
});

test("supports the screener's indexed market and currency query", () => {
  const rows = db.prepare("SELECT symbol FROM etfs WHERE country = ? AND currency = ? ORDER BY symbol").all("US", "USD");
  assert.ok(rows.length >= 5);
});
