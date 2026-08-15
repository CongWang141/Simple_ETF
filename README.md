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
2. Run `npm run dev` and open the local URL shown in the terminal.

The Phase 0 foundation intentionally contains only the Next.js shell, base
styles, tooling configuration, and a placeholder database module. The ETF
screener, local fixture data, and SQLite schema begin in Phase 1.
