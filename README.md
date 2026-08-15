# Simple ETF

A local-only prototype for a simplified ETF screener. It will use Next.js and
TypeScript for the interface, SQLite for local data, and Python to build the
sample database.

## Planned layout

- `app/` — Next.js routes: screener, ETF detail, and comparison.
- `components/` — feature-specific and shared interface pieces.
- `lib/` — database access, domain queries, calculations, and shared types.
- `data/source/` — version-controlled local CSV fixtures.
- `data/simple_etf.sqlite` — generated local database (ignored by Git).
- `scripts/` — database seeding/import utilities.
- `tests/` — query, calculation, and interface tests.
- `docs/` — schema notes and lightweight architecture decisions.
- `public/` — optional static assets.

## Local setup

1. Run `npm install`.
2. Run `npm run db:seed` to create the local SQLite database from the fixture CSVs.
3. Run `npm run db:check` to verify the generated database.
4. Run `npm run dev` and open the local URL shown in the terminal.

Phase 1 provides local fixture CSVs, a reproducible SQLite seeder, and typed
read-only queries. The screener interface begins in Phase 2.

For the fixture-data refresh workflow, see [data updates](docs/data-updates.md).
For the automated checks and a short keyboard/layout review, see the
[quality checklist](docs/quality-checklist.md).
