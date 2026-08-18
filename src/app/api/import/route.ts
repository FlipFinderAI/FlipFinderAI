
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { importProperty } from "@/lib/propertyImporter";
import {
  resolveAddress,
  resolveTargetHouseNumber,
  type TargetHouseNumber,
} from "@/lib/addressResolver";
import { calculateComparableValue } from "@/lib/comparableValuation";
import { calculateFlip } from "@/lib/flipCalculator";
import { calculateDealScore } from "@/lib/dealScore";
import { identifyHouseNumberFromPhoto } from "@/lib/ai";
import fs from "fs";
import path from "path";
import { downloadImage } from "@/lib/ai";
import { getEPCByAddress } from "@/lib/epc";



/*
 * ================================================================
 * HELPERS
 * ================================================================
 */

/**
 * Try to upgrade a Zoopla image to the highest available resolution.
 *
 * Zoopla commonly returns:
 *
 * /u/480/360/IMAGE.jpg
 *
 * but the same image may also be available as:
 *
 * /u/1024/768/IMAGE.jpg
 *
 * We try the larger version first and fall back to the
 * original URL if it is not available.
 */
async function upgradeZooplaImage(url: string): Promise<string> {
  try {
    const parsed = new URL(url);

    if (
      !parsed.hostname
        .toLowerCase()
        .includes("zoocdn.com")
    ) {
      return url;
    }

    const match = parsed.pathname.match(
      /^\/u\/(\d+)\/(\d+)\/(.+)$/i
    );

    if (!match) {
      return url;
    }

    const filename = match[3];

    /*
     * Only attempt an upgrade when the current image
     * is smaller than 1024x768.
     */
    const upgradedPath =
      `/u/1024/768/${filename}`;

    const upgradedUrl =
      `${parsed.protocol}//${parsed.hostname}${upgradedPath}`;

    const response = await fetch(
      upgradedUrl,
      {
        method: "HEAD",
        redirect: "follow",
      }
    );

    if (
      response.ok &&
      response.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("image/")
    ) {
      console.log(
        "IMAGE UPGRADED:",
        url,
        "=>",
        upgradedUrl
      );

      return upgradedUrl;
    }

    console.log(
      "IMAGE UPGRADE UNAVAILABLE:",
      url
    );

    return url;
  } catch (error) {
    console.log(
      "IMAGE UPGRADE ERROR:",
      url,
      error
    );

    return url;
  }
}

function extractListingPostcodeDistrict(
  address: string | null | undefined
): string | null {
  if (!address) {
    return null;
  }

  const cleaned = String(address)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const match = cleaned.match(
    /\b([A-Z]{1,2}\d[A-Z\d]?)\b/
  );

  return match ? match[1] : null;
}

function getTrustedListingDistrict(
  importedAddress: string | null | undefined,
  importedPostcode: string | null | undefined
): string | null {
  const fromAddress =
    extractListingPostcodeDistrict(
      importedAddress
    );

  if (fromAddress) {
    return fromAddress;
  }

  if (importedPostcode) {
    return extractListingPostcodeDistrict(
      importedPostcode
    );
  }

  return null;
}

function normalisePostcode(
  postcode: string | null | undefined
): string {
  if (!postcode) {
    return "";
  }

  const cleaned = postcode
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (cleaned.length < 5) {
    return "";
  }

  return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
}

function isFullUKPostcode(
  postcode: string | null | undefined
): boolean {
  if (!postcode) {
    return false;
  }

  const normalised = postcode
    .replace(/\s+/g, "")
    .toUpperCase();

  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(
    normalised
  );
}

function postcodeBelongsToDistrict(
  postcode: string,
  district: string
): boolean {
  const postcodeClean = postcode
    .replace(/\s+/g, "")
    .toUpperCase();

  const districtClean = district
    .replace(/\s+/g, "")
    .toUpperCase();

  return postcodeClean.startsWith(
    districtClean
  );
}

/*
 * ================================================================
 * PROPERTY IMAGE VALIDATION
 * ================================================================
 */

function isPropertyImageUrl(
  image: string
): boolean {
  if (!image) {
    return false;
  }

  if (!/^https?:\/\//i.test(image)) {
    return false;
  }

  try {
    const parsed = new URL(image);
    const hostname =
      parsed.hostname.toLowerCase();

    const blockedHosts = [
      "bat.bing.com",
      "www.google-analytics.com",
      "google-analytics.com",
      "analytics.google.com",
      "connect.facebook.net",
      "doubleclick.net",
      "googleadservices.com",
      "googletagmanager.com",
      "clarity.ms",
    ];

    const isBlockedHost =
      blockedHosts.some(
        (blockedHost) =>
          hostname === blockedHost ||
          hostname.endsWith(
            `.${blockedHost}`
          )
      );

    if (isBlockedHost) {
      console.log(
        "REJECTED NON-PROPERTY IMAGE:",
        image
      );

      return false;
    }

    const pathname =
      parsed.pathname.toLowerCase();

    /*
     * ========================================================
     * BLOCK KNOWN NON-PROPERTY IMAGES
     * ========================================================
     *
     * Zoopla serves property photographs and agent/branding
     * images from the same zoocdn.com host.
     *
     * Therefore checking the hostname alone is not enough.
     */

    const blockedImageTerms = [
      "logo",
      "agent",
      "static_agent",
      "avatar",
      "favicon",
      "icon",
      "placeholder",
      "branding",
      "floorplan",
      "floor-plan",
      "map",
      "epc",
    ];

    const isBlockedImage =
      blockedImageTerms.some(
        (term) =>
          pathname.includes(term)
      );

    if (isBlockedImage) {
      console.log(
        "IMAGE REMOVED:",
        image
      );

      return false;
    }

    const isZooplaImage =
      hostname.includes("zoocdn.com");

    const hasImageExtension =
  /\.(jpg|jpeg|png|webp|gif)$/i.test(
    pathname
  );

    return (
      isZooplaImage ||
      hasImageExtension
    );

  } catch {
    return false;
  }
}

/*
 * ================================================================
 * BUILD ADDRESS FOR INDEPENDENT RESOLUTION
 * ================================================================
 *
 * IMPORTANT:
 *
 * Zoopla often gives us an abbreviated listing address such as:
 *
 * Ashley Green, Leeds LS12, 3 bed semi-detached house for sale...
 *
 * The AI may independently identify:
 *
 * 21
 *
 * We must combine those pieces BEFORE sending the address to
 * addressResolver.ts.
 *
 * Result:
 *
 * 21 Ashley Green, Leeds LS12
 *
 * The portal's full postcode is NEVER inserted here.
 */

