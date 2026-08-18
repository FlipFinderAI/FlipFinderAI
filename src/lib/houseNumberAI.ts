import openai from "@/lib/openai";
import sharp from "sharp";

/*
============================================================
HOUSE NUMBER TYPES
============================================================
*/

export type HouseNumberResult = {
  houseNumber: string | null;
  confidence: number;
  evidence: string;
};

type HouseNumberCandidate = {
  photograph: number;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
};

type VerificationResult = {
  houseNumber: string | null;
  confidence: number;
  evidence: string;
};


/*
============================================================
JSON CLEANER
============================================================
*/

function cleanJsonResponse(text: string): string {

  return text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

}


/*
============================================================
IMAGE BUFFER TO DATA URL
============================================================
*/

function bufferToDataUrl(
  buffer: Buffer
): string {

  return `data:image/jpeg;base64,${buffer.toString("base64")}`;

}


/*
============================================================
NORMALISE HOUSE NUMBER
============================================================
*/

function normaliseHouseNumber(
  value: unknown
): string | null {

  if (typeof value !== "string") {
    return null;
  }

  const cleaned =
    value
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

  /*
   * Normal house number:
   *
   * 21
   * 21A
   * 21B
   */

  if (/^\d+[A-Z]?$/.test(cleaned)) {
    return cleaned;
  }

  /*
   * Range:
   *
   * 21-23
   */

  if (/^\d+-\d+$/.test(cleaned)) {
    return cleaned;
  }

  return null;

}


/*
============================================================
IMAGE DOWNLOAD
============================================================
*/

async function downloadImage(
  imageUrl: string
): Promise<Buffer | null> {

  try {

    /*
     * ========================================================
     * ZOOPLA IMAGE URL NORMALISATION
     * ========================================================
     */

    const usableImageUrl =
      imageUrl
        .replace(
          "/u/original/768/",
          "/u/1024/768/"
        )
        .replace(
          "/u/original/360/",
          "/u/480/360/"
        );

    if (usableImageUrl !== imageUrl) {

      console.log(
        "HOUSE NUMBER ZOOPLA URL NORMALISED:",
        imageUrl,
        "=>",
        usableImageUrl
      );

    }

    const response =
      await fetch(
        usableImageUrl,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 FlipFinderAI",

            Accept:
              "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          },
        }
      );

    if (!response.ok) {

      console.error(
        "HOUSE NUMBER IMAGE DOWNLOAD FAILED:",
        response.status,
        usableImageUrl
      );

      return null;

    }

    const type =
      response.headers.get(
        "content-type"
      ) || "";

    if (!type.includes("image")) {

      console.error(
        "HOUSE NUMBER NOT IMAGE:",
        type,
        imageUrl
      );

      return null;

    }

    const buffer =
      Buffer.from(
        await response.arrayBuffer()
      );

    console.log(
      "HOUSE NUMBER IMAGE DOWNLOAD SUCCESS:",
      {
        url: usableImageUrl,
        contentType: type,
        bytes: buffer.length,
      }
    );

    return buffer;

  } catch(error) {

    console.error(
      "HOUSE NUMBER DOWNLOAD ERROR:",
      error
    );

    return null;

  }

}


/*
============================================================
IMAGE FILTERING
============================================================
*/

function isValidPropertyImageUrl(
  url: string
): boolean {

  const lower =
    url.toLowerCase();

  const blocked = [
    "logo",
    "agent",
    "avatar",
    "icon",
    "favicon",
    "placeholder",
    "static_agent",
  ];

  if (
    blocked.some(
      item => lower.includes(item)
    )
  ) {

    console.log(
      "HOUSE NUMBER IMAGE REJECTED:",
      url
    );

    return false;

  }

  if (
    !(
      lower.includes(".jpg") ||
      lower.includes(".jpeg") ||
      lower.includes(".png") ||
      lower.includes(".webp")
    )
  ) {

    return false;

  }

  return true;

}


/*
============================================================
CLEAN IMAGE LIST
============================================================
*/

