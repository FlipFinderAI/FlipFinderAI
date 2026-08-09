import axios from "axios";

export type AddressCandidate = {
  address: string;
  postcode: string;
  score: number;
  source: string;
  houseNumber?: string;
};

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalisePostcode(value: string): string {
  return cleanText(value)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseAddress(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function postcodeDistrict(postcode: string): string {
  const normalised = normalisePostcode(postcode);

  if (!normalised) {
    return "";
  }

  return normalised.split(/\s+/)[0];
}

/**
 * Extract a genuine full UK postcode.
 *
 * We NEVER manufacture a postcode.
 */
function extractFullPostcode(text: string): string {
  const match = cleanText(text).match(
    /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i
  );

  if (!match) {
    return "";
  }

  return normalisePostcode(
    match[1].replace(/\s+/g, " ")
  );
}

/**
 * Extract a house number when one exists.
 *
 * Examples:
 * 14 Smith Street -> 14
 * 14A Smith Street -> 14A
 * 14-16 Smith Street -> 14
 */
function extractHouseNumber(text: string): string {
  const match = cleanText(text).match(
    /^\s*(\d+[A-Z]?)\b/i
  );

  return match?.[1] || "";
}

/**
 * Extract the first meaningful street/address component.
 */
function extractStreet(address: string): string {
  const parts = cleanText(address)
    .split(",")
    .map(cleanText)
    .filter(Boolean);

  return parts[0] || cleanText(address);
}

/**
 * Extract town/city from a comma-separated address.
 */
function extractTown(address: string): string {
  const parts = cleanText(address)
    .split(",")
    .map(cleanText)
    .filter(Boolean);

  return parts[1] || "";
}

/**
 * Remove the house number from a street name.
 *
 * 14 Smith Street -> Smith Street
 */
function removeHouseNumber(value: string): string {
  return cleanText(value)
    .replace(/^\s*\d+[A-Z]?\s*/i, "")
    .trim();
}

/**
 * Compare two street names reasonably safely.
 */
function streetMatches(
  requestedStreet: string,
  candidateRoad: string
): boolean {
  const requested = normaliseAddress(
    removeHouseNumber(requestedStreet)
  );

  const candidate = normaliseAddress(
    candidateRoad
  );

  if (!requested || !candidate) {
    return false;
  }

  if (requested === candidate) {
    return true;
  }

  if (
    requested.includes(candidate) ||
    candidate.includes(requested)
  ) {
    return true;
  }

  return false;
}

/**
 * Score a Nominatim candidate.
 *
 * IMPORTANT:
 * A candidate cannot become acceptable
 * merely because its postcode exists.
 *
 * The address itself has to match.
 */
function scoreCandidate(
  requestedStreet: string,
  requestedTown: string,
  requestedDistrict: string,
  requestedHouseNumber: string,
  candidate: any
): number {
  let score = 0;

  const street = normaliseAddress(
    removeHouseNumber(requestedStreet)
  );

  const town = normaliseAddress(
    requestedTown
  );

  const district = normalisePostcode(
    requestedDistrict
  );

  const displayName = normaliseAddress(
    candidate?.display_name || ""
  );

  const candidateRoad = normaliseAddress(
    candidate?.address?.road || ""
  );

  const candidateTown = normaliseAddress(
    candidate?.address?.city ||
      candidate?.address?.town ||
      candidate?.address?.village ||
      candidate?.address?.municipality ||
      ""
  );

  const candidatePostcode = normalisePostcode(
    candidate?.address?.postcode || ""
  );

  const candidateHouseNumber = cleanText(
    candidate?.address?.house_number || ""
  );

  /*
   * STREET
   */

  if (
    street &&
    candidateRoad &&
    streetMatches(street, candidateRoad)
  ) {
    score += 50;
  } else if (
    street &&
    displayName.includes(street)
  ) {
    score += 20;
  } else {
    /*
     * If the street doesn't match,
     * this is not a useful candidate.
     */
    return 0;
  }

  /*
   * TOWN
   */

  if (
    town &&
    candidateTown &&
    candidateTown === town
  ) {
    score += 25;
  } else if (
    town &&
    candidateTown &&
    (
      candidateTown.includes(town) ||
      town.includes(candidateTown)
    )
  ) {
    score += 15;
  } else if (
    town &&
    displayName.includes(town)
  ) {
    score += 10;
  }

  /*
   * POSTCODE DISTRICT
   */

  if (candidatePostcode) {
    const candidateDistrict =
      postcodeDistrict(candidatePostcode);

    if (
      district &&
      candidateDistrict === district
    ) {
      score += 25;
    } else if (
      district &&
      candidateDistrict &&
      candidateDistrict !== district
    ) {
      /*
       * Completely different postcode
       * district = reject.
       */
      return 0;
    }
  }

  /*
   * HOUSE NUMBER
   */

  if (requestedHouseNumber) {
    if (
      candidateHouseNumber &&
      requestedHouseNumber.toUpperCase() ===
        candidateHouseNumber.toUpperCase()
    ) {
      /*
       * Exact house number is extremely
       * strong evidence.
       */
      score += 100;
    } else if (
      candidateHouseNumber
    ) {
      /*
       * We asked for a specific property
       * but Nominatim returned another
       * numbered property.
       *
       * Reject it rather than guessing.
       */
      return 0;
    } else {
      /*
       * We know the requested property
       * number but Nominatim cannot verify
       * the returned number.
       *
       * Don't accept it as an exact match.
       */
      return 0;
    }
  }

  /*
   * A postcode must actually be present.
   */
  if (!candidatePostcode) {
    return 0;
  }

  return score;
}

/**
 * Remove duplicate postcodes.
 */
function deduplicateCandidates(
  candidates: AddressCandidate[]
): AddressCandidate[] {
  const unique =
    new Map<string, AddressCandidate>();

  for (const candidate of candidates) {
    const key = normalisePostcode(
      candidate.postcode
    );

    const existing = unique.get(key);

    if (
      !existing ||
      candidate.score > existing.score
    ) {
      unique.set(key, candidate);
    }
  }

  return Array.from(unique.values()).sort(
    (a, b) => b.score - a.score
  );
}

/**
 * Resolve a partial UK property address.
 *
 * RULES:
 *
 * 1. Never invent a postcode.
 * 2. Never convert a postcode district into
 *    a fake full postcode.
 * 3. Street must match.
 * 4. Postcode district must match when supplied.
 * 5. If a house number is supplied, the
 *    independent result must contain the
 *    SAME house number.
 * 6. Postcodes.io only validates that the
 *    postcode exists. It does NOT prove that
 *    the postcode belongs to the property.
 */
export async function resolveAddress(
  address: string,
  postcodeDistrictInput: string
): Promise<AddressCandidate[]> {
  const cleanAddress =
    cleanText(address);

  const cleanDistrict =
    normalisePostcode(
      postcodeDistrictInput
    );

  if (!cleanAddress) {
    return [];
  }

  const street =
    extractStreet(cleanAddress);

  const town =
    extractTown(cleanAddress);

  const houseNumber =
    extractHouseNumber(cleanAddress);

  console.log(
    `Independent postcode lookup: ${cleanAddress}`
  );

  /*
   * Build several increasingly broad
   * Nominatim searches.
   */

  const queries = [
    [
      houseNumber,
      removeHouseNumber(street),
      town,
      cleanDistrict,
      "UK",
    ]
      .filter(Boolean)
      .join(", "),

    [
      removeHouseNumber(street),
      town,
      cleanDistrict,
      "UK",
    ]
      .filter(Boolean)
      .join(", "),

    [
      removeHouseNumber(street),
      town,
      "UK",
    ]
      .filter(Boolean)
      .join(", "),

    [
      removeHouseNumber(street),
      cleanDistrict,
      "UK",
    ]
      .filter(Boolean)
      .join(", "),
  ];

  const uniqueQueries =
    Array.from(
      new Set(
        queries.filter(Boolean)
      )
    );

  const candidates: AddressCandidate[] =
    [];

  /*
   * Nominatim public API rate limiting.
   */
  for (const query of uniqueQueries) {
    try {
      const response =
        await axios.get(
          "https://nominatim.openstreetmap.org/search",
          {
            params: {
              q: query,
              format: "jsonv2",
              addressdetails: 1,
              limit: 10,
              countrycodes: "gb",
            },

            headers: {
              "User-Agent":
                "FlipFinderAI/1.0 property-address-resolution",
              Accept:
                "application/json",
            },

            timeout: 15000,
          }
        );

      const results =
        Array.isArray(response.data)
          ? response.data
          : [];

      for (const result of results) {
        const postcode =
          extractFullPostcode(
            result?.address?.postcode ||
              result?.display_name ||
              ""
          );

        /*
         * No full postcode = reject.
         */
        if (!postcode) {
          continue;
        }

        const resultDistrict =
          postcodeDistrict(postcode);

        /*
         * Different postcode district =
         * definitely reject.
         */
        if (
          cleanDistrict &&
          resultDistrict !== cleanDistrict
        ) {
          continue;
        }

        const score =
          scoreCandidate(
            street,
            town,
            cleanDistrict,
            houseNumber,
            result
          );

        /*
         * Only keep genuine address matches.
         */
        if (score <= 0) {
          continue;
        }

        candidates.push({
          address:
            cleanText(
              result?.display_name ||
                cleanAddress
            ),

          postcode,

          score,

          source:
            "OpenStreetMap/Nominatim",

          houseNumber:
            cleanText(
              result?.address?.house_number ||
                ""
            ),
        });
      }

      /*
       * If we have an exact house-number
       * match, stop searching.
       */
      if (
        candidates.some(
          candidate =>
            candidate.score >= 150
        )
      ) {
        break;
      }

      /*
       * Small delay between Nominatim
       * requests.
       */
      await new Promise(
        resolve => setTimeout(resolve, 1100)
      );
    } catch (error) {
      console.error(
        "Nominatim address search failed:",
        error
      );
    }
  }

  /*
   * Nothing independently matched.
   */
  if (candidates.length === 0) {
    console.log(
      `✗ No independently verified full postcode found. Keeping district: ${cleanDistrict || "UNKNOWN"}`
    );

    return [];
  }

  /*
   * SECOND CHECK:
   *
   * Postcodes.io confirms that the postcode
   * itself exists.
   *
   * It does NOT create a postcode.
   */
  const validated: AddressCandidate[] =
    [];

  for (const candidate of candidates) {
    try {
      const response =
        await axios.get(
          `https://api.postcodes.io/postcodes/${encodeURIComponent(
            candidate.postcode
          )}`,
          {
            timeout: 10000,
          }
        );

      if (
        response.data?.status !== 200 ||
        !response.data?.result
      ) {
        continue;
      }

      const postcodeData =
        response.data.result;

      const validatedPostcode =
        normalisePostcode(
          postcodeData.postcode || ""
        );

      if (!validatedPostcode) {
        continue;
      }

      const validatedDistrict =
        postcodeDistrict(
          validatedPostcode
        );

      if (
        cleanDistrict &&
        validatedDistrict !==
          cleanDistrict
      ) {
        continue;
      }

      validated.push({
        ...candidate,

        postcode:
          validatedPostcode,

        score:
          candidate.score + 20,

        source:
          "OpenStreetMap/Nominatim+Postcodes.io",
      });
    } catch (error) {
      /*
       * Nominatim already supplied a genuine
       * postcode. If Postcodes.io is temporarily
       * unavailable, keep it.
       */
      validated.push(candidate);
    }
  }

  /*
   * Only return validated candidates where
   * possible.
   */
  const finalCandidates =
    validated.length > 0
      ? validated
      : candidates;

  const finalResults =
    deduplicateCandidates(
      finalCandidates
    ).slice(0, 20);

  if (finalResults.length > 0) {
    console.log(
      `✓ Independently verified full postcode: ${finalResults[0].postcode}`
    );

    console.log(
      `Matched address: ${finalResults[0].address}`
    );
  }

  return finalResults;
}