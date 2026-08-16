# Reproducibility checklist

```bash
npm install
npm run data:generate -- --seed 42
npm run db:seed
npm run db:check
npm test
npm run test:db
npm run lint
npx tsc --noEmit
npm run build
npm run data:reproducibility -- --seed 42
```

Expected scale: 72 ETFs, 210,474 prices/returns, 1,105 quarterly Stock-index snapshots, and 157,466 daily Stock valuation rows.

The final command performs the proof: it builds twice, hashes every generated source file by relative path and bytes, hashes `sqlite3.Connection.iterdump()` as a canonical logical database representation, and fails if either pair differs. Outputs embed no generation timestamps. A different seed intentionally changes prices and valuations; fixed metadata remains unchanged.

Never edit SQLite manually. The database and source CSV directory are local generated artifacts ignored by Git.
