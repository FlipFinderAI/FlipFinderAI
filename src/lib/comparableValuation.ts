import prisma from "@/lib/prisma";

type ComparableSaleWithScore = {
  sale: {
    id: number;
    postcode: string;
    address: string | null;
    soldPrice: number;
    soldDate: Date | null;
    bedrooms: number | null;
    bathrooms: number | null;
    floorArea: number | null;
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
    similarSize: boolean;
    verySimilarSize: boolean;
  };

  pricePerSqFt: number | null;
  sizeDifferencePercent: number | null;
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

function postcodeDistrict(
  postcode: string
): string {
  const normalised = normalisePostcode(postcode);

  const match = normalised.match(
    /^([A-Z]{1,2}\d{1,2})\d/
  );

  return match?.[1] || "";
}

function postcodeSector(
  postcode: string
): string {
  const normalised = normalisePostcode(postcode);

  const match = normalised.match(
    /^([A-Z]{1,2}\d{1,2}\d)/
  );

  return match?.[1] || "";
}

function extractStreetName(
  address: string | null | undefined
): string {
  if (!address) return "";

  const normalised = normaliseAddress(address);

  if (!normalised) return "";

  const parts = normalised.split(" ");

  /*
   * Remove house number.
   *
   * Examples:
   * 7 Sandmoor Drive
   * 17A Sandmoor Drive
   */
  if (
    parts.length > 0 &&
    /^\d+[a-z]?$/.test(parts[0])
  ) {
    parts.shift();
  }

  /*
   * Remove flat number.
   */
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

  return (
    propertyStreet === saleStreet ||
    propertyStreet.includes(saleStreet) ||
    saleStreet.includes(propertyStreet)
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

/*
 * Returns the floor area we should use
 * for valuation.
 *
 * Priority:
 *
 * 1. Property.floorArea
 * 2. Property.epcFloorArea
 *
 * We deliberately do NOT use AI guesses here.
 */
function getPropertyFloorArea(
  property: {
    floorArea: number | null;
    epcFloorArea: number | null;
  }
): number | null {
  if (
    property.floorArea !== null &&
    property.floorArea > 0
  ) {
    return property.floorArea;
  }

  if (
    property.epcFloorArea !== null &&
    property.epcFloorArea > 0
  ) {
    return property.epcFloorArea;
  }

  return null;
}

/*
 * Calculate size difference.
 *
 * Example:
 *
 * Subject = 400 sqm
 * Comparable = 360 sqm
 *
 * Difference = 10%
 */
function getSizeDifferencePercent(
  subjectArea: number | null,
  comparableArea: number | null
): number | null {
  if (
    !subjectArea ||
    subjectArea <= 0 ||
    !comparableArea ||
    comparableArea <= 0
  ) {
    return null;
  }

  return Math.abs(
    (
      comparableArea -
      subjectArea
    ) /
      subjectArea
  ) * 100;
}

/*
 * Determines whether a comparable is
 * genuinely similar in size.
 */
function isVerySimilarSize(
  difference: number | null
): boolean {
  return (
    difference !== null &&
    difference <= 10
  );
}

function isSimilarSize(
  difference: number | null
): boolean {
  return (
    difference !== null &&
    difference <= 20
  );
}

/*
 * Confidence should only become high when
 * the evidence itself is strong.
 */
function confidenceScore(args: {
  selectedCount: number;
  sameStreetCount: number;
  exactPostcodeCount: number;
  sameTypeCount: number;
  similarSizeCount: number;
  verySimilarSizeCount: number;
  recentCount: number;
  prices: number[];
  estimatedValue: number;
  hasFloorArea: boolean;
}): number {
  const {
    selectedCount,
    sameStreetCount,
    exactPostcodeCount,
    sameTypeCount,
    similarSizeCount,
    verySimilarSizeCount,
    recentCount,
    prices,
    estimatedValue,
    hasFloorArea,
  } = args;

  if (
    selectedCount === 0 ||
    estimatedValue <= 0
  ) {
    return 0;
  }

  let confidence = 0;

  /*
   * Number of good comparables.
   */
  if (selectedCount >= 10) {
    confidence += 15;
  } else if (selectedCount >= 7) {
    confidence += 12;
  } else if (selectedCount >= 5) {
    confidence += 9;
  } else if (selectedCount >= 3) {
    confidence += 6;
  } else {
    confidence += 2;
  }

  /*
   * Same street.
   */
  if (sameStreetCount >= 4) {
    confidence += 20;
  } else if (sameStreetCount >= 2) {
    confidence += 17;
  } else if (sameStreetCount >= 1) {
    confidence += 10;
  }

  /*
   * Exact postcode.
   */
  if (exactPostcodeCount >= 3) {
    confidence += 15;
  } else if (exactPostcodeCount >= 1) {
    confidence += 10;
  }

  /*
   * Property type.
   */
  if (
    selectedCount > 0 &&
    sameTypeCount / selectedCount >= 0.8
  ) {
    confidence += 10;
  } else if (
    selectedCount > 0 &&
    sameTypeCount / selectedCount >= 0.6
  ) {
    confidence += 6;
  }

  /*
   * SIZE IS NOW A MAJOR CONFIDENCE FACTOR.
   */
  if (verySimilarSizeCount >= 3) {
    confidence += 20;
  } else if (verySimilarSizeCount >= 2) {
    confidence += 16;
  } else if (verySimilarSizeCount >= 1) {
    confidence += 12;
  } else if (similarSizeCount >= 3) {
    confidence += 8;
  }

  /*
   * Recent sales.
   */
  if (
    selectedCount > 0 &&
    recentCount / selectedCount >= 0.8
  ) {
    confidence += 10;
  } else if (
    selectedCount > 0 &&
    recentCount / selectedCount >= 0.5
  ) {
    confidence += 6;
  }

  /*
   * Floor area evidence.
   */
  if (hasFloorArea) {
    confidence += 10;
  }

  /*
   * Price consistency.
   */
  const deviation =
    standardDeviation(prices);

  const coefficient =
    estimatedValue > 0
      ? deviation / estimatedValue
      : 1;

  if (coefficient <= 0.10) {
    confidence += 10;
  } else if (coefficient <= 0.20) {
    confidence += 6;
  } else if (coefficient <= 0.30) {
    confidence += 3;
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

  /*
   * ========================================
   * SUBJECT PROPERTY
   * ========================================
   */

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
   * Use structured floor area first.
   * EPC floor area is the fallback.
   */
  const subjectFloorArea =
  getPropertyFloorArea({
    floorArea:
      property.floorArea,
   epcFloorArea:
  property.epcFloorArea,
  });

  console.log(
    "========================================"
  );

  console.log(
    "COMPARABLE VALUATION"
  );

  console.log(
    "PROPERTY:",
    property.address
  );

  console.log(
    "POSTCODE:",
    postcode
  );

  console.log(
    "PROPERTY TYPE:",
    propertyType
  );

  console.log(
    "BEDROOMS:",
    bedrooms
  );

  console.log(
    "FLOOR AREA:",
    subjectFloorArea
  );

  console.log(
    "========================================"
  );

  /*
   * ========================================
   * EVIDENCE WINDOW
   * ========================================
   *
   * Use five years rather than only three.
   *
   * This is important for expensive houses
   * where there may be very few transactions.
   */
  const fiveYearsAgo =
    new Date();

  fiveYearsAgo.setFullYear(
    fiveYearsAgo.getFullYear() - 5
  );

  /*
   * Pull a large district evidence pool.
   *
   * We intentionally don't only pull the
   * postcode sector because we need to be able
   * to widen the search intelligently.
   */
  const comparables =
    await prisma.comparableSale.findMany({
      where: {
        postcode: {
          startsWith:
            district,
        },

        soldDate: {
          gte:
            fiveYearsAgo,
        },

        soldPrice: {
          gt: 0,
        },
      },

      orderBy: {
        soldDate:
          "desc",
      },

      take: 2000,
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
      similarSizeCount: 0,
      verySimilarSizeCount: 0,
      recentCount: 0,
      subjectFloorArea,
      valuationMethod:
        "No comparable sales available",
      comparables: [],
    };
  }

  /*
   * ========================================
   * SCORE EVERY SALE
   * ========================================
   */
  const scored =
    comparables.map(
      (
        sale
      ): ComparableSaleWithScore => {
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

        const sizeDifferencePercent =
          getSizeDifferencePercent(
            subjectFloorArea,
            sale.floorArea
          );

        const verySimilarSize =
          isVerySimilarSize(
            sizeDifferencePercent
          );

        const similarSize =
          isSimilarSize(
            sizeDifferencePercent
          );

        /*
         * ====================================
         * LOCATION
         * ====================================
         */

        /*
         * SAME STREET
         *
         * This is deliberately extremely strong.
         */
        if (sameStreet) {
          score += 180;
        }

        /*
         * EXACT POSTCODE
         */
        if (exactPostcode) {
          score += 130;
        }

        /*
         * SAME SECTOR
         */
        if (sameSector) {
          score += 55;
        }

        /*
         * SAME DISTRICT
         */
        if (sameDistrict) {
          score += 20;
        }

        /*
         * ====================================
         * PROPERTY TYPE
         * ====================================
         */

        if (samePropertyType) {
          score += 60;
        } else {
          /*
           * Penalise completely different types.
           */
          score -= 50;
        }

        /*
         * ====================================
         * BEDROOMS
         * ====================================
         */

        if (
          bedrooms !== null &&
          sale.bedrooms !== null
        ) {
          const difference =
            Math.abs(
              bedrooms -
                sale.bedrooms
            );

          if (
            difference === 0
          ) {
            score += 45;
          } else if (
            difference === 1
          ) {
            score += 25;
          } else if (
            difference === 2
          ) {
            score += 10;
          } else {
            score -= 20;
          }
        }

        /*
         * ====================================
         * FLOOR AREA
         * ====================================
         *
         * This is now one of the most important
         * factors in the whole engine.
         */

        if (
          verySimilarSize
        ) {
          score += 100;
        } else if (
          similarSize
        ) {
          score += 60;
        } else if (
          sizeDifferencePercent !==
            null &&
          sizeDifferencePercent <=
            30
        ) {
          score += 25;
        } else if (
          sizeDifferencePercent !==
            null
        ) {
          score -= 50;
        }

        /*
         * ====================================
         * RECENCY
         * ====================================
         */

        if (age <= 3) {
          score += 45;
        } else if (
          age <= 6
        ) {
          score += 38;
        } else if (
          age <= 12
        ) {
          score += 30;
        } else if (
          age <= 18
        ) {
          score += 20;
        } else if (
          age <= 24
        ) {
          score += 12;
        } else {
          score += 4;
        }

        /*
         * ====================================
         * £ PER SQ FT
         * ====================================
         */

        const pricePerSqFt =
          sale.floorArea &&
          sale.floorArea > 0
            ? Math.round(
                sale.soldPrice /
                  (sale.floorArea *
                    10.7639)
              )
            : null;

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
            similarSize,
            verySimilarSize,
          },
          pricePerSqFt,
          sizeDifferencePercent,
        };
      }
    );

  /*
   * ========================================
   * SORT
   * ========================================
   */

  scored.sort(
    (a, b) =>
      b.score -
      a.score
  );

  /*
   * ========================================
   * REMOVE DUPLICATES
   * ========================================
   */

  const uniqueAddresses =
    new Map<
      string,
      ComparableSaleWithScore
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
      !uniqueAddresses.has(
        key
      )
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
   * ========================================
   * SELECTION STRATEGY
   * ========================================
   *
   * We want:
   *
   * 1. Same street + similar size
   * 2. Same postcode + similar size
   * 3. Same sector + similar size
   * 4. Nearby district + similar size
   *
   * NOT simply "cheapest detached houses".
   */

  let selected =
    uniqueScored
      .filter(
        item =>
          item.score >=
          250
      )
      .slice(0, 15);

  /*
   * If we don't have enough excellent
   * comparables, widen carefully.
   */
  if (
    selected.length < 5
  ) {
    selected =
      uniqueScored
        .filter(
          item =>
            item.score >=
            190
        )
        .slice(0, 20);
  }

  /*
   * Widen again if necessary.
   */
  if (
    selected.length < 3
  ) {
    selected =
      uniqueScored
        .filter(
          item =>
            item.score >=
            130
        )
        .slice(0, 20);
  }

  /*
   * Last resort.
   */
  if (
    selected.length < 3
  ) {
    selected =
      uniqueScored
        .slice(
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
      similarSizeCount: 0,
      verySimilarSizeCount: 0,
      recentCount: 0,
      subjectFloorArea,
      valuationMethod:
        "Insufficient comparable evidence",
      comparables: [],
    };
  }

  /*
   * ========================================
   * PRICE-PER-SQ-FT VALUATION
   * ========================================
   *
   * This becomes the primary valuation method
   * whenever we have floor area for both the
   * subject and comparable.
   */

  const sizeBasedComparables =
    selected.filter(
      item =>
        subjectFloorArea !==
          null &&
        item.sale.floorArea !==
          null &&
        item.sale.floorArea >
          0
    );

  let estimatedValue = 0;
  let valuationMethod =
    "Comparable sale prices";

  if (
    subjectFloorArea !==
      null &&
    sizeBasedComparables.length >=
      2
  ) {
    /*
     * Calculate £/sq ft for each comparable.
     */
    const pricePerSqFtValues =
      sizeBasedComparables
        .map(
          item =>
            item.sale.soldPrice /
            (item.sale.floorArea! *
              10.7639)
        )
        .filter(
          value =>
            Number.isFinite(
              value
            ) &&
            value > 0
        );

    const weightedPsfTotal =
      sizeBasedComparables.reduce(
        (total, item) => {
          const psf =
            item.sale.soldPrice /
            (item.sale.floorArea! *
              10.7639);

          const weight =
            Math.max(
              10,
              item.score
            );

          return (
            total +
            psf *
              weight
          );
        },
        0
      );

    const weightTotal =
      sizeBasedComparables.reduce(
        (total, item) =>
          total +
          Math.max(
            10,
            item.score
          ),
        0
      );

    const weightedPsf =
      weightTotal > 0
        ? weightedPsfTotal /
          weightTotal
        : median(
            pricePerSqFtValues
          );

    estimatedValue =
      Math.round(
        (
          weightedPsf *
          subjectFloorArea *
          10.7639
        ) / 1000
      ) * 1000;

    valuationMethod =
      "Size-adjusted £/sq ft comparable valuation";
  } else {
    /*
     * Fallback when floor-area evidence
     * isn't available.
     */

    const prices =
      selected.map(
        item =>
          item.sale.soldPrice
      );

    estimatedValue =
      median(
        prices
      );

    valuationMethod =
      "Comparable sale median — floor-area evidence unavailable";
  }

  /*
   * ========================================
   * MEDIAN COMPARABLE
   * ========================================
   */

  const salePrices =
    selected.map(
      item =>
        item.sale.soldPrice
    );

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
   * ========================================
   * VALUATION RANGE
   * ========================================
   */

  const deviation =
    standardDeviation(
      salePrices
    );

  const rangeAmount =
    Math.max(
      15000,
      Math.round(
        deviation * 0.50
      )
    );

  const valuationRangeLow =
    Math.max(
      0,
      Math.round(
        (
          estimatedValue -
          rangeAmount
        ) / 1000
      ) * 1000
    );

  const valuationRangeHigh =
    Math.round(
      (
        estimatedValue +
        rangeAmount
      ) / 1000
    ) * 1000;

  /*
   * ========================================
   * EVIDENCE COUNTS
   * ========================================
   */

  const exactPostcodeCount =
    selected.filter(
      item =>
        item.factors
          .exactPostcode
    ).length;

  const sameStreetCount =
    selected.filter(
      item =>
        item.factors
          .sameStreet
    ).length;

  const sameTypeCount =
    selected.filter(
      item =>
        item.factors
          .samePropertyType
    ).length;

  const sameBedroomsCount =
    selected.filter(
      item =>
        item.factors
          .sameBedrooms
    ).length;

  const similarSizeCount =
    selected.filter(
      item =>
        item.factors
          .similarSize
    ).length;

  const verySimilarSizeCount =
    selected.filter(
      item =>
        item.factors
          .verySimilarSize
    ).length;

  const recentCount =
    selected.filter(
      item =>
        item.factors
          .recent
    ).length;

  /*
   * ========================================
   * CONFIDENCE
   * ========================================
   */

  const confidence =
    confidenceScore({
      selectedCount:
        selected.length,

      sameStreetCount,

      exactPostcodeCount,

      sameTypeCount,

      similarSizeCount,

      verySimilarSizeCount,

      recentCount,

      prices:
        salePrices,

      estimatedValue,

      hasFloorArea:
        subjectFloorArea !==
        null,
    });

  /*
   * ========================================
   * BMV
   * ========================================
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
   * ========================================
   * LOG EVERYTHING
   * ========================================
   */

  console.log(
    "========================================"
  );

  console.log(
    "VALUATION RESULT"
  );

  console.log(
    "METHOD:",
    valuationMethod
  );

  console.log(
    "SUBJECT FLOOR AREA:",
    subjectFloorArea
  );

  console.log(
    "ESTIMATED VALUE:",
    estimatedValue
  );

  console.log(
    "RANGE:",
    valuationRangeLow,
    "-",
    valuationRangeHigh
  );

  console.log(
    "CONFIDENCE:",
    confidence
  );

  console.log(
    "SAME STREET:",
    sameStreetCount
  );

  console.log(
    "SIMILAR SIZE:",
    similarSizeCount
  );

  console.log(
    "VERY SIMILAR SIZE:",
    verySimilarSizeCount
  );

  console.log(
    "========================================"
  );

  /*
   * ========================================
   * SAVE
   * ========================================
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
   * ========================================
   * RETURN
   * ========================================
   */

  return {
    estimatedValue,

    comparableAverage,

    comparableCount:
      selected.length,

    confidence,

    valuationRangeLow,

    valuationRangeHigh,

    exactPostcodeCount,

    sameStreetCount,

    sameTypeCount,

    sameBedroomsCount,

    similarSizeCount,

    verySimilarSizeCount,

    recentCount,

    subjectFloorArea,

    valuationMethod,

    comparables:
      selected.map(
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

          bathrooms:
            item.sale.bathrooms,

          floorArea:
            item.sale.floorArea,

          pricePerSqFt:
            item.pricePerSqFt,

          sizeDifferencePercent:
            item.sizeDifferencePercent,

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

          similarSize:
            item.factors
              .similarSize,

          verySimilarSize:
            item.factors
              .verySimilarSize,

          recent:
            item.factors
              .recent,
        })
      ),
  };
}