function cleanImageUrls(
  imageUrls: string[]
): string[] {

  const seen =
    new Set<string>();

  const results:
    string[] = [];

  for (
    const raw of imageUrls
  ) {

    if (
      typeof raw !== "string"
    ) {
      continue;
    }

    const url =
      raw.trim();

    if (
      !/^https?:\/\//i.test(url)
    ) {
      continue;
    }

    if (
      !isValidPropertyImageUrl(url)
    ) {
      continue;
    }

    const key =
      url
        .split("?")[0]
        .toLowerCase();

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    results.push(url);

  }

  return results.slice(0, 15);

}


/*
============================================================
PASS 1
LOCATE POSSIBLE HOUSE NUMBER AREAS
============================================================
*/

async function locatePossibleHouseNumbers(
  imageUrls: string[]
): Promise<HouseNumberCandidate[]> {

  console.log(
    "HOUSE NUMBER PASS 1 START"
  );

  const candidates:
    HouseNumberCandidate[] = [];

  for (
    let index = 0;
    index < imageUrls.length;
    index++
  ) {

    console.log(
      "HOUSE NUMBER DOWNLOAD INPUT:",
      index + 1,
      imageUrls[index]
    );

    const imageBuffer =
      await downloadImage(
        imageUrls[index]
      );

    if (!imageBuffer) {
      continue;
    }

    const dataUrl =
      bufferToDataUrl(
        imageBuffer
      );

    try {

      const response =
        await openai.responses.create({

          model: "gpt-5.6",

          input: [
            {
              role: "user",

              content: [

                {
                  type: "input_text",

                  text: `

You inspect UK property photographs.

Your ONLY task is to LOCATE possible physical house-number regions.

Look specifically for:

- numbers on front doors
- numbers beside front doors
- number plaques
- numbers on walls
- numbers on porches
- numbers on gates
- entrance numbers

IMPORTANT:

Do NOT try to guess the actual house number.

You are only locating the physical area containing the number.

A tiny number that is difficult to read is still useful.

Return JSON only:

{
  "candidates": [
    {
      "confidence": 95,
      "x": 420,
      "y": 350,
      "width": 80,
      "height": 80,
      "description": "physical house number on front door"
    }
  ]
}

Coordinates MUST be normalised from 0 to 1000.

x = left edge
y = top edge
width = width of region
height = height of region

IMPORTANT:

Make the bounding box LARGE ENOUGH to include the complete physical number.

Do not return a tiny box around a single digit.

Include some surrounding door/wall area so the next system can crop and enlarge it.

Do not guess a number.
`,

                },

                {
                  type: "input_image",
                  image_url: dataUrl,
                  detail: "high",
                },

              ],

            },

          ],

        });

      const raw =
        response.output_text?.trim() || "";

      if (!raw) {
        continue;
      }

      const parsed =
        JSON.parse(
          cleanJsonResponse(raw)
        );

      if (
        !Array.isArray(
          parsed.candidates
        )
      ) {
        continue;
      }

      for (
        const item of parsed.candidates
      ) {

        const confidence =
          Number(
            item.confidence
          );

        if (
          !Number.isFinite(confidence) ||
          confidence < 50
        ) {
          continue;
        }

        candidates.push({

          photograph:
            index + 1,

          confidence:
            Math.min(
              100,
              Math.max(
                0,
                confidence
              )
            ),

          x:
            Number(item.x) || 0,

          y:
            Number(item.y) || 0,

          width:
            Number(item.width) || 100,

          height:
            Number(item.height) || 100,

          description:
            item.description ||
            "Possible physical house-number area",

        });

      }

    } catch(error) {

      console.error(
        "HOUSE NUMBER PASS 1 ERROR:",
        error
      );

    }

  }

  console.log(
    "HOUSE NUMBER CANDIDATES:",
    candidates.length
  );

  return candidates;

}


/*
============================================================
CREATE ACTUAL NUMBER CROP
============================================================

THIS IS THE IMPORTANT FIX.

The old version simply returned the original image.

This version:

1. Reads the real image dimensions.
2. Converts AI 0-1000 coordinates into pixels.
3. Adds padding around the detected number.
4. Crops the physical number area.
5. Enlarges it substantially.
6. Sharpens it.
7. Gives the enlarged image to the next AI systems.

============================================================
*/

