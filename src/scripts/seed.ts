import prisma from "@/lib/prisma";

async function main() {
  await prisma.property.deleteMany();

  await prisma.property.createMany({
    data: [
      {
        externalId: "SEED-001",
        address: "24 Example Road, Leeds",
        postcode: "LS8",
        type: "Victorian Terrace",
        bedrooms: 3,
        bathrooms: 1,
        price: 85000,
        estimatedValue: 130000,
        totalRefurbCost: 20000,
        aiScore: 82,
        description: "Three bedroom terrace requiring modernisation.",
        images: "house1.jpg,house2.jpg",
        detectedIssues: "Strong BMV opportunity. Good upside potential.",
      },

      {
        externalId: "SEED-002",
        address: "15 Example Street, Leeds",
        postcode: "LS12",
        type: "Semi Detached",
        bedrooms: 3,
        bathrooms: 1,
        price: 110000,
        estimatedValue: 160000,
        totalRefurbCost: 25000,
        aiScore: 77,
        description: "Family home needing cosmetic improvements.",
        images: "house3.jpg",
        detectedIssues: "Good location and refurbishment potential.",
      },

      {
        externalId: "SEED-003",
        address: "8 Example Avenue, Leeds",
        postcode: "LS17",
        type: "Terrace",
        bedrooms: 2,
        bathrooms: 1,
        price: 95000,
        estimatedValue: 145000,
        totalRefurbCost: 30000,
        aiScore: 72,
        description: "Requires full refurbishment.",
        images: "house4.jpg",
        detectedIssues: "Potential flip opportunity.",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
