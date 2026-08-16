# Development guide

Put route/data loading in `app/` and `lib/etfs.ts`, interaction in the relevant component, shared types in `lib/types.ts`, financial logic in `scripts/`, and schema/import work in `seed_database.py`.

Adding a field requires generator, schema/import, explicit query, TypeScript type, validation, test, and documentation updates. Define formula and null rules before adding a metric. Preserve the comparison chart’s vertical-distance hover selection, daily observations, right y-axis, and two handles.

After generator/schema changes run:

```bash
npm run data:generate -- --seed 42
npm run db:seed
npm run db:check
npm test
npm run test:db
npm run lint
npx tsc --noEmit
npm run build
```

A missing database requires seeding; missing CSVs require generation. Fix schema/type mismatches at explicit projections rather than casting them away.

## Common changes

- New ETF field: update the metadata generator and CSV dictionary, schema/import list, validator, explicit server query, shared type, relevant UI, and tests.
- New screener filter: add the domain field, server/filter mapping if server-filtered, client filter key/label, and a filter test. Keep values categorical and useful.
- New metric: define units/formula/null behavior first; generate or derive it in Python/SQLite, then project and display it. Do not independently recreate financial formulas in React.
- Chart change: keep data loading in the route, transformation in a small pure helper where possible, and pointer/keyboard interaction in the client chart. Preserve daily comparison data, right y-axis, independent handles, current-date tooltip, and vertical-only closest-line selection.
- Schema change: edit `SCHEMA` and loader together, regenerate from CSV, and add a database/validator assertion. Never patch the generated database manually.

For troubleshooting, run generation steps individually to isolate missing input, then `npm run db:seed` and `npm run db:check`. A `fileMustExist` error means the database has not been built. A missing profile means a generated `tracking_index` is not represented in `PROFILES`. Type errors after schema changes usually mean an explicit SQL alias and `lib/types.ts` disagree.
