import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

function calculateScore(property: any) {
  let score = 50;

  const price = property.price || 0;
  const value = property.value || 0;

  let discount = 0;

  if (value > price) {
    discount = ((value - price) / value) * 100;
  }

  // Discount scoring
  if (discount >= 25) score += 30;
  else if (discount >= 15) score += 20;
  else if (discount >= 10) score += 10;

  // Bedroom scoring
  if (property.bedrooms >= 3) score += 5;

  // House preference
  if (
    property.type?.toLowerCase().includes("house") ||
    property.type?.toLowerCase().includes("semi") ||
    property.type?.toLowerCase().includes("terrace")
  ) {
    score += 5;
  }

  if (score > 100) score = 100;

  return {
    score,
    discount: Math.round(discount),
  };
}


async function main() {

  console.log("Starting AI property scoring...");

  const properties = await prisma.property.findMany();

  console.log(`Found ${properties.length} properties`);

  for (const property of properties) {

    const result = calculateScore(property);

    let recommendation = "WATCH";

    if (result.score >= 85) {
      recommendation = "🔥 STRONG BMV BUY";
    } 
    else if (result.score >= 70) {
      recommendation = "⭐ POSSIBLE OPPORTUNITY";
    }


    await prisma.property.update({
      where: {
        id: property.id
      },
      data: {
        aiScore: result.score,
        discountPercent: result.discount,
        aiRecommendation: recommendation,
        aiConfidence: 50,
        aiSummary:
          `Property scored ${result.score}/100 based on price, type and discount analysis.`,
        aiOpportunities:
          "Potential below-market purchase opportunity.",
        aiRisks:
          "Requires comparable sales verification."
      }
    });

    console.log(
      `${property.address} -> ${result.score}/100`
    );
  }


  console.log("AI scoring complete");

}


main()
.catch(console.error)
.finally(() => prisma.$disconnect());