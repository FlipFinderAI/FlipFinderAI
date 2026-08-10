
import prisma from "@/lib/prisma";
import {
  classifyProperty,
  type PropertyClassification,
} from "@/lib/classifyProperty";

async function main() {
  console.log("Classifying properties...\n");

  const properties = await prisma.property.findMany({
    orderBy: {
      id: "asc",
    },
  });

  const counts: Record<PropertyClassification, number> = {
    STANDARD: 0,
    BMV_CANDIDATE: 0,
    AUCTION: 0,
    NEW_BUILD: 0,
    INVESTMENT_PRODUCT: 0,
    SHARED_OWNERSHIP: 0,
    IRRELEVANT: 0,
  };

  for (const property of properties) {
    const classification = classifyProperty(property);

    counts[classification]++;

    console.log(
      `${property.id.toString().padStart(3, " ")} | ` +
        `${classification.padEnd(20, " ")} | ` +
        `${property.address}`
    );
  }

  console.log("\n==============================");
  console.log("CLASSIFICATION SUMMARY");
  console.log("==============================");

  for (const [classification, count] of Object.entries(counts)) {
    console.log(`${classification.padEnd(22, " ")} ${count}`);
  }

  console.log(`\nTotal properties: ${properties.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });