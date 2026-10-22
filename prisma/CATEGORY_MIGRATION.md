# Product categories deployment

Migration: `20260906000000_product_categories`.

The migration has been created and inspected but has NOT been applied to the configured database. No database reset, push, seed, truncate, or data deletion was performed.

Before deploying the matching application, apply the migration to a database branch/backup first and verify product/category counts and assignments. Follow `ORDER_MIGRATION.md` if the original baseline or order migration has not yet been recorded/applied. Do not mark a baseline applied without checking that it matches the existing database.

From the project directory, with the intended DATABASE_URL configured:

```powershell
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
npm run build
```

`migrate deploy` applies all pending migration files in order, including the existing cart/order migration when pending. Stop the development server before regenerating Prisma Client on Windows if its engine DLL is locked. Start the matching application after migration and generation.

## Architecture and preservation

- Category has a stable ID, unique name, unique slug, timestamps, and a products relation. Renaming changes only the name, preserving its ID and slug.
- Product has a required, indexed categoryId with a Category relation and an ON DELETE RESTRICT foreign key. Deleting an assigned category returns HTTP 409 and explains that products must be reassigned, including during concurrent assignment attempts.
- Every distinct original Product.category string is inserted into Category and connected to its products. Numbered migration IDs/slugs avoid normalization collisions. No product or variant IDs, order data, admins, or images are deleted or recreated by this migration.
- The old category column is renamed legacyCategory and kept nullable with `@ignore` in Prisma solely as an audit copy. It is not used as a second application category source. New products need not populate it.
- `/api/categories` supplies Admin forms, Shop filtering, and desktop/mobile Shop navigation, including categories without products. Public reads are allowed; create, rename, and delete use existing admin authentication.
- The product API retains a derived category-name string for existing display consumers and adds categoryId. Product writes submit categoryId. Existing product-preview fixtures remain available without a database; category management requires PostgreSQL and shows an error when unavailable.

## Acceptance checks after migration

1. Compare product, variant, order, admin, and image counts/IDs before and after. Confirm every product has a valid categoryId and its category name matches legacyCategory before any renames.
2. Create a category with no products; verify it appears in Admin Add/Edit and the Shop dropdown. Rename an assigned category and verify its products display/filter under the new name.
3. Attempt to delete an assigned category; expect 409 and unchanged product data. Reassign the products, then delete the unused category.
4. Save new and existing variants with blank names, then blank names and sizes. Reload to verify empty fields remain empty and existing variant IDs stay stable. Display labels should be the size or Standard.
5. Add the same variant multiple times and another variant of the same product: navbar counts cart lines, while quantities and totals remain correct. Verify modal close, backdrop, ESC, quantity controls, removal, checkout, and persisted cart after closing.
6. Submit checkout and inspect both new and legacy Admin order details.

Automated tests use transaction/database doubles and an isolated HTTP server; they do not apply SQL or write to the configured database. Browser/live PostgreSQL acceptance checks remain to be performed after deployment.
