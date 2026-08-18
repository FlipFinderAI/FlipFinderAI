
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type AIPropertyAnalysis = {
  overallCondition: string;
  refurbRequired: boolean;
  estimatedRefurbCost: number;

  kitchen: string;
  bathroom: string;
  decoration: string;
  flooring: string;
  exterior: string;

  opportunities: string[];
  risks: string[];
  detectedIssues: string[];
  refurbPlan: string[];

  recommendation: "BUY" | "INVESTIGATE" | "AVOID";
  confidence: number;
  summary: string;

  // Address evidence
  detectedHouseNumber: string | null;
  houseNumberConfidence: number;
  houseNumberEvidence: string;
};

function cleanJsonResponse(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function analysePropertyWithAI({
  address,
  postcode,
  type,
  bedrooms,
  bathrooms,
  price,
  estimatedValue,
  description,
  images,
}: {
  address: string;
  postcode: string;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number;
  estimatedValue: number;
  description: string | null;
  images: string[];
}): Promise<AIPropertyAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not configured."
    );
  }

  /*
   * Keep the number of images sensible.
   * The importer should normally give us around
   * 12 genuine property photos.
   */
  const usableImages = images
    .filter(
      (url) =>
        typeof url === "string" &&
        /^https?:\/\//i.test(url)
    )
    .slice(0, 12);

  const imageContent = usableImages.map((url) => ({
    type: "input_image" as const,
    image_url: url,
    detail: "high" as const,
  }));

  const prompt = `
You are an experienced UK property investor and refurbishment estimator.

Analyse this property using BOTH the listing information and the supplied property photographs.

PROPERTY:

Address supplied by listing:
${address}

Postcode:
${postcode}

Property type:
${type}

Bedrooms:
${bedrooms ?? "Unknown"}

Bathrooms:
${bathrooms ?? "Unknown"}

Asking price:
£${price.toLocaleString("en-GB")}

Estimated market value:
£${estimatedValue.toLocaleString("en-GB")}

Listing description:
${description || "No description available"}


============================================================
IMPORTANT ADDRESS / HOUSE NUMBER INSTRUCTION
============================================================

Carefully inspect ALL supplied property photographs for visible
house numbers, door numbers, plaques, signs, gates, walls,
porches, front doors or other physical evidence showing the
property number.

The house number is extremely important.

If a clear house number is visible in a photograph, identify
the number exactly as shown.

For example:

If the photograph clearly shows:

17

then return:

"detectedHouseNumber": "17"

Do NOT change 17 to another number based on assumptions,
nearby properties, the listing address, or postcode information.

Do NOT infer a house number merely because another address
source suggests one.

Do NOT guess.

If the number is unclear, partially hidden, blurred, or cannot
be read confidently, return:

"detectedHouseNumber": null

The AI-read number is ONLY photographic evidence. It will be
independently checked against address data later.

If different photographs appear to show different numbers,
describe the conflict in houseNumberEvidence and return the
number that has the strongest photographic evidence only if
one is clearly stronger.

houseNumberConfidence must be between 0 and 100.

Use approximately:

90-100 = number is clearly visible and highly legible
75-89  = number is visible but slightly unclear
50-74  = possible number but significant uncertainty
0-49   = number cannot reliably be identified

Never invent a number simply to complete the field.


============================================================
PROPERTY CONDITION ANALYSIS
============================================================

Only make observations that are reasonably supported by the
photographs or listing information.

Do NOT invent structural problems.

If something cannot be determined from the photographs, say so.

We are looking for properties that could potentially be bought
below market value and improved for resale.

Assess:

1. Overall condition
2. Kitchen
3. Bathroom
4. Decoration
5. Flooring
6. Exterior and garden
7. Obvious repair issues
8. Likely refurbishment requirements
9. Potential value-add opportunities
10. Investor risks

Give realistic UK refurbishment estimates.

Do not assume a full refurbishment if the property does not
appear to need one.


============================================================
OUTPUT
============================================================

Return ONLY valid JSON matching this exact structure:

{
  "overallCondition": "string",
  "refurbRequired": true,
  "estimatedRefurbCost": 0,

  "kitchen": "string",
  "bathroom": "string",
  "decoration": "string",
  "flooring": "string",
  "exterior": "string",

  "opportunities": ["string"],
  "risks": ["string"],
  "detectedIssues": ["string"],
  "refurbPlan": ["string"],

  "recommendation": "BUY",
  "confidence": 0,
  "summary": "string",

  "detectedHouseNumber": "17",
  "houseNumberConfidence": 95,
  "houseNumberEvidence": "Clearly visible house number on the front of the property."
}


============================================================
RECOMMENDATION RULES
============================================================

BUY:
The property appears potentially attractive at the asking price
or below it, with a reasonable margin and manageable refurbishment.

INVESTIGATE:
There may be a good opportunity, but important information,
condition issues or valuation uncertainty should be investigated.

AVOID:
The numbers or condition appear unattractive for an investor.

The confidence should be between 0 and 100.

estimatedRefurbCost should be a realistic approximate total
refurbishment cost in GBP.

Do not include pound signs inside estimatedRefurbCost.

Keep the summary concise and useful to a property investor.


============================================================
HOUSE NUMBER SAFETY
============================================================

The house number is a separate piece of evidence from the
listing address.

Never assume the supplied address is correct simply because it
contains a house number.

Never manufacture a house number.

Never use the postcode to guess a house number.

The photograph should be treated as the source of the
detectedHouseNumber.

The downstream address resolver will independently verify the
number before the property is treated as correctly identified.
`;

  const response = await openai.responses.create({
    model: "gpt-5.6",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
          ...imageContent,
        ],
      },
    ],
  });

  const raw = response.output_text?.trim();

  if (!raw) {
    throw new Error(
      "AI returned an empty response."
    );
  }

  const cleaned = cleanJsonResponse(raw);

  let parsed: Partial<AIPropertyAnalysis>;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error(
      "AI returned invalid JSON:",
      raw
    );

    throw new Error(
      "AI returned invalid analysis data."
    );
  }

  /*
   * Recommendation validation.
   */
  const recommendation =
    parsed.recommendation === "BUY" ||
    parsed.recommendation === "INVESTIGATE" ||
    parsed.recommendation === "AVOID"
      ? parsed.recommendation
      : "INVESTIGATE";

  /*
   * Confidence validation.
   */
  const confidence =
    Number.isFinite(Number(parsed.confidence))
      ? Math.max(
          0,
          Math.min(
            100,
            Number(parsed.confidence)
          )
        )
      : 0;

  /*
   * Refurbishment cost validation.
   */
  const estimatedRefurbCost =
    Number.isFinite(
      Number(parsed.estimatedRefurbCost)
    )
      ? Math.max(
          0,
          Math.round(
            Number(
              parsed.estimatedRefurbCost
            )
          )
        )
      : 0;

  /*
   * House number validation.
   *
   * We deliberately do NOT attempt to manufacture
   * a number here.
   *
   * Only accept a simple UK-style numeric house number
   * with an optional letter, e.g.:
   *
   * 17
   * 17A
   * 17B
   */
  let detectedHouseNumber:
    string | null = null;

  if (
    typeof parsed.detectedHouseNumber ===
      "string" &&
    /^\d+[A-Z]?$/i.test(
      parsed.detectedHouseNumber.trim()
    )
  ) {
    detectedHouseNumber =
      parsed.detectedHouseNumber
        .trim()
        .toUpperCase();
  }

  /*
   * House number confidence validation.
   */
  const houseNumberConfidence =
    Number.isFinite(
      Number(
        parsed.houseNumberConfidence
      )
    )
      ? Math.max(
          0,
          Math.min(
            100,
            Number(
              parsed.houseNumberConfidence
            )
          )
        )
      : 0;

  const houseNumberEvidence =
    typeof parsed.houseNumberEvidence ===
    "string"
      ? parsed.houseNumberEvidence.trim()
      : "";

  /*
   * Log the photographic address evidence.
   */
  console.log(
    "========================================"
  );

  console.log(
    "AI PROPERTY ANALYSIS"
  );

  console.log(
    "AI detected house number:",
    detectedHouseNumber || "NOT CONFIDENTLY DETECTED"
  );

  console.log(
    "House number confidence:",
    houseNumberConfidence
  );

  console.log(
    "House number evidence:",
    houseNumberEvidence ||
      "No photographic evidence recorded."
  );

  console.log(
    "========================================"
  );

  return {
    overallCondition:
      parsed.overallCondition ||
      "Unable to determine",

    refurbRequired:
      Boolean(
        parsed.refurbRequired
      ),

    estimatedRefurbCost,

    kitchen:
      parsed.kitchen ||
      "Unable to determine",

    bathroom:
      parsed.bathroom ||
      "Unable to determine",

    decoration:
      parsed.decoration ||
      "Unable to determine",

    flooring:
      parsed.flooring ||
      "Unable to determine",

    exterior:
      parsed.exterior ||
      "Unable to determine",

    opportunities:
      Array.isArray(
        parsed.opportunities
      )
        ? parsed.opportunities
        : [],

    risks:
      Array.isArray(parsed.risks)
        ? parsed.risks
        : [],

    detectedIssues:
      Array.isArray(
        parsed.detectedIssues
      )
        ? parsed.detectedIssues
        : [],

    refurbPlan:
      Array.isArray(
        parsed.refurbPlan
      )
        ? parsed.refurbPlan
        : [],

    recommendation,

    confidence,

    summary:
      parsed.summary ||
      "No AI summary available.",

    detectedHouseNumber,

    houseNumberConfidence,

    houseNumberEvidence:
      houseNumberEvidence ||
      "No photographic house number evidence available.",
  };
}