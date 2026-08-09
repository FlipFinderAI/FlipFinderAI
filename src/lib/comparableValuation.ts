import prisma from "@/lib/prisma";

type ScoredComparable = {
  sale: {
    id: number;
    postcode: string;
    address: string | null;
    soldPrice: number;
    soldDate: Date | null;
    bedrooms: number | null;
    bathrooms?: number | null;
    floorArea?: number | null;
    propertyType: string | null;
    source: string | null;
    createdAt: Date;
  };

  score: number;

  factors: {
    exactPostcode: boolean;
    sameStreet: boolean;
    samePropertyType: boolean;
    sameBedrooms: boolean;
    sameSector: boolean;
    sameDistrict: boolean;
    recent: boolean;
  };
};

function normaliseType(
  type: string | null | undefined
): string {
  if (!type) return "";

  return type
    .toLowerCase()
    .replace(/semi[\s-]+detached/g, "semi-detached")
    .replace(/detached house/g, "detached")
    .replace(/terraced house/g, "terraced")
    .replace(/\bterrace\b/g, "terraced")
    .replace(/\bflat\b/g, "flat")
    .replace(/\bapartment\b/g, "flat")
    .replace(/\bmaisonette\b/g, "flat")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseAddress(
  address: string | null | undefined
): string {
  if (!address) return "";

  return address
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalisePostcode(
  postcode: string | null | undefined
): string {
  if (!postcode) return "";

  return postcode
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();
}

/**
 * UK postcode district.
 *
 * Examples:
 * LS8 3BA  -> LS8
 * LS10 2AB -> LS10
 * LS17 8AA -> LS17
 */
function postcodeDistrict(
  postcode: string
): string {
  const normalised =
    normalisePostcode(postcode);

  const match =
    normalised.match(
      /^([A-Z]{1,2}\d{1,2})\d/
    );

  return match?.[1] || "";
}

/**
 * UK postcode sector.
 *
 * Examples:
 * LS8 3BA  -> LS83
 * LS10 2AB -> LS102
 * LS17 8AA -> LS178
 */
function postcodeSector(
  postcode: string
): string {
  const normalised =
    normalisePostcode(postcode);

  const match =
    normalised.match(
      /^([A-Z]{1,2}\d{1,2}\d)/
    );

  return match?.[1] || "";
}

function extractStreetName(
  address: string | null | undefined
): string {
  if (!address) return "";

  const normalised =
    normaliseAddress(address);

  if (!normalised) return "";

  const parts =
    normalised.split(" ");

  // Remove house number.
  if (
    parts.length > 0 &&
    /^\d+[a-z]?$/.test(parts[0])
  ) {
    parts.shift();
  }

  // Remove flat number when clearly
  // at the beginning.
  if (
    parts.length > 1 &&
    parts[0] === "flat" &&
    /^\d+[a-z]?$/.test(parts[1])
  ) {
    parts.splice(0, 2);
  }

  return parts.join(" ");
}

function isSameStreet(
  propertyAddress: string,
  saleAddress: string | null
): boolean {
  const propertyStreet =
    extractStreetName(propertyAddress);

  const saleStreet =
    extractStreetName(saleAddress);

  if (
    !propertyStreet ||
    !saleStreet
  ) {
    return false;
  }

  const propertyWords =
    propertyStreet
      .split(" ")
      .filter(Boolean);

  const saleWords =
    saleStreet
      .split(" ")
      .filter(Boolean);

  if (
    propertyWords.length === 0 ||
    saleWords.length === 0
  ) {
    return false;
  }

  const propertyCore =
    propertyWords
      .slice(0, 3)
      .join(" ");

  const saleCore =
    saleWords
      .slice(0, 3)
      .join(" ");

  return (
    propertyCore === saleCore ||
    propertyStreet.includes(saleCore) ||
    saleStreet.includes(propertyCore)
  );
}

function monthsOld(
  date: Date | null
): number {
  if (!date) return 999;

  return Math.max(
    0,
    (
      new Date().getTime() -
      date.getTime()
    ) /
      (1000 * 60 * 60 * 24 * 30.4375)
  );
}

function median(
  values: number[]
): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted =
    [...values].sort(
      (a, b) => a - b
    );

  const middle =
    Math.floor(
      sorted.length / 2
    );

  if (
    sorted.length % 2 === 0
  ) {
    return Math.round(
      (
        sorted[middle - 1] +
        sorted[middle]
      ) / 2
    );
  }

  return sorted[middle];
}

function standardDeviation(
  values: number[]
): number {
  if (values.length < 2) {
    return 0;
  }

  const average =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length;

  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - average,
          2
        ),
      0
    ) / values.length;

  return Math.sqrt(variance);
}

