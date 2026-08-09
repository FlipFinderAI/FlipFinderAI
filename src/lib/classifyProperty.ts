export type PropertyClassification =
  | "STANDARD"
  | "BMV_CANDIDATE"
  | "AUCTION"
  | "NEW_BUILD"
  | "INVESTMENT_PRODUCT"
  | "SHARED_OWNERSHIP"
  | "IRRELEVANT";

export interface PropertyForClassification {
  address: string;
  description?: string | null;
  agent?: string | null;
  source?: string | null;
  listingUrl?: string | null;
  price?: number | null;
}

function text(property: PropertyForClassification): string {
  return [
    property.address,
    property.description,
    property.agent,
    property.source,
    property.listingUrl,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

export function classifyProperty(
  property: PropertyForClassification
): PropertyClassification {
  const value = text(property);

  // 1. Obviously irrelevant / non-standard property adverts
  if (
    containsAny(value, [
      "commercial",
      "office",
      "retail unit",
      "shop",
      "warehouse",
      "industrial unit",
      "restaurant",
      "hotel",
      "land for sale",
      "garage for sale",
      "parking space",
    ])
  ) {
    return "IRRELEVANT";
  }

  // 2. Shared ownership
  if (
    containsAny(value, [
      "shared ownership",
      "shared-ownership",
      "share of",
      "25% share",
      "50% share",
      "75% share",
    ])
  ) {
    return "SHARED_OWNERSHIP";
  }

  // 3. Investment products rather than normal residential listings
  if (
    containsAny(value, [
      "rwinvest",
      "hands off",
      "hands-off",
      "buy to let investment",
      "buy-to-let investment",
      "investment opportunity",
      "investment property",
      "fully managed",
      "turnkey investment",
      "projected rental yield",
      "rental yields",
      "rental yield",
      "projected returns",
      "guaranteed rent",
      "managed investment",
    ])
  ) {
    return "INVESTMENT_PRODUCT";
  }

  // 4. Auction properties
  if (
    containsAny(value, [
      "auction",
      "modern method of auction",
      "traditional auction",
      "auction guide",
      "auctioneer",
      "conditional auction",
      "unconditional auction",
    ])
  ) {
    return "AUCTION";
  }

  // 5. New builds / developer plots
  if (
    containsAny(value, [
      "new build",
      "new-build",
      "new home",
      "new homes",
      "brand new",
      "off plan",
      "off-plan",
      "plot ",
      "plot.",
      "development",
      "new development",
      "persimmon homes",
      "barratt homes",
      "taylor wimpey",
      "linden homes",
      "miller homes",
      "avant homes",
      "bellway",
      "redrow",
      "cala homes",
      "orion homes",
      "anwyl homes",
      "david wilson homes",
    ])
  ) {
    return "NEW_BUILD";
  }

  // 6. Strong BMV / renovation indicators
  if (
    containsAny(value, [
      "below market value",
      "below-market value",
      "bmv",
      "reduced",
      "price reduced",
      "reduced price",
      "offers over",
      "offers in excess",
      "must sell",
      "motivated seller",
      "quick sale",
      "cash buyers",
      "requires renovation",
      "requires modernisation",
      "requires modernization",
      "in need of renovation",
      "in need of modernisation",
      "in need of modernization",
      "refurbishment",
      "refurb required",
      "renovation required",
      "needs renovating",
      "needs modernising",
      "needs modernizing",
      "project",
      "fixer upper",
      "fixer-upper",
      "investment opportunity",
    ])
  ) {
    return "BMV_CANDIDATE";
  }

  // 7. Everything else remains a genuine standard listing.
  return "STANDARD";
}