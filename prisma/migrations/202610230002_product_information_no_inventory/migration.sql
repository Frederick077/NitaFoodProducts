-- Prepared locally only. No existing stock values or product text are changed.
ALTER TABLE "ProductVariant" ALTER COLUMN "stock" DROP NOT NULL;
ALTER TABLE "ProductVariant" ALTER COLUMN "stock" DROP DEFAULT;
ALTER TABLE "Product" ADD COLUMN "nutrients" TEXT NOT NULL DEFAULT '',
                      ADD COLUMN "nutritionBasis" TEXT NOT NULL DEFAULT '',
                      ADD COLUMN "howToUse" TEXT NOT NULL DEFAULT '';
