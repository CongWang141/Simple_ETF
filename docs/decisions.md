# Architecture decisions

- Keep the first version local-only and read-only.
- Use Next.js with TypeScript for pages and UI.
- Use SQLite as the sole application datastore.
- Use Python only to seed the SQLite database from local fixture files.
- Keep generated databases and build outputs out of Git.
