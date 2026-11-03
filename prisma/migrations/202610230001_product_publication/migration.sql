-- Approved legacy policy: every pre-existing product remains publicly visible.
-- Add with PUBLISHED for the existing rows, then change only the insertion default.
-- This migration is prepared locally; do not apply to production from this phase.
CREATE TYPE "ProductPublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
ALTER TABLE "Product" ADD COLUMN "publicationStatus" "ProductPublicationStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Product" ALTER COLUMN "publicationStatus" SET DEFAULT 'DRAFT';

-- Price input stays explicit. Remove the old stock default without changing saved values.
-- Phase 3C.1 retires website inventory; the next migration makes legacy stock optional.
ALTER TABLE "ProductVariant" ALTER COLUMN "price" DROP DEFAULT;
ALTER TABLE "ProductVariant" ALTER COLUMN "stock" DROP DEFAULT;