function buildResolverAddress(
  importedAddress: string | null | undefined,
  houseNumber: string | null,
  postcodeDistrict: string | null
): string {
  if (!importedAddress) {
    return "";
  }

  let cleaned = importedAddress
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  /*
   * Remove common listing-description suffixes.
   *
   * Example:
   *
   * Ashley Green, Leeds LS12,
   * 3 bed semi-detached house for sale,
   * £259,950 - Zoopla
   */

  cleaned = cleaned
    .replace(
      /,\s*\d+\s*bed\b.*$/i,
      ""
    )
    .replace(
      /\b\d+\s*bed\b.*$/i,
      ""
    )
    .replace(
      /,\s*for sale\b.*$/i,
      ""
    )
    .replace(
      /\bfor sale\b.*$/i,
      ""
    )
    .replace(
      /,\s*for rent\b.*$/i,
      ""
    )
    .replace(
      /\bfor rent\b.*$/i,
      ""
    )
    .replace(
      /£[\d,]+.*$/i,
      ""
    )
    .replace(
      /-\s*Zoopla.*$/i,
      ""
    )
    .trim();

  /*
   * Remove the postcode district from the text temporarily.
   * The district is supplied separately to the resolver as the
   * search-area constraint.
   */

  if (postcodeDistrict) {
    const escapedDistrict =
      postcodeDistrict.replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      );

    const districtRegex =
      new RegExp(
        `\\b${escapedDistrict}\\b`,
        "ig"
      );

    cleaned = cleaned
      .replace(
        districtRegex,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .replace(
        /,\s*,/g,
        ","
      )
      .replace(
        /^,\s*|\s*,\s*$/g,
        ""
      )
      .trim();
  }

  /*
   * If the AI found a house number, put it at the beginning.
   *
   * This is the critical fix.
   */

  if (houseNumber) {
    return `${houseNumber} ${cleaned}`;
  }

  return cleaned;
}

/*
 * ================================================================
 * POST
 * ================================================================
 */

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const url =
      typeof body.url === "string"
        ? body.url.trim()
        : "";

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Property listing URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * SCRAPE LISTING
     * ============================================================
     */

    const imported =
      await importProperty(url);

    console.log(
      "========================================"
    );

    console.log(
      "IMPORTED PROPERTY"
    );

    console.log(
      "Address:",
      imported.address
    );

    console.log(
      "Portal postcode:",
      imported.postcode ||
        "NONE"
    );

    console.log(
      "Images found:",
      imported.images.length
    );

    console.log(
      "Floor plans found:",
      imported.floorPlans.length
    );

    console.log(
      "Primary photo:",
      imported.primaryPhoto ||
        "NONE"
    );

    console.log(
      "========================================"
    );

    /*
     * ============================================================
     * TRUSTED POSTCODE DISTRICT
     * ============================================================
     *
     * We ONLY use the district visible in the listing address.
     *
     * Example:
     *
     * LS12
     *
     * We NEVER trust imported.postcode.
     */

    const listingPostcodeDistrict =
  getTrustedListingDistrict(
    imported.address,
    imported.postcode
  );

    console.log(
      "========================================"
    );

    console.log(
      "TRUSTED LISTING LOCATION"
    );

    console.log(
      "Listing address:",
      imported.address
    );

    console.log(
      "Trusted postcode district:",
      listingPostcodeDistrict ||
        "NOT FOUND"
    );

    console.log(
      "Portal postcode deliberately ignored:",
      imported.postcode ||
        "NONE"
    );

    console.log(
      "========================================"
    );

    /*
     * ============================================================
     * LISTING HOUSE NUMBER EXTRACTION
     * ============================================================
     *
     * The house number is already extracted by the scraper.
     * We now use it as independent property-identity evidence.
     */

    const listingHouseNumber =
      imported.houseNumber ||
      null;

    console.log(
      "========================================"
    );

    console.log(
      "LISTING HOUSE NUMBER"
    );

    console.log(
      "Extracted from listing address:",
      listingHouseNumber ||
        "NONE"
    );

    console.log(
      "Full listing address:",
      imported.address
    );

    console.log(
      "========================================"
    );

    /*
     * ============================================================
     * TARGET HOUSE NUMBER RESOLUTION
     * ============================================================
     *
     * Establish independent property-identity evidence BEFORE
     * the AI photographic pipeline runs.
     *
     * If the listing contains a house number, we check whether
     * independent geocoders agree on it. This produces a target
     * that the photographic result can be compared against.
     *
     * The geocoder results are cached so that resolveAddress()
     * can reuse them without making duplicate HTTP requests.
     */

    let targetHouseNumber: TargetHouseNumber =
      {
        number: null,
        sourceCount: 0,
        sources: [],
        highestAddrType: null,
        geocoderAgrees: false,
        listingNumber:
          listingHouseNumber || "",
      };

    if (
      listingHouseNumber &&
      listingPostcodeDistrict
    ) {
      try {
        console.log(
          "========================================"
        );

        console.log(
          "TARGET HOUSE NUMBER RESOLUTION STARTED"
        );

        console.log(
          "Listing house number:",
          listingHouseNumber
        );

        console.log(
          "District:",
          listingPostcodeDistrict
        );

        console.log(
          "========================================"
        );

        targetHouseNumber =
          await resolveTargetHouseNumber(
            listingHouseNumber,
            imported.address,
            listingPostcodeDistrict
          );

        console.log(
          "TARGET RESOLUTION RESULT:"
        );

        console.log(
          "  Number:",
          targetHouseNumber.number ||
            "NONE"
        );

        console.log(
          "  Source count:",
          targetHouseNumber.sourceCount
        );

        console.log(
          "  Sources:",
          targetHouseNumber.sources.join(
            ", "
          ) || "NONE"
        );

        console.log(
          "  Geocoder agrees:",
          targetHouseNumber.geocoderAgrees
        );

        console.log(
          "  AddrType:",
          targetHouseNumber.highestAddrType ||
            "NONE"
        );

        console.log(
          "  Cached geocoder results:",
          targetHouseNumber.cachedGeocoderResults
            ? "YES"
            : "NO"
        );

        console.log(
          "========================================"
        );
      } catch (
        targetError
      ) {
        console.error(
          "Target house number resolution failed:",
          targetError
        );

        targetHouseNumber =
          {
            number: null,
            sourceCount: 0,
            sources: [],
            highestAddrType: null,
            geocoderAgrees: false,
            listingNumber:
              listingHouseNumber,
          };
      }
    } else {
      console.log(
        "TARGET RESOLUTION SKIPPED:"
      );

      console.log(
        "  Listing house number:",
        listingHouseNumber ||
          "NONE"
      );

      console.log(
        "  District:",
        listingPostcodeDistrict ||
          "NONE"
      );
    }

    /*
     * ============================================================
     * CLEAN PROPERTY IMAGES
     * ============================================================
     */

    const imageUrls =
      Array.from(
        new Set(
          Array.isArray(
            imported.images
          )
            ? imported.images
                .filter(
                  (
                    image
                  ): image is string =>
                    typeof image ===
                    "string"
                )
                .map(
                  (image) =>
                    image.trim()
                )
                .filter(
                  (image) => {
                    const valid =
                      isPropertyImageUrl(
                        image
                      );

                    if (!valid) {
                      console.log(
                        "IMAGE REMOVED:",
                        image
                      );
                    }

                    return valid;
                  }
                )
            : []
        )
      );

    console.log(
      "========================================"
    );

    console.log(
      "CLEAN PROPERTY PHOTOS"
    );

    console.log(
      "Original image count:",
      Array.isArray(
        imported.images
      )
        ? imported.images.length
        : 0
    );

    console.log(
      "Photos to save:",
      imageUrls.length
    );

    imageUrls.forEach(
      (
        image,
        index
      ) => {
        console.log(
          `${index + 1}: ${image}`
        );
      }
    );

    console.log(
      "========================================"
    );
