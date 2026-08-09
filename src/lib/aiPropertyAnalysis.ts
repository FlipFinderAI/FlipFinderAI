
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
   *
   * Your importer should normally give us around
   * 12 genuine property photos.
   */
  const usableImages = images
    .filter(
      (url) =>
        typeof url === "string" &&
        /^https?:\/\//i.test(url)
    )
    .slice(0, 12);

  const imageContent = usableImages.map(
    (url) => ({
      type: "input_image" as const,
      image_url: url,
      detail: "low" as const,
    })
  );

  const prompt = `
You are an experienced UK property investor and refurbishment estimator.

Analyse this property using BOTH the listing information and the supplied property photographs.

PROPERTY:

Address:
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

IMPORTANT:

Only make observations that are reasonably supported by the photographs or listing information.

Do NOT invent structural problems.

If something cannot be determined from the photographs, say so.

We are looking for properties that could potentially be bought below market value and improved for resale.

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

Do not assume a full refurbishment if the property does not appear to need one.

Return ONLY valid JSON matching this structure:

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
  "summary": "string"
}

RECOMMENDATION RULES:

BUY:
The property appears potentially attractive at the asking price or below it, with a reasonable margin and manageable refurbishment.

INVESTIGATE:
There may be a good opportunity, but important information, condition issues or valuation uncertainty should be investigated.

AVOID:
The numbers or condition appear unattractive for an investor.

The confidence should be between 0 and 100.

estimatedRefurbCost should be a realistic approximate total refurbishment cost in GBP.

Do not include pound signs inside estimatedRefurbCost.

Keep the summary concise and useful to a property investor.
`;

  const response =
    await openai.responses.create({
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

  const raw =
    response.output_text?.trim();

  if (!raw) {
    throw new Error(
      "AI returned an empty response."
    );
  }

  const cleaned =
    cleanJsonResponse(raw);

  let parsed: AIPropertyAnalysis;

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
   * Basic safety/default validation.
   */

  const recommendation =
    parsed.recommendation === "BUY" ||
    parsed.recommendation === "INVESTIGATE" ||
    parsed.recommendation === "AVOID"
      ? parsed.recommendation
      : "INVESTIGATE";

  const confidence =
    Number.isFinite(
      Number(parsed.confidence)
    )
      ? Math.max(
          0,
          Math.min(
            100,
            Number(
              parsed.confidence
            )
          )
        )
      : 0;

  const estimatedRefurbCost =
    Number.isFinite(
      Number(
        parsed.estimatedRefurbCost
      )
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
  };
}