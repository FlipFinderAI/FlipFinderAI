import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analysePropertyPhoto(imageUrl: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",

      messages: [
        {
          role: "system",
          content:
            "You are an expert UK property surveyor and house flipping investor. Analyse property photos and provide refurbishment advice. Return JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Analyse this property image for a house flipper.

Return ONLY JSON in this format:

{
  "room": "kitchen/lounge/bedroom/bathroom/exterior/unknown",
  "conditionScore": 0,
  "estimatedRepairCost": 0,
  "issues": [],
  "repairs": [],
  "summary": "",
  "investorAdvice": ""
}

Look for:

- outdated kitchens
- old bathrooms
- damp or mould
- cracks
- poor decoration
- flooring problems
- windows
- obvious refurbishment needs
- approximate UK refurbishment costs

If you cannot see something clearly, say unknown.
`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],

      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content);

    return {
      room: result.room || "unknown",

      conditionScore:
        typeof result.conditionScore === "number"
          ? result.conditionScore
          : 50,

      estimatedRepairCost:
        typeof result.estimatedRepairCost === "number"
          ? result.estimatedRepairCost
          : 0,

      issues: Array.isArray(result.issues)
        ? result.issues
        : [],

      summary:
        result.summary || "",

      repairs: Array.isArray(result.repairs)
        ? result.repairs
        : [],

      investorAdvice:
        result.investorAdvice || "",
    };

  } catch (error) {

    console.error(
      "=============================="
    );

    console.error(
      "OPENAI PROPERTY ANALYSIS ERROR:"
    );

    console.error(error);

    console.error(
      "=============================="
    );

    throw error;
  }
}