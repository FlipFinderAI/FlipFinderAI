export type PropertyForScoring = {
  price: number;
  value?: number | null;
  address?: string | null;
  type?: string | null;
  bedrooms?: number | null;
  description?: string | null;
  postcode?: string | null;
  estateAgent?: string | null;
  refurb?: number | null;
};

export type DealRating =
  | "EXCELLENT"
  | "STRONG"
  | "INVESTIGATE"
  | "WEAK"
  | "IGNORE";

export type DealScoreResult = {
  score: number;
  rating: DealRating;

  discountPercent: number;
  discountAmount: number;

  reasons: string[];
  warnings: string[];
};

function normaliseText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateDealScore(
  property: PropertyForScoring
): DealScoreResult {
  const price = Number(property.price) || 0;
  const value = Number(property.value) || 0;

  const type = normaliseText(property.type);
  const description = normaliseText(property.description);
  const address = normaliseText(property.address);
  const postcode = normaliseText(property.postcode);
  const estateAgent = normaliseText(property.estateAgent);

  const text = `${type} ${description} ${address} ${postcode} ${estateAgent}`;

  const reasons: string[] = [];
  const warnings: string[] = [];

  /*
   * ============================================================
   * BASIC VALIDATION
   * ============================================================
   */

  if (price <= 0) {
    return {
      score: 0,
      rating: "IGNORE",
      discountPercent: 0,
      discountAmount: 0,
      reasons: [],
      warnings: ["No valid asking price"],
    };
  }

  /*
   * ============================================================
   * MARKET DISCOUNT
   *
   * This is the most important part of the score.
   *
   * We do NOT want a normal asking price to become a BMV deal
   * just because it happens to be a house in Leeds.
   * ============================================================
   */

  let discountPercent = 0;
  let discountAmount = 0;

  if (value > 0 && value > price) {
    discountAmount = value - price;
    discountPercent = (discountAmount / value) * 100;
  }

  let marketScore = 0;

  if (discountPercent >= 30) {
    marketScore = 40;
    reasons.push(
      `Excellent estimated BMV discount of ${discountPercent.toFixed(1)}%`
    );
  } else if (discountPercent >= 25) {
    marketScore = 37;
    reasons.push(
      `Very strong estimated BMV discount of ${discountPercent.toFixed(1)}%`
    );
  } else if (discountPercent >= 20) {
    marketScore = 34;
    reasons.push(
      `Strong estimated BMV discount of ${discountPercent.toFixed(1)}%`
    );
  } else if (discountPercent >= 15) {
    marketScore = 29;
    reasons.push(
      `Good estimated BMV discount of ${discountPercent.toFixed(1)}%`
    );
  } else if (discountPercent >= 10) {
    marketScore = 20;
    reasons.push(
      `Moderate estimated BMV discount of ${discountPercent.toFixed(1)}%`
    );
  } else if (discountPercent >= 5) {
    marketScore = 8;
    reasons.push(
      `Small estimated discount of ${discountPercent.toFixed(1)}%`
    );
  } else {
    marketScore = 0;

    if (value > 0) {
      warnings.push("No meaningful market discount");
    } else {
      warnings.push("No reliable estimated market value");
    }
  }

  /*
   * ============================================================
   * PROPERTY TYPE
   * ============================================================
   */

  let propertyScore = 0;

  const isHouse =
    type.includes("terraced") ||
    type.includes("semi-detached") ||
    type.includes("semi detached") ||
    type.includes("detached") ||
    type.includes("end of terrace") ||
    type === "house" ||
    type.includes("bungalow");

  const isFlat =
    type.includes("flat") ||
    type.includes("apartment") ||
    type.includes("studio") ||
    type.includes("penthouse") ||
    type.includes("duplex");

  const isHMO =
    type.includes("hmo") ||
    type.includes("house of multiple occupation");

  if (isHouse) {
    propertyScore = 15;
    reasons.push("House suitable for refurbishment/resale");
  } else if (isHMO) {
    propertyScore = 3;
    warnings.push("HMO / specialist investment property");
  } else if (isFlat) {
    propertyScore = 2;
    warnings.push("Flat/apartment has limited flip potential");
  } else {
    propertyScore = 0;
    warnings.push("Unknown or unsuitable property type");
  }

  /*
   * ============================================================
   * REFURBISHMENT / VALUE-ADD POTENTIAL
   * ============================================================
   */

  let refurbScore = 0;

  const strongRefurbKeywords = [
    "full refurbishment",
    "fully requires refurbishment",
    "complete refurbishment",
    "requires full refurbishment",
    "in need of complete refurbishment",
    "significant refurbishment",
    "major refurbishment",
    "requires renovation",
    "significant renovation",
    "development opportunity",
    "redevelopment opportunity",
    "modernisation required",
    "modernization required",
    "property requiring refurbishment",
    "property requiring renovation",
    "needs extensive work",
    "requires extensive work",
  ];

  const refurbKeywords = [
    "needs modernisation",
    "needs modernization",
    "requires modernisation",
    "requires modernization",
    "requires refurbishment",
    "needs refurbishment",
    "refurbishment",
    "renovation",
    "renovate",
    "updating",
    "needs updating",
    "in need of updating",
    "in need of modernisation",
    "in need of modernization",
    "in need of refurbishment",
    "project",
    "improvement",
    "improvements",
    "work required",
    "some updating",
    "updating required",
    "scope for improvement",
  ];

  const hasStrongRefurb = strongRefurbKeywords.some((keyword) =>
    text.includes(keyword)
  );

  const refurbMatches = refurbKeywords.filter((keyword) =>
    text.includes(keyword)
  );

  if (hasStrongRefurb) {
    refurbScore = 15;
    reasons.push("Strong refurbishment/value-add potential");
  } else if (refurbMatches.length >= 3) {
    refurbScore = 13;
    reasons.push("Multiple refurbishment signals");
  } else if (refurbMatches.length >= 2) {
    refurbScore = 10;
    reasons.push("Refurbishment potential identified");
  } else if (refurbMatches.length === 1) {
    refurbScore = 6;
  } else {
    refurbScore = 0;
  }

  /*
   * ============================================================
   * SELLER MOTIVATION
   * ============================================================
   */

  let sellerScore = 0;

  const sellerSignals = [
    "cash buyers only",
    "vacant property",
    "vacant possession",
    "no onward chain",
    "no upper chain",
    "no upward chain",
    "chain free",
    "chain-free",
    "reduced",
    "reduced price",
    "price reduction",
    "must sell",
    "quick sale",
    "motivated seller",
    "probate",
    "executor",
    "requires sale",
    "sold as seen",
  ];

  const strongSellerSignals = [
    "probate",
    "executor",
    "must sell",
    "quick sale",
    "motivated seller",
    "price reduction",
    "reduced price",
    "reduced",
    "vacant possession",
  ];

  const sellerMatches = sellerSignals.filter((keyword) =>
    text.includes(keyword)
  );

  const strongSellerMatches = strongSellerSignals.filter((keyword) =>
    text.includes(keyword)
  );

  if (strongSellerMatches.length >= 2) {
    sellerScore = 10;
    reasons.push("Strong seller motivation signals");
  } else if (strongSellerMatches.length === 1) {
    sellerScore = 8;
    reasons.push("Seller motivation signal identified");
  } else if (sellerMatches.length >= 3) {
    sellerScore = 7;
    reasons.push("Multiple seller signals");
  } else if (sellerMatches.length >= 1) {
    sellerScore = 4;
  }

  /*
   * ============================================================
   * LOCATION
   *
   * Leeds is the priority.
   * West Yorkshire comes next.
   * Other Yorkshire areas receive some credit.
   * ============================================================
   */

  let locationScore = 0;

  const isLeeds =
    text.includes("leeds") ||
    postcode.startsWith("ls");

  const isWestYorkshire =
    isLeeds ||
    postcode.startsWith("wf") ||
    postcode.startsWith("bd") ||
    postcode.startsWith("hx") ||
    postcode.startsWith("hd");

  const isYorkshire =
    isWestYorkshire ||
    postcode.startsWith("yo") ||
    text.includes("sheffield") ||
    text.includes("barnsley") ||
    text.includes("rotherham") ||
    text.includes("wakefield") ||
    text.includes("huddersfield") ||
    text.includes("halifax") ||
    text.includes("bradford") ||
    text.includes("castleford") ||
    text.includes("pudsey") ||
    text.includes("selby") ||
    text.includes("harrogate");

  if (isLeeds) {
    locationScore = 15;
    reasons.push("Priority Leeds location");
  } else if (isWestYorkshire) {
    locationScore = 13;
    reasons.push("Strong West Yorkshire location");
  } else if (isYorkshire) {
    locationScore = 10;
  } else if (
    text.includes("liverpool") ||
    text.includes("manchester") ||
    text.includes("nottingham") ||
    text.includes("birmingham")
  ) {
    locationScore = 5;
  } else {
    locationScore = 2;
  }

  /*
   * ============================================================
   * PRICE BAND
   *
   * Strong preference for properties below £150k.
   * Extra bonus below £100k.
   * ============================================================
   */

  let priceBonus = 0;

  if (price <= 75000) {
    priceBonus = 10;
    reasons.push("Very attractive purchase price");
  } else if (price <= 100000) {
    priceBonus = 9;
    reasons.push("Target purchase price range");
  } else if (price <= 125000) {
    priceBonus = 7;
  } else if (price <= 150000) {
    priceBonus = 5;
  } else if (price <= 200000) {
    priceBonus = 2;
  }

  /*
   * ============================================================
   * PENALTIES
   * ============================================================
   */

  let penalty = 0;

  /*
   * Retirement properties
   */

  if (
    text.includes("retirement") ||
    text.includes("over 55") ||
    text.includes("over-55") ||
    text.includes("age restricted") ||
    text.includes("age-restricted")
  ) {
    penalty += 35;
    warnings.push("Retirement/age-restricted property");
  }

  /*
   * Auction
   */

  if (
    text.includes("auction") ||
    text.includes("modern method of auction")
  ) {
    penalty += 30;
    warnings.push("Auction property");
  }

  /*
   * Flats/apartments
   */

  if (isFlat) {
    penalty += 10;
    warnings.push("Not a preferred house flip");
  }

  /*
   * HMO
   */

  if (isHMO) {
    penalty += 20;
    warnings.push("HMO / specialist investment");
  }

  /*
   * Cash buyers only
   *
   * This is NOT automatically a bad thing.
   * It can indicate a problematic property, so we apply
   * only a modest penalty.
   */

  if (text.includes("cash buyers only")) {
    penalty += 4;
    warnings.push("Cash buyers only");
  }

  /*
   * Leasehold
   */

  if (text.includes("leasehold") && isFlat) {
    penalty += 7;
    warnings.push("Leasehold flat/apartment");
  }

  /*
   * Short lease
   */

  const leaseMatch = text.match(
    /(\d{2,3})\s*years?\s*(?:remaining|left)/
  );

  if (leaseMatch) {
    const yearsRemaining = Number(leaseMatch[1]);

    if (yearsRemaining < 80) {
      penalty += 20;
      warnings.push(
        `Short lease: ${yearsRemaining} years remaining`
      );
    } else if (yearsRemaining < 90) {
      penalty += 8;
      warnings.push(
        `Lease below 90 years: ${yearsRemaining} years remaining`
      );
    }
  }

  /*
   * Already modern / low value-add properties
   */

  const alreadyModernisedSignals = [
    "new build",
    "beautifully presented",
    "beautifully maintained",
    "modernised throughout",
    "modernized throughout",
    "fully refurbished",
    "fully renovated",
    "modern throughout",
    "presented to a great standard",
    "immaculate throughout",
    "immaculately presented",
    "excellent condition",
    "ready to move into",
    "ready to move in",
  ];

  const modernSignalsFound = alreadyModernisedSignals.filter(
    (keyword) => text.includes(keyword)
  );

  if (modernSignalsFound.length > 0) {
    penalty += 12;
    warnings.push("Limited obvious refurbishment upside");
  }

  /*
   * ============================================================
   * FINAL SCORE
   * ============================================================
   */

  let score =
    marketScore +
    propertyScore +
    refurbScore +
    sellerScore +
    locationScore +
    priceBonus -
    penalty;

  score = Math.round(clamp(score, 0, 100));

  /*
   * ============================================================
   * HARD FILTERS
   *
   * These are deliberately strict.
   * A property should NOT become a BMV deal merely because
   * it is cheap or in Leeds.
   * ============================================================
   */

  /*
   * No market discount = cannot be a strong BMV deal.
   */

  if (discountPercent < 5) {
    score = Math.min(score, 35);
  }

  /*
   * No estimated value = insufficient evidence.
   */

  if (value <= 0) {
    score = Math.min(score, 45);
    warnings.push("No estimated market value");
  }

  /*
   * Flats cannot become Excellent/Strong flip opportunities
   * under this strategy.
   */

  if (isFlat) {
    score = Math.min(score, 40);
  }

  /*
   * Retirement properties are effectively excluded.
   */

  if (
    text.includes("retirement") ||
    text.includes("over 55") ||
    text.includes("over-55") ||
    text.includes("age restricted") ||
    text.includes("age-restricted")
  ) {
    score = Math.min(score, 20);
  }

  /*
   * Auctions are excluded from the normal BMV strategy.
   */

  if (
    text.includes("auction") ||
    text.includes("modern method of auction")
  ) {
    score = Math.min(score, 30);
  }

  /*
   * HMO is not a normal house-flip target.
   */

  if (isHMO) {
    score = Math.min(score, 35);
  }

  /*
   * Already modernised properties need a genuine discount
   * to remain interesting.
   */

  if (modernSignalsFound.length > 0 && discountPercent < 15) {
    score = Math.min(score, 30);
  }

  /*
   * ============================================================
   * RATING
   * ============================================================
   */

  let rating: DealRating;

  if (score >= 80 && discountPercent >= 20 && isHouse) {
    rating = "EXCELLENT";
  } else if (score >= 65 && discountPercent >= 15 && isHouse) {
    rating = "STRONG";
  } else if (score >= 50 && discountPercent >= 10) {
    rating = "INVESTIGATE";
  } else if (score >= 35 && discountPercent >= 5) {
    rating = "WEAK";
  } else {
    rating = "IGNORE";
  }

  /*
   * ============================================================
   * RETURN RESULT
   * ============================================================
   */

  return {
    score,
    rating,
    discountPercent: Number(discountPercent.toFixed(1)),
    discountAmount: Math.round(discountAmount),
    reasons,
    warnings,
  };
}