-- AlterTable
ALTER TABLE "Property" ADD COLUMN "epcCertificateImage" TEXT;
ALTER TABLE "Property" ADD COLUMN "epcCertificateUrl" TEXT;
ALTER TABLE "Property" ADD COLUMN "floorPlanSource" TEXT;
ALTER TABLE "Property" ADD COLUMN "floorPlanUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PropertyPhoto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'photo',
    "aiDescription" TEXT,
    "detectedRoom" TEXT,
    "conditionScore" INTEGER,
    "estimatedRepairCost" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropertyPhoto_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PropertyPhoto" ("aiDescription", "conditionScore", "createdAt", "detectedRoom", "estimatedRepairCost", "id", "propertyId", "url") SELECT "aiDescription", "conditionScore", "createdAt", "detectedRoom", "estimatedRepairCost", "id", "propertyId", "url" FROM "PropertyPhoto";
DROP TABLE "PropertyPhoto";
ALTER TABLE "new_PropertyPhoto" RENAME TO "PropertyPhoto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
