BEGIN;

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_productId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "address" TEXT,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "subtotal" DECIMAL(18,2),
ADD COLUMN     "total" DECIMAL(18,2),
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "unitPrice" DECIMAL(18,2),
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(18,2),

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Preserve existing references, customer fields, status and timestamps.
-- The old schema never stored an order price. NULL explicitly means unknown.
INSERT INTO "OrderItem" ("id", "orderId", "productId", "variantId", "productName", "variantName", "imageUrl", "unitPrice", "quantity", "subtotal")
SELECT 'legacy-' || o."id", o."id", o."productId", NULL,
       COALESCE(p."name", 'Legacy product'), COALESCE(o."size", 'Standard'),
       COALESCE(p."featuredImageUrl", ''), NULL, o."quantity", NULL
FROM "Order" o LEFT JOIN "Product" p ON p."id" = o."productId"
WHERE o."productId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "OrderItem" i WHERE i."orderId" = o."id");
UPDATE "Order" SET "orderNumber" = "id" WHERE "orderNumber" IS NULL;

COMMIT;
