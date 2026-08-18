import openai from "@/lib/openai";
import sharp from "sharp";

/*
 * ============================================================
 * HOUSE NUMBER AI
 * ============================================================
 *
 * Pipeline:
 *
 * 1. Download exterior photographs
 * 2. Locate possible physical house numbers
 * 3. Crop detected region
 * 4. Read number independently
 * 5. Independently confirm number
 * 6. Determine whether number belongs to advertised property
 * 7. If direct verification fails, inspect neighbours
 * 8. Only infer a number where the visual relationship supports it
 *
 * IMPORTANT:
 *
 * The advertised address is NEVER supplied to the vision model.
 * ============================================================
 */

export type HouseNumberResult = {
  houseNumber: string | null;
  confidence: number;
  evidence: string;

  /*
   * Cross-validation context.
   *
   * visibleNumbers: all numbers the AI read from photographs.
   * associatedNumber: the number Pass 4 attributed to the property.
   * associationConfidence: Pass 4's confidence.
   * targetMatch: how the photographic result compares to the target.
   * targetMismatchReason: explanation when conflict.
   */
  visibleNumbers: string[];
  associatedNumber: string | null;
  associationConfidence: number;
  targetMatch:
    | "confirmed"
    | "conflict"
    | "unknown";
  targetMismatchReason: string | null;
};

type DownloadedImage = {
  buffer: Buffer;
  mimeType: string;
};

type HouseNumberCandidate = {
  photograph: number;
  confidence: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  description: string;
};

type VerificationResult = {
  houseNumber: string | null;
  confidence: number;
  evidence: string;
};

type AssociationResult = {
  belongsToAdvertisedProperty: boolean;
  confidence: number;
  evidence: string;
};

type NeighbourInferenceResult = {
  houseNumber: string | null;
  confidence: number;
  evidence: string;
  visibleNeighbourNumber?: string | null;
  targetSide?: "left" | "right" | "unknown";
  neighbourSide?: "left" | "right" | "unknown";
  relationship?:
    | "adjacent_semi_detached"
    | "adjacent_terraced"
    | "adjacent"
    | "not_adjacent"
    | "unknown";
  numberingPatternSupported?: boolean;
};

/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const MODEL = "gpt-5.6";

const MAX_PHOTOS = 15;

const MAX_DIRECT_CANDIDATES = 8;

const DIRECT_READ_THRESHOLD = 70;

const DIRECT_CONFIRM_THRESHOLD = 85;

const ASSOCIATION_THRESHOLD = 80;

const NEIGHBOUR_THRESHOLD = 90;

/*
 * ============================================================
 * JSON CLEANER
 * ============================================================
 */

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();

  cleaned = cleaned.replace(
    /^```(?:json)?\s*/i,
    ""
  );

  cleaned = cleaned.replace(
    /\s*```$/i,
    ""
  );

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace >= 0 &&
    lastBrace > firstBrace
  ) {
    cleaned = cleaned.slice(
      firstBrace,
      lastBrace + 1
    );
  }

  return cleaned.trim();
}

/*
 * ============================================================
 * SAFE JSON PARSER
 * ============================================================
 */

function parseJson(
  text: string
): any | null {
  try {
    return JSON.parse(
      cleanJsonResponse(text)
    );
  } catch (error) {
    console.error(
      "HOUSE NUMBER JSON PARSE ERROR:",
      error
    );

    console.error(
      "RAW RESPONSE:",
      text
    );

    return null;
  }
}

/*
 * ============================================================
 * IMAGE BUFFER -> DATA URL
 * ============================================================
 */

function bufferToDataUrl(
  buffer: Buffer,
  mimeType: string
): string {
  return `data:${mimeType};base64,${buffer.toString(
    "base64"
  )}`;
}

/*
 * ============================================================
 * NORMALISE HOUSE NUMBER
 * ============================================================
 */

function normaliseHouseNumber(
  value: unknown
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (
    /^\d+[A-Z]?$/.test(cleaned)
  ) {
    return cleaned;
  }

  if (
    /^\d+-\d+$/.test(cleaned)
  ) {
    return cleaned;
  }

  return null;
}

/*
 * ============================================================
 * CLAMP
 * ============================================================
 */

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

/*
 * ============================================================
 * OPENAI VISION RETRY WRAPPER
 * ============================================================
 */

async function callVision(
  input: any,
  attempts = 3
): Promise<string | null> {
  for (
    let attempt = 1;
    attempt <= attempts;
    attempt++
  ) {
    try {
      console.log(
        `HOUSE NUMBER VISION ATTEMPT ${attempt}/${attempts}`
      );

      const response =
        await openai.responses.create({
          model: MODEL,
          input,
        });

      const output =
        response.output_text?.trim();

      if (output) {
        return output;
      }

      console.warn(
        `HOUSE NUMBER VISION EMPTY RESPONSE ${attempt}/${attempts}`
      );
    } catch (error) {
      console.error(
        `HOUSE NUMBER VISION ERROR ${attempt}/${attempts}:`,
        error
      );

      if (
        attempt < attempts
      ) {
        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1000 * attempt
            )
        );
      }
    }
  }

  return null;
}

/*
 * ============================================================
 * IMAGE DOWNLOAD
 * ============================================================
 */

export async function downloadImage(
  imageUrl: string
): Promise<Buffer | null> {
  const result =
    await downloadImageWithMimeType(
      imageUrl
    );

  return result?.buffer ?? null;
}

