# Simple ETF

Simple ETF is a deliberately small, local-only ETF screener for UI and data-pipeline development. Every fund, identifier, price, return, and valuation is fictional; nothing is investment information.

## Features and stack

- Next.js 16, React 19, strict TypeScript, local read-only SQLite, and deterministic Python
- screener filters/sorting, detail and comparison pages
- daily price, cumulative-return, P/E, and P/B charts

## Setup

```bash
npm install
npm run data:generate -- --seed 42
npm run db:seed
npm run db:check
npm run dev
```

## Synthetic Data

This project uses fictional ETF data. Regenerate it manually with:

```bash
npm run data:generate -- --seed 42
```

The generator creates data through the last working day before execution; starting or refreshing Next.js never regenerates it. To reproduce a particular dataset exactly, use a fixed date:

```bash
npm run data:generate -- --seed 42 --end-date 2026-08-14
```

Then run `npm run db:seed` and `npm run db:check`. See the [data pipeline](docs/data-pipeline.md) and [reproducibility checklist](docs/reproducibility-checklist.md) for the complete workflow.

The default seed is `42`. Useful checks are `npm run db:check`, `npm test`, `npm run test:db`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`. `npm run data:reproducibility -- --seed 42 --end-date 2026-08-14` performs two complete generations/rebuilds and compares every generated CSV byte plus a canonical logical SQLite dump.

## Structure

- `app/`: server routes
- `components/`: feature UI
- `lib/`: server database access, types, and calculations
- `scripts/`: generation, rebuild, and validation
- `data/source/`: generated local CSVs
- `data/simple_etf.sqlite`: generated local database
- `tests/` and `docs/`: checks and project documentation

See [architecture](docs/architecture.md), [data pipeline](docs/data-pipeline.md), [data model](docs/data-model.md), [development guide](docs/development-guide.md), [project specification](docs/project-spec.md), and the [reproducibility checklist](docs/reproducibility-checklist.md).

## Limitations and non-goals

Weekdays are not exchange-holiday calendars; currencies are not converted; distributions use a smooth annual assumption; valuations are ETF/index-level rather than holdings-level. Authentication, payments, deployment, cloud services, Docker, external APIs, real/real-time data, SEO, analytics, and licensing systems are intentionally out of scope.
