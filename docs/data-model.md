# Local data model

The generated `data/simple_etf.sqlite` database contains four read-only tables:

- `etfs` — ETF identity, benchmark, fund facts, and classifications.
- `etf_metrics` — valuation and return snapshots, keyed by ETF and as-of date.
- `price_history` — monthly synthetic close prices in local trading currency.
- `return_history` — monthly price/total returns and normalized total-return index.
- `valuation_history` — P/E and P/B derived for every price observation from
  the latest quarterly direct valuation snapshot.

`data/source/etfs.csv`, yearly `prices/*.csv`, and the sparse `fundamentals/`
CSV files are the version-controlled source of truth. Run `npm run db:seed` to
recreate the local database; never edit the generated SQLite file directly.

All data is illustrative. No external APIs, real-time feeds, or data-licensing
workflow are in scope.
