import {
  calculateDealScore,
  DealRating,
  PropertyForScoring,
} from "./dealScore";

export type FilteredProperty = PropertyForScoring & {
  score: number;
  rating: DealRating;
  discountPercent: number;
  discountAmount: number;
  reasons: string[];
  warnings: string[];
};

export type DealFilterOptions = {
  minScore?: number;
  minDiscount?: number;
  maxPrice?: number;

  ratings?: DealRating[];

  includeFlats?: boolean;
  includeHouses?: boolean;
  includeAuction?: boolean;
  includeRetirement?: boolean;
  includeCashOnly?: boolean;

  postcode?: string;
};

function normalise(value: unknown): string {
  return String(value ?? "").toLowerCase().trim();
}

export function filterAndScoreProperties(
  properties: PropertyForScoring[],
  options: DealFilterOptions = {}
): FilteredProperty[] {
  const {
    minScore = 0,
    minDiscount = 0,
    maxPrice = Infinity,

    ratings,

    includeFlats = true,
    includeHouses = true,
    includeAuction = false,
    includeRetirement = false,
    includeCashOnly = true,

    postcode,
  } = options;

  const postcodeFilter = normalise(postcode);

  const results: FilteredProperty[] = [];

  for (const property of properties) {
    const price = Number(property.price) || 0;

    if (price <= 0) {
      continue;
    }

    if (price > maxPrice) {
      continue;
    }

    const type = normalise(property.type);
    const description = normalise(property.description);

    const text = `${type} ${description}`;

    const isFlat =
      type.includes("flat") ||
      type.includes("apartment") ||
      type.includes("studio");

    const isHouse =
      type.includes("terraced") ||
      type.includes("semi-detached") ||
      type.includes("detached") ||
      type.includes("house") ||
      type.includes("bungalow");

    const isAuction =
      text.includes("auction") ||
      text.includes("modern method of auction");

    const isRetirement =
      text.includes("retirement") ||
      text.includes("over 55") ||
      text.includes("over-55") ||
      text.includes("age restricted");

    const isCashOnly =
      text.includes("cash buyers only");

    if (!includeFlats && isFlat) {
      continue;
    }

    if (!includeHouses && isHouse) {
      continue;
    }

    if (!includeAuction && isAuction) {
      continue;
    }

    if (!includeRetirement && isRetirement) {
      continue;
    }

    if (!includeCashOnly && isCashOnly) {
      continue;
    }

    if (postcodeFilter) {
      const propertyPostcode = normalise(property.postcode);

      if (
        !propertyPostcode.includes(postcodeFilter) &&
        !normalise(property.address).includes(postcodeFilter)
      ) {
        continue;
      }
    }

    const result = calculateDealScore(property);

    if (result.score < minScore) {
      continue;
    }

    if (result.discountPercent < minDiscount) {
      continue;
    }

    if (ratings && ratings.length > 0) {
      if (!ratings.includes(result.rating)) {
        continue;
      }
    }

    results.push({
      ...property,

      score: result.score,
      rating: result.rating,

      discountPercent: result.discountPercent,
      discountAmount: result.discountAmount,

      reasons: result.reasons,
      warnings: result.warnings,
    });
  }

  /*
   * BEST DEALS FIRST
   *
   * Discount is deliberately used as a secondary sort.
   * This prevents a property with a slightly higher score
   * but almost no actual discount from appearing above a
   * genuinely discounted property.
   */

  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (b.discountPercent !== a.discountPercent) {
      return b.discountPercent - a.discountPercent;
    }

    return a.price - b.price;
  });

  return results;
}