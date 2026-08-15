import assert from "node:assert/strict";
import Database from "better-sqlite3";
import test from "node:test";

const db = new Database("data/simple_etf.sqlite", { readonly: true, fileMustExist: true });

test("reads ETF facts, metrics, and complete history from SQLite", () => {
  const etf = db.prepare("SELECT e.symbol, m.pe_ratio AS peRatio FROM etfs e JOIN etf_metrics m ON m.etf_id = e.id WHERE e.symbol = ?").get("USP500");
  assert.equal(etf.symbol, "USP500");
  assert.ok(etf.peRatio > 0);
  const count = db.prepare("SELECT COUNT(*) AS count FROM return_history r JOIN etfs e ON e.id = r.etf_id WHERE e.symbol = ?").get("USP500");
  assert.deepEqual(count, { count: 61 });
});

test("supports the screener's indexed market and currency query", () => {
  const rows = db.prepare("SELECT symbol FROM etfs WHERE market = ? AND currency = ? ORDER BY symbol").all("United States", "USD");
  assert.deepEqual(rows.map((row) => row.symbol), ["USDJIA", "USN100", "USP500", "USR2000"]);
});
