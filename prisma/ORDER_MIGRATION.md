# Cart and multi-item orders: deployment

No database commands have been applied by this change. Do not seed or reset an existing database.

The repository originally had no migration history. `prisma/baseline.prisma` and `20260905000000_baseline` capture its original schema. `20260905010000_multi_item_orders` adds order fields and OrderItem, makes the legacy product reference nullable, and backfills one snapshot per legacy order in the same SQL transaction. No tables, products, orders, admins or legacy columns are deleted.

Before deployment, take a database backup/Neon branch and test on that branch. Configure DATABASE_URL in the project .env (use .env.example as a guide). The server now loads .env before initializing Prisma. Stop writes during migration and deploy the matching application build afterward.

For an EXISTING database, first inspect:

```powershell
npx prisma migrate status
npx prisma migrate diff --from-schema-datasource prisma/baseline.prisma --to-schema-datamodel prisma/baseline.prisma --exit-code --script
```

The diff must report no differences (exit 0). If it reports differences (exit 2), or there is an existing migration history that does not match these migrations, reconcile the actual schema/history first. Do not mark a mismatching baseline as applied.

For an existing matching database with no prior migration history, mark ONLY the original baseline as already applied, then apply the additive migration:

```powershell
npx prisma migrate resolve --applied 20260905000000_baseline
npx prisma migrate deploy
npx prisma generate
npm run build
npm start
```

For an EMPTY database, do not mark the baseline applied. Run `npx prisma migrate deploy`, then generate/build/start as above. Admin provisioning remains the existing startup behavior.

## Legacy data

The backfill is included in the migration; no separate data script is required. It retains old order IDs as order numbers, direct product references, quantities, sizes, customer details, dates and status. The old schema had no order price or total. Therefore legacy unitPrice/subtotal/total stay NULL, displayed as “Unknown (legacy order)”. Product names and images for legacy items can only be captured as they exist at migration time; earlier renames and original prices cannot be recovered from this schema. Variant references are left NULL because size alone cannot reliably identify a variant.

New orders always receive Decimal prices/totals and immutable name/variant/image snapshots. Existing product variant Float prices were not converted. Checkout rounds each authoritative unit price to two decimal places before Decimal multiplication and addition. Total equals subtotal; no fees or stock deduction were added.

## Verify on the database branch

1. Edit product name and independently edit variant name, size, SKU, price, compare price, stock and availability. Save, reload admin, shop and product details. Check existing variant IDs remain the same.
2. Add three products with quantities 1/2/1. Repeat one variant, then add a second variant of the same product. Verify merging, separate rows, quantity changes, removal, totals and refresh persistence.
3. Submit checkout. Verify one Order and all OrderItems, server prices, order confirmation and cart clearing. Submit an invalid/unavailable/overstock item and confirm the cart remains and no Order is created.
4. Open admin order details. Rename/reprice a product and variant afterward; verify the old order still displays its original snapshots.
5. Inspect old orders and counts before/after migration. Unknown legacy monetary amounts must remain clearly marked.

Local checks: `npm run lint`, `npx tsx --test tests/cart-checkout.test.ts`, `npm run build`. Automated tests use an isolated transaction double, not a live PostgreSQL database. Browser/database acceptance checks require the configured branch.
