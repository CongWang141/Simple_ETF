# Updating local fixture data

The project is local-only. CSV fixture files in `data/source/` are the source
of truth; `data/simple_etf.sqlite` is generated and must not be edited by hand.

## Refresh workflow

1. Update ETF facts in `data/source/etfs.csv`.
2. Add directly reported quarterly P/E and P/B observations to
   `data/source/fundamentals/index_valuation_snapshots.csv`.
3. If changing price/volatility assumptions, update
   `scripts/generate_price_history.py` and run:

   ```bash
   python3 scripts/generate_price_history.py
   python3 scripts/generate_metrics_snapshot.py
   ```

   The first command regenerates yearly files in `prices/`. The second creates
   the latest compact screener snapshot in `metrics/`.

3. Recreate and check the SQLite database:

   ```bash
   npm run db:seed
   npm run db:check
   ```

4. Run the full quality check before committing:

   ```bash
   npm test
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

Commit the CSV fixture and source-code changes. Do not commit
`data/simple_etf.sqlite`, `node_modules/`, or `.next/`.

## Data conventions

- Return fields are percentages, for example `12.50` means 12.50%.
- `total_return_index` is generated inside SQLite and assumes reinvested
  illustrative dividends.
- Historical price values remain in each ETF's stated currency; do not compare
  their price levels across currencies.
- All values are illustrative toy data, not investment information.