async function createNumberCrop(
  imageBuffer: Buffer,
  candidate: HouseNumberCandidate
): Promise<Buffer> {

  console.log(
    "========================================"
  );

  console.log(
    "CREATING ACTUAL HOUSE NUMBER CROP"
  );

  console.log(
    "CANDIDATE COORDINATES:",
    {
      x: candidate.x,
      y: candidate.y,
      width: candidate.width,
      height: candidate.height,
    }
  );

  const metadata =
    await sharp(imageBuffer)
      .metadata();

  const imageWidth =
    metadata.width || 1024;

  const imageHeight =
    metadata.height || 768;

  /*
   * Convert 0-1000 coordinates to actual pixels.
   */

  let left =
    Math.round(
      (candidate.x / 1000) *
      imageWidth
    );

  let top =
    Math.round(
      (candidate.y / 1000) *
      imageHeight
    );

  let width =
    Math.round(
      (candidate.width / 1000) *
      imageWidth
    );

  let height =
    Math.round(
      (candidate.height / 1000) *
      imageHeight
    );

  /*
   * ========================================================
   * PADDING
   * ========================================================
   *
   * The locator may produce a box that is slightly too tight.
   *
   * Give the number some breathing room.
   */

  const paddingX =
    Math.max(
      30,
      Math.round(width * 0.75)
    );

  const paddingY =
    Math.max(
      30,
      Math.round(height * 0.75)
    );

  left -= paddingX;
  top -= paddingY;

  width +=
    paddingX * 2;

  height +=
    paddingY * 2;

  /*
   * ========================================================
   * KEEP CROP INSIDE IMAGE
   * ========================================================
   */

  if (left < 0) {
    width += left;
    left = 0;
  }

  if (top < 0) {
    height += top;
    top = 0;
  }

  if (
    left + width >
    imageWidth
  ) {

    width =
      imageWidth - left;

  }

  if (
    top + height >
    imageHeight
  ) {

    height =
      imageHeight - top;

  }

  /*
   * Safety checks.
   */

  width =
    Math.max(
      1,
      Math.round(width)
    );

  height =
    Math.max(
      1,
      Math.round(height)
    );

  console.log(
    "ORIGINAL IMAGE SIZE:",
    {
      width: imageWidth,
      height: imageHeight,
    }
  );

  console.log(
    "ACTUAL CROP PIXELS:",
    {
      left,
      top,
      width,
      height,
    }
  );

  /*
   * ========================================================
   * ENLARGE THE NUMBER REGION
   * ========================================================
   *
   * Target output is large enough for GPT vision to inspect
   * the physical digits clearly.
   */

  const targetWidth =
    1400;

  const targetHeight =
    1050;

  const crop =
    await sharp(imageBuffer)
      .extract({
        left,
        top,
        width,
        height,
      })
      .resize(
        targetWidth,
        targetHeight,
        {
          fit: "contain",
          background: {
            r: 255,
            g: 255,
            b: 255,
            alpha: 1,
          },
          kernel:
            sharp.kernel.lanczos3,
        }
      )
      .sharpen({
        sigma: 1.2,
        m1: 1,
        m2: 2,
      })
      .jpeg({
        quality: 95,
      })
      .toBuffer();

  console.log(
    "ENLARGED HOUSE NUMBER CROP CREATED:",
    {
      bytes: crop.length,
      width: targetWidth,
      height: targetHeight,
    }
  );

  console.log(
    "========================================"
  );

  return crop;

}


/*
============================================================
PASS 2
READ THE ACTUAL HOUSE NUMBER
============================================================
*/

