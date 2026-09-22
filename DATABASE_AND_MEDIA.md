# A² Database & Media Setup — Phase 4

Phase 4 adds two production-capable adapters while keeping the resettable JSON demo path available.

## 1. PostgreSQL / Prisma

The storefront and admin APIs continue importing `src/server/store-db.ts`. That file now selects one repository:

- `A2_STORE_BACKEND=json` → `data/store.json` (development/demo only)
- `A2_STORE_BACKEND=prisma` → PostgreSQL through Prisma
- if `A2_STORE_BACKEND` is omitted and `DATABASE_URL` exists, Prisma is selected automatically

### First database setup

If Docker is available, a local PostgreSQL service is included:

```bash
docker compose -f docker-compose.postgres.yml up -d
```

Then configure and initialize Prisma:

```bash
cp .env.example .env.local
# A2_STORE_BACKEND=prisma
# DATABASE_URL=postgresql://a2:a2_dev_password@localhost:5432/a2_store?schema=public
npm install
npm run db:generate
npm run db:migrate:deploy
npm run db:seed:demo
npm run dev
```

An initial PostgreSQL migration is already committed under `prisma/migrations/`. Use `db:migrate:deploy` for a clean database. `db:push` remains available only for disposable schema experiments; do not use it as the production deployment path.

For later schema changes, create a new migration in development:

```bash
npm run db:migrate -- --name describe_the_change
```

### Demo seed in PostgreSQL

`npm run db:seed:demo` imports the same temporary development catalogue used by the JSON adapter: products, variants, stock, customers, orders, discounts, inventory history, settings, and order counter.

To remove commerce demo data from PostgreSQL:

```bash
npm run db:clear
```

This leaves uploaded media untouched.

### Concurrency and inventory

Checkout runs inside a serializable Prisma transaction. Each variant stock decrement is conditional on `stockOnHand >= requested quantity`, so two simultaneous checkouts cannot intentionally sell the same final units. Orders store customer/product snapshots so historical records remain readable if catalogue data changes later.

## 2. Media Manager

Admin route: `/admin/media`

The Product editor also has integrated media fields for:

- ordered product gallery
- ordered 360° frames
- multi-file upload
- selecting existing assets from the library
- reordering/removing selected assets

Accepted types: JPEG, PNG, WebP, AVIF. Default maximum file size is 15 MB and a maximum of 40 files can be uploaded in one request.

### Local development storage

```env
MEDIA_STORAGE=local
```

Files are written to `public/uploads/`. This is suitable only for a persistent local/VPS development process and is intentionally git-ignored.

### S3-compatible production storage

Supported by the same media manager: AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO, or another S3-compatible provider.

```env
MEDIA_STORAGE=s3
MEDIA_PREFIX=products
S3_BUCKET=a2-store
S3_REGION=auto
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=false
MEDIA_PUBLIC_URL=https://cdn.example.com
```

Check required configuration with:

```bash
npm run media:check
```

`MEDIA_PUBLIC_URL` must be a public/CDN origin that serves the uploaded objects. The Next.js image configuration reads it at build time, so rebuild after changing that origin.

## 3. Production switch checklist

1. Provision PostgreSQL and set `A2_STORE_BACKEND=prisma`.
2. Run the committed Prisma migrations.
3. Configure S3/R2 media storage and CDN/public URL.
4. Upload real product images and ordered 24–36 frame 360 sequences.
5. Import the real product master, SKUs and stock.
6. Run `npm run db:clear` first if the production database was seeded with demo records.
7. Remove legacy demo media under `public/media/demo/` when no real product references it.
8. Run build/typecheck/lint and an end-to-end checkout/stock test before opening sales.
