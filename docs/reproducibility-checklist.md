# Reproducibility checklist

## Current local dataset

```bash
npm install
npm run data:generate -- --seed 42
npm run db:seed
npm run db:check
```

This manual run generates through the last Monday–Friday working day before execution. It is appropriate when the local fixture data needs to be refreshed.

## Exact reproducible dataset

```bash
npm install
npm run data:generate -- --seed 42 --end-date 2026-08-14
npm run db:seed
npm run db:check
```

This fixed-date run is appropriate for debugging, testing, and rebuilding an identical historical dataset. Same source version, seed, and end date must produce identical CSVs and logical SQLite contents.

To prove it, run:

```bash
npm run data:reproducibility -- --seed 42 --end-date 2026-08-14
```

The check generates and seeds twice with the same explicit date, validates both databases, and compares generated CSV bytes plus a canonical SQLite dump. It does not run automatically.