async function verifyNumberCrop(
  cropBuffer: Buffer,
  candidate: HouseNumberCandidate,
  photographNumber: number
): Promise<VerificationResult> {

  console.log(
    "HOUSE NUMBER PASS 2 - READING ENLARGED CROP"
  );

  try {

    const dataUrl =
      bufferToDataUrl(
        cropBuffer
      );

    const response =
      await openai.responses.create({

        model: "gpt-5.6",

        input: [
          {
            role: "user",

            content: [

              {
                type: "input_text",

                text: `

You are the SECOND independent house-number reading system.

This image is an ENLARGED CROP taken from:

Photograph ${photographNumber}

The crop was created because another vision system detected a possible physical house-number area.

IMPORTANT:

Ignore the previous system's interpretation.

Look directly at the enlarged image.

Your task is to READ THE ACTUAL PHYSICAL DIGITS.

Look for:

- house number on door
- number plaque
- digits beside door
- digits on wall
- entrance number

Do NOT use:

- listing address
- postcode
- property database
- filenames
- assumptions
- nearby house numbers

Do NOT guess.

If you can clearly see the physical number, return exactly what the digits show.

Examples:

21
23
17A
21B

If you cannot reliably read it, return null.

Return ONLY valid JSON:

{
  "houseNumber": "21",
  "confidence": 95,
  "evidence": "The enlarged crop clearly shows the physical digits 21 attached to the entrance."
}

OR:

{
  "houseNumber": null,
  "confidence": 0,
  "evidence": "The physical digits cannot be read reliably."
}

Confidence:

90-100 = extremely clear
80-89 = clear
70-79 = readable but some uncertainty
50-69 = possible but unreliable
below 50 = null

Do NOT infer the number from the property listing.

READ THE IMAGE.
`,

              },

              {
                type: "input_image",
                image_url: dataUrl,
                detail: "high",
              },

            ],

          },

        ],

      });

    const raw =
      response.output_text?.trim() || "";

    if (!raw) {

      return {

        houseNumber: null,

        confidence: 0,

        evidence:
          "The enlarged crop reading returned no result.",

      };

    }

    const parsed =
      JSON.parse(
        cleanJsonResponse(raw)
      );

    const houseNumber =
      normaliseHouseNumber(
        parsed.houseNumber
      );

    const confidence =
      Number(
        parsed.confidence
      );

    return {

      houseNumber,

      confidence:
        Number.isFinite(
          confidence
        )
          ? Math.max(
              0,
              Math.min(
                100,
                confidence
              )
            )
          : 0,

      evidence:
        typeof parsed.evidence === "string"
          ? parsed.evidence.trim()
          : "No visual evidence supplied.",

    };

  } catch(error) {

    console.error(
      "HOUSE NUMBER PASS 2 ERROR:",
      error
    );

    return {

      houseNumber: null,

      confidence: 0,

      evidence:
        "House-number reading failed.",

    };

  }

}


/*
============================================================
PASS 3
INDEPENDENT CONFIRMATION

IMPORTANT:
DO NOT TELL PASS 3 WHAT PASS 2 SAID.

This prevents the second AI from simply agreeing.
============================================================
*/

async function independentlyConfirmNumber(
  cropBuffer: Buffer
): Promise<VerificationResult> {

  console.log(
    "HOUSE NUMBER PASS 3 - FULLY INDEPENDENT READING"
  );

  try {

    const dataUrl =
      bufferToDataUrl(
        cropBuffer
      );

    const response =
      await openai.responses.create({

        model: "gpt-5.6",

        input: [
          {
            role: "user",

            content: [

              {
                type: "input_text",

                text: `

You are the THIRD and FINAL independent house-number reading system.

You are looking at an ENLARGED CROP of a possible physical house-number area.

Do NOT assume any answer.

Do NOT trust another AI.

Your task is to independently read whatever physical house number is actually visible.

Look carefully at:

- individual digits
- digit shapes
- spacing
- physical placement
- door number plaques
- numbers attached to the entrance

The number MUST physically exist in the supplied image.

Do NOT use:

- property listing information
- address information
- postcode
- filenames
- nearby properties
- expected answers
- assumptions

If the physical number is clearly readable, return it.

If it is not readable, return null.

Return ONLY valid JSON:

{
  "houseNumber": "21",
  "confidence": 95,
  "evidence": "The enlarged crop clearly shows the physical digits 21."
}

OR:

{
  "houseNumber": null,
  "confidence": 0,
  "evidence": "No physical house number can be reliably read."
}

Confidence:

90-100 = extremely clear
80-89 = clear
70-79 = readable with some uncertainty
50-69 = possible but unreliable
below 50 = null

DO NOT GUESS.

READ THE DIGITS YOURSELF.
`,

              },

              {
                type: "input_image",
                image_url: dataUrl,
                detail: "high",
              },

            ],

          },

        ],

      });

    const raw =
      response.output_text?.trim() || "";

    if (!raw) {

      return {

        houseNumber: null,

        confidence: 0,

        evidence:
          "Independent confirmation returned no result.",

      };

    }

    const parsed =
      JSON.parse(
        cleanJsonResponse(raw)
      );

    const houseNumber =
      normaliseHouseNumber(
        parsed.houseNumber
      );

    const confidence =
      Number(
        parsed.confidence
      );

    return {

      houseNumber,

      confidence:
        Number.isFinite(
          confidence
        )
          ? Math.max(
              0,
              Math.min(
                100,
                confidence
              )
            )
          : 0,

      evidence:
        typeof parsed.evidence === "string"
          ? parsed.evidence.trim()
          : "No independent evidence supplied.",

    };

  } catch(error) {

    console.error(
      "HOUSE NUMBER PASS 3 ERROR:",
      error
    );

    return {

      houseNumber: null,

      confidence: 0,

      evidence:
        "Independent house-number confirmation failed.",

    };

  }

}


