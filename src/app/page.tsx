import prisma from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const properties =
    await prisma.property.findMany({
      where: {
        source: {
          not: "rightmove-unavailable",
        },
      },
      /*
       * Keep the public homepage compatible while the deployed SQLite file is
       * being migrated. Selecting the whole model makes Prisma request every
       * schema column, including a newly-added column that may not yet exist
       * in the live file, which turns a recoverable migration lag into a 500.
       */
      select: {
        id: true,
        address: true,
        postcode: true,
        type: true,
        bedrooms: true,
        bathrooms: true,
        price: true,
        estimatedValue: true,
        totalRefurbCost: true,
        potentialProfit: true,
        aiScore: true,
        discountPercent: true,
        images: true,
        primaryPhoto: true,
        listingUrl: true,
        effectiveHouseNumber: true,
      },
      orderBy: [
        {
          aiScore: "desc",
        },
        {
          lastSeen: "desc",
        },
      ],
    });

  return (
    <HomeClient
      properties={properties}
    />
  );
}
