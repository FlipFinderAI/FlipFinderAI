import prisma from "@/lib/prisma";

type DealRating = "EXCELLENT" | "STRONG" | "INVESTIGATE" | "IGNORE";

function getDealRating(score: number): DealRating {
  if (score >= 80) return "EXCELLENT";
  if (score >= 65) return "STRONG";
  if (score >= 50) return "INVESTIGATE";
  return "IGNORE";
}

function getTypeScore(type: string | null): number {
  const value = (type || "").toLowerCase();

  if (
    value.includes("detached") ||
    value.includes("semi-detached") ||
    value.includes("terraced") ||
    value.includes("end of terrace") ||
    value.includes("bungalow")
  ) {
    return 15;
  }

  if (value.includes("house")) {
    return 13;
  }

  if (value.includes("flat") || value.includes("apartment")) {
    return 7;
  }

  if (value.includes("studio")) {
    return 2;
  }

  if (
    value.includes("hmo") ||
    value.includes("house of multiple occupation") ||
    value.includes("student")
  ) {
    return 3;
  }

  return 5;
}

function getRefurbScore(
  description: string | null,
  refurbRequired: boolean
): number {
  const text = (description || "").toLowerCase();

  let score = 0;

  if (refurbRequired) {
    score += 8;
  }

  const strongSignals = [
    "requires refurbishment",
    "requires renovation",
    "in need of renovation",
    "in need of refurbishment",
    "needs refurbishment",
    "needs renovation",
    "renovation project",
    "refurbishment project",
    "property project",
    "development opportunity",
    "modernisation required",
    "modernization required",
  ];

  const mediumSignals = [
    "needs updating",
    "requires updating",
    "in need of updating",
    "some updating required",
    "updating required",
    "cash buyers only",
    "vacant property",
    "vacant",
    "chain-free",
    "no onward chain",
  ];

  for (const signal of strongSignals) {
    if (text.includes(signal)) {
      score += 7;
      break;
    }
  }

  for (const signal of mediumSignals) {
    if (text.includes(signal)) {
      score += 2;
    }
  }

  return Math.min(score, 15);
}

function getMotivationScore(description: string | null): number {
  const text = (description || "").toLowerCase();

  let score = 0;

  const signals = [
    "cash buyers only",
    "reduced",
    "price reduced",
    "recently reduced",
    "no chain",
    "no onward chain",
    "chain-free",
    "vacant",
    "must sell",
    "motivated seller",
    "quick sale",
    "offers invited",
    "offers over",
  ];

  for (const signal of signals) {
    if (text.includes(signal)) {
      score += 2;
    }
  }

  return Math.min(score, 10);
}

function getLocationScore(postcode: string | null): number {
  const value = (postcode || "").toUpperCase();

  // Leeds and surrounding areas are currently our main target.
  if (
    value.startsWith("LS6") ||
    value.startsWith("LS8") ||
    value.startsWith("LS9") ||
    value.startsWith("LS10") ||
    value.startsWith("LS11") ||
    value.startsWith("LS12") ||
    value.startsWith("LS13") ||
    value.startsWith("LS14") ||
    value.startsWith("LS15") ||
    value.startsWith("LS16") ||
    value.startsWith("LS17") ||
    value.startsWith("LS18") ||
    value.startsWith("LS19") ||
    value.startsWith("LS20") ||
    value.startsWith("LS21") ||
    value.startsWith("LS27") ||
    value.startsWith("LS28")
  ) {
    return 15;
  }

  // West Yorkshire / nearby markets.
  if (
    value.startsWith("BD") ||
    value.startsWith("WF") ||
    value.startsWith("HX") ||
    value.startsWith("HD")
  ) {
    return 12;
  }

  // Sheffield / South Yorkshire.
  if (value.startsWith("S")) {
    return 10;
  }

  // Other northern cities.
  if (
    value.startsWith("M") ||
    value.startsWith("L") ||
    value.startsWith("YO") ||
    value.startsWith("DN")
  ) {
    return 8;
  }

  return 5;
}

function getDiscountScore(
  price: number,
  estimatedValue: number | null,
  soldComparableAvg: number | null
): {
  score: number;
  value: number | null;
  discount: number | null;
} {
  const values = [
    estimatedValue,
    soldComparableAvg,
  ].filter((value): value is number => value !== null && value > 0);

  if (values.length === 0 || price <= 0) {
    return {
      score: 0,
      value: null,
      discount: null,
    };
  }

  // Use the strongest available valuation.
  const marketValue = Math.max(...values);

  const discount = ((marketValue - price) / marketValue) * 100;

  let score = 0;

  if (discount >= 35) {
    score = 30;
  } else if (discount >= 30) {
    score = 28;
  } else if (discount >= 25) {
    score = 25;
  } else if (discount >= 20) {
    score = 20;
  } else if (discount >= 15) {
    score = 15;
  } else if (discount >= 10) {
    score = 10;
  } else if (discount >= 5) {
    score = 5;
  }

  return {
    score,
    value: marketValue,
    discount,
  };
}

