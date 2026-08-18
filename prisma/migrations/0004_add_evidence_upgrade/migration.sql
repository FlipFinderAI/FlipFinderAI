-- AlterTable: Full EPC certificate data
ALTER TABLE "Property" ADD COLUMN "epcPotentialScore" INTEGER;
ALTER TABLE "Property" ADD COLUMN "epcExpiryDate" DATETIME;
ALTER TABLE "Property" ADD COLUMN "epcPropertyType" TEXT;
ALTER TABLE "Property" ADD COLUMN "epcWalls" TEXT;
ALTER TABLE "Property" ADD COLUMN "epcRoof" TEXT;
ALTER TABLE "Property" ADD COLUMN "epcWindows" TEXT;
ALTER TABLE "Property" ADD COLUMN "epcMainFuel" TEXT;
ALTER TABLE "Property" ADD COLUMN "epcRecommendations" TEXT;
ALTER TABLE "Property" ADD COLUMN "epcEstimatedCosts" TEXT;
ALTER TABLE "Property" ADD COLUMN "epcFullCertificate" TEXT;

-- AlterTable: Floor plans
ALTER TABLE "Property" ADD COLUMN "floorPlanImages" TEXT;

-- AlterTable: Primary photo and location
ALTER TABLE "Property" ADD COLUMN "primaryPhoto" TEXT;
ALTER TABLE "Property" ADD COLUMN "latitude" REAL;
ALTER TABLE "Property" ADD COLUMN "longitude" REAL;

-- AlterTable: Address confidence tracking
ALTER TABLE "Property" ADD COLUMN "addressConfidence" TEXT;
ALTER TABLE "Property" ADD COLUMN "addressSource" TEXT;

-- AlterTable: PropertyPhoto source tracking and ordering
ALTER TABLE "PropertyPhoto" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "PropertyPhoto" ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PropertyPhoto" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;
