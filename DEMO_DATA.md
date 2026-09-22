# A² Demo Data

This repository intentionally ships with temporary development data so the storefront, mobile UX and admin workflows can be reviewed before production content exists.

## Included right now
- 9 demo products across T-Shirts, Hoodies, Pants and Sets.
- Color × size variant matrices with independent SKU and stock levels.
- 12 demo orders covering the main fulfilment/return states.
- 10 fake customers using non-production contact details.
- Automatic product/collection discounts and coupon examples.
- Inventory movement history for dashboard and stock testing.
- Temporary product/campaign assets inside `public/media/demo/`.
- A few copied sample assets under `public/uploads/products/demo/` so the new Media Library is populated on first run.

## JSON demo backend
Restore:
```bash
npm run demo:reset
```

Clear records while retaining settings:
```bash
npm run demo:clear
```

Clear records and the old temporary demo media:
```bash
npm run demo:clear:all
```

## PostgreSQL demo backend
After setting `A2_STORE_BACKEND=prisma` and provisioning the schema:
```bash
npm run db:seed:demo
```

Clear PostgreSQL commerce records:
```bash
npm run db:clear
```

The PostgreSQL cleanup intentionally does **not** delete object-storage uploads. Media is managed separately from commerce data to avoid accidental file loss.

## Production rule
Do not launch using demo customers/orders, placeholder support details or temporary product photography. Before go-live, switch to PostgreSQL, configure production object storage, clear the demo seed, import the real product master/SKUs/stock, upload final photography/360 frames, and complete payment/shipping integration testing.
