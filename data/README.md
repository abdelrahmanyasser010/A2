# Development persistence

`store.json` is the active Phase 3 development datastore.

`demo-seed.json` is the resettable temporary catalogue used while the real A² product photography and product master data are not ready yet.

Useful commands:
- `npm run demo:reset` — restore the full temporary catalogue.
- `npm run demo:clear` — clear demo business records but keep settings.
- `npm run demo:clear:all` — clear demo records and remove `public/media/demo/`.

This JSON repository remains a development/demo persistence layer. Production must move to PostgreSQL/Prisma or another durable database before deployment.
