# Changelog

## Unreleased

- Added one documented deterministic seed interface.
- Derived Stock valuations from market value, earnings, and book value; retained null Bond/Commodity valuation.
- Added fictional ISIN, exchange, currencies, and index-provider Key Data.
- Strengthened constraints, validation, and tests.
- Corrected daily return column names previously labeled monthly.
- Limited comparison history loading to selected ETFs while preserving chart behavior.
- Added complete architecture, pipeline, model, development, reproducibility, and project-spec documentation.
- Added automated two-run CSV/logical-SQLite reproducibility proof and direct validation of daily return and valuation formulas.
- Added a pure regression-tested vertical-distance series selector without changing comparison interaction.
- Removed redundant history indexes already supplied by composite primary keys.
- Added an explicit unavailable state for non-Stock valuation charts.