async function downloadImageWithMimeType(
  imageUrl: string
): Promise<DownloadedImage | null> {
  try {
    const urlsToTry: string[] = [];

    /*
     * ZOOPLA HIGH QUALITY
     */

    let highQualityUrl =
      imageUrl;

    highQualityUrl =
      highQualityUrl.replace(
        "/u/original/768/",
        "/u/1024/768/"
      );

    highQualityUrl =
      highQualityUrl.replace(
        "/u/original/360/",
        "/u/1024/768/"
      );

    highQualityUrl =
      highQualityUrl.replace(
        "/u/480/360/",
        "/u/1024/768/"
      );

    if (
      !urlsToTry.includes(
        highQualityUrl
      )
    ) {
      urlsToTry.push(
        highQualityUrl
      );
    }

    /*
     * FALLBACK
     */

    let fallbackUrl =
      imageUrl;

    fallbackUrl =
      fallbackUrl.replace(
        "/u/original/768/",
        "/u/480/360/"
      );

    fallbackUrl =
      fallbackUrl.replace(
        "/u/original/360/",
        "/u/480/360/"
      );

    if (
      !urlsToTry.includes(
        fallbackUrl
      )
    ) {
      urlsToTry.push(
        fallbackUrl
      );
    }

    /*
     * ORIGINAL
     */

    if (
      !urlsToTry.includes(
        imageUrl
      )
    ) {
      urlsToTry.push(
        imageUrl
      );
    }

    /*
     * TRY URLS
     */

    for (
      const url of urlsToTry
    ) {
      console.log(
        "HOUSE NUMBER IMAGE ATTEMPT:",
        url
      );

      try {
        const response =
          await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151 Safari/537.36",

              Accept:
                "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",

              Referer:
                "https://www.zoopla.co.uk/",
            },
          });

        if (!response.ok) {
          console.warn(
            "HOUSE NUMBER IMAGE FAILED:",
            response.status,
            url
          );

          continue;
        }

        const contentType =
          response.headers.get(
            "content-type"
          ) || "";

        if (
          !contentType
            .toLowerCase()
            .startsWith("image/")
        ) {
          console.warn(
            "HOUSE NUMBER RESPONSE NOT IMAGE:",
            contentType,
            url
          );

          continue;
        }

        const buffer =
          Buffer.from(
            await response.arrayBuffer()
          );

        if (
          buffer.length === 0
        ) {
          continue;
        }

        try {
          await sharp(
            buffer
          ).metadata();
        } catch {
          console.warn(
            "HOUSE NUMBER IMAGE COULD NOT BE READ:",
            url
          );

          continue;
        }

        console.log(
          "HOUSE NUMBER IMAGE DOWNLOAD SUCCESS:",
          {
            url,
            contentType,
            bytes: buffer.length,
          }
        );

        return {
          buffer,
          mimeType:
            contentType
              .split(";")[0]
              .trim() ||
            "image/jpeg",
        };
      } catch (error) {
        console.warn(
          "HOUSE NUMBER IMAGE ERROR:",
          url,
          error
        );
      }
    }

    console.error(
      "HOUSE NUMBER IMAGE DOWNLOAD FAILED:",
      imageUrl
    );

    return null;
  } catch (error) {
    console.error(
      "HOUSE NUMBER DOWNLOAD ERROR:",
      error
    );

    return null;
  }
}

/*
 * ============================================================
 * PASS 1
 * LOCATE POSSIBLE PHYSICAL HOUSE NUMBERS
 * ============================================================
 */