/*
============================================================
MAIN FUNCTION
============================================================
*/

export async function identifyHouseNumberFromPhoto(
  imageUrls: string[]
): Promise<HouseNumberResult> {

  console.log(
    "========================================"
  );

  console.log(
    "HOUSE NUMBER AI STARTED"
  );

  console.log(
    "EXTERIOR PHOTOS ONLY"
  );

  console.log(
    "PHOTO 1 = PRIMARY FRONT PHOTO"
  );

  console.log(
    "IMAGES:",
    imageUrls?.length || 0
  );

  console.log(
    "========================================"
  );

  try {

    /*
     * ========================================================
     * VALIDATE INPUT
     * ========================================================
     */

    if (
      !Array.isArray(imageUrls) ||
      imageUrls.length === 0
    ) {

      return {

        houseNumber: null,

        confidence: 0,

        evidence:
          "No property photographs were supplied.",

      };

    }


    /*
     * ========================================================
     * CLEAN + DEDUPLICATE
     * ========================================================
     */

    const cleanedImages =
      cleanImageUrls(
        imageUrls
      );

    console.log(
      "CLEANED HOUSE NUMBER IMAGES:",
      cleanedImages.length
    );


    if (
      cleanedImages.length === 0
    ) {

      return {

        houseNumber: null,

        confidence: 0,

        evidence:
          "No valid exterior property photographs were available for house-number analysis.",

      };

    }


    /*
     * ========================================================
     * PASS 1
     * LOCATE POSSIBLE NUMBER AREAS
     * ========================================================
     */

    const candidates =
      await locatePossibleHouseNumbers(
        cleanedImages
      );


    /*
     * ========================================================
     * PHOTO 1 PRIORITY
     * ========================================================
     */

    const photoOneCandidates =
      candidates
        .filter(
          candidate =>
            candidate.photograph === 1
        )
        .sort(
          (a, b) =>
            b.confidence -
            a.confidence
        );


    const otherCandidates =
      candidates
        .filter(
          candidate =>
            candidate.photograph !== 1
        )
        .sort(
          (a, b) =>
            b.confidence -
            a.confidence
        );


    /*
     * PHOTO 1 ALWAYS FIRST
     */

    const sortedCandidates = [

      ...photoOneCandidates,

      ...otherCandidates,

    ].slice(0, 8);


    console.log(
      "PHOTO 1 CANDIDATES:",
      photoOneCandidates.length
    );

    console.log(
      "OTHER EXTERIOR CANDIDATES:",
      otherCandidates.length
    );


    /*
     * ========================================================
     * NO POSSIBLE NUMBERS
     * ========================================================
     */

    if (
      sortedCandidates.length === 0
    ) {

      return {

        houseNumber: null,

        confidence: 0,

        evidence:
          "Exterior photographs were inspected, but no plausible physical house-number region was detected.",

      };

    }


    /*
     * ========================================================
     * IMAGE CACHE
     * ========================================================
     */

    const imageBufferCache =
      new Map<number, Buffer>();


    /*
     * ========================================================
     * PROCESS CANDIDATES
     * ========================================================
     */

    for (
      const candidate of sortedCandidates
    ) {

      const photographNumber =
        candidate.photograph;


      if (
        photographNumber < 1 ||
        photographNumber >
          cleanedImages.length
      ) {

        continue;

      }


      console.log(
        "========================================"
      );

      console.log(
        "PROCESSING HOUSE NUMBER CANDIDATE"
      );

      console.log(
        "PHOTOGRAPH:",
        photographNumber
      );

      console.log(
        "CANDIDATE:",
        candidate
      );

      console.log(
        "========================================"
      );


      /*
       * ======================================================
       * DOWNLOAD ORIGINAL IMAGE
       * ======================================================
       */

      let imageBuffer =
        imageBufferCache.get(
          photographNumber
        );


      if (!imageBuffer) {

        const downloadedImage =
          await downloadImage(
            cleanedImages[
              photographNumber - 1
            ]
          );

        if (!downloadedImage) {
          continue;
        }

        imageBuffer =
          downloadedImage;

        imageBufferCache.set(
          photographNumber,
          imageBuffer
        );

      }


      /*
       * ======================================================
       * CREATE REAL ENLARGED CROP
       * ======================================================
       */

      let cropBuffer: Buffer;


      try {

        cropBuffer =
          await createNumberCrop(
            imageBuffer,
            candidate
          );

      } catch(error) {

        console.error(
          "HOUSE NUMBER CROP ERROR:",
          error
        );

        continue;

      }


      /*
       * ======================================================
       * PASS 2
       * READ ENLARGED CROP
       * ======================================================
       */

      const verification =
        await verifyNumberCrop(
          cropBuffer,
          candidate,
          photographNumber
        );


      console.log(
        "HOUSE NUMBER PASS 2 RESULT:",
        verification
      );


      /*
       * ======================================================
       * PASS 2 FAILURE
       * ======================================================
       */

      if (
        !verification.houseNumber ||
        verification.confidence < 70
      ) {

        console.log(
          "HOUSE NUMBER PASS 2 FAILED"
        );

        continue;

      }


      /*
       * ======================================================
       * PASS 3
       * INDEPENDENTLY READ SAME ENLARGED CROP
       * ======================================================
       */

      const confirmation =
        await independentlyConfirmNumber(
          cropBuffer
        );


      console.log(
        "HOUSE NUMBER PASS 3 RESULT:",
        confirmation
      );


      /*
       * ======================================================
       * PASS 3 FAILURE
       * ======================================================
       */

      if (
        !confirmation.houseNumber ||
        confirmation.confidence < 85
      ) {

        console.log(
          "HOUSE NUMBER INDEPENDENT CONFIRMATION FAILED"
        );

        continue;

      }


      /*
       * ======================================================
       * EXACT AGREEMENT CHECK
       * ======================================================
       */

      const pass2Number =
        verification.houseNumber
          .trim()
          .toUpperCase();

      const pass3Number =
        confirmation.houseNumber
          .trim()
          .toUpperCase();


      if (
        pass2Number !==
        pass3Number
      ) {

        console.log(
          "HOUSE NUMBER VERIFICATION DISAGREEMENT"
        );

        console.log(
          "PASS 2:",
          verification.houseNumber
        );

        console.log(
          "PASS 3:",
          confirmation.houseNumber
        );

        continue;

      }


      /*
       * ======================================================
       * VERIFIED NUMBER
       * ======================================================
       */

      const finalConfidence =
        Math.min(
          verification.confidence,
          confirmation.confidence
        );


      const finalEvidence =
        `Photograph ${photographNumber}: ${
          verification.evidence ||
          confirmation.evidence ||
          "Physical exterior house number independently confirmed."
        }`;


      console.log(
        "========================================"
      );

      console.log(
        "HOUSE NUMBER VERIFIED"
      );

      console.log(
        "HOUSE NUMBER:",
        pass2Number
      );

      console.log(
        "CONFIDENCE:",
        finalConfidence
      );

      console.log(
        "EVIDENCE:",
        finalEvidence
      );

      console.log(
        "========================================"
      );


      return {

        houseNumber:
          pass2Number,

        confidence:
          finalConfidence,

        evidence:
          finalEvidence,

      };

    }


    /*
     * ========================================================
     * NOTHING VERIFIED
     * ========================================================
     */

    console.log(
      "========================================"
    );

    console.log(
      "HOUSE NUMBER NOT VERIFIED"
    );

    console.log(
      "No physical house number passed all verification stages."
    );

    console.log(
      "========================================"
    );


    return {

      houseNumber: null,

      confidence: 0,

      evidence:
        "Exterior photographs were inspected, but no physical house number passed the required visual verification.",

    };


  } catch(error) {

    console.error(
      "HOUSE NUMBER AI MAIN ERROR:",
      error
    );


    return {

      houseNumber: null,

      confidence: 0,

      evidence:
        "House-number analysis failed unexpectedly.",

    };

  }

}