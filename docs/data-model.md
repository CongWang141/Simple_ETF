# Data model

SQLite is rebuilt from CSV and opened read-only by Next.js.

| Table | Purpose and key |
| --- | --- |
| `etfs` | identity, classification, currencies, dates, AUM/TER, distribution assumption; integer PK, unique symbol/ISIN |
| `etf_metrics` | latest return and nullable valuation snapshot; ETF/date PK |
| `price_history` | positive daily close and trading currency; ETF/date PK |
| `return_history` | daily price/total return, total-return index, cumulative return; ETF/date PK |
| `valuation_snapshots` | quarterly Stock-index fundamentals and derived ratios; index/report-date PK |
| `valuation_history` | daily derived Stock P/E/P/B; ETF/date PK |

ETF child tables reference `etfs.id`. Composite primary keys already index ETF/date lookups; the only additional named index covers the screener's classification-filter order. Bond and Commodity latest ratios are SQL `NULL` and have no valuation-history rows—zero never represents unavailable.

Python/CSV and SQLite use snake_case. Explicit aliases in `lib/etfs.ts` map to camelCase types in `lib/types.ts`. See [data-pipeline.md](data-pipeline.md) for formulas and `etfs.csv` fields.

## Columns and relationships

- `etfs`: `id` is the internal key; identity, classification, currency, domicile, inception, TER, AUM, policy, replication, benchmark, and distribution assumption columns are non-null except Stock-only `industry`/`strategy` on non-Stock funds.
- `etf_metrics`: one current row per ETF in this fixture. Return columns are percentage points; `pe_ratio`/`pb_ratio` are positive multiples for Stock and SQL `NULL` for Bond/Commodity.
- `price_history`: one positive close per ETF/business date in `currency`. `(etf_id, date)` prevents duplicates.
- `return_history`: one row for every price row. Daily return fields and cumulative return are percentage points; `total_return_index` starts at 100.
- `valuation_snapshots`: one report per Stock tracking index/quarter containing positive market value, earnings, book value, and their derived ratios.
- `valuation_history`: positive daily Stock ratios only. There are intentionally no rows for Bond/Commodity.

All ETF child tables reference `etfs(id)`. Named composite indexes mirror symbol-filter and ETF/date query patterns; unique/primary-key auto-indexes enforce identity. The application avoids `SELECT *` and maps each selected snake_case column to its TypeScript field explicitly.
