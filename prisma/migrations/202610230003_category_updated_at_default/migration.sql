-- Forward-only reconciliation: Prisma @updatedAt is authoritative.
-- Existing Category timestamp values and historical migrations are unchanged.
ALTER TABLE "Category" ALTER COLUMN "updatedAt" DROP DEFAULT;
