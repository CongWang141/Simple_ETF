# Architecture

The data flow is deterministic Python generators → generated CSV files → SQLite rebuild → server-only queries → Next.js server routes → focused React client components.

`generate_data.py` passes one seed through metadata, prices, valuation fundamentals, and metrics. `seed_database.py` recreates SQLite; the application never writes to it.

- `app/page.tsx` loads compact summaries; `EtfScreener` owns filters, sorting, and selection.
- `app/etfs/[symbol]/page.tsx` loads one ETF and its histories; the chart owns range interaction.
- `app/compare/page.tsx` validates up to eight symbols and loads only their histories. The client preserves daily overlays, two handles, right-side axes, and vertical-only closest-line highlighting.
- `lib/etfs.ts` contains explicit parameterized projections; `lib/types.ts` mirrors them.

Database access stays server-side. Only serializable summaries and requested histories cross into client components.

## Responsibilities and boundaries

- `scripts/generate_*.py` own all synthetic financial assumptions and CSV production. `scripts/generation.py` owns the single default-seed interface.
- `scripts/seed_database.py` owns schema creation, CSV loading, total-return construction, and quarterly-to-daily valuation derivation. `scripts/verify_database.py` independently checks those results.
- `lib/db.ts` opens one local database read-only. `lib/etfs.ts` is the server-only query boundary and uses explicit projections and parameter binding. `lib/types.ts` is the shared serializable domain contract.
- Route files are server components. They validate route input and request only the summaries or histories needed by that page.
- `EtfScreener`, `HistoricalReturnChart`, and `EtfComparison` are client components because they own browser interaction. They receive data; they never access SQLite or calculate canonical financial facts.
- `lib/return-calculations.ts` contains small pure presentation calculations for rebasing/comparison and vertical-only hover selection, making required chart behavior testable without a browser.

There are no API routes, background services, caches, external requests, authentication, or write paths. This is deliberate for a one-developer local application.
