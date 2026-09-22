# A² Implementation Notes — Phase 3

## Architectural choice in this build
The application has a real server mutation boundary and repository layer. The repository currently persists to `data/store.json` so all ecommerce flows can run without network/database provisioning.

The domain model mirrors the PostgreSQL/Prisma target: products, color/size variants, SKU stock, orders, status events, customers, discounts, inventory movements and settings.

## Temporary demo content
Development data is deliberately isolated:
- Business records: `data/demo-seed.json` → active `data/store.json`.
- Product demo assets: `public/media/demo/`.
- Admin displays a DEMO DATA banner while `store.meta.demoData` is true.
- `npm run demo:reset` restores demo records.
- `npm run demo:clear` clears demo records and preserves settings.
- `npm run demo:clear:all` additionally deletes the demo-media directory.

This is intended to make production cleanup explicit and reproducible instead of relying on manual deletion.

## Security
- Admin pages are protected by a signed HTTP-only cookie.
- Admin mutation APIs independently verify the session.
- Checkout never trusts price totals sent by the browser; it recalculates product price, discounts, shipping and stock on the server.
- Order lookup requires both order number and checkout phone.

## Inventory rules
- Stock is held per variant, never at product level.
- Checkout deducts stock within the serialized repository mutation queue.
- Cancellation/returned status restocks once and records movements.
- Manual stock changes produce an audit movement.

## Promotions
- Automatic product/collection promotions can change storefront effective prices.
- Coupon codes are validated server-side and support order/product/collection scope, minimum spend, date window and usage limit.
- Promotion stacking remains conservative: best automatic product-level discount + one coupon.

## Production migration
Before launch:
1. Implement a Prisma/PostgreSQL repository with database transactions.
2. Run migrations and controlled production seeds.
3. Move product media to object storage/CDN.
4. Integrate payment gateway webhooks and idempotency keys.
5. Integrate shipping/tracking and notifications.

## Phase 4 — PostgreSQL + Media
- `src/server/store-db.ts` is now the stable repository facade; JSON and Prisma implementations sit behind it.
- Prisma checkout uses a serializable transaction and conditional stock decrement (`stockOnHand >= quantity`).
- Order/product/customer snapshots remain on order records so catalogue edits do not rewrite history.
- `/admin/media` uses the same API for local development files or S3-compatible object storage.
- Product gallery and spin-frame arrays are persisted as ordered `ProductImage` rows when the Prisma adapter is active.
- Local upload storage is deliberately excluded from Git. Production must use object storage because serverless/local filesystems may be ephemeral.
