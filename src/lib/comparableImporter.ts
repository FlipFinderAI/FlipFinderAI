import prisma from "@/lib/prisma";

type ComparableSaleInput = {
  postcode: string;
  address?: string;
  soldPrice: number;
  soldDate?: string;
  bedrooms?: number;
  propertyType?: string;
  source?: string;
};

export async function addComparableSale(
  sale: ComparableSaleInput
) {
  return prisma.comparableSale.create({
    data: {
      postcode: sale.postcode.toUpperCase().trim(),
      address: sale.address || null,
      soldPrice: sale.soldPrice,
      soldDate: sale.soldDate
        ? new Date(sale.soldDate)
        : null,
      bedrooms: sale.bedrooms ?? null,
      propertyType: sale.propertyType || null,
      source: sale.source || "Imported",
    },
  });
}

export async function getComparableSales(
  postcode: string
) {
  const cleanPostcode = postcode
    .toUpperCase()
    .trim();

  const postcodeArea = cleanPostcode.split(" ")[0];

  return prisma.comparableSale.findMany({
    where: {
      postcode: {
        startsWith: postcodeArea,
      },
    },
    orderBy: {
      soldDate: "desc",
    },
    take: 50,
  });
}