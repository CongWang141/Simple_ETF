# Updating local fixture data

The project is local-only. CSV fixture files in `data/source/` are the source
of truth; `data/simple_etf.sqlite` is generated and must not be edited by hand.

## Refresh workflow

1. Update ETF facts in `data/source/etfs.csv`, or run `npm run data:generate`
   to regenerate the 72-ETF fictional universe. The generated universe has at
   least five ETFs for every available filter value.
2. Add directly reported quarterly P/E and P/B observations to
   `data/source/fundamentals/index_valuation_snapshots.csv`, or regenerate the
   fictional observations with `scripts/generate_valuation_snapshots.py`.
3. If changing price/volatility assumptions, update
   `scripts/generate_price_history.py` and run:

   ```bash
   npm run data:generate -- --seed 42
   ```

   This regenerates yearly daily-price files in `prices/`, quarterly valuation
   files in `fundamentals/`, and the latest compact screener snapshot in `metrics/`.

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

The data source directory is intentionally ignored by Git, so commit the
scripts and code but keep your local CSV data private. Do not commit
`data/simple_etf.sqlite`, `node_modules/`, or `.next/`.

## Data conventions

- Return fields are percentages, for example `12.50` means 12.50%.
- `total_return_index` is generated during the SQLite rebuild and applies the
  documented smooth illustrative distribution-yield assumption.
- Historical price values remain in each ETF's stated currency; do not compare
  their price levels across currencies.
- All values are illustrative toy data, not investment information.
