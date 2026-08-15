# Planned local data model

The initial SQLite database will contain `etfs`, `etf_metrics`, and
`price_history` tables. Local CSV files in `data/source/` will be the
version-controlled source data, and a Python script will recreate the database
from those files.

No external APIs, real-time feeds, or data-licensing workflow are in scope.