async function locatePossibleHouseNumbers(
  imageUrls: string[]
): Promise<HouseNumberCandidate[]> {
  console.log(
    "HOUSE NUMBER PASS 1 - LOCATING PHYSICAL NUMBERS"
  );

  const candidates: HouseNumberCandidate[] =
    [];

  for (
    let index = 0;
    index < imageUrls.length;
    index++
  ) {
    const downloaded =
      await downloadImageWithMimeType(
        imageUrls[index]
      );

    if (!downloaded) {
      continue;
    }

    const dataUrl =
      bufferToDataUrl(
        downloaded.buffer,
        downloaded.mimeType
      );

    const input = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
You are the first-stage physical house-number detector.

This is photograph ${
              index + 1
            } of a UK property listing.

Your ONLY task is to locate REAL PHYSICAL HOUSE-NUMBER REGIONS.

Look for:

- number on front door
- number beside front door
- ceramic number plaque
- metal number plaque
- number mounted on wall
- number beside entrance
- number on gate
- number on porch
- number attached to building

DO NOT read or infer the actual number.

DO NOT use:

- listing text
- filename
- URL
- postcode
- estate-agent signs
- bins
- cars
- road signs
- neighbouring assumptions

If you find a possible physical house number, return its bounding region.

IMPORTANT:

x and y MUST represent the CENTRE of the detected region.

All coordinates are 0 to 1000.

Return ONLY:

{
  "candidates": [
    {
      "confidence": 95,
      "centerX": 500,
      "centerY": 500,
      "width": 80,
      "height": 100,
      "description": "Physical number plaque beside the front door."
    }
  ]
}

If nothing is visible:

{
  "candidates": []
}

Confidence:

90-100 = clearly visible number region
75-89 = probably number region
50-74 = possible
below 50 = do not return

DO NOT GUESS.
`,
          },
          {
            type: "input_image",
            image_url: dataUrl,
            detail: "high",
          },
        ],
      },
    ];

    const raw =
      await callVision(input);

    if (!raw) {
      continue;
    }

    const parsed =
      parseJson(raw);

    if (
      !parsed ||
      !Array.isArray(
        parsed.candidates
      )
    ) {
      continue;
    }

    for (
      const candidate of
        parsed.candidates
    ) {
      const confidence =
        Number(
          candidate.confidence
        );

      if (
        !Number.isFinite(
          confidence
        ) ||
        confidence < 50
      ) {
        continue;
      }

      const centerX =
        clamp(
          Number(
            candidate.centerX
          ) || 500,
          0,
          1000
        );

      const centerY =
        clamp(
          Number(
            candidate.centerY
          ) || 500,
          0,
          1000
        );

      const width =
        clamp(
          Number(
            candidate.width
          ) || 100,
          10,
          1000
        );

      const height =
        clamp(
          Number(
            candidate.height
          ) || 100,
          10,
          1000
        );

      candidates.push({
        photograph:
          index + 1,

        confidence:
          clamp(
            confidence,
            0,
            100
          ),

        centerX,
        centerY,
        width,
        height,

        description:
          typeof candidate.description ===
          "string"
            ? candidate.description
            : "Possible physical house-number region.",
      });
    }
  }

  console.log(
    "HOUSE NUMBER PASS 1 CANDIDATES:",
    candidates.length
  );

  return candidates;
}

/*
 * ============================================================
 * DEDICATED PHOTO 1 SCAN
 * ============================================================
 */

async function locatePhotoOneHouseNumber(
  imageUrl: string
): Promise<HouseNumberCandidate | null> {
  console.log(
    "HOUSE NUMBER PHOTO 1 DEDICATED SCAN"
  );

  const downloaded =
    await downloadImageWithMimeType(
      imageUrl
    );

  if (!downloaded) {
    return null;
  }

  const dataUrl =
    bufferToDataUrl(
      downloaded.buffer,
      downloaded.mimeType
    );

  const input = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `
This is the PRIMARY FRONT PHOTOGRAPH of a UK property.

Perform an extremely careful search for a REAL PHYSICAL HOUSE NUMBER.

Inspect:

- front door
- wall beside door
- door frame
- porch
- entrance
- gate
- front wall
- house-number plaque
- ceramic number
- metal number
- building frontage

Do NOT use:

- listing address
- postcode
- filename
- URL
- assumptions
- neighbouring properties

Do NOT tell me the number.

Only locate the physical number region.

Coordinates MUST represent the CENTRE of the region.

Return ONLY:

{
  "found": true,
  "confidence": 95,
  "centerX": 500,
  "centerY": 500,
  "width": 80,
  "height": 100,
  "description": "Physical number beside the front door."
}

OR:

{
  "found": false
}

Do NOT guess.
`,
        },
        {
          type: "input_image",
          image_url: dataUrl,
          detail: "high",
        },
      ],
    },
  ];

  const raw =
    await callVision(input);

  if (!raw) {
    return null;
  }

  const parsed =
    parseJson(raw);

  if (
    !parsed ||
    parsed.found !== true
  ) {
    return null;
  }

  const confidence =
    Number(
      parsed.confidence
    );

  if (
    !Number.isFinite(
      confidence
    ) ||
    confidence < 50
  ) {
    return null;
  }

  return {
    photograph: 1,

    confidence:
      clamp(
        confidence,
        0,
        100
      ),

    centerX:
      clamp(
        Number(
          parsed.centerX
        ) || 500,
        0,
        1000
      ),

    centerY:
      clamp(
        Number(
          parsed.centerY
        ) || 500,
        0,
        1000
      ),

    width:
      clamp(
        Number(
          parsed.width
        ) || 100,
        10,
        1000
      ),

    height:
      clamp(
        Number(
          parsed.height
        ) || 100,
        10,
        1000
      ),

    description:
      typeof parsed.description ===
      "string"
        ? parsed.description
        : "Possible physical house number on primary front photograph.",
  };
}

/*
 * ============================================================
 * CREATE NUMBER CROP
 * ============================================================
 */

async function createNumberCrop(
  imageBuffer: Buffer,
  candidate: HouseNumberCandidate
): Promise<Buffer> {
  try {
    const metadata =
      await sharp(
        imageBuffer
      ).metadata();

    const imageWidth =
      metadata.width;

    const imageHeight =
      metadata.height;

    if (
      !imageWidth ||
      !imageHeight
    ) {
      return imageBuffer;
    }

    const centerX =
      (candidate.centerX /
        1000) *
      imageWidth;

    const centerY =
      (candidate.centerY /
        1000) *
      imageHeight;

    let width =
      (candidate.width /
        1000) *
      imageWidth;

    let height =
      (candidate.height /
        1000) *
      imageHeight;

    /*
     * HOUSE NUMBERS CAN BE EXTREMELY SMALL.
     *
     * Give the detector generous surrounding context,
     * but then enlarge the actual crop substantially.
     */

    const paddingX =
      Math.max(
        width * 0.75,
        imageWidth * 0.06
      );

    const paddingY =
      Math.max(
        height * 0.75,
        imageHeight * 0.06
      );

    let left =
      Math.round(
        centerX -
          width / 2 -
          paddingX
      );

    let top =
      Math.round(
        centerY -
          height / 2 -
          paddingY
      );

    width =
      Math.round(
        width +
          paddingX * 2
      );

    height =
      Math.round(
        height +
          paddingY * 2
      );

    left =
      Math.max(
        0,
        left
      );

    top =
      Math.max(
        0,
        top
      );

    width =
      Math.min(
        width,
        imageWidth - left
      );

    height =
      Math.min(
        height,
        imageHeight - top
      );

    if (
      width <= 0 ||
      height <= 0
    ) {
      return imageBuffer;
    }

    console.log(
      "HOUSE NUMBER PIXEL CROP:",
      {
        imageWidth,
        imageHeight,
        left,
        top,
        width,
        height,
      }
    );

    /*
     * IMPORTANT:
     *
     * The physical number may only occupy a tiny number
     * of pixels in the original photograph.
     *
     * Extract first.
     * Then enlarge the crop dramatically.
     */

    const enlargedWidth =
      Math.max(
        1200,
        Math.round(
          width * 4
        )
      );

    const enlargedHeight =
      Math.max(
        900,
        Math.round(
          height * 4
        )
      );

    const crop =
      await sharp(
        imageBuffer
      )
        .extract({
          left,
          top,
          width,
          height,
        })
        .resize({
          width:
            enlargedWidth,
          height:
            enlargedHeight,
          fit: "inside",
          withoutEnlargement: false,
          kernel:
            sharp.kernel.lanczos3,
        })
        .sharpen({
          sigma: 1.2,
        })
        .jpeg({
          quality: 100,
          chromaSubsampling:
            "4:4:4",
        })
        .toBuffer();

    console.log(
      "HOUSE NUMBER ENLARGED CROP:",
      {
        originalCropWidth:
          width,
        originalCropHeight:
          height,
        enlargedWidth,
        enlargedHeight,
        bytes:
          crop.length,
      }
    );

    return crop;
  } catch (error) {
    console.error(
      "HOUSE NUMBER CROP ERROR:",
      error
    );

    return imageBuffer;
  }
}

/*
 * ============================================================
 * PASS 2
 * READ ACTUAL NUMBER
 * ============================================================
 */

async function verifyNumberCrop(
  cropBuffer: Buffer,
  photographNumber: number
): Promise<VerificationResult> {
  console.log(
    "HOUSE NUMBER PASS 2 - READING NUMBER"
  );

  const dataUrl =
    bufferToDataUrl(
      cropBuffer,
      "image/jpeg"
    );

  const input = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `
You are the SECOND independent house-number reading system.

This is photograph ${photographNumber}.

The supplied image is an ENLARGED CROP from a property photograph.

Your ONLY task is to read the ACTUAL PHYSICAL HOUSE NUMBER visible in this crop.

Do not infer a number from context.

Do not use:

- listing address
- postcode
- URL
- filename
- previous model results
- nearby properties
- expected numbering
- street numbering
- database information

IMPORTANT:

READ EACH DIGIT INDIVIDUALLY.

Pay particular attention to visually similar digits such as:

1 vs 6
1 vs 7
3 vs 8
5 vs 6
6 vs 8
2 vs 7

If a digit is blurred, partially hidden, distorted or genuinely ambiguous, you MUST NOT guess.

If you cannot distinguish the digits reliably, return:

{
  "houseNumber": null,
  "confidence": 0,
  "evidence": "The physical digits are too ambiguous to read reliably."
}

If the physical number is clearly readable, return the exact digits that are actually visible.

Example:

{
  "houseNumber": "21",
  "confidence": 95,
  "evidence": "The enlarged crop clearly shows two physical digits. The first digit is 2 and the second digit is 1."
}

CRITICAL:

Do NOT convert an uncertain "1" into "6".

Do NOT convert an uncertain digit into whatever number seems likely for the street.

The visual pixels are the ONLY evidence.

Return ONLY valid JSON.

DO NOT GUESS.
`,
        },
        {
          type: "input_image",
          image_url: dataUrl,
          detail: "high",
        },
      ],
    },
  ];

  const raw =
    await callVision(input);

  if (!raw) {
    return {
      houseNumber: null,
      confidence: 0,
      evidence:
        "Second visual reading returned no result.",
    };
  }

  const parsed =
    parseJson(raw);

  if (!parsed) {
    return {
      houseNumber: null,
      confidence: 0,
      evidence:
        "Second visual reading returned invalid JSON.",
    };
  }

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
        ? clamp(
            confidence,
            0,
            100
          )
        : 0,

    evidence:
      typeof parsed.evidence ===
      "string"
        ? parsed.evidence.trim()
        : "No visual evidence supplied.",
  };
}

/*
 * ============================================================
 * PASS 3
 * INDEPENDENT CONFIRMATION
 * ============================================================
 */

async function independentlyConfirmNumber(
  cropBuffer: Buffer,
  expectedNumber: string
): Promise<VerificationResult> {
  console.log(
    "HOUSE NUMBER PASS 3 - INDEPENDENT CONFIRMATION"
  );

  /*
   * IMPORTANT:
   *
   * expectedNumber is intentionally NOT supplied to the
   * vision model.
   *
   * Pass 3 must independently read the photograph.
   */

  void expectedNumber;

  const dataUrl =
    bufferToDataUrl(
      cropBuffer,
      "image/jpeg"
    );

  const input = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `
You are the THIRD and FINAL INDEPENDENT house-number reading system.

You are looking at an enlarged crop from a property photograph.

Read the physical house number that is ACTUALLY visible.

This is an independent reading.

You have NOT been told what another system thinks the number is.

Do NOT use:

- listing address
- postcode
- URL
- filename
- previous AI results
- expected numbers
- neighbouring properties
- street numbering patterns
- database information

Read every visible digit independently.

Pay particular attention to ambiguous digits.

For example, carefully distinguish:

1 from 6
1 from 7
3 from 8
5 from 6
6 from 8
2 from 7

If the physical number is not clearly readable, return:

{
  "houseNumber": null,
  "confidence": 0,
  "evidence": "The physical number cannot be read reliably from the image."
}

If it is clearly readable, return the exact physical number.

Example:

{
  "houseNumber": "21",
  "confidence": 96,
  "evidence": "The enlarged crop clearly shows the physical digits 2 and 1."
}

IMPORTANT:

Do NOT guess.

Do NOT infer the number from the surrounding property.

Do NOT choose a number because it is more likely to exist at this address.

Only report what the pixels actually show.

Return ONLY valid JSON.
`,
        },
        {
          type: "input_image",
          image_url: dataUrl,
          detail: "high",
        },
      ],
    },
  ];

  const raw =
    await callVision(input);

  if (!raw) {
    return {
      houseNumber: null,
      confidence: 0,
      evidence:
        "Independent confirmation returned no result.",
    };
  }

  const parsed =
    parseJson(raw);

  if (!parsed) {
    return {
      houseNumber: null,
      confidence: 0,
      evidence:
        "Independent confirmation returned invalid JSON.",
    };
  }

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
        ? clamp(
            confidence,
            0,
            100
          )
        : 0,

    evidence:
      typeof parsed.evidence ===
      "string"
        ? parsed.evidence.trim()
        : "No independent evidence supplied.",
  };
}

/*
 * ============================================================
 * PASS 4
 * PROPERTY ASSOCIATION
 * ============================================================
 */

async function checkHouseNumberPropertyAssociation(
  imageBuffer: Buffer,
  detectedNumber: string,
  photographNumber: number
): Promise<AssociationResult> {
  console.log(
    "HOUSE NUMBER PASS 4 - PROPERTY ASSOCIATION"
  );

  let jpegBuffer: Buffer;

  try {
    jpegBuffer =
      await sharp(
        imageBuffer
      )
        .jpeg({
          quality: 95,
        })
        .toBuffer();
  } catch {
    jpegBuffer =
      imageBuffer;
  }

  const dataUrl =
    bufferToDataUrl(
      jpegBuffer,
      "image/jpeg"
    );

  const input = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `
You are the FINAL PROPERTY OWNERSHIP CHECK.

Photograph ${photographNumber} contains a physical number that has independently been read as:

${detectedNumber}

Your ONLY task is to determine whether that physical number belongs to the ACTUAL PROPERTY BEING ADVERTISED.

A visible number can belong to a neighbouring property.

Inspect the ENTIRE photograph.

First identify the main property being photographed.

Then identify exactly which building the physical number is attached to.

Look at:

- front door
- walls
- rooflines
- windows
- entrances
- gates
- driveways
- fences
- porches
- dividing walls
- semi-detached boundaries
- terraced-house boundaries

If the number belongs to a neighbouring property, return false.

Do NOT use:

- listing address
- postcode
- URL
- filename
- database information
- assumptions

If there is any serious ambiguity, return false.

Return ONLY:

{
  "belongsToAdvertisedProperty": true,
  "confidence": 95,
  "evidence": "The number is physically attached to the main advertised property's entrance."
}

OR:

{
  "belongsToAdvertisedProperty": false,
  "confidence": 95,
  "evidence": "The number is physically attached to the neighbouring property."
}

Return ONLY valid JSON.
`,
        },
        {
          type: "input_image",
          image_url: dataUrl,
          detail: "high",
        },
      ],
    },
  ];

  const raw =
    await callVision(input);

  if (!raw) {
    return {
      belongsToAdvertisedProperty: false,
      confidence: 0,
      evidence:
        "Property association returned no result.",
    };
  }

  const parsed =
    parseJson(raw);

  if (!parsed) {
    return {
      belongsToAdvertisedProperty: false,
      confidence: 0,
      evidence:
        "Property association returned invalid JSON.",
    };
  }

  const confidence =
    Number(
      parsed.confidence
    );

  return {
    belongsToAdvertisedProperty:
      parsed.belongsToAdvertisedProperty ===
      true,

    confidence:
      Number.isFinite(
        confidence
      )
        ? clamp(
            confidence,
            0,
            100
          )
        : 0,

    evidence:
      typeof parsed.evidence ===
      "string"
        ? parsed.evidence.trim()
        : "No property ownership evidence supplied.",
  };
}

/*
 * ============================================================
 * NEIGHBOUR INFERENCE
 * ============================================================
 */

async function inferHouseNumberFromNeighbour(
  imageUrls: string[]
): Promise<NeighbourInferenceResult> {
  console.log(
    "HOUSE NUMBER NEIGHBOUR INFERENCE STARTED"
  );

  if (
    !Array.isArray(
      imageUrls
    ) ||
    imageUrls.length === 0
  ) {
    return {
      houseNumber: null,
      confidence: 0,
      evidence:
        "No photographs available for neighbour inference.",
    };
  }

  const usableImages =
    imageUrls.slice(
      0,
      8
    );

  const imageInputs: any[] =
    [];

  for (
    let index = 0;
    index < usableImages.length;
    index++
  ) {
    const downloaded =
      await downloadImageWithMimeType(
        usableImages[index]
      );

    if (!downloaded) {
      continue;
    }

    let jpegBuffer =
      downloaded.buffer;

    try {
      jpegBuffer =
        await sharp(
          downloaded.buffer
        )
          .jpeg({
            quality: 92,
          })
          .toBuffer();
    } catch {
      // Keep original buffer.
    }

    imageInputs.push({
      type: "input_image",
      image_url:
        bufferToDataUrl(
          jpegBuffer,
          "image/jpeg"
        ),
      detail: "high",
    });
  }

  if (
    imageInputs.length === 0
  ) {
    return {
      houseNumber: null,
      confidence: 0,
      evidence:
        "Property photographs could not be loaded.",
    };
  }

  const input = [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `
You are the STRICT SECONDARY HOUSE NUMBER INFERENCE SYSTEM.

Direct physical-number verification has already failed.

Your ONLY task is to determine whether the house number of the ADVERTISED PROPERTY can be safely inferred from an immediately neighbouring property.

PHOTO 1 IS THE PRIMARY PROPERTY.

Photograph 1 is the primary front photograph.

The main building/frontage being presented in photograph 1 is the advertised property.

Additional photographs can be used to understand the frontage and neighbouring buildings.

DO NOT USE EXTERNAL INFORMATION.

Do NOT use:

- listing address
- postcode
- URL
- filename
- price
- database information
- property records
- assumptions
- external knowledge

Use visual evidence only.

STEP 1:
Determine whether the advertised property is:

"left"

"right"

or:

"unknown"

STEP 2:
Find a clearly visible physical number belonging to a neighbouring building.

Do not use:

- estate-agent signs
- road signs
- bins
- cars
- unrelated text

STEP 3:
Determine whether the numbered neighbour is:

"left"

"right"

or:

"unknown"

STEP 4:
Determine relationship:

"adjacent_semi_detached"

"adjacent_terraced"

"adjacent"

"not_adjacent"

"unknown"

STEP 5:
Determine whether the numbering pattern is visually supported.

Do NOT assume:

23 -> 21

or:

23 -> 25

The photographs must support the relationship.

If:

TARGET = left-hand property
NEIGHBOUR = right-hand property
NEIGHBOUR NUMBER = 23
and the visual evidence clearly supports consecutive numbering,

then 21 may potentially be inferred.

If there is uncertainty, return null.

If the visible number belongs to the advertised property itself, return null.

If the target property cannot be confidently identified, return null.

If the neighbour cannot be confidently identified, return null.

If the buildings are not clearly adjacent, return null.

If the numbering pattern is not visually supported, return null.

Return ONLY:

{
  "houseNumber": "21",
  "confidence": 94,
  "visibleNeighbourNumber": "23",
  "targetSide": "left",
  "neighbourSide": "right",
  "relationship": "adjacent_semi_detached",
  "numberingPatternSupported": true,
  "evidence": "Detailed visual explanation."
}

OR:

{
  "houseNumber": null,
  "confidence": 0,
  "visibleNeighbourNumber": "23",
  "targetSide": "left",
  "neighbourSide": "right",
  "relationship": "adjacent_semi_detached",
  "numberingPatternSupported": false,
  "evidence": "The visual evidence does not establish a safe numbering relationship."
}

DO NOT GUESS.

Confidence must represent confidence in the FINAL INFERRED NUMBER.
`,
        },
        ...imageInputs,
      ],
    },
  ];

  const raw =
    await callVision(input);

  if (!raw) {
    return {
      houseNumber: null,
      confidence: 0,
      evidence:
        "Neighbour inference returned no result.",
    };
  }

  const parsed =
    parseJson(raw);

  if (!parsed) {
    return {
      houseNumber: null,
      confidence: 0,
      evidence:
        "Neighbour inference returned invalid JSON.",
    };
  }

  const candidateNumber =
    normaliseHouseNumber(
      parsed.houseNumber
    );

  const neighbourNumber =
    normaliseHouseNumber(
      parsed.visibleNeighbourNumber
    );

  const confidence =
    Number(
      parsed.confidence
    );

  const targetSide =
    parsed.targetSide ===
      "left" ||
    parsed.targetSide ===
      "right"
      ? parsed.targetSide
      : "unknown";

  const neighbourSide =
    parsed.neighbourSide ===
      "left" ||
    parsed.neighbourSide ===
      "right"
      ? parsed.neighbourSide
      : "unknown";

  const relationship =
    [
      "adjacent_semi_detached",
      "adjacent_terraced",
      "adjacent",
      "not_adjacent",
      "unknown",
    ].includes(
      parsed.relationship
    )
      ? parsed.relationship
      : "unknown";

  const numberingPatternSupported =
    parsed.numberingPatternSupported ===
    true;

  const evidence =
    typeof parsed.evidence ===
    "string"
      ? parsed.evidence.trim()
      : "";

  const safeConfidence =
    Number.isFinite(
      confidence
    )
      ? clamp(
          Math.round(
            confidence
          ),
          0,
          100
        )
      : 0;

  if (
    !candidateNumber
  ) {
    return {
      houseNumber: null,
      confidence: 0,
      evidence:
        evidence ||
        "No safe inferred house number.",
    };
  }

  if (
    !neighbourNumber
  ) {
    return {
      houseNumber: null,
      confidence: safeConfidence,
      evidence:
        evidence ||
        "No clearly readable neighbouring property number was established.",
    };
  }

  if (
    !numberingPatternSupported
  ) {
    return {
      houseNumber: null,
      confidence: safeConfidence,
      evidence:
        evidence ||
        "The visual evidence did not establish a sufficiently reliable numbering pattern.",
    };
  }

  if (
    targetSide ===
      "unknown" ||
    neighbourSide ===
      "unknown"
  ) {
    return {
      houseNumber: null,
      confidence: safeConfidence,
      evidence:
        evidence ||
        "The target and neighbouring property sides could not be established.",
    };
  }

  if (
    targetSide ===
    neighbourSide
  ) {
    return {
      houseNumber: null,
      confidence: safeConfidence,
      evidence:
        evidence ||
        "The target and numbered neighbour could not be established as separate adjacent properties.",
    };
  }

  if (
    relationship ===
      "not_adjacent" ||
    relationship ===
      "unknown"
  ) {
    return {
      houseNumber: null,
      confidence: safeConfidence,
      evidence:
        evidence ||
        "The numbered property was not established as an immediately adjacent property.",
    };
  }

  if (
    safeConfidence <
    NEIGHBOUR_THRESHOLD
  ) {
    return {
      houseNumber: null,
      confidence: safeConfidence,
      evidence:
        evidence ||
        "Neighbour inference did not reach the required confidence threshold.",
    };
  }

  const targetNumeric =
    parseInt(
      candidateNumber,
      10
    );

  const neighbourNumeric =
    parseInt(
      neighbourNumber,
      10
    );

  if (
    Number.isFinite(
      targetNumeric
    ) &&
    Number.isFinite(
      neighbourNumeric
    )
  ) {
    const difference =
      Math.abs(
        targetNumeric -
          neighbourNumeric
      );

    if (
      difference !== 2
    ) {
      return {
        houseNumber: null,
        confidence: safeConfidence,
        evidence:
          `The AI proposed ${candidateNumber} from neighbouring number ${neighbourNumber}, but the numbers are not consecutive by the required two-number sequence.`,
      };
    }
  }

  console.log(
    "HOUSE NUMBER NEIGHBOUR INFERENCE ACCEPTED:",
    {
      candidateNumber,
      neighbourNumber,
      targetSide,
      neighbourSide,
      relationship,
      confidence:
        safeConfidence,
    }
  );

  return {
    houseNumber:
      candidateNumber,

    confidence:
      safeConfidence,

    visibleNeighbourNumber:
      neighbourNumber,

    targetSide,

    neighbourSide,

    relationship,

    numberingPatternSupported,

    evidence:
      `Neighbour inference: ${evidence}`,
  };
}

/*
 * ============================================================
 * CLEAN / DEDUPLICATE IMAGE URLS
 * ============================================================
 */

function prepareImageUrls(
  imageUrls: string[]
): string[] {
  const seen =
    new Set<string>();

  const result: string[] =
    [];

  for (
    const rawUrl of imageUrls
  ) {
    if (
      typeof rawUrl !==
      "string"
    ) {
      continue;
    }

    const url =
      rawUrl.trim();

    if (
      !/^https?:\/\//i.test(
        url
      )
    ) {
      continue;
    }

    if (
      url ===
        "https://lid.zoocdn.com/" ||
      url ===
        "https://lid.zoocdn.com"
    ) {
      continue;
    }

    if (
      seen.has(url)
    ) {
      continue;
    }

    seen.add(url);

    result.push(url);

    if (
      result.length >=
      MAX_PHOTOS
    ) {
      break;
    }
  }

  return result;
}

/*
 * ============================================================
 * MAIN FUNCTION
 * ============================================================
 */

export async function identifyHouseNumberFromPhoto(
  imageUrls: string[],
  targetHouseNumber?: string | null
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
    "========================================"
  );

  /*
   * The target house number is used ONLY for post-pipeline
   * cross-validation. It is NEVER passed to the vision models.
   * The AI must independently read what it sees in the photos.
   */

  const normalisedTarget =
    targetHouseNumber
      ? targetHouseNumber
          .trim()
          .toUpperCase() || null
      : null;

  try {
    if (
      !Array.isArray(
        imageUrls
      ) ||
      imageUrls.length === 0
    ) {
      return {
        houseNumber: null,
        confidence: 0,
        evidence:
          "No property photographs were supplied.",
        visibleNumbers: [],
        associatedNumber: null,
        associationConfidence: 0,
        targetMatch: "unknown",
        targetMismatchReason: null,
      };
    }

    /*
     * ========================================================
     * PREPARE PHOTOS
     * ========================================================
     */

    const usableImages =
      prepareImageUrls(
        imageUrls
      );

    console.log(
      "HOUSE NUMBER UNIQUE USABLE IMAGES:",
      usableImages.length
    );

    usableImages.forEach(
      (
        url,
        index
      ) => {
        console.log(
          `HOUSE NUMBER IMAGE ${
            index + 1
          }:`,
          url
        );
      }
    );

    if (
      usableImages.length ===
      0
    ) {
      return {
        houseNumber: null,
        confidence: 0,
        evidence:
          "No valid property photographs were available.",
        visibleNumbers: [],
        associatedNumber: null,
        associationConfidence: 0,
        targetMatch: "unknown",
        targetMismatchReason: null,
      };
    }

    /*
     * ========================================================
     * PASS 1
     * ========================================================
     */

    const candidates =
      await locatePossibleHouseNumbers(
        usableImages
      );

    /*
     * ========================================================
     * SORT CANDIDATES
     * ========================================================
     */

    const photoOneCandidates =
      candidates
        .filter(
          candidate =>
            candidate.photograph ===
            1
        )
        .sort(
          (
            a,
            b
          ) =>
            b.confidence -
            a.confidence
        );

    const otherCandidates =
      candidates
        .filter(
          candidate =>
            candidate.photograph !==
            1
        )
        .sort(
          (
            a,
            b
          ) =>
            b.confidence -
            a.confidence
        );

    let sortedCandidates =
      [
        ...photoOneCandidates,
        ...otherCandidates,
      ].slice(
        0,
        MAX_DIRECT_CANDIDATES
      );

    /*
     * ========================================================
     * PHOTO 1 DEDICATED FALLBACK
     * ========================================================
     */

    if (
      photoOneCandidates.length ===
      0
    ) {
      console.log(
        "PHOTO 1 WAS NOT FLAGGED BY PASS 1 - RUNNING DEDICATED SCAN"
      );

      const photoOne =
        await locatePhotoOneHouseNumber(
          usableImages[0]
        );

      if (photoOne) {
        sortedCandidates =
          [
            photoOne,
            ...sortedCandidates,
          ].slice(
            0,
            MAX_DIRECT_CANDIDATES
          );
      }
    }

    console.log(
      "HOUSE NUMBER DIRECT CANDIDATES:",
      sortedCandidates.length
    );

    /*
     * ========================================================
     * IMAGE CACHE
     * ========================================================
     */

    const imageCache =
      new Map<
        number,
        DownloadedImage
      >();

    /*
     * Collect all numbers successfully read from photographs.
     * Used for cross-validation and diagnostics.
     */

    const visibleNumbers: string[] = [];

    /*
     * ========================================================
     * DIRECT VERIFICATION LOOP
     *
     * IMPORTANT:
     *
     * EVERYTHING FROM HERE THROUGH THE FINAL DIRECT RETURN
     * IS INSIDE THIS FOR LOOP.
     * ========================================================
     */

    for (
      const candidate of
        sortedCandidates
    ) {
      const photographNumber =
        candidate.photograph;

      if (
        photographNumber < 1 ||
        photographNumber >
          usableImages.length
      ) {
        continue;
      }

      console.log(
        "========================================"
      );

      console.log(
        "PROCESSING DIRECT HOUSE NUMBER CANDIDATE"
      );

      console.log(
        "PHOTO:",
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
       * GET IMAGE
       * ======================================================
       */

      let downloaded =
        imageCache.get(
          photographNumber
        );

      if (!downloaded) {
        const freshDownload =
          await downloadImageWithMimeType(
            usableImages[
              photographNumber - 1
            ]
          );

        if (!freshDownload) {
          continue;
        }

        downloaded =
          freshDownload;

        imageCache.set(
          photographNumber,
          downloaded
        );
      }

      /*
       * ======================================================
       * CREATE CROP
       * ======================================================
       */

      const cropBuffer =
        await createNumberCrop(
          downloaded.buffer,
          candidate
        );

      /*
       * ======================================================
       * PASS 2
       * ======================================================
       */

      const verification =
        await verifyNumberCrop(
          cropBuffer,
          photographNumber
        );

      console.log(
        "PASS 2:",
        verification
      );

      if (
        !verification.houseNumber ||
        verification.confidence <
          DIRECT_READ_THRESHOLD
      ) {
        continue;
      }

      /*
       * ======================================================
       * PASS 3
       * ======================================================
       */

      const confirmation =
        await independentlyConfirmNumber(
          cropBuffer,
          verification.houseNumber
        );

      console.log(
        "PASS 3:",
        confirmation
      );

      if (
        !confirmation.houseNumber ||
        confirmation.confidence <
          DIRECT_CONFIRM_THRESHOLD
      ) {
        continue;
      }

      /*
       * ======================================================
       * EXACT AGREEMENT
       * ======================================================
       */

      if (
        confirmation.houseNumber
          .trim()
          .toUpperCase() !==
        verification.houseNumber
          .trim()
          .toUpperCase()
      ) {
        console.log(
          "PASS 2 / PASS 3 DISAGREEMENT"
        );

        continue;
      }

      /*
       * Record this number as visible in the photographs.
       */

      const readNumber =
        verification.houseNumber
          .trim()
          .toUpperCase();

      if (
        !visibleNumbers.includes(
          readNumber
        )
      ) {
        visibleNumbers.push(
          readNumber
        );
      }

      /*
       * ======================================================
       * PASS 4
       * PROPERTY OWNERSHIP
       * ======================================================
       */

      const association =
        await checkHouseNumberPropertyAssociation(
          downloaded.buffer,
          verification.houseNumber,
          photographNumber
        );

      console.log(
        "PASS 4:",
        association
      );

      if (
        !association.belongsToAdvertisedProperty ||
        association.confidence <
          ASSOCIATION_THRESHOLD
      ) {
        console.log(
          "DIRECT NUMBER REJECTED - BELONGS TO NEIGHBOUR OR AMBIGUOUS"
        );

        continue;
      }

      /*
       * ======================================================
       * VERIFIED DIRECT NUMBER
       * ======================================================
       */

      const finalConfidence =
        Math.min(
          verification.confidence,
          confirmation.confidence,
          association.confidence
        );

      const evidence =
        `Photograph ${photographNumber}: ${verification.evidence} ${confirmation.evidence} ${association.evidence}`;

      /*
       * ======================================================
       * CROSS-VALIDATION
       * ======================================================
       *
       * Compare the photographic number against the target
       * using strict suffix-preserving comparison.
       *
       * 21 must NOT match 21A.
       * 21A must NOT match 21B.
       * ======================================================
       */

      const photographicNumber =
        verification.houseNumber
          .trim()
          .toUpperCase();

      let targetMatch:
        | "confirmed"
        | "conflict"
        | "unknown" = "unknown";

      let targetMismatchReason: string | null =
        null;

      if (normalisedTarget) {
        if (
          photographicNumber ===
          normalisedTarget
        ) {
          targetMatch = "confirmed";

          console.log(
            "CROSS-VALIDATION: CONFIRMED - photographic number matches target"
          );
        } else {
          targetMatch = "conflict";

          targetMismatchReason =
            `AI read ${photographicNumber} but listing and geocoders agree on ${normalisedTarget}. Listing/geocoder evidence takes precedence.`;

          console.log(
            "CROSS-VALIDATION: CONFLICT - photographic number",
            photographicNumber,
            "does not match target",
            normalisedTarget
          );
        }
      } else {
        console.log(
          "CROSS-VALIDATION: UNKNOWN - no target available"
        );
      }

      console.log(
        "========================================"
      );

      console.log(
        "DIRECT HOUSE NUMBER VERIFIED"
      );

      console.log(
        "NUMBER:",
        verification.houseNumber
      );

      console.log(
        "CONFIDENCE:",
        finalConfidence
      );

      console.log(
        "TARGET MATCH:",
        targetMatch
      );

      console.log(
        "========================================"
      );

      return {
        houseNumber:
          verification.houseNumber.trim(),

        confidence:
          finalConfidence,

        evidence,

        visibleNumbers,

        associatedNumber:
          verification.houseNumber.trim(),

        associationConfidence:
          association.confidence,

        targetMatch,

        targetMismatchReason,
      };
    }

    /*
     * ========================================================
     * DIRECT SYSTEM FAILED
     * ========================================================
     *
     * The FOR LOOP has now legitimately ended.
     * Therefore all neighbour inference code is OUTSIDE the
     * loop and no CONTINUE statements appear below this point.
     * ========================================================
     */

    console.log(
      "========================================"
    );

    console.log(
      "DIRECT HOUSE NUMBER VERIFICATION FAILED"
    );

    console.log(
      "STARTING STRICT NEIGHBOUR INFERENCE"
    );

    console.log(
      "========================================"
    );

    /*
     * ========================================================
     * NEIGHBOUR INFERENCE
     * ========================================================
     */

    const neighbour =
      await inferHouseNumberFromNeighbour(
        usableImages
      );

    if (
      neighbour.houseNumber &&
      neighbour.confidence >=
        NEIGHBOUR_THRESHOLD
    ) {
      console.log(
        "========================================"
      );

      console.log(
        "HOUSE NUMBER VERIFIED THROUGH NEIGHBOUR INFERENCE"
      );

      console.log(
        "NUMBER:",
        neighbour.houseNumber
      );

      console.log(
        "CONFIDENCE:",
        neighbour.confidence
      );

      console.log(
        "NEIGHBOUR:",
        neighbour.visibleNeighbourNumber
      );

      console.log(
        "TARGET SIDE:",
        neighbour.targetSide
      );

      console.log(
        "NEIGHBOUR SIDE:",
        neighbour.neighbourSide
      );

      console.log(
        "RELATIONSHIP:",
        neighbour.relationship
      );

      /*
       * Cross-validate neighbour inference against target.
       */

      const neighbourNumber =
        neighbour.houseNumber
          ?.trim()
          .toUpperCase() ||
        null;

      let neighbourTargetMatch:
        | "confirmed"
        | "conflict"
        | "unknown" = "unknown";

      let neighbourTargetMismatchReason: string | null =
        null;

      if (
        normalisedTarget &&
        neighbourNumber
      ) {
        if (
          neighbourNumber ===
          normalisedTarget
        ) {
          neighbourTargetMatch =
            "confirmed";

          console.log(
            "CROSS-VALIDATION: CONFIRMED - neighbour-inferred number matches target"
          );
        } else {
          neighbourTargetMatch =
            "conflict";

          neighbourTargetMismatchReason =
            `AI inferred ${neighbourNumber} from neighbour but listing and geocoders agree on ${normalisedTarget}. Listing/geocoder evidence takes precedence.`;

          console.log(
            "CROSS-VALIDATION: CONFLICT - neighbour-inferred number",
            neighbourNumber,
            "does not match target",
            normalisedTarget
          );
        }
      }

      console.log(
        "========================================"
      );

      return {
        houseNumber:
          neighbour.houseNumber,

        confidence:
          neighbour.confidence,

        evidence:
          neighbour.evidence,

        visibleNumbers,

        associatedNumber:
          neighbour.houseNumber,

        associationConfidence:
          neighbour.confidence,

        targetMatch:
          neighbourTargetMatch,

        targetMismatchReason:
          neighbourTargetMismatchReason,
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
      "========================================"
    );

    return {
      houseNumber: null,

      confidence: 0,

      evidence:
        neighbour.evidence ||
        "No physical house number could be safely verified.",

      visibleNumbers,

      associatedNumber: null,

      associationConfidence: 0,

      targetMatch: "unknown",

      targetMismatchReason: null,
    };
  } catch (error) {
    console.error(
      "HOUSE NUMBER AI MAIN ERROR:",
      error
    );

    return {
      houseNumber: null,

      confidence: 0,

      evidence:
        "House-number analysis failed unexpectedly.",

      visibleNumbers: [],

      associatedNumber: null,

      associationConfidence: 0,

      targetMatch: "unknown",

      targetMismatchReason: null,
    };
  }
}