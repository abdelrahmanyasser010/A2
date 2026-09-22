# A² Project Status

## Version
0.4.0 — PostgreSQL/Prisma adapter + integrated Media Manager

## Implemented
- A² charcoal / off-white / olive visual system and responsive mobile-first storefront.
- Touch-first product spin viewer, wishlist, cart, checkout and order tracking/return request flow.
- Admin catalogue, color × size variants, independent SKU/stock, orders, inventory, discounts, customers, reports and settings.
- Resettable demo catalogue and isolated demo photography.
- **Production PostgreSQL repository through Prisma** with repository switching from the same storefront/admin APIs.
- Product/category/collection/variant/image relational model plus customer/order snapshots, discounts, inventory movements and atomic order counter.
- Checkout stock deductions inside a serializable database transaction with conditional stock update to reduce overselling risk.
- Committed initial PostgreSQL migration plus demo import and cleanup commands.
- **Media Library** at `/admin/media` with upload, browse, copy URL and delete actions.
- Product editor integration for uploading/selecting/reordering gallery images and ordered 360° frames.
- Local development media provider and S3-compatible production provider (S3/R2/Spaces/MinIO).
- Image type/size/count validation and generated safe object keys.
- Source specification remains at repository root: `A2_Ecommerce_Project_Specification_AR.docx`.

## Persistence modes
### Demo/local
`A2_STORE_BACKEND=json` → `data/store.json`.

### PostgreSQL
`A2_STORE_BACKEND=prisma` + `DATABASE_URL` → Prisma/PostgreSQL.

See `DATABASE_AND_MEDIA.md` for setup and production switch instructions.

## Media modes
### Development
`MEDIA_STORAGE=local` → `public/uploads/`.

### Production
`MEDIA_STORAGE=s3` → S3-compatible object storage with a public CDN/origin defined by `MEDIA_PUBLIC_URL`.

## Demo cleanup
- JSON adapter: `npm run demo:clear:all`
- PostgreSQL adapter: `npm run db:clear`
- Runtime uploads are intentionally separate from demo assets and are never deleted by database cleanup scripts.

## Next milestone — 0.5.0
1. Real payment gateway selection/integration for Egypt with webhook verification and idempotency.
2. Shipping zones/provider integration and shipment tracking.
3. Staff accounts + role/permission matrix using `AdminUser`.
4. Transactional email/SMS/WhatsApp notifications.
5. Product import/export CSV and bulk stock update.
6. Automated repository/API/browser tests and CI deployment pipeline.
7. Analytics events, structured-data SEO, sitemap/robots and production observability.

## Source of truth
`A2_Ecommerce_Project_Specification_AR.docx` in this repository root.