/*
 * UPGRADE ZOOPLA IMAGE RESOLUTION
 */
const upgradedImageUrls = await Promise.all(
  imageUrls.map(
    (url: string) =>
      upgradeZooplaImage(url)
  )
);

const finalImageUrls = [
  ...new Set(upgradedImageUrls)
];

const imageUrlsForProcessing =
  finalImageUrls;

console.log(
  "========================================"
);

console.log(
  "FINAL IMAGE RESOLUTION CHECK"
);

console.log(
  "BEFORE UPGRADE:",
  imageUrls.length
);

console.log(
  "AFTER UPGRADE:",
  finalImageUrls.length
);

finalImageUrls.forEach(
  (
    url,
    index
  ) => {
    console.log(
      `FINAL IMAGE ${index + 1}: ${url}`
    );
  }
);

console.log(
  "========================================"
);
    /*
     * ============================================================
     * IDENTIFY HOUSE NUMBER FROM PHOTOS
     * ============================================================
     */

    let houseNumberFromPhoto:
      | string
      | null = null;

    let houseNumberConfidence =
      0;

    let houseNumberEvidence =
      "";

    let visibleNumbers: string[] =
      [];

    /*
     * ============================================================
     * HOUSE NUMBER AI — OPTIONAL, NOT BLOCKING
     * ============================================================
     *
     * The import pipeline must continue even when:
     *   - no visible house number exists
     *   - the front door is obscured
     *   - the house number is too small
     *   - the property is photographed from an angle
     *   - there are 30+ photographs
     *
     * Listing data and address/postcode sources are the
     * primary address mechanism. House-number visual
     * recognition is a secondary cross-check only.
     */

    if (
      imageUrls.length > 0
    ) {
      try {
        console.log(
          "========================================"
        );

        console.log(
          "HOUSE NUMBER SECTION STARTED (OPTIONAL)"
        );

        console.log(
          "IMAGE URL COUNT:",
          imageUrls.length
        );

        console.log(
          "CALLING identifyHouseNumberFromPhoto"
        );

        const houseNumberResult =
  await identifyHouseNumberFromPhoto(
    imageUrlsForProcessing,
    targetHouseNumber.number
  );

        console.log(
          "HOUSE NUMBER RAW AI RESPONSE:",
          houseNumberResult
        );

        houseNumberFromPhoto =
          houseNumberResult.houseNumber;

        houseNumberConfidence =
          houseNumberResult.confidence;

        houseNumberEvidence =
          houseNumberResult.evidence;

        visibleNumbers =
          houseNumberResult.visibleNumbers;

        console.log(
          "HOUSE NUMBER IDENTIFIED FROM PHOTO:",
          houseNumberFromPhoto ||
            "UNKNOWN"
        );

        console.log(
          "HOUSE NUMBER CONFIDENCE:",
          houseNumberConfidence
        );

        console.log(
          "HOUSE NUMBER EVIDENCE:",
          houseNumberEvidence ||
            "NONE"
        );

        console.log(
          "VISIBLE NUMBERS:",
          houseNumberResult.visibleNumbers.join(
            ", "
          ) || "NONE"
        );

        console.log(
          "TARGET MATCH:",
          houseNumberResult.targetMatch
        );

        if (
          houseNumberResult.targetMismatchReason
        ) {
          console.log(
            "TARGET MISMATCH REASON:",
            houseNumberResult.targetMismatchReason
          );
        }

        console.log(
          "HOUSE NUMBER SECTION FINISHED"
        );

        console.log(
          "========================================"
        );
      } catch (
        photoNumberError
      ) {
        console.error(
          "House number photo analysis failed (non-blocking):",
          photoNumberError
        );

        houseNumberFromPhoto = null;
        houseNumberConfidence = 0;
        houseNumberEvidence = "";
        visibleNumbers = [];
      }
    } else {
      console.log(
        "No valid property photographs available for house number analysis."
      );
    }

    /*
     * ============================================================
     * CROSS-VALIDATION: DECIDE EFFECTIVE HOUSE NUMBER
     * ============================================================
     *
     * The AI result is photographic evidence.
     * The target is property-identity evidence.
     *
     * The photographic number must NEVER independently override
     * stronger property-identity evidence from the listing address
     * or independent geocoders.
     *
     * Decision matrix:
     *
     *   AI says X, target is Y:
     *     X === Y (strict)  → effective = X (confirmed)
     *     X !== Y           → effective = Y (target wins)
     *     target is null    → effective = X (no target to compare)
     *
     *   AI says null:
     *     effective = null (no photographic evidence)
     *
     * Strict comparison means suffix-preserving:
     *   21 !== 21A
     *   21A !== 21B
     */

    let effectiveHouseNumber: string | null =
      houseNumberFromPhoto;

    let targetMatchFinal = false;

    let targetMismatchReasonFinal: string | null =
      null;

    if (
      houseNumberFromPhoto &&
      targetHouseNumber.number
    ) {
      const aiNum =
        houseNumberFromPhoto
          .trim()
          .toUpperCase();

      const targetNum =
        targetHouseNumber.number
          .trim()
          .toUpperCase();

      if (aiNum === targetNum) {
        /*
         * CONFIRMED: AI and target agree.
         * Use the AI number (they are the same).
         */

        targetMatchFinal = true;

        effectiveHouseNumber =
          houseNumberFromPhoto;

        console.log(
          "========================================"
        );

        console.log(
          "CROSS-VALIDATION: CONFIRMED"
        );

        console.log(
          "AI number:",
          houseNumberFromPhoto
        );

        console.log(
          "Target number:",
          targetHouseNumber.number
        );

        console.log(
          "Effective house number:",
          effectiveHouseNumber
        );

        console.log(
          "========================================"
        );
      } else {
        /*
         * CONFLICT: AI and target disagree.
         * Target wins because it has stronger property-identity
         * evidence (listing address + geocoders).
         */

        targetMatchFinal = false;

        targetMismatchReasonFinal =
          `AI read ${houseNumberFromPhoto} but listing and geocoders agree on ${targetHouseNumber.number}. ` +
          `Listing/geocoder sources: ${targetHouseNumber.sources.join(", ")}. ` +
          `Geocoder agreement: ${targetHouseNumber.geocoderAgrees ? "YES" : "NO"}. ` +
          `ArcGIS AddrType: ${targetHouseNumber.highestAddrType || "N/A"}. ` +
          `Listing/geocoder evidence takes precedence.`;

        effectiveHouseNumber =
          targetHouseNumber.number;

        console.log(
          "========================================"
        );

        console.log(
          "CROSS-VALIDATION: CONFLICT - TARGET WINS"
        );

        console.log(
          "AI number (photographic):",
          houseNumberFromPhoto
        );

        console.log(
          "Target number (property identity):",
          targetHouseNumber.number
        );

        console.log(
          "Target sources:",
          targetHouseNumber.sources.join(
            ", "
          )
        );

        console.log(
          "Target geocoder agrees:",
          targetHouseNumber.geocoderAgrees
        );

        console.log(
          "Effective house number:",
          effectiveHouseNumber
        );

        console.log(
          "========================================"
        );
      }
    } else if (
      houseNumberFromPhoto
    ) {
      /*
       * AI found a number but no target exists.
       * Sanity check: if visibleNumbers contains a
       * single-digit number that prefixes the AI read,
       * the AI read likely captured a neighbouring
       * number (e.g. "3" + neighbour "1" = "31").
       */

      const aiRead =
        houseNumberFromPhoto
          .trim()
          .toUpperCase();

      const singleDigitPrefix =
        visibleNumbers.find(
          (n) =>
            n.length === 1 &&
            aiRead.startsWith(n) &&
            aiRead.length > 1
        );

      if (singleDigitPrefix) {
        effectiveHouseNumber =
          singleDigitPrefix;

        console.log(
          "CROSS-VALIDATION: NO TARGET - AI read",
          houseNumberFromPhoto,
          "but single-digit",
          singleDigitPrefix,
          "also visible — using",
          singleDigitPrefix
        );
      } else {
        effectiveHouseNumber =
          houseNumberFromPhoto;

        console.log(
          "CROSS-VALIDATION: NO TARGET - using AI number:",
          houseNumberFromPhoto
        );
      }
    } else {
      /*
       * AI found no number.
       */

      effectiveHouseNumber = null;

      console.log(
        "CROSS-VALIDATION: AI found no house number"
      );
    }

    /*
     * ============================================================
     * BUILD INDEPENDENT RESOLVER ADDRESS
     * ============================================================
     *
     * THIS IS THE IMPORTANT FIX.
     *
     * Example:
     *
     * Listing:
     * Ashley Green, Leeds LS12, 3 bed semi-detached...
     *
     * AI:
     * 21
     *
     * Target:
     * 23 (from listing + geocoders)
     *
     * Effective:
     * 23 (target wins in cross-validation)
     *
     * Resolver input:
     * 23 Ashley Green, Leeds
     *
     * Resolver district:
     * LS12
     *
     * Portal postcode:
     * NEVER SENT
     */

    const resolverAddress =
      buildResolverAddress(
        imported.address,
        effectiveHouseNumber,
        listingPostcodeDistrict
      );

    console.log(
      "========================================"
    );

    console.log(
      "ADDRESS SENT TO INDEPENDENT RESOLVER"
    );

    console.log(
      "Original listing address:",
      imported.address
    );

    console.log(
      "AI house number (photographic):",
      houseNumberFromPhoto ||
        "UNKNOWN"
    );

    console.log(
      "Effective house number (cross-validated):",
      effectiveHouseNumber ||
        "UNKNOWN"
    );

    console.log(
      "House number confidence:",
      houseNumberConfidence
    );

    console.log(
      "Resolver address:",
      resolverAddress ||
        "NONE"
    );

    console.log(
      "Postcode district constraint:",
      listingPostcodeDistrict ||
        "NONE"
    );

    console.log(
      "Portal postcode used:",
      "NO"
    );

    console.log(
      "========================================"
    );

    /*
     * ============================================================
     * RESOLVE FULL POSTCODE
     * ============================================================
     */

    let resolvedAddress =
      imported.address;

    let resolvedPostcode =
      "";

    let postcodeResolutionSource =
      "";

    let postcodeResolutionScore =
      0;

    try {
      if (
        resolverAddress &&
        listingPostcodeDistrict
      ) {
        console.log(
          "========================================"
        );

        console.log(
          "INDEPENDENT POSTCODE RESOLUTION STARTED"
        );

        console.log(
          "Resolver address:",
          resolverAddress
        );

        console.log(
          "House number (effective):",
          effectiveHouseNumber ||
            "NONE"
        );

        console.log(
          "District:",
          listingPostcodeDistrict
        );

        console.log(
          "IMPORTANT: portal postcode is ignored"
        );

        console.log(
          "========================================"
        );

        /*
 * IMPORTANT:
 *
 * The AI has identified the house number from the
 * property photographs.
 *
 * That house number MUST be passed separately into
 * addressResolver.ts.
 *
 * It is a hard property-identity constraint.
 *
 * Example:
 *
 *   AI detects: 23
 *
 *   resolveAddress(
 *     resolverAddress,
 *     "LS8",
 *     "23"
 *   )
 *
 * This prevents evidence for a neighbouring property,
 * such as number 21, being accepted as evidence for
 * number 23.
 */

        const candidates =
  await resolveAddress(
    resolverAddress,
    listingPostcodeDistrict,
    effectiveHouseNumber,
    targetHouseNumber.cachedGeocoderResults || null
  );

        console.log(
          "INDEPENDENT POSTCODE CANDIDATES:",
          candidates.length
        );

        /*
         * ========================================================
         * VERIFY CANDIDATES
         * ========================================================
         */

        const verifiedCandidates =
          candidates
            .filter(
              (
                candidate
              ) => {
                if (
                  !isFullUKPostcode(
                    candidate.postcode
                  )
                ) {
                  console.warn(
                    "Rejected invalid postcode:",
                    candidate.postcode
                  );

                  return false;
                }

                if (
                  !postcodeBelongsToDistrict(
                    candidate.postcode,
                    listingPostcodeDistrict
                  )
                ) {
                  console.warn(
                    "Rejected postcode:",
                    candidate.postcode,
                    "because it does not belong to:",
                    listingPostcodeDistrict
                  );

                  return false;
                }

                return true;
              }
            )
            .sort(
              (a, b) =>
                b.score -
                a.score
            );

        if (
          verifiedCandidates.length >
          0
        ) {
          const best =
            verifiedCandidates[0];

          resolvedPostcode =
            normalisePostcode(
              best.postcode
            );

          resolvedAddress =
            best.address ||
            imported.address;

          postcodeResolutionSource =
            best.source ||
            "Independent resolver";

          postcodeResolutionScore =
            best.score || 0;

          /*
           * ========================================================
           * POST-RESOLUTION HOUSE NUMBER CORRECTION
           * ========================================================
           *
           * When the geocoder-verified address contains a different
           * house number than the effective house number, and the
           * geocoder result is high-confidence (PointAddress or
           * verified candidate with multiple sources), prefer the
           * geocoder's house number.
           *
           * This handles cases where the listing address contains
           * the wrong house number but the geocoder has the correct
           * address indexed.
           */

          const resolvedNumber =
            best.houseNumber || null;

          if (
            resolvedNumber &&
            effectiveHouseNumber &&
            normaliseHouseNumber(resolvedNumber) !==
              normaliseHouseNumber(effectiveHouseNumber)
          ) {
            const isHighConfidence =
              best.verified === true ||
              best.sourceCount !== undefined &&
                best.sourceCount >= 2 ||
              best.arcGISAddrType === "PointAddress";

            if (isHighConfidence) {
              console.log(
                "POST-RESOLUTION CORRECTION:",
                `effective house number ${effectiveHouseNumber} overridden by geocoder ${resolvedNumber}`
              );

              effectiveHouseNumber =
                normaliseHouseNumber(resolvedNumber);
            } else {
              console.log(
                "POST-RESOLUTION: geocoder suggests",
                resolvedNumber,
                "but confidence insufficient to override",
                effectiveHouseNumber
              );
            }
          }

          console.log(
            "========================================"
          );

          console.log(
            "VERIFIED FULL POSTCODE"
          );

          console.log(
            "Resolved address:",
            resolvedAddress
          );

          console.log(
            "Verified postcode:",
            resolvedPostcode
          );

          console.log(
            "Source:",
            postcodeResolutionSource
          );

          console.log(
            "Score:",
            postcodeResolutionScore
          );

          console.log(
            "========================================"
          );
        } else {
          console.log(
            "========================================"
          );

          console.log(
            "NO INDEPENDENT POSTCODE FOUND"
          );

          console.log(
            "The portal postcode will NOT be used."
          );

          console.log(
            "========================================"
          );
        }
      } else {
        console.log(
          "Cannot perform independent postcode resolution."
        );

        console.log(
          "Resolver address:",
          resolverAddress ||
            "NONE"
        );

        console.log(
          "District:",
          listingPostcodeDistrict ||
            "NONE"
        );
      }
    } catch (
      addressError
    ) {
      console.error(
        "Independent address resolution failed:",
        addressError
      );

      /*
       * NEVER fall back to imported.postcode.
       */

      resolvedPostcode =
        "";

      postcodeResolutionSource =
        "";

      postcodeResolutionScore =
        0;
    }

    /*
     * ============================================================
     * FINAL POSTCODE SAFETY CHECK
     * ============================================================
     */

    if (
      resolvedPostcode &&
      imported.postcode &&
      normalisePostcode(
        resolvedPostcode
      ) ===
        normalisePostcode(
          imported.postcode
        )
    ) {
      console.warn(
        "Independent postcode happens to equal portal postcode."
      );

      console.warn(
        "It is still accepted because it was independently discovered."
      );
    }

    /*
     * ============================================================
     * HOUSE NUMBER EVIDENCE
     * ============================================================
     */

    console.log(
      "========================================"
    );

    console.log(
      "HOUSE NUMBER EVIDENCE"
    );

    console.log(
      "AI house number:",
      houseNumberFromPhoto ||
        "UNKNOWN"
    );

    console.log(
      "AI confidence:",
      houseNumberConfidence
    );

    console.log(
      "AI evidence:",
      houseNumberEvidence ||
        "None"
    );

    console.log(
      "========================================"
    );

    /*
     * ============================================================
     * FINAL PROPERTY ADDRESS STATE
     * ============================================================
     */

    console.log(
      "========================================"
    );

    console.log(
      "FINAL PROPERTY ADDRESS STATE"
    );

    console.log(
      "Scraped listing address:",
      imported.address
    );

    console.log(
      "Resolver address:",
      resolverAddress
    );

    console.log(
      "AI house number (photographic):",
      houseNumberFromPhoto ||
        "UNKNOWN"
    );

    console.log(
      "Effective house number (cross-validated):",
      effectiveHouseNumber ||
        "UNKNOWN"
    );

    console.log(
      "Listing district:",
      listingPostcodeDistrict ||
        "UNKNOWN"
    );

    console.log(
      "Portal postcode:",
      imported.postcode ||
        "NONE"
    );

    console.log(
      "VERIFIED postcode:",
      resolvedPostcode ||
        "NOT VERIFIED"
    );

    console.log(
      "Postcode source:",
      postcodeResolutionSource ||
        "NONE"
    );

    console.log(
      "========================================"
    );

    /*
     * ============================================================
     * CHECK EXISTING PROPERTY
     * ============================================================
     */

    const existing =
      await prisma.property.findUnique(
        {
          where: {
            externalId:
              imported.externalId,
          },
        }
      );

    let property:
      | Awaited<
          ReturnType<
            typeof prisma.property.create
          >
        >
      | Awaited<
          ReturnType<
            typeof prisma.property.update
          >
        >;

    /*
     * ============================================================
     * UPDATE EXISTING PROPERTY
     * ============================================================
     */

    if (existing) {
      property =
        await prisma.property.update(
          {
            where: {
              id: existing.id,
            },

            data: {
              address:
                resolvedAddress,

              /*
               * NEVER use imported.postcode.
               */

              postcode:
                resolvedPostcode,

              houseNumberAI:
                houseNumberFromPhoto,

              houseNumberConfidence:
                houseNumberConfidence,

              houseNumberEvidence:
                houseNumberEvidence,

              listingHouseNumber:
                listingHouseNumber ||
                null,

              targetHouseNumber:
                targetHouseNumber.number ||
                null,

              effectiveHouseNumber:
                effectiveHouseNumber ||
                null,

              targetMatch:
                targetMatchFinal || null,

              targetMismatchReason:
                targetMismatchReasonFinal ||
                null,

              type:
                imported.type,

              description:
                imported.description ||
                null,

              listingUrl:
                imported.listingUrl,

              agent:
                imported.agent ||
                null,

              source:
                imported.source,

              price:
                imported.price,

              bedrooms:
                imported.bedrooms,

              bathrooms:
                imported.bathrooms,

              images:
                JSON.stringify(
                  imageUrls
                ),

              floorPlanImages:
                imported.floorPlans.length > 0
                  ? JSON.stringify(imported.floorPlans)
                  : null,

              primaryPhoto:
                imported.primaryPhoto || null,

              addressSource:
                postcodeResolutionSource || "Listing address",

              addressConfidence:
                postcodeResolutionScore > 0
                  ? `${postcodeResolutionScore}%`
                  : null,

              dateListed:
                imported.dateListed
                  ? new Date(
                      imported.dateListed
                    )
                  : null,

              lastSeen:
                new Date(),
            },
          }
        );

      /*
       * ==========================================================
       * DELETE OLD PHOTOS
       * ==========================================================
       */

      await prisma.propertyPhoto.deleteMany(
        {
          where: {
            propertyId:
              property.id,
          },
        }
      );

       /*
 * ==========================================================
 * SAVE FRESH PHOTOS LOCALLY
 * ==========================================================
 */

console.log(
  "SAVING PROPERTY PHOTOS:",
  imageUrls.length
);

const savedPhotos: {
  propertyId: number;
  url: string;
  displayOrder: number;
  isPrimary: boolean;
}[] = [];

/*
 * Clean markdown image URLs first
 */

const cleanImageUrls: string[] =
  imageUrlsForProcessing
  .map((url) => {
    if (!url) {
      return null;
    }

    const markdownMatch =
      url.match(/\]\((https?:\/\/[^)]+)\)/);

    let cleanedUrl =
      markdownMatch?.[1] || url;

    const bracketMatch =
      cleanedUrl.match(/\[(https?:\/\/[^\]]+)\]/);

    if (bracketMatch?.[1]) {
      cleanedUrl = bracketMatch[1];
    }

    cleanedUrl = cleanedUrl
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .trim();

    /*
     * ========================================================
     * ZOOPLA IMAGE URL NORMALISATION
     * ========================================================
     */

    if (
      cleanedUrl.includes(
        "lid.zoocdn.com/u/original/768/"
      )
    ) {
      cleanedUrl = cleanedUrl.replace(
        "/u/original/768/",
        "/u/1024/768/"
      );
    }

    if (
      cleanedUrl.includes(
        "lid.zoocdn.com/u/original/360/"
      )
    ) {
      cleanedUrl = cleanedUrl.replace(
        "/u/original/360/",
        "/u/480/360/"
      );
    }

    return cleanedUrl;
  })
  .filter(
    (url): url is string =>
      typeof url === "string" &&
      url.length > 0
  );

