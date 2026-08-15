# Local data model

The generated `data/simple_etf.sqlite` database contains four read-only tables:

- `etfs` — ETF identity, benchmark, fund facts, and classifications.
- `etf_metrics` — valuation and return snapshots, keyed by ETF and as-of date.
- `price_history` — monthly synthetic close prices in local trading currency.
- `return_history` — monthly price/total returns and normalized total-return index.

`data/source/etfs.csv`, `price_history.csv`, and `return_history.csv` are the
version-controlled source of truth. Run `npm run db:seed` to recreate the local
database; never edit the generated SQLite file directly.

All data is illustrative. No external APIs, real-time feeds, or data-licensing
workflow are in scope.
