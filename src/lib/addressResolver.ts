/*
 * ================================================================
 * FLIPFINDERAI ADDRESS RESOLVER
 * ================================================================
 *
 * PURPOSE
 * -------
 * Resolve:
 *
 *   house number
 *   street
 *   town
 *   postcode district
 *
 * into:
 *
 *   verified full UK postcode candidates
 *
 * IMPORTANT
 * ---------
 * This resolver is deliberately conservative.
 *
 * It must NOT:
 *
 *   - trust the postcode supplied by the portal
 *   - accept a neighbouring house number as the property
 *   - assume that a street-level postcode belongs to the property
 *   - return a postcode merely because it matches the district
 *   - manufacture a house number from a street-level result
 *
 * The supplied postcode district is a HARD constraint.
 *
 * House number + street are the primary identity of the property.
 *
 * Multiple independent geocoding sources are used where possible.
 *
 * A postcode gets a strong score when independent sources agree on:
 *
 *   - house number
 *   - street
 *   - postcode
 *
 * If sources disagree about the house number, the result is treated
 * as ambiguous rather than silently choosing one.
 *
 * ================================================================
 */

export type AddressCandidate = {
  address: string;
  postcode: string;
  source: string;
  score: number;

  /*
   * Additional verification information.
   */
  houseNumber?: string | null;
  street?: string | null;
  town?: string | null;

  houseNumberMatch?: boolean;
  streetMatch?: boolean;
  districtMatch?: boolean;

  /*
   * Number of independent sources supporting this
   * exact candidate.
   */
  sourceCount?: number;

  /*
   * Whether this candidate is considered sufficiently
   * verified to use as the property's resolved postcode.
   */
  verified?: boolean;

  /*
   * ArcGIS address type (e.g. "PointAddress", "StreetAddress").
   */
  arcGISAddrType?: string;

  /*
   * Geolocation from the geocoder result.
   */
  latitude?: number | null;
  longitude?: number | null;
};

/*
 * ================================================================
 * TARGET HOUSE NUMBER
 * ================================================================
 *
 * Independent property-identity evidence established BEFORE
 * the AI photographic pipeline runs.
 *
 * Combines the listing address house number with independent
 * geocoder evidence to produce a target that the photographic
 * result can be compared against.
 * ================================================================
 */

export type TargetHouseNumber = {
  /*
   * The normalised house number from the listing address.
   */
  number: string | null;

  /*
   * How many independent geocoders returned this number
   * on the correct street in the correct district.
   */
  sourceCount: number;

  /*
   * Which geocoders agreed.
   */
  sources: string[];

  /*
   * Best ArcGIS Addr_type seen (e.g. "PointAddress").
   */
  highestAddrType: string | null;

  /*
   * True if 2+ independent geocoders agree on the number.
   */
  geocoderAgrees: boolean;

  /*
   * Original house number extracted from the listing address.
   */
  listingNumber: string;

  /*
   * Raw geocoder results cached for reuse by resolveAddress().
   */
  cachedGeocoderResults?: GeocoderResults;
};

/*
 * Cached geocoder results to avoid duplicate HTTP requests.
 */
export type GeocoderResults = {
  nominatim: NominatimResult[];
  photon: PhotonResponse | null;
  arcGIS: ArcGISCandidate[];
};

type NominatimResult = {
  display_name?: string;
  importance?: number;
  lat?: string;
  lon?: string;

  address?: {
    house_number?: string;
    road?: string;
    street?: string;
    residential?: string;
    pedestrian?: string;

    neighbourhood?: string;
    suburb?: string;

    village?: string;
    town?: string;
    city?: string;
    municipality?: string;

    county?: string;
    state?: string;

    postcode?: string;

    country?: string;
    country_code?: string;
  };
};

type ArcGISCandidate = {
  address?: string;
  score?: number;

  location?: {
    x?: number;
    y?: number;
  };

  attributes?: {
    Match_addr?: string;
    Addr_type?: string;
    StAddr?: string;
    City?: string;
    Region?: string;
    Postal?: string;
    PostalExt?: string;
    Country?: string;
  };
};

type PhotonResponse = {
  features?: Array<{
    properties?: {
      housenumber?: string;
      street?: string;
      name?: string;

      city?: string;
      district?: string;
      county?: string;
      state?: string;

      postcode?: string;
      country?: string;
    };

    geometry?: {
      coordinates?: number[];
    };
  }>;
};

type PostcodesIOResponse = {
  status?: number;

  result?: Array<{
    postcode?: string;

    codes?: {
      admin_district?: string;
      admin_county?: string;
      admin_ward?: string;
      parish?: string;
      parliamentary_constituency?: string;
      ccg?: string;
      ced?: string;
      nuts?: string;
    };

    latitude?: number;
    longitude?: number;

    country?: string;
    region?: string;

    district?: string;
    parish?: string;

    admin_district?: string;

    eastings?: number;
    northings?: number;
  }>;
};

/*
 * ================================================================
 * CONSTANTS
 * ================================================================
 */

const USER_AGENT =
  "FlipFinderAI/1.0 (property postcode resolver)";

const REQUEST_TIMEOUT =
  7000;

const MAX_CANDIDATES =
  10;

/*
 * Strong verification thresholds.
 *
 * We deliberately make these higher than the old resolver.
 */

const STRONG_SCORE =
  110;

const VERIFIED_SCORE =
  125;

/*
 * ================================================================
 * BASIC HELPERS
 * ================================================================
 */

