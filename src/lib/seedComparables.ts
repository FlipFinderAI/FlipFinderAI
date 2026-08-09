import prisma from "@/lib/prisma";

const comparables = [
  {
    postcode: "LS8 5AA",
    address: "10 Example Road, Leeds",
    soldPrice: 195000,
    soldDate: "2026-05-12",
    bedrooms: 3,
    propertyType: "Terraced",
    source: "Test Data",
  },
  {
    postcode: "LS8 5BB",
    address: "22 Example Street, Leeds",
    soldPrice: 202000,
    soldDate: "2026-04-18",
    bedrooms: 3,
    propertyType: "Terraced",
    source: "Test Data",
  },
  {
    postcode: "LS8 5CC",
    address: "31 Example Avenue, Leeds",
    soldPrice: 198000,
    soldDate: "2026-03-22",
    bedrooms: 3,
    propertyType: "Terraced",
    source: "Test Data",
  },
  {
    postcode: "LS8 5DD",
    address: "44 Example Road, Leeds",
    soldPrice: 210000,
    soldDate: "2026-02-10",
    bedrooms: 4,
    propertyType: "Terraced",
    source: "Test Data",
  },
];

async function main() {
  for (const sale of comparables) {
    await prisma.comparableSale.create({
      data: {
        ...sale,
        soldDate: new Date(sale.soldDate),
      },
    });
  }

  console.log(
    `Added ${comparables.length} comparable sales.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });