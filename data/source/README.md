# Local ETF fixtures

All files here are fictional, illustrative local data. They do not describe a
real fund, market price, or investment result.

- `etfs.csv` contains static ETF facts and each ETF's annual distribution-yield
  assumption.
- `prices/YYYY.csv` contains the canonical price/NAV history, partitioned by
  year. The current toy fixture is monthly; the same layout supports daily rows.
- `fundamentals/index_valuation_baselines.csv` stores one starting P/E and P/B
  for each tracked index.
- `fundamentals/index_valuation_events.csv` stores sparse quarterly earnings
  and book-value indices. SQLite uses these with prices to derive historical
  P/E and P/B, rather than storing a valuation row as a source file every day.
- `metrics/YYYY-MM-DD.csv` is a compact generated screener snapshot.

Run `python3 scripts/generate_price_history.py`, then
`python3 scripts/generate_metrics_snapshot.py`, then `npm run db:seed` to
rebuild the toy data pipeline.
