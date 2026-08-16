# Architecture decisions

- Keep the first version local-only and read-only.
- Use Next.js with TypeScript for pages and UI.
- Use SQLite as the sole application datastore.
- Use deterministic Python to generate CSV fixtures, seed SQLite, and validate
  financial/data integrity.
- Keep generated databases and build outputs out of Git.
