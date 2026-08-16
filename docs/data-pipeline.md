# Synthetic data pipeline

All output is fictional. Seed `42` is the default; the same seed and source version produce identical CSVs and logical SQLite contents. ETF metadata is deliberately fixed position-based fixture data, so its bytes are seed-independent; prices and valuation fundamentals consume the seed.

1. `generate_etf_universe.py` creates 72 ETFs across nine countries from fixed category tables and position-based fund facts.
2. `generate_price_history.py` emits weekdays from inception through 2025-12-31. A seeded per-symbol generator combines an index profile, deterministic cycle, and bounded Gaussian movement.
3. `generate_valuation_snapshots.py` creates quarter-end Stock-index fundamentals from 2009-12-31 through 2025-12-31: `P/E = market value / aggregate earnings` and `P/B = market value / aggregate book value`. Zero, negative, non-finite, or extremely small denominators are not meaningful ratios and must be unavailable; current fixtures intentionally use positive denominators. Bond/Commodity ratios are never generated.
4. `generate_metrics_snapshot.py` builds total-return indexes. `daily total return = price return + annual distribution yield × elapsed days / 365.25`.
5. `seed_database.py` holds per-unit fundamentals constant between reports: `earnings per unit = reference price × aggregate earnings / market value`, then `daily P/E = daily price / earnings per unit`; P/B is analogous. The reference price is the last ETF price on or before the report date (or the first available price when the ETF began later). A new report replaces the held fundamentals without interpolating the ratios.
6. `verify_database.py` validates constraints, uniqueness, finite values, null rules, formulas, dates, relationships, foreign keys, and indexes.

## `etfs.csv` dictionary

| Field | Type/unit | Origin or formula | Allowed values and downstream use |
| --- | --- | --- |
| `symbol` | text | country/asset/sequence-derived fictional ticker | unique, non-empty; routes, joins, display |
| `isin` | text | sequential fictional identifier | unique `XF` fixture value; display and SQLite identity |
| `name` | text | country + classification + strategy/asset suffix | non-empty; display and search context |
| `tracking_index` | text | selected from fixed country index lists or asset profile | must have a price profile; price and valuation generation |
| `index_provider` | text | first index-name token or `Synthetic Local` | non-empty; Key Data display |
| `market`, `country`, `region` | text | fixed country configuration | nine supported countries and matching Asia/Europe/America; filters/display |
| `exchange` | text | country-derived fictional local exchange | non-empty; Key Data display |
| `issuer` | text | country-derived fictional provider | non-empty; display |
| `asset_class` | enum | loop-defined | `Stock`, `Bond`, or `Commodity`; controls classifications/valuation nulls |
| `industry` | nullable text | rotating fixed list | required for Stock, empty/null otherwise; filter/display |
| `strategy` | nullable text | rotating fixed list | required for Stock, empty/null otherwise; filter/display |
| `fund_currency` | ISO-like code | country configuration | non-empty; Key Data display |
| `trading_currency` | ISO-like code | country configuration | equals generated price currency; price display |
| `domicile` | text | country configuration | non-empty; fund fact |
| `inception_date` | ISO date | `2010 + position % 10` with deterministic month/day | not after 2025-12-31; first history boundary |
| `ter` | percentage points | `0.10 + position-cycle` for Stock; asset formula otherwise | non-negative; screener/detail/comparison |
| `fund_size_million_usd` | USD millions | deterministic position formula | non-negative; screener/detail/comparison |
| `distribution_policy` | enum | alternating by position | `Accumulative` or `Distributive`; filter/display |
| `replication_method` | enum-like text | fixed fixture value | `Physical`; Key Data display |
| `benchmark_name` | text | index/country suffix-derived | non-empty; Key Data display |
| `assumed_annual_distribution_yield` | decimal fraction/year | deterministic asset/position assumption | non-negative; smooth total-return accrual only |

CSV is the generated source layer and SQLite is the sole application datastore; React does not reimplement financial calculations.

Generation deletes obsolete yearly price partitions before writing current ones. Metrics use the latest available observation on or before each requested horizon base date. Weekdays are used rather than exchange-specific holiday calendars, and dates stop at the fixed fixture date 2025-12-31.
