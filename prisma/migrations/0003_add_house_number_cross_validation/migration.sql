-- AlterTable
ALTER TABLE "Property" ADD COLUMN "listingHouseNumber" TEXT;
ALTER TABLE "Property" ADD COLUMN "targetHouseNumber" TEXT;
ALTER TABLE "Property" ADD COLUMN "effectiveHouseNumber" TEXT;
ALTER TABLE "Property" ADD COLUMN "targetMatch" BOOLEAN;
ALTER TABLE "Property" ADD COLUMN "targetMismatchReason" TEXT;
