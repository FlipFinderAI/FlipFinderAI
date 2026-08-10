import prisma from "@/lib/prisma";
import { calculateDealScore } from "@/lib/dealScore";

const properties = [
  {
    address: "Example Road, Leeds",
    postcode: "LS8",
    type: "Terraced",
    bedrooms: 3,
    bathrooms: 1,
    price: 95000,
    value: 140000,
    refurb: 20000,
    description:
      "Needs modernisation. Good potential flip.",
    images: ["/house-placeholder.jpg"],
    source: "Test Import",
    listingUrl: "https://example.com",
    agent: "Example Estate Agent",
  },
];

async function main() {
  console.log("Starting property import...");

  for (const property of properties) {
    const dealScore = calculateDealScore({
  price: property.price,
  value: property.value,
  refurb: property.refurb,
  address: property.address,
  type: property.type,
  bedrooms: property.bedrooms,
  description: property.description,
  postcode: property.postcode,
});

const score = dealScore.score;

    await prisma.property.create({
      data: {
        externalId: `TEST-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}`,

        address: property.address,
        postcode: property.postcode,
        type: property.type,

        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,

        price: property.price,

        estimatedValue: property.value,

        totalRefurbCost: property.refurb,

        description: property.description,

        images: JSON.stringify(property.images),

        source: property.source,

        listingUrl: property.listingUrl,

        agent: property.agent,

        aiScore: score,

        lastSeen: new Date(),
      },
    });

    console.log(
      `Imported: ${property.address} | Score: ${score}/100`
    );
  }

  console.log("Import complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });