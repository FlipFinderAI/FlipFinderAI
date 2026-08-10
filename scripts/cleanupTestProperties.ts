
import prisma from "@/lib/prisma";

async function main() {
  console.log("Cleaning obvious test properties...");

  const testProperties = await prisma.property.findMany({
    where: {
      OR: [
        { address: { contains: "Test Road" } },
        { address: { contains: "Example Street" } },
        { address: { contains: "Example Road" } },
        { address: { contains: "Example Avenue" } },
        { address: { contains: "Test Street" } },
        { address: { contains: "Property in A2A2AD" } },
      ],
    },
  });

  console.log(`Found ${testProperties.length} obvious test properties.`);

  for (const property of testProperties) {
    console.log(`Deleting test property: ${property.address}`);

    // AIAnalysis records are linked directly to Property,
    // so Prisma will remove them automatically because of
    // onDelete: Cascade in the schema.

    // PropertyPhoto records are also linked with onDelete: Cascade.

    await prisma.property.delete({
      where: {
        id: property.id,
      },
    });
  }

  console.log("Cleanup complete.");
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });