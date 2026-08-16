# Codex reproduction prompt

Use this prompt in a future Codex session after giving it local access to this repository:

> Work in this Simple ETF repository as a senior software, data, and financial-data application reviewer. Read `docs/project-spec.md` first, then inspect Git status and the complete repository before editing. Preserve unrelated changes and keep the product intentionally small, fictional, local-only, and free of external services or real market data.
>
> Trace Python → generated CSV → SQLite → server-only queries → Next.js routes → React tables/charts. Treat the Python generator as the authoritative first-class data pipeline. Verify deterministic seed handling, `etfs.csv`, price/return formulas, quarterly fundamentals, daily P/E/P/B, Stock versus Bond/Commodity null rules, schema/types/queries/indexes, server/client boundaries, accessibility, responsive behavior, and all comparison-chart requirements in `docs/project-spec.md`.
>
> Before significant structural work, summarize findings and proposed focused changes. Use `apply_patch`; do not rewrite without need, add scope, commit, push, deploy, or delete unrelated files. Update the relevant docs and changelog with any behavior or formula change.
>
> Finish by running `npm run data:generate -- --seed 42`, `npm run db:seed`, `npm run db:check`, `npm test`, `npm run test:db`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run data:reproducibility -- --seed 42`. Report exact results, changed files, financial methodology, data counts, reproducibility hashes, limitations, Git status, and explicit confirmation that no commit/push/deployment or real/external data was introduced.

The authoritative behavior is in [project-spec.md](project-spec.md); the prompt intentionally points there instead of duplicating every implementation detail.