function confidenceScore(args: {
  selectedCount: number;
  exactPostcodeCount: number;
  sameStreetCount: number;
  sameTypeCount: number;
  sameBedroomsCount: number;
  recentCount: number;
  prices: number[];
  estimatedValue: number;
}): number {
  const {
    selectedCount,
    exactPostcodeCount,
    sameStreetCount,
    sameTypeCount,
    sameBedroomsCount,
    recentCount,
    prices,
    estimatedValue,
  } = args;

  if (
    selectedCount === 0 ||
    estimatedValue <= 0
  ) {
    return 0;
  }

  let confidence = 0;

  // Number of useful comparables.
  if (selectedCount >= 15) {
    confidence += 15;
  } else if (selectedCount >= 10) {
    confidence += 13;
  } else if (selectedCount >= 7) {
    confidence += 11;
  } else if (selectedCount >= 5) {
    confidence += 9;
  } else if (selectedCount >= 3) {
    confidence += 6;
  } else {
    confidence += 3;
  }

  // Exact postcode.
  if (exactPostcodeCount >= 3) {
    confidence += 20;
  } else if (exactPostcodeCount >= 2) {
    confidence += 17;
  } else if (exactPostcodeCount >= 1) {
    confidence += 12;
  }

  // Same street.
  if (sameStreetCount >= 5) {
    confidence += 20;
  } else if (sameStreetCount >= 3) {
    confidence += 18;
  } else if (sameStreetCount >= 2) {
    confidence += 15;
  } else if (sameStreetCount >= 1) {
    confidence += 10;
  }

  // Same property type.
  const typeRatio =
    sameTypeCount /
    selectedCount;

  if (typeRatio >= 0.9) {
    confidence += 15;
  } else if (typeRatio >= 0.75) {
    confidence += 12;
  } else if (typeRatio >= 0.5) {
    confidence += 8;
  }

  // Bedrooms.
  if (
    sameBedroomsCount > 0
  ) {
    const bedroomRatio =
      sameBedroomsCount /
      selectedCount;

    if (bedroomRatio >= 0.8) {
      confidence += 10;
    } else if (
      bedroomRatio >= 0.6
    ) {
      confidence += 7;
    }
  }

  // Recency.
  const recentRatio =
    recentCount /
    selectedCount;

  if (recentRatio >= 0.8) {
    confidence += 10;
  } else if (recentRatio >= 0.6) {
    confidence += 8;
  } else if (recentRatio >= 0.4) {
    confidence += 5;
  }

  // Price consistency.
  const deviation =
    standardDeviation(prices);

  const coefficient =
    estimatedValue > 0
      ? deviation / estimatedValue
      : 1;

  if (coefficient <= 0.05) {
    confidence += 10;
  } else if (coefficient <= 0.10) {
    confidence += 8;
  } else if (coefficient <= 0.15) {
    confidence += 6;
  } else if (coefficient <= 0.20) {
    confidence += 4;
  }

  return Math.min(
    95,
    Math.max(
      0,
      Math.round(confidence)
    )
  );
}

