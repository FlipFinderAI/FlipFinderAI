import Database from "better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import dotenv from "dotenv";

// Load PostgreSQL environment variables
dotenv.config({ path: ".env.development.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// --------------------------------------------------
// PostgreSQL
// --------------------------------------------------

const pgAdapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const postgres = new PrismaClient({
  adapter: pgAdapter,
});

// --------------------------------------------------
// SQLite
// --------------------------------------------------

const sqlite = new Database("./dev.db", {
  readonly: true,
});

// --------------------------------------------------
// Migration
// --------------------------------------------------

async function main() {
  console.log("");
  console.log("==========================================");
  console.log("FlipFinderAI SQLite → PostgreSQL migration");
  console.log("==========================================");
  console.log("");

  // Count existing SQLite properties
  const countResult = sqlite
    .prepare("SELECT COUNT(*) as count FROM Property")
    .get() as { count: number };

  console.log(`SQLite properties found: ${countResult.count}`);
  console.log("");

  // Get properties
  const properties = sqlite
    .prepare("SELECT * FROM Property ORDER BY id")
    .all() as any[];

  let imported = 0;
  let skipped = 0;

  for (const property of properties) {
    try {
      // Check whether property already exists
      const existing = await postgres.property.findUnique({
        where: {
          externalId: property.externalId,
        },
      });

      if (existing) {
        skipped++;

        if (skipped % 100 === 0) {
          console.log(`Skipped ${skipped} existing properties...`);
        }

        continue;
      }

      await postgres.property.create({
        data: {
          id: property.id,

          externalId: property.externalId,
          address: property.address,
          postcode: property.postcode,
          type: property.type,
          description: property.description,
          listingUrl: property.listingUrl,
          agent: property.agent,
          source: property.source,
          images: property.images,

          price: property.price,
          estimatedValue: property.estimatedValue,
          soldComparableAvg: property.soldComparableAvg,
          discountPercent: property.discountPercent,

          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          floorArea: property.floorArea,
          tenure: property.tenure,
          epcRating: property.epcRating,

          refurbRequired: Boolean(property.refurbRequired),

          kitchenCost: property.kitchenCost,
          bathroomCost: property.bathroomCost,
          decorationCost: property.decorationCost,
          extensionCost: property.extensionCost,
          totalRefurbCost: property.totalRefurbCost,

          purchaseCosts: property.purchaseCosts,
          stampDuty: property.stampDuty,
          legalCosts: property.legalCosts,
          totalInvestment: property.totalInvestment,
          resaleValue: property.resaleValue,
          potentialProfit: property.potentialProfit,
          rentalValue: property.rentalValue,
          yield: property.yield,

          aiScore: property.aiScore,
          aiConfidence: property.aiConfidence,
          aiRecommendation: property.aiRecommendation,
          aiSummary: property.aiSummary,
          aiOpportunities: property.aiOpportunities,
          aiRisks: property.aiRisks,

          photoAnalysis: property.photoAnalysis,
          detectedIssues: property.detectedIssues,
          refurbPlan: property.refurbPlan,

          valuationReasoning: property.valuationReasoning,
          comparableAnalysis: property.comparableAnalysis,
          marketAnalysis: property.marketAnalysis,

          aiTrainingData: property.aiTrainingData,
          actualOutcome: property.actualOutcome,
          dealSuccessful:
            property.dealSuccessful === null
              ? null
              : Boolean(property.dealSuccessful),

          dateListed: property.dateListed
            ? new Date(property.dateListed)
            : null,

          lastSeen: property.lastSeen
            ? new Date(property.lastSeen)
            : new Date(),

          createdAt: property.createdAt
            ? new Date(property.createdAt)
            : new Date(),

          updatedAt: property.updatedAt
            ? new Date(property.updatedAt)
            : new Date(),
        },
      });

      imported++;

      if (imported % 100 === 0) {
        console.log(`Imported ${imported} / ${properties.length}`);
      }
    } catch (error) {
      console.error("");
      console.error(`FAILED property ID ${property.id}`);
      console.error(property.address);
      console.error(error);
      console.error("");

      throw error;
    }
  }

  console.log("");
  console.log("==========================================");
  console.log("Migration finished");
  console.log("==========================================");
  console.log(`SQLite properties: ${properties.length}`);
  console.log(`Imported:          ${imported}`);
  console.log(`Skipped:           ${skipped}`);
  console.log("");

  // Verify PostgreSQL count
  const postgresCount = await postgres.property.count();

  console.log(`PostgreSQL properties now: ${postgresCount}`);
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("MIGRATION FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    sqlite.close();
    await postgres.$disconnect();
  });