console.log(
  "CLEANED PHOTO URLS:",
  cleanImageUrls
);

/*
 * ==========================================================
 * DOWNLOAD EVERY PHOTO
 * ==========================================================
 */

for (
  let i = 0;
  i < cleanImageUrls.length;
  i++
) {
  const imageUrl =
    cleanImageUrls[i];

  /*
   * Extra safety check
   */
  if (!imageUrl) {
    console.log(
      "PHOTO URL EMPTY:",
      i
    );

    continue;
  }

  try {
    /*
     * Download the remote image
     */
    const downloaded =
      await downloadImage(
        imageUrl
      );

    /*
     * Skip failed downloads
     */
    if (!downloaded) {
      console.log(
        "PHOTO DOWNLOAD FAILED:",
        imageUrl
      );

      continue;
    }

    /*
     * Create local filename
     */
    const filename =
      `property-${property.id}-${i}.jpg`;

    /*
     * Local filesystem path
     */
    const filepath =
      path.join(
        process.cwd(),
        "public",
        "uploads",
        "properties",
        filename
      );

    /*
     * Make sure directory exists
     */
    await fs.promises.mkdir(
      path.dirname(filepath),
      {
        recursive: true
      }
    );

    /*
     * Save image locally
     */
    await fs.promises.writeFile(
      filepath,
      downloaded
    );

    /*
     * Local URL used by the website
     */
    const localUrl =
      `/uploads/properties/${filename}`;

    console.log(
      "PHOTO SAVED:",
      localUrl
    );

    savedPhotos.push({
      propertyId: property.id,
      url: localUrl,
      displayOrder: i,
      isPrimary: imageUrls[i] === imported.primaryPhoto,
    });
  } catch (error) {
    console.error(
      "PHOTO SAVE ERROR:",
      imageUrl,
      error
    );
  }
}