export async function calculateComparableValue(
  propertyId: number
) {
  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

  if (!property) {
    throw new Error(
      "Property not found"
    );
  }

  const postcode =
    normalisePostcode(
      property.postcode
    );

  const district =
    postcodeDistrict(
      postcode
    );

  const sector =
    postcodeSector(
      postcode
    );

  const propertyType =
    normaliseType(
      property.type
    );

  const bedrooms =
    property.bedrooms ?? null;

  /*
   * Use three years of transaction
   * history as the initial evidence pool.
   */
  const threeYearsAgo =
    new Date();

  threeYearsAgo.setFullYear(
    threeYearsAgo.getFullYear() - 3
  );

  /*
   * Pull a large local evidence pool.
   *
   * IMPORTANT:
   * The postcode district must be LS8,
   * not LS83.
   */
  const comparables =
    await prisma.comparableSale.findMany({
      where: {
        postcode: {
          startsWith: district,
        },

        soldDate: {
          gte: threeYearsAgo,
        },

        soldPrice: {
          gt: 0,
        },
      },

      orderBy: {
        soldDate: "desc",
      },

      take: 1000,
    });

  if (
    comparables.length === 0
  ) {
    return {
      estimatedValue: 0,
      comparableAverage: 0,
      comparableCount: 0,
      confidence: 0,
      valuationRangeLow: 0,
      valuationRangeHigh: 0,
      exactPostcodeCount: 0,
      sameStreetCount: 0,
      sameTypeCount: 0,
      sameBedroomsCount: 0,
      recentCount: 0,
      comparables: [],
    };
  }

  /*
   * SCORE EVERY SALE.
   */
  const scored =
    comparables.map(
      (sale): ScoredComparable => {
        let score = 0;

        const salePostcode =
          normalisePostcode(
            sale.postcode
          );

        const saleSector =
          postcodeSector(
            salePostcode
          );

        const saleDistrict =
          postcodeDistrict(
            salePostcode
          );

        const saleType =
          normaliseType(
            sale.propertyType
          );

        const exactPostcode =
          Boolean(
            postcode &&
            salePostcode ===
              postcode
          );

        const sameSector =
          Boolean(
            sector &&
            saleSector ===
              sector
          );

        const sameDistrict =
          Boolean(
            district &&
            saleDistrict ===
              district
          );

        const sameStreet =
          isSameStreet(
            property.address,
            sale.address
          );

        const samePropertyType =
          Boolean(
            propertyType &&
            saleType &&
            propertyType ===
              saleType
          );

        const sameBedrooms =
          Boolean(
            bedrooms !== null &&
            sale.bedrooms !== null &&
            bedrooms ===
              sale.bedrooms
          );

        const age =
          monthsOld(
            sale.soldDate
          );

        /*
         * LOCATION
         */

        // Exact postcode is the strongest
        // geographic evidence.
        if (exactPostcode) {
          score += 100;
        }

        // Same street is extremely strong.
        if (sameStreet) {
          score += 90;
        }

        // Same postcode sector.
        if (sameSector) {
          score += 35;
        }

        // Same postcode district.
        if (sameDistrict) {
          score += 10;
        }

        /*
         * PROPERTY CHARACTERISTICS
         */

        if (samePropertyType) {
          score += 40;
        }

        if (
          bedrooms !== null &&
          sale.bedrooms !== null
        ) {
          const difference =
            Math.abs(
              bedrooms -
                sale.bedrooms
            );

          if (difference === 0) {
            score += 35;
          } else if (
            difference === 1
          ) {
            score += 15;
          }
        }

        /*
         * RECENCY
         */

        if (age <= 3) {
          score += 35;
        } else if (age <= 6) {
          score += 30;
        } else if (age <= 12) {
          score += 25;
        } else if (age <= 18) {
          score += 18;
        } else if (age <= 24) {
          score += 12;
        } else if (age <= 36) {
          score += 6;
        }

        return {
          sale,
          score,
          factors: {
            exactPostcode,
            sameStreet,
            samePropertyType,
            sameBedrooms,
            sameSector,
            sameDistrict,
            recent:
              age <= 12,
          },
        };
      }
    );

  /*
   * Strongest first.
   */
  scored.sort(
    (a, b) =>
      b.score - a.score
  );

  /*
   * REMOVE DUPLICATE PROPERTY ADDRESSES
   */
  const uniqueAddresses =
    new Map<
      string,
      ScoredComparable
    >();

  for (
    const item of scored
  ) {
    const key =
      normaliseAddress(
        item.sale.address
      );

    if (!key) {
      continue;
    }

    if (
      !uniqueAddresses.has(key)
    ) {
      uniqueAddresses.set(
        key,
        item
      );
    }
  }

  const uniqueScored =
    Array.from(
      uniqueAddresses.values()
    );

  /*
   * SELECT BEST COMPARABLES
   */

  let selected =
    uniqueScored
      .filter(
        item =>
          item.score >= 150
      )
      .slice(0, 20);

  /*
   * If fewer than five very
   * strong comparables exist,
   * widen the evidence pool.
   */
  if (
    selected.length < 5
  ) {
    selected =
      uniqueScored
        .filter(
          item =>
            item.score >= 100
        )
        .slice(0, 20);
  }

  /*
   * If still too few, use
   * the strongest available.
   */
  if (
    selected.length < 3
  ) {
    selected =
      uniqueScored.slice(
        0,
        Math.min(
          10,
          uniqueScored.length
        )
      );
  }

  if (
    selected.length === 0
  ) {
    return {
      estimatedValue: 0,
      comparableAverage: 0,
      comparableCount: 0,
      confidence: 0,
      valuationRangeLow: 0,
      valuationRangeHigh: 0,
      exactPostcodeCount: 0,
      sameStreetCount: 0,
      sameTypeCount: 0,
      sameBedroomsCount: 0,
      recentCount: 0,
      comparables: [],
    };
  }

  /*
   * REMOVE EXTREME OUTLIERS
   */

  const initialPrices =
    selected.map(
      item =>
        item.sale.soldPrice
    );

  const initialMedian =
    median(
      initialPrices
    );

  const filtered =
    selected.filter(
      item => {
        const price =
          item.sale.soldPrice;

        return (
          price >=
            initialMedian *
              0.60 &&
          price <=
            initialMedian *
              1.50
        );
      }
    );

  const sales =
    filtered.length >= 3
      ? filtered
      : selected;

  /*
   * WEIGHTED VALUATION
   */

  let weightedTotal = 0;
  let totalWeight = 0;

  for (
    const item of sales
  ) {
    const weight =
      Math.max(
        10,
        item.score
      );

    weightedTotal +=
      item.sale.soldPrice *
      weight;

    totalWeight +=
      weight;
  }

  const weightedValue =
    totalWeight > 0
      ? weightedTotal /
        totalWeight
      : 0;

  /*
   * MEDIAN
   */

  const salePrices =
    sales.map(
      item =>
        item.sale.soldPrice
    );

  const medianValue =
    median(
      salePrices
    );

  /*
   * SIMPLE AVERAGE
   */

  const comparableAverage =
    Math.round(
      salePrices.reduce(
        (total, price) =>
          total + price,
        0
      ) /
        salePrices.length
    );

  /*
   * FINAL VALUE
   *
   * 70% weighted comparable
   * 30% median.
   */
  const estimatedValue =
    Math.round(
      (
        weightedValue *
          0.70 +
        medianValue *
          0.30
      ) / 100
    ) * 100;

  /*
   * VALUATION RANGE
   */

  const deviation =
    standardDeviation(
      salePrices
    );

  const rangeAmount =
    Math.max(
      7500,
      Math.round(
        deviation * 0.65
      )
    );

  const valuationRangeLow =
    Math.max(
      0,
      Math.round(
        (
          estimatedValue -
          rangeAmount
        ) / 100
      ) * 100
    );

  const valuationRangeHigh =
    Math.round(
      (
        estimatedValue +
        rangeAmount
      ) / 100
    ) * 100;

  /*
   * EVIDENCE COUNTS
   */

  const exactPostcodeCount =
    sales.filter(
      item =>
        item.factors
          .exactPostcode
    ).length;

  const sameStreetCount =
    sales.filter(
      item =>
        item.factors
          .sameStreet
    ).length;

  const sameTypeCount =
    sales.filter(
      item =>
        item.factors
          .samePropertyType
    ).length;

  const sameBedroomsCount =
    sales.filter(
      item =>
        item.factors
          .sameBedrooms
    ).length;

  const recentCount =
    sales.filter(
      item =>
        item.factors
          .recent
    ).length;

  /*
   * CONFIDENCE
   */

  const confidence =
    confidenceScore({
      selectedCount:
        sales.length,

      exactPostcodeCount,

      sameStreetCount,

      sameTypeCount,

      sameBedroomsCount,

      recentCount,

      prices:
        salePrices,

      estimatedValue,
    });

  /*
   * BMV
   */

  const discountPercent =
    estimatedValue > 0
      ? Math.round(
          (
            (
              estimatedValue -
              property.price
            ) /
            estimatedValue
          ) * 100
        )
      : 0;

  /*
   * SAVE TO PROPERTY
   */

  await prisma.property.update({
    where: {
      id: propertyId,
    },

    data: {
      estimatedValue,

      soldComparableAvg:
        comparableAverage,

      discountPercent,

      aiConfidence:
        confidence,
    },
  });

  /*
   * RETURN EVERYTHING NEEDED BY UI
   */

  return {
    estimatedValue,

    comparableAverage,

    comparableCount:
      sales.length,

    confidence,

    valuationRangeLow,

    valuationRangeHigh,

    exactPostcodeCount,

    sameStreetCount,

    sameTypeCount,

    sameBedroomsCount,

    recentCount,

    comparables:
      sales.map(
        item => ({
          id:
            item.sale.id,

          address:
            item.sale.address,

          postcode:
            item.sale.postcode,

          soldPrice:
            item.sale.soldPrice,

          soldDate:
            item.sale.soldDate,

          bedrooms:
            item.sale.bedrooms,

          propertyType:
            item.sale.propertyType,

          source:
            item.sale.source,

          comparableScore:
            item.score,

          exactPostcode:
            item.factors
              .exactPostcode,

          sameStreet:
            item.factors
              .sameStreet,

          samePropertyType:
            item.factors
              .samePropertyType,

          sameBedrooms:
            item.factors
              .sameBedrooms,

          sameSector:
            item.factors
              .sameSector,

          sameDistrict:
            item.factors
              .sameDistrict,

          recent:
            item.factors
              .recent,
        })
      ),
  };
}
