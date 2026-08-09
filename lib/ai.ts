import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function analysePropertyPhoto(imageUrl: string) {

  const response = await openai.chat.completions.create({

    model: "gpt-5-mini",

    messages: [

      {
        role: "system",
        content:
          "You are an expert UK property investor. Analyse property photos and estimate refurbishment requirements and costs."
      },

      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
Analyse this property image.

Return JSON containing:

- room
- conditionScore (0-100)
- issues
- refurbishmentRequired
- estimatedRepairCost
- investorAdvice
- confidence
`
          },

          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }

    ],

    response_format: {
      type: "json_object"
    }

  });


  return JSON.parse(
    response.choices[0].message.content || "{}"
  );

}