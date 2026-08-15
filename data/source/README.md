# Local ETF fixtures

All files here are fictional, illustrative local data. They do not describe a
real fund, market price, or investment result.

- `etfs.csv` contains static ETF facts and each ETF's annual distribution-yield
  assumption.
- `prices/YYYY.csv` contains the canonical price/NAV history, partitioned by
  year. The current toy fixture is monthly; the same layout supports daily rows.
- `fundamentals/index_valuation_snapshots.csv` stores directly reported
  quarterly P/E and P/B ratios for each tracked index. SQLite converts each
  report into an implied earnings/book-value-per-unit value using the price at
  that report date, then derives P/E and P/B for each later price observation
  until the next quarterly report.
- `metrics/YYYY-MM-DD.csv` is a compact generated screener snapshot.

Run `python3 scripts/generate_price_history.py`, then
`python3 scripts/generate_metrics_snapshot.py`, then `npm run db:seed` to
rebuild the toy data pipeline.