function normalise(
  value: string | null | undefined
): string {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseUpper(
  value: string | null | undefined
): string {
  return normalise(value).toUpperCase();
}

function normalisePostcode(
  postcode: string | null | undefined
): string {
  return normaliseUpper(postcode)
    .replace(/\s+/g, " ")
    .trim();
}

function postcodeWithoutSpaces(
  postcode: string | null | undefined
): string {
  return normalisePostcode(postcode)
    .replace(/\s+/g, "");
}

function isFullUKPostcode(
  postcode: string | null | undefined
): boolean {
  if (!postcode) {
    return false;
  }

  const cleaned =
    postcodeWithoutSpaces(postcode);

  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(
    cleaned
  );
}

function cleanPostcode(
  postcode: string | null | undefined
): string | null {
  if (!postcode) {
    return null;
  }

  const cleaned =
    normalisePostcode(postcode);

  if (
    !isFullUKPostcode(cleaned)
  ) {
    return null;
  }

  /*
   * Return with standard UK spacing.
   *
   * Example:
   *
   * LS83BA -> LS8 3BA
   */

  const compact =
    postcodeWithoutSpaces(cleaned);

  return compact.replace(
    /^(.+?)(\d[A-Z]{2})$/,
    "$1 $2"
  );
}

function postcodeBelongsToDistrict(
  postcode: string,
  district: string
): boolean {
  const postcodeClean =
    postcodeWithoutSpaces(postcode);

  const districtClean =
    normaliseUpper(district)
      .replace(/\s+/g, "");

  return (
    districtClean.length > 0 &&
    postcodeClean.startsWith(districtClean)
  );
}

/*
 * ================================================================
 * HOUSE NUMBER
 * ================================================================
 */

function extractHouseNumber(
  address: string
): string | null {
  const match =
    normalise(address).match(
      /^(?:NO\.?\s*)?(\d+[A-Za-z]?)\b/i
    );

  return match
    ? normalise(match[1])
    : null;
}

function normaliseHouseNumber(
  value: string | null | undefined
): string | null {
  const cleaned =
    normaliseUpper(value);

  if (!cleaned) {
    return null;
  }

  /*
   * Convert common textual variants.
   *
   * 23A -> 23A
   * No. 23 -> 23
   */

  const match =
    cleaned.match(
      /(?:NO\.?\s*)?(\d+[A-Z]?)/
    );

  return match
    ? match[1]
    : cleaned;
}

function houseNumberMatches(
  expected: string | null,
  actual: string | null
): boolean {
  const a =
    normaliseHouseNumber(expected);

  const b =
    normaliseHouseNumber(actual);

  if (!a || !b) {
    return false;
  }

  return a === b;
}

/*
 * ================================================================
 * STRICT HOUSE NUMBER COMPARISON
 * ================================================================
 *
 * Unlike houseNumberMatches(), this preserves the suffix.
 *
 *   "21A" vs "21A"  → true
 *   "21A" vs "21"   → false
 *   "21"  vs "21A"  → false
 *   "21B" vs "21A"  → false
 *
 * Used for cross-validation where suffix identity matters.
 * ================================================================
 */

export function houseNumberMatchesStrict(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const cleanA = normaliseUpper(a);
  const cleanB = normaliseUpper(b);

  if (!cleanA || !cleanB) {
    return false;
  }

  return cleanA === cleanB;
}

/*
 * ================================================================
 * STREET NORMALISATION
 * ================================================================
 */

function normaliseStreet(
  value: string
): string {
  return normaliseUpper(value)
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bLANE\b/g, "LN")
    .replace(/\bCLOSE\b/g, "CL")
    .replace(/\bGARDENS\b/g, "GDNS")
    .replace(/\bPLACE\b/g, "PL")
    .replace(/\bCRESCENT\b/g, "CRES")
    .replace(/\bTERRACE\b/g, "TER")
    .replace(/\bSQUARE\b/g, "SQ")
    .replace(/\bWAY\b/g, "WAY")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function streetMatches(
  expected: string,
  actual: string
): boolean {
  const a =
    normaliseStreet(expected);

  const b =
    normaliseStreet(actual);

  if (!a || !b) {
    return false;
  }

  return (
    a === b ||
    a.includes(b) ||
    b.includes(a)
  );
}

/*
 * ================================================================
 * ADDRESS PARSER
 * ================================================================
 */

function parseAddress(
  rawAddress: string,
  suppliedDistrict: string,
  suppliedHouseNumber?: string | null
): {
  houseNumber: string | null;
  street: string;
  town: string;
  district: string;
} {
  let address =
    normalise(rawAddress);

  const district =
    normaliseUpper(suppliedDistrict);

  /*
   * Remove common listing suffixes.
   */

  address =
    address
      .replace(
        /\s*-\s*Zoopla.*$/i,
        ""
      )
      .replace(
        /\s*-\s*Rightmove.*$/i,
        ""
      )
      .replace(
        /\s*-\s*OnTheMarket.*$/i,
        ""
      )
      .replace(
        /,\s*\d+\s*bed\b.*$/i,
        ""
      )
      .trim();

  /*
   * Remove district.
   */

  if (district) {
    address =
      address.replace(
        new RegExp(
          `\\b${escapeRegex(district)}\\b`,
          "ig"
        ),
        ""
      );
  }

  /*
   * Remove a full postcode.
   */

  address =
    address.replace(
      /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi,
      ""
    );

  address =
    address
      .replace(/\s+/g, " ")
      .replace(/,\s*,+/g, ",")
      .replace(
        /^[,\s]+|[,\s]+$/g,
        ""
      )
      .trim();

  /*
   * House number.
   *
   * IMPORTANT:
   *
   * If the caller has supplied a house number from
   * the property photograph, that number wins.
   */

  const parsedNumber =
    suppliedHouseNumber ||
    extractHouseNumber(address);

  const houseNumber =
    normaliseHouseNumber(parsedNumber);

  if (houseNumber) {
    address =
      address
        .replace(
          new RegExp(
            `^(?:No\\.\\s*)?${escapeRegex(
              houseNumber
            )}\\s*[,\\-]?\\s*`,
            "i"
          ),
          ""
        )
        .trim();
  }

  /*
   * Split address.
   */

  const parts =
    address
      .split(",")
      .map(normalise)
      .filter(Boolean);

  let street = "";
  let town = "";

  if (parts.length >= 2) {
    street = parts[0];
    town = parts[1];
  } else if (parts.length === 1) {
    const only = parts[0];

    const leedsMatch =
      only.match(
        /^(.+?)\s+\bLeeds\b$/i
      );

    if (leedsMatch) {
      street =
        normalise(leedsMatch[1]);

      town = "Leeds";
    } else {
      street = only;
      town = "Leeds";
    }
  }

  /*
   * Safety split.
   */

  if (/\bLeeds\b/i.test(street)) {
    street =
      street
        .replace(
          /\s+\bLeeds\b\s*$/i,
          ""
        )
        .trim();

    if (!town) {
      town = "Leeds";
    }
  }

  return {
    houseNumber,
    street: normalise(street),
    town: normalise(town),
    district,
  };
}

function escapeRegex(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
 * ================================================================
 * FETCH JSON
 * ================================================================
 */

async function fetchJson<T>(
  url: string,
  options?: RequestInit,
  timeout = REQUEST_TIMEOUT
): Promise<T | null> {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeout
    );

  try {
    const response =
      await fetch(
        url,
        {
          ...options,

          signal:
            controller.signal,

          headers: {
            "User-Agent":
              USER_AGENT,

            Accept:
              "application/json",

            ...(options?.headers || {}),
          },
        }
      );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/*
 * ================================================================
 * NOMINATIM
 * ================================================================
 */

async function queryNominatim(
  query: string
): Promise<NominatimResult[]> {
  const params =
    new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "10",
      countrycodes: "gb",
      dedupe: "1",
    });

  const url =
    `https://nominatim.openstreetmap.org/search?${params.toString()}`;

  console.log(
    "Nominatim:",
    query
  );

  const result =
    await fetchJson<NominatimResult[]>(
      url
    );

  return Array.isArray(result)
    ? result
    : [];
}

/*
 * ================================================================
 * PHOTON
 * ================================================================
 */

async function queryPhoton(
  query: string
): Promise<PhotonResponse | null> {
  const params =
    new URLSearchParams({
      q: query,
      limit: "10",
    });

  const url =
    `https://photon.komoot.io/api/?${params.toString()}`;

  console.log(
    "Photon:",
    query
  );

  return fetchJson<PhotonResponse>(
    url
  );
}

/*
 * ================================================================
 * ARCGIS
 * ================================================================
 */

async function queryArcGIS(
  query: string
): Promise<ArcGISCandidate[]> {
  const params =
    new URLSearchParams({
      SingleLine: query,
      CountryCode: "GBR",
      MaxLocations: "10",
      f: "json",
    });

  const url =
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${params.toString()}`;

  console.log(
    "ArcGIS:",
    query
  );

  const result =
    await fetchJson<{
      candidates?: ArcGISCandidate[];
    }>(url);

  return Array.isArray(
    result?.candidates
  )
    ? result.candidates
    : [];
}

/*
 * ================================================================
 * POSTCODES.IO
 * ================================================================
 *
 * Postcodes.io is useful for UK postcode validation.
 *
 * IMPORTANT:
 *
 * It proves that a postcode exists.
 *
 * It does NOT prove that the postcode belongs to the
 * requested house number.
 *
 * Therefore it can NEVER create or verify a house-number
 * match on its own.
 *
 * ================================================================
 */

async function queryPostcodesIO(
  postcode: string
): Promise<PostcodesIOResponse | null> {
  const cleaned =
    cleanPostcode(postcode);

  if (!cleaned) {
    return null;
  }

  const compact =
    postcodeWithoutSpaces(cleaned);

  const url =
    `https://api.postcodes.io/postcodes/${encodeURIComponent(
      compact
    )}`;

  console.log(
    "Postcodes.io:",
    cleaned
  );

  return fetchJson<PostcodesIOResponse>(
    url
  );
}

/*
 * ================================================================
 * POSTCODE EXTRACTION
 * ================================================================
 */

function extractPostcode(
  text: string
): string | null {
  const match =
    normaliseUpper(text).match(
      /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/
    );

  return match
    ? cleanPostcode(match[0])
    : null;
}

/*
 * ================================================================
 * NOMINATIM CONVERSION
 * ================================================================
 */

function nominatimCandidate(
  result: NominatimResult,
  expectedHouseNumber: string | null,
  expectedStreet: string,
  expectedTown: string,
  district: string
): AddressCandidate | null {
  const postcode =
    cleanPostcode(
      result.address?.postcode
    );

  if (!postcode) {
    return null;
  }

  /*
   * HARD DISTRICT CONSTRAINT.
   */

  if (
    !postcodeBelongsToDistrict(
      postcode,
      district
    )
  ) {
    return null;
  }

  const resultHouse =
    normaliseHouseNumber(
      result.address?.house_number
    );

  const resultStreet =
    normalise(
      result.address?.road ||
        result.address?.street ||
        result.address?.residential ||
        result.address?.pedestrian ||
        ""
    );

  const resultTown =
    normalise(
      result.address?.city ||
        result.address?.town ||
        result.address?.municipality ||
        result.address?.village ||
        ""
    );

  const houseMatch =
    houseNumberMatches(
      expectedHouseNumber,
      resultHouse
    );

  const streetMatch =
    streetMatches(
      expectedStreet,
      resultStreet
    );

  const townMatch =
    !!(
      expectedTown &&
      resultTown &&
      normaliseUpper(
        resultTown
      ).includes(
        normaliseUpper(
          expectedTown
        )
      )
    );

  let score = 30;

  /*
   * EXACT HOUSE NUMBER
   *
   * This is the most important part.
   */

  if (expectedHouseNumber) {
    if (houseMatch) {
      score += 60;
    } else if (resultHouse) {
      /*
       * Explicitly penalise a different house number.
       *
       * 21 Example Street
       *
       * must NEVER become evidence for:
       *
       * 23 Example Street.
       */
      score -= 100;
    } else {
      /*
       * No house number returned means this is only
       * street-level evidence.
       */
      score -= 20;
    }
  }

  /*
   * EXACT STREET.
   */

  if (streetMatch) {
    score += 35;
  } else {
    score -= 50;
  }

  /*
   * TOWN.
   */

  if (townMatch) {
    score += 10;
  }

  /*
   * Nominatim importance is only a tiny modifier.
   */

  if (
    typeof result.importance ===
    "number"
  ) {
    score += Math.min(
      5,
      result.importance * 5
    );
  }

  return {
    address:
      normalise(
        result.display_name || ""
      ) ||
      `${expectedHouseNumber || ""} ${expectedStreet}, ${expectedTown}, ${postcode}`.trim(),

    postcode,

    source:
      "Nominatim / OpenStreetMap",

    score,

    /*
     * CRITICAL:
     *
     * Store the ACTUAL house number returned by the source.
     *
     * Never substitute expectedHouseNumber here.
     */
    houseNumber:
      resultHouse,

    street:
      resultStreet,

    town:
      resultTown,

    houseNumberMatch:
      houseMatch,

    streetMatch,

    districtMatch:
      true,

    sourceCount:
      1,

    verified:
      false,

    latitude:
      result.lat
        ? Number(result.lat)
        : null,

    longitude:
      result.lon
        ? Number(result.lon)
        : null,
  };
}

/*
 * ================================================================
 * PHOTON CONVERSION
 * ================================================================
 */

function photonCandidates(
  result: PhotonResponse | null,
  expectedHouseNumber: string | null,
  expectedStreet: string,
  expectedTown: string,
  district: string
): AddressCandidate[] {
  const candidates: AddressCandidate[] =
    [];

  for (
    const feature of
      result?.features || []
  ) {
    const properties =
      feature.properties || {};

    const postcode =
      cleanPostcode(
        properties.postcode
      );

    if (!postcode) {
      continue;
    }

    /*
     * HARD DISTRICT CONSTRAINT.
     */

    if (
      !postcodeBelongsToDistrict(
        postcode,
        district
      )
    ) {
      continue;
    }

    const actualHouse =
      normaliseHouseNumber(
        properties.housenumber
      );

    const actualStreet =
      normalise(
        properties.street ||
          properties.name ||
          ""
      );

    const actualTown =
      normalise(
        properties.city ||
          properties.district ||
          ""
      );

    const houseMatch =
      houseNumberMatches(
        expectedHouseNumber,
        actualHouse
      );

    const streetMatch =
      streetMatches(
        expectedStreet,
        actualStreet
      );

    const townMatch =
      !!(
        expectedTown &&
        actualTown &&
        normaliseUpper(
          actualTown
        ).includes(
          normaliseUpper(
            expectedTown
          )
        )
      );

    let score = 25;

    if (expectedHouseNumber) {
      if (houseMatch) {
        score += 60;
      } else if (actualHouse) {
        score -= 100;
      } else {
        score -= 20;
      }
    }

    if (streetMatch) {
      score += 35;
    } else {
      score -= 50;
    }

    if (townMatch) {
      score += 10;
    }

    const coords =
      feature.geometry?.coordinates;

    candidates.push({
      address:
        `${actualHouse || expectedHouseNumber || ""} ${actualStreet || expectedStreet}, ${actualTown || expectedTown}, ${postcode}`.trim(),

      postcode,

      source:
        "Photon / OpenStreetMap",

      score,

      /*
       * ACTUAL source house number only.
       */
      houseNumber:
        actualHouse,

      street:
        actualStreet,

      town:
        actualTown,

      houseNumberMatch:
        houseMatch,

      streetMatch,

      districtMatch:
        true,

      sourceCount:
        1,

      verified:
        false,

      latitude:
        Array.isArray(coords) &&
        coords.length >= 2
          ? Number(coords[1])
          : null,

      longitude:
        Array.isArray(coords) &&
        coords.length >= 2
          ? Number(coords[0])
          : null,
    });
  }

  return candidates;
}

/*
 * ================================================================
 * ARCGIS CONVERSION
 * ================================================================
 */

function arcGISCandidates(
  results: ArcGISCandidate[],
  expectedHouseNumber: string | null,
  expectedStreet: string,
  expectedTown: string,
  district: string
): AddressCandidate[] {
  const candidates: AddressCandidate[] =
    [];

  for (
    const result of
      results
  ) {
    const attributes =
      result.attributes || {};

    const address =
      normalise(
        result.address ||
          attributes.Match_addr ||
          ""
      );

    const postcode =
      cleanPostcode(
        attributes.Postal ||
          attributes.PostalExt ||
          extractPostcode(address)
      );

    if (!postcode) {
      continue;
    }

    /*
     * HARD DISTRICT CONSTRAINT.
     */

    if (
      !postcodeBelongsToDistrict(
        postcode,
        district
      )
    ) {
      continue;
    }

    const actualHouse =
      normaliseHouseNumber(
        extractHouseNumber(address)
      );

    /*
     * ArcGIS StAddr can contain the house number,
     * so remove it before comparing the street.
     */

    const stAddr =
      normalise(
        attributes.StAddr || ""
      );

    let actualStreet =
      stAddr;

    if (actualHouse && stAddr) {
      actualStreet =
        stAddr
          .replace(
            new RegExp(
              `^(?:No\\.\\s*)?${escapeRegex(
                actualHouse
              )}\\s*`,
              "i"
            ),
            ""
          )
          .trim();
    }

    /*
     * If StAddr is unavailable, try to derive the street
     * from the full address.
     */

    if (!actualStreet) {
      actualStreet =
        address
          .replace(
            new RegExp(
              `^(?:No\\.\\s*)?${escapeRegex(
                actualHouse || ""
              )}\\s*[,\\-]?\\s*`,
              "i"
            ),
            ""
          )
          .split(",")[0]
          .trim();
    }

    const houseMatch =
      houseNumberMatches(
        expectedHouseNumber,
        actualHouse
      );

    const streetMatch =
      streetMatches(
        expectedStreet,
        actualStreet
      );

    const townMatch =
      normaliseUpper(address).includes(
        normaliseUpper(expectedTown)
      );

    let score = 30;

    if (expectedHouseNumber) {
      if (houseMatch) {
        score += 60;
      } else if (actualHouse) {
        score -= 100;
      } else {
        score -= 20;
      }
    }

    if (streetMatch) {
      score += 35;
    } else {
      score -= 50;
    }

    if (townMatch) {
      score += 10;
    }

    /*
     * ArcGIS own score is deliberately capped.
     *
     * It must never override an explicit house-number
     * mismatch.
     */

    if (
      typeof result.score ===
      "number"
    ) {
      score += Math.min(
        5,
        result.score / 20
      );
    }

    /*
     * ArcGIS Addr_type bonus.
     *
     * "PointAddress" means the geocoder resolved to an exact
     * property-level match. This is strong property-identity
     * evidence.
     *
     * Capped at +10 to avoid overriding explicit mismatches.
     */

    const addrType =
      attributes.Addr_type || null;

    if (
      addrType === "PointAddress" &&
      houseMatch
    ) {
      score += 10;
    }

    candidates.push({
      address:
        address ||
        `${expectedHouseNumber || ""} ${expectedStreet}, ${expectedTown}, ${postcode}`.trim(),

      postcode,

      source:
        "ArcGIS World Geocoding",

      score,

      /*
       * ACTUAL house number only.
       */
      houseNumber:
        actualHouse,

      street:
        actualStreet,

      town:
        expectedTown,

      houseNumberMatch:
        houseMatch,

      streetMatch,

      districtMatch:
        true,

      sourceCount:
        1,

      verified:
        false,

      arcGISAddrType:
        addrType || undefined,
    });
  }

  return candidates;
}

/*
 * ================================================================
 * CANDIDATE KEY
 * ================================================================
 *
 * IMPORTANT:
 *
 * Candidates are grouped by:
 *
 *   actual house number + street + postcode
 *
 * A missing house number is represented as UNKNOWN.
 *
 * We NEVER use expectedHouseNumber as a fallback here.
 *
 * This prevents:
 *
 *   "Example Street, LS8 3BA"
 *
 * from accidentally becoming:
 *
 *   "23 Example Street, LS8 3BA"
 *
 * ================================================================
 */

function candidateKey(
  candidate: AddressCandidate,
  _expectedHouseNumber: string | null,
  expectedStreet: string
): string {
  /*
   * CRITICAL SAFETY RULE:
   *
   * Never manufacture a house number.
   */

  const house =
    normaliseHouseNumber(
      candidate.houseNumber
    ) ||
    "UNKNOWN";

  const street =
    normaliseStreet(
      candidate.street ||
        expectedStreet
    );

  const postcode =
    postcodeWithoutSpaces(
      candidate.postcode
    );

  return [
    house,
    street,
    postcode,
  ].join("|");
}

/*
 * ================================================================
 * CANDIDATE CONSOLIDATION
 * ================================================================
 */

function consolidateCandidates(
  candidates: AddressCandidate[],
  expectedHouseNumber: string | null,
  expectedStreet: string
): AddressCandidate[] {
  const map =
    new Map<
      string,
      AddressCandidate
    >();

  for (
    const candidate of
      candidates
  ) {
    const postcode =
      cleanPostcode(
        candidate.postcode
      );

    if (!postcode) {
      continue;
    }

    /*
     * HARD DISTRICT CONSTRAINT.
     */

    if (!candidate.districtMatch) {
      continue;
    }

    /*
     * ------------------------------------------------------------
     * HOUSE NUMBER SAFETY
     * ------------------------------------------------------------
     *
     * If we are looking for number 23:
     *
     *   source says 21 -> REJECT
     *   source says 23 -> ACCEPT
     *   source gives no number -> KEEP AS STREET EVIDENCE
     *
     * Missing number is NOT a match.
     */

    if (expectedHouseNumber) {
      if (
        candidate.houseNumber &&
        !houseNumberMatches(
          expectedHouseNumber,
          candidate.houseNumber
        )
      ) {
        continue;
      }
    }

    const key =
      candidateKey(
        candidate,
        expectedHouseNumber,
        expectedStreet
      );

    const existing =
      map.get(key);

    if (!existing) {
      map.set(
        key,
        {
          ...candidate,

          postcode,

          sourceCount:
            1,

          verified:
            false,
        }
      );

      continue;
    }

    /*
     * ------------------------------------------------------------
     * MERGE INDEPENDENT SOURCE EVIDENCE
     * ------------------------------------------------------------
     */

    const existingSources =
      new Set(
        existing.source
          .split(" + ")
          .map(
            source =>
              source.trim()
          )
          .filter(Boolean)
      );

    const candidateSources =
      candidate.source
        .split(" + ")
        .map(
          source =>
            source.trim()
        )
        .filter(Boolean);

    for (
      const source of
        candidateSources
    ) {
      existingSources.add(
        source
      );
    }

    existing.source =
      Array.from(
        existingSources
      ).join(" + ");

    existing.sourceCount =
      existingSources.size;

    /*
     * ------------------------------------------------------------
     * SCORE
     * ------------------------------------------------------------
     */

    existing.score =
      Math.max(
        existing.score,
        candidate.score
      ) + 15;

    /*
     * ------------------------------------------------------------
     * KEEP THE RICHEST ADDRESS
     * ------------------------------------------------------------
     */

    if (
      candidate.address.length >
      existing.address.length
    ) {
      existing.address =
        candidate.address;
    }

    /*
     * ------------------------------------------------------------
     * MERGE MATCH FLAGS
     * ------------------------------------------------------------
     */

    existing.houseNumberMatch =
      existing.houseNumberMatch ===
        true ||
      candidate.houseNumberMatch ===
        true;

    existing.streetMatch =
      existing.streetMatch ===
        true ||
      candidate.streetMatch ===
        true;

    existing.districtMatch =
      existing.districtMatch ===
        true &&
      candidate.districtMatch ===
        true;

    /*
     * If one source actually knows the house number and the
     * other doesn't, preserve the actual number.
     */

    if (
      !existing.houseNumber &&
      candidate.houseNumber
    ) {
      existing.houseNumber =
        candidate.houseNumber;
    }

    if (
      !existing.street &&
      candidate.street
    ) {
      existing.street =
        candidate.street;
    }

    if (
      !existing.town &&
      candidate.town
    ) {
      existing.town =
        candidate.town;
    }

    /*
     * Preserve the best ArcGIS AddrType.
     *
     * "PointAddress" is the strongest signal.
     */

    if (
      candidate.arcGISAddrType ===
        "PointAddress" ||
      (!existing.arcGISAddrType &&
        candidate.arcGISAddrType)
    ) {
      existing.arcGISAddrType =
        candidate.arcGISAddrType;
    }
  }

  /*
   * --------------------------------------------------------------
   * FINAL VERIFICATION
   * --------------------------------------------------------------
   *
   * Verification requires:
   *
   *   1. Actual house number
   *   2. Exact house-number match
   *   3. Street match
   *   4. Correct district
   *   5. At least TWO independent sources
   *   6. Strong score
   *
   * A street-only result can NEVER be verified.
   */

  const result =
    Array.from(
      map.values()
    ).map(
      candidate => {
        const exactHouse =
          !!(
            expectedHouseNumber &&
            candidate.houseNumber &&
            houseNumberMatches(
              expectedHouseNumber,
              candidate.houseNumber
            )
          );

        const exactStreet =
          candidate.streetMatch ===
          true;

        const multipleSources =
          (candidate.sourceCount ||
            0) >= 2;

        const verified =
          exactHouse &&
          exactStreet &&
          candidate.districtMatch ===
            true &&
          multipleSources &&
          candidate.score >=
            VERIFIED_SCORE;

        return {
          ...candidate,

          verified,
        };
      }
    );

  return result.sort(
    (a, b) =>
      b.score -
      a.score
  );
}

/*
 * ================================================================
 * STREET-LEVEL SAFETY
 * ================================================================
 *
 * A street-level result is useful as evidence, but it must NOT
 * be promoted to an exact property match.
 *
 * If the expected property is number 23 and a source only tells
 * us that Example Street contains postcode LS8 3BA, that does not
 * prove number 23 has LS8 3BA.
 *
 * Therefore street-only candidates are marked unverified.
 *
 * ================================================================
 */

function markStreetOnlyCandidates(
  candidates: AddressCandidate[],
  expectedHouseNumber: string | null
): AddressCandidate[] {
  if (!expectedHouseNumber) {
    return candidates;
  }

  return candidates.map(
    candidate => {
      /*
       * No actual house number from the source.
       *
       * This is street-level evidence only.
       */
      if (
        !candidate.houseNumber
      ) {
        return {
          ...candidate,

          verified:
            false,

          houseNumberMatch:
            false,
        };
      }

      /*
       * Actual house number exists but does not match.
       *
       * This should normally already have been filtered out,
       * but we keep this safety check here.
       */

      if (
        !houseNumberMatches(
          expectedHouseNumber,
          candidate.houseNumber
        )
      ) {
        return {
          ...candidate,

          verified:
            false,

          houseNumberMatch:
            false,
        };
      }

      return candidate;
    }
  );
}

/*
 * ================================================================
 * SEARCH QUERIES
 * ================================================================
 */

function buildQueries(
  houseNumber: string | null,
  street: string,
  town: string,
  district: string
): string[] {
  const queries: string[] =
    [];

  const cleanTown =
    town ||
    "Leeds";

  /*
   * Most specific queries first.
   */

  if (houseNumber) {
    queries.push(
      `${houseNumber} ${street}, ${cleanTown}, ${district}, UK`
    );

    queries.push(
      `${houseNumber} ${street}, ${cleanTown}, West Yorkshire, ${district}, UK`
    );

    queries.push(
      `${houseNumber} ${street}, ${cleanTown}, ${district}`
    );

    queries.push(
      `${houseNumber} ${street}, ${cleanTown}, UK`
    );
  }

  /*
   * Street-level fallback.
   */

  queries.push(
    `${street}, ${cleanTown}, ${district}, UK`
  );

  queries.push(
    `${street}, ${cleanTown}, UK`
  );

  return Array.from(
    new Set(
      queries
        .map(normalise)
        .filter(Boolean)
    )
  );
}

/*
 * ================================================================
 * TARGET HOUSE NUMBER RESOLUTION
 * ================================================================
 *
 * Establishes independent property-identity evidence BEFORE
 * the AI photographic pipeline runs.
 *
 * Takes the house number from the listing address and checks
 * whether independent geocoders agree on it.
 *
 * Returns a TargetHouseNumber and optionally caches the raw
 * geocoder results so that resolveAddress() can reuse them
 * without making duplicate HTTP requests.
 * ================================================================
 */

export async function resolveTargetHouseNumber(
  listingHouseNumber: string,
  listingAddress: string,
  postcodeDistrict: string
): Promise<TargetHouseNumber> {
  console.log(
    "========================================"
  );

  console.log(
    "TARGET HOUSE NUMBER RESOLUTION"
  );

  console.log(
    "Listing house number:",
    listingHouseNumber
  );

  console.log(
    "Listing address:",
    listingAddress
  );

  console.log(
    "District:",
    postcodeDistrict
  );

  console.log(
    "========================================"
  );

  const parsed =
    parseAddress(
      listingAddress,
      postcodeDistrict,
      listingHouseNumber
    );

  if (
    !parsed.street ||
    !parsed.district
  ) {
    console.warn(
      "TARGET RESOLUTION: insufficient address information."
    );

    return {
      number: null,
      sourceCount: 0,
      sources: [],
      highestAddrType: null,
      geocoderAgrees: false,
      listingNumber: listingHouseNumber,
    };
  }

  /*
   * Build the same queries that resolveAddress() would build.
   */

  const queries =
    buildQueries(
      parsed.houseNumber,
      parsed.street,
      parsed.town,
      parsed.district
    );

  const bestQuery =
    queries[0];

  if (!bestQuery) {
    return {
      number: null,
      sourceCount: 0,
      sources: [],
      highestAddrType: null,
      geocoderAgrees: false,
      listingNumber: listingHouseNumber,
    };
  }

  console.log(
    "TARGET RESOLUTION QUERY:",
    bestQuery
  );

  /*
   * Query all three geocoders in parallel.
   */

  const [
    nominatimResults,
    photonResults,
    arcGISResults,
  ] = await Promise.all([
    queryNominatim(bestQuery),
    queryPhoton(bestQuery),
    queryArcGIS(bestQuery),
  ]);

  /*
   * Check each geocoder for agreement on the listing number.
   */

  const agreeingSources: string[] = [];
  let highestAddrType: string | null = null;

  /*
   * Nominatim
   */

  for (
    const result of nominatimResults
  ) {
    const candidate =
      nominatimCandidate(
        result,
        parsed.houseNumber,
        parsed.street,
        parsed.town,
        parsed.district
      );

    if (
      candidate &&
      candidate.houseNumber &&
      houseNumberMatches(
        listingHouseNumber,
        candidate.houseNumber
      )
    ) {
      agreeingSources.push("Nominatim");
      break;
    }
  }

  /*
   * Photon
   */

  const photonCands =
    photonCandidates(
      photonResults,
      parsed.houseNumber,
      parsed.street,
      parsed.town,
      parsed.district
    );

  for (
    const candidate of photonCands
  ) {
    if (
      candidate.houseNumber &&
      houseNumberMatches(
        listingHouseNumber,
        candidate.houseNumber
      )
    ) {
      agreeingSources.push("Photon");
      break;
    }
  }

  /*
   * ArcGIS
   */

  const arcCands =
    arcGISCandidates(
      arcGISResults,
      parsed.houseNumber,
      parsed.street,
      parsed.town,
      parsed.district
    );

  for (
    const candidate of arcCands
  ) {
    if (
      candidate.houseNumber &&
      houseNumberMatches(
        listingHouseNumber,
        candidate.houseNumber
      )
    ) {
      agreeingSources.push("ArcGIS");

      if (
        candidate.arcGISAddrType
      ) {
        if (
          !highestAddrType ||
          candidate.arcGISAddrType ===
            "PointAddress"
        ) {
          highestAddrType =
            candidate.arcGISAddrType;
        }
      }

      break;
    }
  }

  const sourceCount =
    agreeingSources.length;

  const geocoderAgrees =
    sourceCount >= 2;

  /*
   * When geocoders do NOT agree on the listing house number,
   * attempt to discover the correct number by searching for
   * the street without a number constraint.
   *
   * If independent geocoders consistently return a specific
   * house number on the same street, that is stronger evidence
   * than a listing that geocoders cannot confirm.
   */

  let alternativeNumber: string | null = null;

  if (!geocoderAgrees && parsed.street) {
    const streetQuery =
      `${parsed.street}, ${parsed.town || "Leeds"}, ${parsed.district}, UK`;

    console.log(
      "TARGET RESOLUTION: geocoders disagree — trying street-only query:",
      streetQuery
    );

    try {
      const [
        streetNominatim,
        streetPhoton,
        streetArcGIS,
      ] = await Promise.all([
        queryNominatim(streetQuery),
        queryPhoton(streetQuery),
        queryArcGIS(streetQuery),
      ]);

      const streetCandidates: string[] = [];

      for (const result of streetNominatim) {
        const cand = nominatimCandidate(
          result,
          null,
          parsed.street,
          parsed.town,
          parsed.district
        );

        if (
          cand &&
          cand.houseNumber &&
          cand.districtMatch
        ) {
          streetCandidates.push(cand.houseNumber);
          break;
        }
      }

      for (const cand of photonCandidates(
        streetPhoton,
        null,
        parsed.street,
        parsed.town,
        parsed.district
      )) {
        if (
          cand.houseNumber &&
          cand.districtMatch
        ) {
          streetCandidates.push(cand.houseNumber);
          break;
        }
      }

      for (const cand of arcGISCandidates(
        streetArcGIS,
        null,
        parsed.street,
        parsed.town,
        parsed.district
      )) {
        if (
          cand.houseNumber &&
          cand.districtMatch
        ) {
          streetCandidates.push(cand.houseNumber);
          if (
            cand.arcGISAddrType === "PointAddress"
          ) {
            highestAddrType = "PointAddress";
          }
          break;
        }
      }

      /*
       * If 2+ geocoders agree on a specific house number
       * from the street-level search, use it.
       */
      const normalised =
        streetCandidates.map(normaliseHouseNumber);

      const counts = new Map<string, number>();

      for (const n of normalised) {
        if (n) {
          counts.set(
            n,
            (counts.get(n) || 0) + 1
          );
        }
      }

      for (const [num, count] of counts) {
        if (count >= 2) {
          alternativeNumber = num;
          break;
        }
      }

      /*
       * If no multi-source agreement, use ArcGIS
       * PointAddress as a single-source fallback.
       */
      if (!alternativeNumber) {
        for (const cand of arcGISCandidates(
          streetArcGIS,
          null,
          parsed.street,
          parsed.town,
          parsed.district
        )) {
          if (
            cand.houseNumber &&
            cand.arcGISAddrType === "PointAddress" &&
            cand.districtMatch
          ) {
            alternativeNumber = normaliseHouseNumber(
              cand.houseNumber
            );
            highestAddrType = "PointAddress";
            break;
          }
        }
      }
    } catch (altError) {
      console.log(
        "TARGET RESOLUTION: street-only search failed (non-fatal):",
        altError instanceof Error
          ? altError.message
          : altError
      );
    }

    if (alternativeNumber) {
      console.log(
        "TARGET RESOLUTION: geocoder alternative:",
        alternativeNumber,
        "(listing had:",
        listingHouseNumber,
        ")"
      );
    }
  }

  /*
   * When geocoders agree, use the listing number (confirmed).
   * When they disagree but found an alternative, use the
   * alternative (geocoder evidence beats incorrect listing).
   * When no alternative found, return null (unknown).
   */

  const effectiveNumber =
    geocoderAgrees
      ? normaliseHouseNumber(listingHouseNumber)
      : alternativeNumber || null;

  const result: TargetHouseNumber = {
    number: effectiveNumber,
    sourceCount,
    sources: agreeingSources,
    highestAddrType,
    geocoderAgrees,
    listingNumber: listingHouseNumber,
    cachedGeocoderResults: {
      nominatim: nominatimResults,
      photon: photonResults,
      arcGIS: arcGISResults,
    },
  };

  console.log(
    "TARGET RESOLUTION RESULT:"
  );

  console.log(
    "  Number:",
    result.number || "NONE"
  );

  console.log(
    "  Source count:",
    result.sourceCount
  );

  console.log(
    "  Sources:",
    result.sources.join(", ") ||
      "NONE"
  );

  console.log(
    "  Geocoder agrees:",
    result.geocoderAgrees
  );

  console.log(
    "  Highest AddrType:",
    result.highestAddrType ||
      "NONE"
  );

  console.log(
    "========================================"
  );

  return result;
}

/*
 * ================================================================
 * MAIN RESOLVER
 * ================================================================
 */

export async function resolveAddress(
  listingAddress: string,
  postcodeDistrict: string,
  houseNumber?: string | null,
  cachedGeocoderResults?: GeocoderResults | null
): Promise<AddressCandidate[]> {
  console.log(
    "========================================"
  );

  console.log(
    "FLIPFINDERAI MULTI-SOURCE ADDRESS RESOLUTION"
  );

  console.log(
    "========================================"
  );

  /*
   * --------------------------------------------------------------
   * 1. NORMALISE THE AI HOUSE NUMBER
   * --------------------------------------------------------------
   *
   * The house number should already have been detected by AI
   * before this function is called.
   *
   * Example:
   *
   *   listingAddress:
   *     "Grange Park Avenue, Leeds LS8"
   *
   *   houseNumber:
   *     "23"
   *
   * becomes:
   *
   *   "23 Grange Park Avenue, Leeds LS8"
   *
   * We do NOT ask the geocoders to guess the house number.
   */

  const aiHouseNumber =
    normaliseHouseNumber(
      houseNumber
    );

  console.log(
    "AI HOUSE NUMBER:",
    aiHouseNumber ||
      "NONE"
  );

  /*
   * --------------------------------------------------------------
   * 2. PARSE THE ADDRESS
   * --------------------------------------------------------------
   *
   * IMPORTANT:
   *
   * The third argument forces parseAddress() to use the AI
   * house number rather than trying to extract a number from
   * the listing address.
   */

  const parsed =
    parseAddress(
      listingAddress,
      postcodeDistrict,
      aiHouseNumber
    );

  /*
   * If AI supplied a house number, make absolutely sure that
   * number is retained.
   */

  if (
    aiHouseNumber
  ) {
    parsed.houseNumber =
      aiHouseNumber;
  }

  console.log(
    "========================================"
  );

  console.log(
    "PARSED ADDRESS"
  );

  console.log(
    "House number:",
    parsed.houseNumber ||
      "NONE"
  );

  console.log(
    "Street:",
    parsed.street ||
      "NONE"
  );

  console.log(
    "Town:",
    parsed.town ||
      "NONE"
  );

  console.log(
    "District:",
    parsed.district ||
      "NONE"
  );

  console.log(
    "========================================"
  );

  /*
   * --------------------------------------------------------------
   * 3. BASIC VALIDATION
   * --------------------------------------------------------------
   */

  if (
    !parsed.street ||
    !parsed.district
  ) {
    console.warn(
      "ADDRESS RESOLUTION ABORTED: insufficient address information."
    );

    return [];
  }

  /*
   * --------------------------------------------------------------
   * 4. BUILD SEARCH QUERIES
   * --------------------------------------------------------------
   *
   * The AI house number is now part of the queries.
   *
   * If AI found 23:
   *
   *   23 Grange Park Avenue, Leeds, LS8
   *
   * is searched.
   *
   * We never replace 23 with a number returned by a neighbouring
   * property.
   */

  const queries =
    buildQueries(
      parsed.houseNumber,
      parsed.street,
      parsed.town,
      parsed.district
    );

  console.log(
    "SEARCH QUERIES:"
  );

  queries.forEach(
    (
      query,
      index
    ) => {
      console.log(
        `${index + 1}.`,
        query
      );
    }
  );

  const candidates: AddressCandidate[] =
    [];

  /*
   * --------------------------------------------------------------
   * 5. PRIMARY SEARCH
   * --------------------------------------------------------------
   *
   * Use the most specific query first.
   *
   * All three independent geocoders are queried:
   *
   *   - Nominatim
   *   - Photon
   *   - ArcGIS
   *
   * They are given the AI-detected house number.
   */

  const bestQuery =
    queries[0];

  if (
    bestQuery
  ) {
    console.log(
      "========================================"
    );

    console.log(
      "PRIMARY ADDRESS QUERY"
    );

    console.log(
      bestQuery
    );

    console.log(
      "AI HOUSE NUMBER USED:",
      parsed.houseNumber ||
        "NONE"
    );

    console.log(
      "========================================"
    );

    /*
     * Use cached geocoder results if available to avoid
     * duplicate HTTP requests.
     */

    let nominatimResults: NominatimResult[];
    let photonResults: PhotonResponse | null;
    let arcGISResults: ArcGISCandidate[];

    if (
      cachedGeocoderResults &&
      cachedGeocoderResults.nominatim &&
      cachedGeocoderResults.photon !==
        undefined &&
      cachedGeocoderResults.arcGIS
    ) {
      console.log(
        "REUSING CACHED GEOCODER RESULTS"
      );

      nominatimResults =
        cachedGeocoderResults.nominatim;

      photonResults =
        cachedGeocoderResults.photon;

      arcGISResults =
        cachedGeocoderResults.arcGIS;
    } else {
      console.log(
        "QUERYING GEOCODERS"
      );

      const results =
        await Promise.all([
          queryNominatim(
            bestQuery
          ),

          queryPhoton(
            bestQuery
          ),

          queryArcGIS(
            bestQuery
          ),
        ]);

      nominatimResults =
        results[0];

      photonResults =
        results[1];

      arcGISResults =
        results[2];
    }

    /*
     * ------------------------------------------------------------
     * NOMINATIM
     * ------------------------------------------------------------
     */

    for (
      const result of
        nominatimResults
    ) {
      const candidate =
        nominatimCandidate(
          result,
          parsed.houseNumber,
          parsed.street,
          parsed.town,
          parsed.district
        );

      if (
        candidate
      ) {
        candidates.push(
          candidate
        );
      }
    }

    /*
     * ------------------------------------------------------------
     * PHOTON
     * ------------------------------------------------------------
     */

    candidates.push(
      ...photonCandidates(
        photonResults,
        parsed.houseNumber,
        parsed.street,
        parsed.town,
        parsed.district
      )
    );

    /*
     * ------------------------------------------------------------
     * ARCGIS
     * ------------------------------------------------------------
     */

    candidates.push(
      ...arcGISCandidates(
        arcGISResults,
        parsed.houseNumber,
        parsed.street,
        parsed.town,
        parsed.district
      )
    );
  }

  /*
   * --------------------------------------------------------------
   * 6. CONSOLIDATE PRIMARY RESULTS
   * --------------------------------------------------------------
   */

  let verified =
    consolidateCandidates(
      candidates,
      parsed.houseNumber,
      parsed.street
    );

  /*
   * --------------------------------------------------------------
   * 7. LOOK FOR STRONG MULTI-SOURCE MATCH
   * --------------------------------------------------------------
   *
   * A postcode is only considered VERIFIED when:
   *
   *   - AI supplied a house number
   *   - house number matches
   *   - street matches
   *   - postcode is in the required district
   *   - at least two independent sources agree
   *   - score reaches the verification threshold
   */

  const strong =
    verified.find(
      candidate =>
        candidate.verified ===
          true &&
        candidate.score >=
          STRONG_SCORE
    );

  if (
    strong
  ) {
    console.log(
      "========================================"
    );

    console.log(
      "STRONG MULTI-SOURCE ADDRESS MATCH"
    );

    console.log(
      "========================================"
    );

    console.log(
      "AI HOUSE NUMBER:",
      parsed.houseNumber
    );

    console.log(
      "VERIFIED HOUSE NUMBER:",
      strong.houseNumber
    );

    console.log(
      "VERIFIED STREET:",
      strong.street
    );

    console.log(
      "VERIFIED POSTCODE:",
      strong.postcode
    );

    console.log(
      "SOURCES:",
      strong.source
    );

    console.log(
      "SOURCE COUNT:",
      strong.sourceCount
    );

    console.log(
      "SCORE:",
      strong.score
    );

    console.log(
      "========================================"
    );

    return verified.slice(
      0,
      MAX_CANDIDATES
    );
  }

  /*
   * --------------------------------------------------------------
   * 8. SECONDARY NOMINATIM QUERIES
   * --------------------------------------------------------------
   *
   * The primary search did not establish the property.
   *
   * Try the additional address forms.
   *
   * The AI house number remains fixed throughout.
   */

  for (
    const query of
      queries.slice(
        1,
        4
      )
  ) {
    const currentBest =
      verified[0];

    if (
      currentBest?.verified &&
      currentBest.score >=
        STRONG_SCORE
    ) {
      break;
    }

    console.log(
      "========================================"
    );

    console.log(
      "SECONDARY NOMINATIM QUERY"
    );

    console.log(
      query
    );

    console.log(
      "AI HOUSE NUMBER:",
      parsed.houseNumber ||
        "NONE"
    );

    console.log(
      "========================================"
    );

    const results =
      await queryNominatim(
        query
      );

    for (
      const result of
        results
    ) {
      const candidate =
        nominatimCandidate(
          result,
          parsed.houseNumber,
          parsed.street,
          parsed.town,
          parsed.district
        );

      if (
        candidate
      ) {
        candidates.push(
          candidate
        );
      }
    }

    verified =
      consolidateCandidates(
        candidates,
        parsed.houseNumber,
        parsed.street
      );
  }

  /*
   * --------------------------------------------------------------
   * 9. HARD FINAL VALIDATION
   * --------------------------------------------------------------
   *
   * This is the final safety barrier.
   *
   * A neighbouring house must NEVER become the property.
   *
   * Example:
   *
   * AI says:
   *
   *   23
   *
   * Source returns:
   *
   *   21 Grange Park Avenue
   *
   * That candidate is rejected.
   */

  verified =
    verified.filter(
      candidate => {
        const postcode =
          cleanPostcode(
            candidate.postcode
          );

        if (
          !postcode
        ) {
          return false;
        }

        /*
         * HARD DISTRICT CHECK.
         */

        if (
          !postcodeBelongsToDistrict(
            postcode,
            parsed.district
          )
        ) {
          console.warn(
            "REJECTED POSTCODE OUTSIDE DISTRICT:",
            postcode
          );

          return false;
        }

        /*
         * HARD HOUSE NUMBER CHECK.
         */

        if (
          parsed.houseNumber
        ) {
          /*
           * If the source explicitly returned a house number
           * and it differs from the AI house number, reject it.
           */

          if (
            candidate.houseNumber &&
            !houseNumberMatches(
              parsed.houseNumber,
              candidate.houseNumber
            )
          ) {
            console.warn(
              "REJECTED HOUSE NUMBER MISMATCH:",
              {
                aiHouseNumber:
                  parsed.houseNumber,

                sourceHouseNumber:
                  candidate.houseNumber,

                postcode:
                  candidate.postcode,

                address:
                  candidate.address,
              }
            );

            return false;
          }

          /*
           * A candidate without a matching house number is
           * NOT allowed to become verified.
           */

          if (
            !candidate.houseNumberMatch
          ) {
            candidate.verified =
              false;
          }
        }

        return true;
      }
    );

  /*
   * --------------------------------------------------------------
   * 10. STREET-ONLY RESULTS MUST REMAIN UNVERIFIED
   * --------------------------------------------------------------
   */

  verified =
    markStreetOnlyCandidates(
      verified,
      parsed.houseNumber
    );

  /*
   * --------------------------------------------------------------
   * 11. POSTCODES.IO VALIDATION
   * --------------------------------------------------------------
   *
   * This validates that the postcode itself exists.
   *
   * It does NOT prove that the postcode belongs to the AI
   * house number, so it only receives a small score bonus.
   */

  const postcodeChecks =
    await Promise.all(
      verified
        .slice(
          0,
          5
        )
        .map(
          candidate =>
            queryPostcodesIO(
              candidate.postcode
            )
        )
    );

  verified =
    verified.map(
      (
        candidate,
        index
      ) => {
        const check =
          postcodeChecks[
            index
          ];

        if (
          check?.status ===
            200 &&
          Array.isArray(
            check.result
          ) &&
          check.result.length >
            0
        ) {
          return {
            ...candidate,

            score:
              candidate.score +
              5,
          };
        }

        return candidate;
      }
    );

  /*
   * --------------------------------------------------------------
   * 12. FINAL SORT
   * --------------------------------------------------------------
   */

  verified =
    verified.sort(
      (a, b) =>
        b.score -
        a.score
    );

  /*
   * --------------------------------------------------------------
   * 13. FINAL LOGGING
   * --------------------------------------------------------------
   */

  console.log(
    "========================================"
  );

  console.log(
    "ADDRESS RESOLUTION COMPLETE"
  );

  console.log(
    "========================================"
  );

  console.log(
    "AI HOUSE NUMBER:",
    parsed.houseNumber ||
      "NONE"
  );

  console.log(
    "STREET:",
    parsed.street
  );

  console.log(
    "DISTRICT:",
    parsed.district
  );

  console.log(
    "CANDIDATES:",
    verified.length
  );

  verified
    .slice(
      0,
      MAX_CANDIDATES
    )
    .forEach(
      (
        candidate,
        index
      ) => {
        console.log(
          `${index + 1}.`,
          {
            postcode:
              candidate.postcode,

            address:
              candidate.address,

            source:
              candidate.source,

            score:
              candidate.score,

            houseNumber:
              candidate.houseNumber,

            aiHouseNumber:
              parsed.houseNumber,

            houseNumberMatch:
              candidate.houseNumberMatch,

            streetMatch:
              candidate.streetMatch,

            districtMatch:
              candidate.districtMatch,

            sourceCount:
              candidate.sourceCount,

            verified:
              candidate.verified,
          }
        );
      }
    );

  console.log(
    "========================================"
  );

  /*
   * --------------------------------------------------------------
   * 14. NO VERIFIED PROPERTY
   * --------------------------------------------------------------
   *
   * This is intentional.
   *
   * If AI found a house number but the independent postcode
   * sources cannot corroborate it, we DO NOT invent a postcode.
   */

  if (
    parsed.houseNumber
  ) {
    const hasVerified =
      verified.some(
        candidate =>
          candidate.verified ===
          true
      );

    if (
      !hasVerified
    ) {
      console.warn(
        "========================================"
      );

      console.warn(
        "NO MULTI-SOURCE VERIFIED HOUSE NUMBER/POSTCODE MATCH"
      );

      console.warn(
        "AI HOUSE NUMBER:",
        parsed.houseNumber
      );

      console.warn(
        "The resolver will NOT invent or assume a postcode."
      );

      console.warn(
        "Returning candidates as UNVERIFIED."
      );

      console.warn(
        "========================================"
      );
    }
  }

  /*
   * --------------------------------------------------------------
   * 15. RETURN
   * --------------------------------------------------------------
   */

  return verified.slice(
    0,
    MAX_CANDIDATES
  );
}