/*
 * ==========================================================
 * SAVE LOCAL PHOTO REFERENCES
 * ==========================================================
 */

if (
  savedPhotos.length > 0
) {
  await prisma.propertyPhoto.createMany({
    data:
      savedPhotos,
  });
}

console.log(
  "LOCAL PHOTOS SAVED:",
  savedPhotos.length
);

console.log(
  "========================================"
);

console.log(
  "EXISTING PROPERTY UPDATED"
);

console.log(
  "Property ID:",
  property.id
);

console.log(
  "AI House Number:",
  houseNumberFromPhoto ||
    "UNKNOWN"
);

console.log(
  "AI House Number Confidence:",
  houseNumberConfidence
);

console.log(
  "Verified postcode:",
  resolvedPostcode ||
    "NOT VERIFIED"
);

console.log(
  "Fresh photos saved:",
  savedPhotos.length
);

console.log(
  "========================================"
);

} else {
/*
 * ============================================================
 * CREATE NEW PROPERTY
 * ============================================================
 */
      property =
        await prisma.property.create(
          {
            data: {
              externalId:
                imported.externalId,

              address:
                resolvedAddress,

              postcode:
                resolvedPostcode,

              houseNumberAI:
                houseNumberFromPhoto,

              houseNumberConfidence:
                houseNumberConfidence,

              houseNumberEvidence:
                houseNumberEvidence,

              listingHouseNumber:
                listingHouseNumber ||
                null,

              targetHouseNumber:
                targetHouseNumber.number ||
                null,

              effectiveHouseNumber:
                effectiveHouseNumber ||
                null,

              targetMatch:
                targetMatchFinal || null,

              targetMismatchReason:
                targetMismatchReasonFinal ||
                null,

              type:
                imported.type,

              description:
                imported.description ||
                null,

              listingUrl:
                imported.listingUrl,

              agent:
                imported.agent ||
                null,

              source:
                imported.source,

              images:
                JSON.stringify(
                  imageUrls
                ),

              floorPlanImages:
                imported.floorPlans.length > 0
                  ? JSON.stringify(imported.floorPlans)
                  : null,

              primaryPhoto:
                imported.primaryPhoto || null,

              addressSource:
                postcodeResolutionSource || "Listing address",

              addressConfidence:
                postcodeResolutionScore > 0
                  ? `${postcodeResolutionScore}%`
                  : null,

              price:
                imported.price,

              bedrooms:
                imported.bedrooms,

              bathrooms:
                imported.bathrooms,

              estimatedValue:
                0,

              soldComparableAvg:
                0,

              discountPercent:
                0,

              refurbRequired:
                false,

              kitchenCost:
                0,

              bathroomCost:
                0,

              decorationCost:
                0,

              extensionCost:
                0,

              totalRefurbCost:
                0,

              purchaseCosts:
                0,

              stampDuty:
                0,

              legalCosts:
                0,

              totalInvestment:
                imported.price,

              resaleValue:
                0,

              potentialProfit:
                0,

              rentalValue:
                0,

              yield:
                0,

              aiScore:
                0,

              aiConfidence:
                0,

              aiRecommendation:
                null,

              aiSummary:
                null,

              aiOpportunities:
                null,

              aiRisks:
                null,

              photoAnalysis:
                null,

              detectedIssues:
                null,

              refurbPlan:
                null,

              valuationReasoning:
                null,

              comparableAnalysis:
                null,

              marketAnalysis:
                null,

              aiTrainingData:
                null,

              actualOutcome:
                null,

              dealSuccessful:
                null,

              dateListed:
                imported.dateListed
                  ? new Date(
                      imported.dateListed
                    )
                  : null,

              lastSeen:
                new Date(),

              photos: {
                create:
                  imageUrls.map(
                    (
                      imageUrl,
                      index
                    ) => ({
                      url:
                        imageUrl,
                      displayOrder:
                        index,
                      isPrimary:
                        imageUrl ===
                        imported.primaryPhoto,
                    })
                  ),
              },
            },

            include: {
              photos: true,
            },
          }
        );

      console.log(
        "========================================"
      );

      console.log(
        "NEW PROPERTY CREATED"
      );

      console.log(
        "Property ID:",
        property.id
      );

      console.log(
        "AI House Number:",
        houseNumberFromPhoto ||
          "UNKNOWN"
      );

      console.log(
        "AI House Number Confidence:",
        houseNumberConfidence
      );

      console.log(
        "Verified postcode:",
        resolvedPostcode ||
          "NOT VERIFIED"
      );

      console.log(
        "Photos saved:",
        imageUrls.length
      );

      console.log(
        "========================================"
      );
    }
    /*
     * ============================================================
     * LOOK UP EPC FOR EXACT PROPERTY
     * ============================================================
     *
     * IMPORTANT:
     *
     * The house number has already been identified by the
     * property-photo AI.
     *
     * EPC does NOT determine the house number.
     *
     * We use:
     *
     *   AI house number
     *   +
     *   independently verified postcode
     *   +
     *   resolved address
     *
     * to find the correct EPC record.
     */

    try {
      console.log(
        "========================================"
      );

      console.log(
        "EXACT EPC LOOKUP STARTED"
      );

      console.log(
        "House Number (effective):",
        effectiveHouseNumber ||
          "UNKNOWN"
      );

      console.log(
        "Verified Postcode:",
        resolvedPostcode ||
          "NOT VERIFIED"
      );

      console.log(
        "Resolved Address:",
        resolvedAddress ||
          "UNKNOWN"
      );

      if (
        effectiveHouseNumber &&
        resolvedPostcode
      ) {
        const epc =
          await getEPCByAddress(
            resolvedPostcode,
            effectiveHouseNumber,
            resolvedAddress
          );

        if (epc) {
          console.log(
            "========================================"
          );

          console.log(
            "EXACT EPC FOUND"
          );

          console.log(
            "EPC Address:",
            epc.address ||
              "UNKNOWN"
          );

          console.log(
            "EPC House Number:",
            effectiveHouseNumber
          );

          console.log(
            "EPC Rating:",
            epc.rating ||
              "UNKNOWN"
          );

          console.log(
            "EPC Floor Area:",
            epc.totalFloorArea ??
              "UNKNOWN"
          );

          console.log(
            "EPC Certificate:",
            epc.certificateNumber ||
              "UNKNOWN"
          );

          console.log(
            "EPC UPRN:",
            epc.uprn ||
              "UNKNOWN"
          );

          console.log(
            "========================================"
          );

          await prisma.property.update({
  where: {
    id: property.id,
  },

  data: {
    epcRating:
      epc.rating,

    epcPotentialRating:
      epc.potentialEnergyEfficiencyBand,

    epcScore:
      epc.currentEnergyEfficiency,

    epcPotentialScore:
      epc.potentialEnergyEfficiency,

    epcFloorArea:
      epc.totalFloorArea,

    epcCertificateDate:
      epc.certificateDate
        ? new Date(
            epc.certificateDate
          )
        : null,

    epcSource:
      "EPC Register - exact address match",

    epcHeating:
      epc.heating || null,

    epcCertificateUrl:
      epc.certificateUrl || null,

    epcCertificateImage:
      epc.certificateImage || null,

    epcPropertyType:
      epc.propertyType || null,

    epcMainFuel:
      epc.mainFuel || null,

    epcWalls:
      epc.walls || null,

    epcRoof:
      epc.roof || null,

    epcWindows:
      epc.windows || null,

    epcRecommendations:
      epc.recommendations
        ? JSON.stringify(epc.recommendations)
        : null,

    epcEstimatedCosts:
      epc.estimatedCosts
        ? JSON.stringify(epc.estimatedCosts)
        : null,

    epcFullCertificate:
      epc.fullCertificate
        ? JSON.stringify(epc.fullCertificate)
        : null,
  },
});
          console.log(
            "EPC DATA SAVED TO PROPERTY"
          );
        } else {
          console.log(
            "========================================"
          );

          console.log(
            "NO EXACT EPC FOUND"
          );

          console.log(
            "EPC was NOT assigned from another property."
          );

          console.log(
            "========================================"
          );
        }
      } else {
        console.log(
          "EPC LOOKUP SKIPPED:"
        );

        console.log(
          "House number or verified postcode missing."
        );
      }
    } catch (epcError) {
      console.error(
        "Exact EPC lookup failed:",
        epcError
      );
    }

    /*
     * ============================================================
     * RUN COMPARABLE VALUATION
     * ============================================================
     */

    let valuation = {
      estimatedValue: 0,

      comparableAverage: 0,

      comparableCount: 0,

      comparables:
        [] as any[],
    };

    try {
      valuation =
        await calculateComparableValue(
          property.id
        );
    } catch (
      valuationError
    ) {
      console.error(
        "Comparable valuation failed:",
        valuationError
      );
    }

    
    /*
     * ============================================================
     * CALCULATE FLIP
     * ============================================================
     */

    const estimatedValue =
      valuation.estimatedValue;

    const refurb =
      property.totalRefurbCost ??
      0;

    const flip =
      calculateFlip({
        purchasePrice:
          property.price,

        resaleValue:
          estimatedValue,

        refurbCost:
          refurb,
      });

    /*
     * ============================================================
     * DEAL SCORE
     * ============================================================
     */

    const dealScore =
      calculateDealScore({
        price:
          property.price,

        value:
          estimatedValue,

        address:
          property.address,

        type:
          property.type,

        bedrooms:
          property.bedrooms,

        description:
          property.description,

        postcode:
          property.postcode,
      });

    const aiScore =
      dealScore.score;

    /*
     * ============================================================
     * SAVE CALCULATED DATA
     * ============================================================
     */

    const updatedProperty =
      await prisma.property.update(
        {
          where: {
            id:
              property.id,
          },

          data: {
            houseNumberAI:
              houseNumberFromPhoto,

            houseNumberConfidence:
              houseNumberConfidence,

            houseNumberEvidence:
              houseNumberEvidence,

            listingHouseNumber:
              listingHouseNumber ||
              null,

            targetHouseNumber:
              targetHouseNumber.number ||
              null,

            effectiveHouseNumber:
              effectiveHouseNumber ||
              null,

            targetMatch:
              targetMatchFinal || null,

            targetMismatchReason:
              targetMismatchReasonFinal ||
              null,

            estimatedValue:
              estimatedValue,

            soldComparableAvg:
              valuation.comparableAverage,

            discountPercent:
              estimatedValue > 0
                ? Math.round(
                    (
                      (
                        estimatedValue -
                        property.price
                      ) /
                      estimatedValue
                    ) *
                      100
                  )
                : 0,

            totalInvestment:
              flip.totalProjectCost,

            resaleValue:
              flip.resaleValue,

            potentialProfit:
              flip.netProfit,

            purchaseCosts:
              flip.stampDuty +
              flip.legalCosts,

            stampDuty:
              flip.stampDuty,

            legalCosts:
              flip.legalCosts,

            aiScore:
              aiScore,
          },

          include: {
            photos: true,
          },
        }
      );

    /*
     * ============================================================
     * RETURN RESULT
     * ============================================================
     */

    return NextResponse.json({
      success: true,

      action:
        existing
          ? "updated"
          : "created",

      property:
        updatedProperty,

      addressResolution: {
        scrapedAddress:
          imported.address,

        resolverAddress:
          resolverAddress,

        aiHouseNumber:
          houseNumberFromPhoto,

        aiHouseNumberConfidence:
          houseNumberConfidence,

        postcodeDistrict:
          listingPostcodeDistrict,

        portalPostcode:
          imported.postcode ||
          null,

        portalPostcodeIgnored:
          true,

        verifiedPostcode:
          resolvedPostcode ||
          null,

        verifiedAddress:
          resolvedAddress,

        source:
          postcodeResolutionSource ||
          null,

        score:
          postcodeResolutionScore ||
          null,

        independentlyVerified:
          Boolean(
            resolvedPostcode
          ),
      },

      houseNumberAI: {
        houseNumber:
          houseNumberFromPhoto,

        confidence:
          houseNumberConfidence,

        evidence:
          houseNumberEvidence,

        listingHouseNumber:
          listingHouseNumber ||
          null,

        targetHouseNumber:
          targetHouseNumber.number ||
          null,

        effectiveHouseNumber:
          effectiveHouseNumber ||
          null,

        targetMatch:
          targetMatchFinal,

        targetMismatchReason:
          targetMismatchReasonFinal,

        targetSources:
          targetHouseNumber.sources,

        targetGeocoderAgrees:
          targetHouseNumber.geocoderAgrees,

        visibleNumbers:
          visibleNumbers,
      },

      valuation: {
        estimatedValue:
          valuation.estimatedValue,

        comparableAverage:
          valuation.comparableAverage,

        comparableCount:
          valuation.comparableCount,
      },

      dealScore: {
        score:
          dealScore.score,

        rating:
          dealScore.rating,

        discountPercent:
          dealScore.discountPercent,

        discountAmount:
          dealScore.discountAmount,

        reasons:
          dealScore.reasons,

        warnings:
          dealScore.warnings,
      },

      flip: {
        totalProjectCost:
          flip.totalProjectCost,

        netProfit:
          flip.netProfit,

        roi:
          flip.roi,

        maximumPurchasePrice:
          flip.maximumPurchasePrice,

        recommendedOffer:
          flip.recommendedOffer,
      },

      message:
        existing
          ? "Existing property updated. Listing details scraped, valid property photos saved, house number identified from photos, portal postcode ignored, independent postcode resolution attempted, property revaluated and rescored."
          : "Property imported. Listing details scraped, valid property photos saved, house number identified from photos, portal postcode ignored, independent postcode resolution attempted, property valued and scored.",
    });
  } catch (
    error
  ) {
    console.error(
      "Property import error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Property import failed.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}