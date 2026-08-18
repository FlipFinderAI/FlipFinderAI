-- CreateTable
CREATE TABLE "Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "listingUrl" TEXT,
    "agent" TEXT,
    "source" TEXT,
    "images" TEXT,
    "price" INTEGER NOT NULL,
    "estimatedValue" INTEGER,
    "soldComparableAvg" INTEGER,
    "discountPercent" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floorArea" INTEGER,
    "tenure" TEXT,
    "dateListed" DATETIME,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "epcRating" TEXT,
    "epcPotentialRating" TEXT,
    "epcScore" INTEGER,
    "epcCertificateDate" DATETIME,
    "epcFloorArea" INTEGER,
    "epcHeating" TEXT,
    "epcSource" TEXT,
    "refurbRequired" BOOLEAN NOT NULL DEFAULT false,
    "kitchenCost" INTEGER,
    "bathroomCost" INTEGER,
    "decorationCost" INTEGER,
    "extensionCost" INTEGER,
    "totalRefurbCost" INTEGER,
    "refurbPlan" TEXT,
    "purchaseCosts" INTEGER,
    "stampDuty" INTEGER,
    "legalCosts" INTEGER,
    "totalInvestment" INTEGER,
    "resaleValue" INTEGER,
    "potentialProfit" INTEGER,
    "rentalValue" INTEGER,
    "potentialRentalValue" INTEGER,
    "rentalSource" TEXT,
    "rentalEvidence" TEXT,
    "rentalUpdatedAt" DATETIME,
    "yield" REAL,
    "aiScore" INTEGER,
    "aiConfidence" INTEGER,
    "aiRecommendation" TEXT,
    "aiSummary" TEXT,
    "aiOpportunities" TEXT,
    "aiRisks" TEXT,
    "detectedIssues" TEXT,
    "photoAnalysis" TEXT,
    "valuationReasoning" TEXT,
    "comparableAnalysis" TEXT,
    "marketAnalysis" TEXT,
    "aiTrainingData" TEXT,
    "actualOutcome" TEXT,
    "dealSuccessful" BOOLEAN,
    "houseNumberAI" TEXT,
    "houseNumberConfidence" REAL,
    "houseNumberEvidence" TEXT,
    "listingHouseNumber" TEXT,
    "targetHouseNumber" TEXT,
    "effectiveHouseNumber" TEXT,
    "targetMatch" BOOLEAN,
    "targetMismatchReason" TEXT,
    "epcCertificateImage" TEXT,
    "epcCertificateUrl" TEXT,
    "floorPlanSource" TEXT,
    "floorPlanUrl" TEXT
);

-- CreateTable
CREATE TABLE "PropertyPhoto" (
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

-- CreateTable
CREATE TABLE "ComparableSale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transactionId" TEXT,
    "postcode" TEXT NOT NULL,
    "address" TEXT,
    "soldPrice" INTEGER NOT NULL,
    "soldDate" DATETIME,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floorArea" INTEGER,
    "epcRating" TEXT,
    "propertyType" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "confidence" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIAnalysis_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketData" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postcode" TEXT NOT NULL,
    "averagePrice" INTEGER,
    "averageRent" INTEGER,
    "demandScore" INTEGER,
    "growthRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LearningExample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER,
    "beforeAnalysis" TEXT,
    "finalDecision" TEXT,
    "actualResult" TEXT,
    "profit" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_externalId_key" ON "Property"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparableSale_transactionId_key" ON "ComparableSale"("transactionId");
