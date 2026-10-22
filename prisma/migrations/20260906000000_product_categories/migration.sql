BEGIN;

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- Keep every exact legacy category value, including whitespace/case differences.
-- Numbered IDs/slugs avoid collisions for names that normalize to the same slug.
INSERT INTO "Category" ("id", "name", "slug")
SELECT 'legacy-category-' || n, name,
  COALESCE(NULLIF(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'category') || '-' || n
FROM (SELECT "category" AS name, row_number() OVER (ORDER BY "category") AS n
      FROM "Product" GROUP BY "category") AS existing;

ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;
UPDATE "Product" p SET "categoryId" = c."id" FROM "Category" c WHERE p."category" = c."name";
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Retain the original values for audit/rollback, outside the active Prisma model.
-- All application reads/writes now use Category via categoryId.
ALTER TABLE "Product" RENAME COLUMN "category" TO "legacyCategory";
ALTER TABLE "Product" ALTER COLUMN "legacyCategory" DROP NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "legacyCategory" DROP DEFAULT;
COMMIT;
