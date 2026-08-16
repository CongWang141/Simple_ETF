# Authoritative project specification

Simple ETF is a local-only fictional screener for one developer. It retains screening/sorting, detail and comparison pages, daily price/cumulative-return/P/E/P/B charts, synthetic data, and SQLite.

The required architecture is deterministic Python → CSV → reproducible SQLite → server-only queries → Next.js/React. Seed 42 is default. Stock ratios derive from synthetic market value, earnings, and book value; Bond/Commodity ratios are null. Daily ratios keep per-unit fundamentals constant between quarterly reports while price moves. Total return includes the documented smooth distribution assumption.

The app is read-only and local. Authentication, payments, deployment, cloud services, Docker, external APIs, real/real-time data, SEO, analytics, licensing logic, and holdings complexity are non-goals.

Changes must preserve parameterized explicit queries, asset-class null rules, the custom comparison hover algorithm, keyboard-operable range handles, responsive layouts, and validation/reproducibility. See [architecture](architecture.md), [pipeline](data-pipeline.md), [model](data-model.md), and [development guide](development-guide.md).

## Required product behavior

The screener filters and sorts the fictional universe. Each ETF route shows professional-style Key Data plus daily price, selected-period cumulative total return, and (when applicable) daily P/E and P/B. Comparison accepts two to eight valid unique tickers and loads only those histories.

Comparison observations remain daily and use a right-side y-axis and two independently movable pointer/keyboard range handles. At the current x-axis date, highlighting compares only the cursor-to-line vertical distance in chart coordinates. It does not use Euclidean/horizontal distance or nearest-point selection. The tooltip identifies the ETF by long name before value, with ticker secondary if shown, and updates as vertical cursor position changes.

## Data and financial rules

Generation uses one integer seed (default 42), a fixed 2025-12-31 end date, valid weekdays from each inception, deterministic price profiles, and a smooth documented annual distribution accrual. Outputs are synthetic and must never be described as real performance.

Stock P/E and P/B derive from positive aggregate market value, earnings, and book value. Non-positive, tiny, non-finite denominators produce unavailable ratios rather than zero, infinity, or NaN. Current fixtures use valid positive Stock denominators. Bond and Commodity P/E/P/B are always unavailable: null metrics and no history rows. Between reports, per-unit fundamentals remain fixed while daily prices move the ratios.

## Repository and quality contract

`app/` contains server routes, `components/` interactive feature UI, `lib/` server queries/types/pure presentation helpers, `scripts/` the authoritative generator/schema/validation pipeline, `data/source/` generated CSVs, `data/simple_etf.sqlite` the generated database, `tests/` checks, and `docs/` maintenance guidance. Generated data and the database remain ignored local artifacts.

Every handoff runs generation, rebuild, validation, JavaScript/Python tests, lint, strict TypeScript, production build, and same-seed reproducibility. No commit, push, deployment, external data/service, or unrelated cleanup is part of an audit unless separately authorized.
