# A² Store

Premium mobile-first fashion ecommerce storefront + operations dashboard.

## Phase 4 highlights
Phase 4 keeps the full working demo path and adds the infrastructure needed to move the same application to production data:

- PostgreSQL + Prisma repository adapter
- atomic checkout stock handling
- relational products / variants / orders / customers / discounts / inventory
- PostgreSQL demo seed and cleanup commands
- admin Media Library
- direct product-image and 360-frame uploads/selections
- local media storage for development
- S3-compatible object storage for production

The detailed Arabic product specification remains in the repository root as `A2_Ecommerce_Project_Specification_AR.docx`.

## Quick local demo
```bash
npm install
cp .env.example .env.local
# Keep A2_STORE_BACKEND=json and MEDIA_STORAGE=local
npm run dev
```

Open `http://localhost:3000`.

### Development admin login
When `NODE_ENV !== production` and admin environment variables are not set:
- Email: `admin@a2.local`
- Password: `A2admin2026`

Admin: `http://localhost:3000/admin`
Media Library: `http://localhost:3000/admin/media`

## PostgreSQL development mode
```bash
# Optional local DB
# docker compose -f docker-compose.postgres.yml up -d

# Set DATABASE_URL and A2_STORE_BACKEND=prisma in .env.local
npm run db:generate
npm run db:migrate:deploy
npm run db:seed:demo
npm run dev
```

## Useful commands
```bash
npm run dev
npm run build
npm run typecheck
npm run lint

# JSON demo data
npm run demo:reset
npm run demo:clear
npm run demo:clear:all

# Prisma/PostgreSQL
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:migrate:deploy
npm run db:seed:demo
npm run db:clear
npm run db:studio

# Media
npm run media:check
```

## Media
The Product editor no longer requires manually typing image paths. Upload images directly, browse the media library, order the product gallery, and build the 360 sequence from uploaded frames.

For production, use `MEDIA_STORAGE=s3`. See `DATABASE_AND_MEDIA.md` for S3/R2 configuration and the complete PostgreSQL setup.

## Demo catalogue
The temporary development products are still available so the storefront remains reviewable before final photography/master data are ready. See `DEMO_DATA.md` before production cleanup.

## Project tracking
- `PROJECT_STATUS.md` — implementation milestone/status
- `DATABASE_AND_MEDIA.md` — PostgreSQL and media deployment setup
- `DEMO_DATA.md` — temporary data and cleanup rules
- `docs/IMPLEMENTATION_NOTES.md` — engineering notes