function calculateDealScore(property: {
  price: number;
  estimatedValue: number | null;
  soldComparableAvg: number | null;
  type: string | null;
  description: string | null;
  refurbRequired: boolean;
  postcode: string | null;
}) {
  const discount = getDiscountScore(
    property.price,
    property.estimatedValue,
    property.soldComparableAvg
  );

  const typeScore = getTypeScore(property.type);

  const refurbScore = getRefurbScore(
    property.description,
    property.refurbRequired
  );

  const locationScore = getLocationScore(property.postcode);

  const motivationScore = getMotivationScore(property.description);

  const score =
    discount.score +
    typeScore +
    refurbScore +
    locationScore +
    motivationScore;

  return {
    score: Math.min(score, 100),
    rating: getDealRating(Math.min(score, 100)),
    marketValue: discount.value,
    discountPercent: discount.discount,
    discountScore: discount.score,
    typeScore,
    refurbScore,
    locationScore,
    motivationScore,
  };
}

async function main() {
  console.log("");
  console.log("FLIPFINDERAI - BMV DEAL SCORING");
  console.log("========================================");
  console.log("");

  const properties = await prisma.property.findMany({
    orderBy: {
      price: "asc",
    },
  });

  const scored = properties
    .map((property) => {
      const analysis = calculateDealScore(property);

      return {
        ...property,
        ...analysis,
      };
    })
    .filter((property) => {
      // We only want properties that have some genuine BMV signal.
      return (
        property.discountScore > 0 ||
        property.refurbScore >= 5 ||
        property.motivationScore >= 4
      );
    })
    .sort((a, b) => {
      // Highest deal score first.
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // Then biggest potential discount.
      return (
        (b.discountPercent || 0) -
        (a.discountPercent || 0)
      );
    });

  console.log(`Found ${scored.length} potential BMV deals.`);
  console.log("");

  console.log("========================================");
  console.log("TOP DEALS");
  console.log("========================================");
  console.log("");

  for (const property of scored) {
    console.log("----------------------------------------");

    console.log(
      `SCORE:       ${property.score}/100`
    );

    console.log(
      `RATING:      ${property.rating}`
    );

    console.log(
      `ID:          ${property.id}`
    );

    console.log(
      `Address:     ${property.address}`
    );

    console.log(
      `Price:       £${property.price.toLocaleString()}`
    );

    console.log(
      `Type:        ${property.type || "N/A"}`
    );

    console.log(
      `Bedrooms:    ${property.bedrooms ?? "N/A"}`
    );

    console.log(
      `Postcode:    ${property.postcode || "UNKNOWN"}`
    );

    console.log(
      `Agent:       ${property.agent || "N/A"}`
    );

    console.log(
      `Source:      ${property.source || "N/A"}`
    );

    if (property.marketValue) {
      console.log(
        `Est. Value:  £${property.marketValue.toLocaleString()}`
      );
    }

    if (property.discountPercent !== null) {
      console.log(
        `Discount:    ${property.discountPercent.toFixed(1)}%`
      );
    }

    console.log("");

    console.log("SCORE BREAKDOWN:");

    console.log(
      `  Market discount: ${property.discountScore}/30`
    );

    console.log(
      `  Property type:   ${property.typeScore}/15`
    );

    console.log(
      `  Refurb potential:${property.refurbScore}/15`
    );

    console.log(
      `  Location:        ${property.locationScore}/15`
    );

    console.log(
      `  Seller signals:  ${property.motivationScore}/10`
    );

    console.log("");

    console.log(
      `Description: ${
        property.description || "N/A"
      }`
    );

    console.log("");

    console.log(
      `URL: ${property.listingUrl || "N/A"}`
    );

    console.log("");
  }

  console.log("========================================");
  console.log("SUMMARY");
  console.log("========================================");
  console.log("");

  const excellent = scored.filter(
    (p) => p.rating === "EXCELLENT"
  ).length;

  const strong = scored.filter(
    (p) => p.rating === "STRONG"
  ).length;

  const investigate = scored.filter(
    (p) => p.rating === "INVESTIGATE"
  ).length;

  const ignore = scored.filter(
    (p) => p.rating === "IGNORE"
  ).length;

  console.log(`🔥 Excellent deals: ${excellent}`);
  console.log(`🟢 Strong candidates: ${strong}`);
  console.log(`🟡 Investigate: ${investigate}`);
  console.log(`🔴 Ignore: ${ignore}`);

  console.log("");
}

main()
  .catch((error) => {
    console.error("ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });