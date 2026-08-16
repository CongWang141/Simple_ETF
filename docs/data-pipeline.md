# Synthetic data pipeline

This local project uses fictional ETF data for development and UI testing. It is not real market data, investment information, or a market-data service.

## Manual execution only

The pipeline runs only when you explicitly execute it. Starting Next.js, refreshing the browser, building the application, or opening a page never generates data or changes SQLite.

```bash
npm run data:generate -- --seed 42
npm run db:seed
npm run db:check
```

`data:generate` determines the generation end date once, writes CSV files, and stops. `db:seed` then recreates `data/simple_etf.sqlite` from those files. Next.js reads that generated database; it does not generate market data at runtime.

## Generation end date

Without `--end-date`, the generator ends on the last Monday–Friday working day before the day it is run:

| Run day | Generation end date |
| --- | --- |
| Monday | Previous Friday |
| Tuesday–Friday | Previous weekday |
| Saturday or Sunday | Previous Friday |

For example, running it on Sunday 16-Aug-2026 produces data through Friday 14-Aug-2026. Weekends are excluded. Exchange holidays are not modelled.

For a fixed, reproducible run, supply a working-day date explicitly:

```bash
npm run data:generate -- --seed 42 --end-date 2026-08-14
```

The explicit date overrides the automatic calculation. It must be a Monday–Friday date no later than the most recent allowed working day, so the synthetic data never extends into the future.

Same source-code version, seed, and end date produce the same generated CSV and logical SQLite dataset. The default command may produce additional observations on a later calendar day because its end date changes.

## Stages and files

1. `scripts/generate_data.py` resolves one seed and one end date, then passes both to every stage.
2. `scripts/generate_etf_universe.py` writes `data/source/etfs.csv`, including deterministic ETF inception dates.
3. `scripts/generate_price_history.py` writes weekday price partitions to `data/source/prices/YYYY.csv`, from each ETF's inception through the shared end date.
4. `scripts/generate_valuation_snapshots.py` writes quarterly Stock-index fundamentals to `data/source/fundamentals/index_valuation_snapshots.csv`, through the shared end date. P/E is market value divided by aggregate earnings; P/B is market value divided by aggregate book value.
5. `scripts/generate_metrics_snapshot.py` derives total-return indexes from the generated prices and writes one latest snapshot to `data/source/metrics/`. It uses the existing smooth annual distribution-yield assumption and dynamic return horizons relative to the selected end date.
6. `scripts/seed_database.py` rebuilds SQLite, derives daily total returns, and holds quarterly fundamentals constant between reports to calculate daily P/E and P/B.
7. `scripts/verify_database.py` checks constraints, dates, weekday-only observations, uniqueness, inception boundaries, total-return formulas, valuation formulas, and SQLite integrity.

Every historical output shares the one resolved generation end date. ETFs have different inception dates, so their histories have different lengths; no observation is created before inception. Generated files and SQLite are local artifacts ignored by Git.

## Assumptions

Prices combine seeded per-ETF randomness, a deterministic market cycle, and index profiles. The seed controls prices and valuations; metadata is deterministic fixture data. Bond and commodity ETFs have no P/E or P/B. There are no external APIs, real-time feeds, exchange calendars, or automatic updates.
