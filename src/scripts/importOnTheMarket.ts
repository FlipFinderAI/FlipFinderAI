
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

const BASE_URL = "https://www.onthemarket.com";

const CITIES = [
  "leeds",
  "bradford",
  "wakefield",
  "york",
  "sheffield",
  "manchester",
  "liverpool",
  "nottingham",
  "birmingham",
  "slough",
];

const MAX_PAGES_PER_CITY = 5;

/*
============================================================
SETTINGS
============================================================
*/

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

const NOMINATIM_USER_AGENT =
  "FlipFinderAI/1.0 (property postcode verification)";

const NOMINATIM_EMAIL =
  "marcus@leelad.co.uk";

const NOMINATIM_DELAY_MS = 1100;

const CACHE_FILE = path.join(
  process.cwd(),
  "postcode-cache.json"
);

/*
============================================================
TYPES
============================================================
*/

type OTMProperty = {
  id?: number | string;
  address?: string;

  price?: string | number;
  shortPrice?: string;
  ["short-price"]?: string;

  bedrooms?: number;
  bathrooms?: number;

  ["property-title"]?: string;
  propertyTitle?: string;

  ["humanised-property-type"]?: string;
  humanisedPropertyType?: string;

  ["details-url"]?: string;
  detailsUrl?: string;

  images?: Array<{
    default?: string;
    webp?: string;
  }>;

  ["cover-image"]?: {
    default?: string;
    webp?: string;
  };

  agent?: {
    name?: string;
  };

  features?: string[];
};

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  residential?: string;

  postcode?: string;

  city?: string;
  town?: string;
  village?: string;
  municipality?: string;

  suburb?: string;
  neighbourhood?: string;
  district?: string;

  county?: string;

  country?: string;
  country_code?: string;

  [key: string]: string | undefined;
};

type NominatimResult = {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;

  lat?: string;
  lon?: string;

  display_name?: string;

  address?: NominatimAddress;

  type?: string;
  category?: string;

  importance?: number;
};

type CachedPostcodeResult = {
  postcode: string | null;
  district: string | null;
  verified: boolean;
  source: "Nominatim";
  checkedAt: string;
  matchedAddress?: string;
};

type PostcodeCache =
  Record<string, CachedPostcodeResult>;

/*
============================================================
CACHE
============================================================
*/

function loadPostcodeCache(): PostcodeCache {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return {};
    }

    const contents =
      fs.readFileSync(
        CACHE_FILE,
        "utf8"
      );

    return JSON.parse(
      contents
    ) as PostcodeCache;
  } catch (error) {
    console.error(
      "Could not load postcode cache:",
      error
    );

    return {};
  }
}

function savePostcodeCache(
  cache: PostcodeCache
): void {
  try {
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify(
        cache,
        null,
        2
      ),
      "utf8"
    );
  } catch (error) {
    console.error(
      "Could not save postcode cache:",
      error
    );
  }
}

const postcodeCache =
  loadPostcodeCache();

/*
============================================================
DELAY
============================================================
*/

function sleep(
  milliseconds: number
): Promise<void> {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}

let lastNominatimRequest = 0;

async function respectNominatimRateLimit(): Promise<void> {
  const now = Date.now();

  const elapsed =
    now -
    lastNominatimRequest;

  if (
    elapsed <
    NOMINATIM_DELAY_MS
  ) {
    await sleep(
      NOMINATIM_DELAY_MS -
        elapsed
    );
  }

  lastNominatimRequest =
    Date.now();
}

/*
============================================================
GENERAL HELPERS
============================================================
*/

function cleanUrl(
  value: string | undefined
): string | null {
  if (!value) {
    return null;
  }

  return value
    .replace(/\u0026/g, "&")
    .replace(/\u003d/g, "=")
    .replace(/\u002f/g, "/")
    .replace(/\\\//g, "/")
    .trim();
}

function parsePrice(
  value: unknown
): number {
  if (
    typeof value ===
    "number"
  ) {
    return value;
  }

  if (
    typeof value !==
    "string"
  ) {
    return 0;
  }

  const cleaned =
    value.replace(
      /[£,\s]/g,
      ""
    );

  const number =
    parseFloat(cleaned);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/*
============================================================
ADDRESS / POSTCODE HELPERS
============================================================
*/

function extractPostcodeDistrict(
  address: string
): string | null {
  if (!address) {
    return null;
  }

  const fullPostcodeMatch =
    address.match(
      /\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i
    );

  if (
    fullPostcodeMatch
  ) {
    return fullPostcodeMatch[1]
      .toUpperCase()
      .replace(
        /\s+/g,
        " "
      )
      .trim()
      .split(" ")[0];
  }

  const districtMatch =
    address.match(
      /\b([A-Z]{1,2}\d{1,2})\b/i
    );

  if (
    districtMatch
  ) {
    return districtMatch[1]
      .toUpperCase()
      .trim();
  }

  return null;
}

function extractFullPostcode(
  value: unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const match =
    value.match(
      /\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i
    );

  if (!match) {
    return null;
  }

  return match[1]
    .toUpperCase()
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function normaliseAddress(
  address: string
): string {
  return address
    .replace(
      /\u003e/g,
      ">"
    )
    .replace(
      /\u003c/g,
      "<"
    )
    .replace(
      /\u0026/g,
      "&"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function normaliseText(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(
      /&/g,
      " and "
    )
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function removePostcode(
  address: string
): string {
  return address
    .replace(
      /\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function extractHouseNumber(
  address: string
): string | null {
  if (!address) {
    return null;
  }

  const cleaned =
    removePostcode(
      address
    );

  const match =
    cleaned.match(
      /(?:^|,\s*|\bflat\s+\w+,\s*)(\d+[A-Z]?(?:-\d+)?)/i
    );

  if (!match) {
    return null;
  }

  return match[1]
    .toUpperCase();
}

function extractStreet(
  address: string
): string | null {
  if (!address) {
    return null;
  }

  let cleaned =
    removePostcode(
      address
    );

  cleaned =
    cleaned
      .replace(
        /^flat\s+[^,]+,\s*/i,
        ""
      )
      .replace(
        /^apartment\s+[^,]+,\s*/i,
        ""
      )
      .replace(
        /^unit\s+[^,]+,\s*/i,
        ""
      )
      .trim();

  cleaned =
    cleaned.replace(
      /^\d+[A-Z]?(?:-\d+)?\s+/i,
      ""
    );

  const firstPart =
    cleaned.split(",")[0];

  return firstPart
    ? firstPart.trim()
    : null;
}

function extractLocality(
  address: string
): string | null {
  if (!address) {
    return null;
  }

  const parts =
    removePostcode(
      address
    )
      .split(",")
      .map(
        (part) =>
          part.trim()
      )
      .filter(Boolean);

  if (
    parts.length < 2
  ) {
    return null;
  }

  return parts[
    parts.length - 1
  ];
}

const STREET_SYNONYMS:
  Record<string, string> = {
  road: "rd",
  rd: "road",

  street: "st",
  st: "street",

  avenue: "ave",
  ave: "avenue",

  lane: "ln",
  ln: "lane",

  close: "cl",
  cl: "close",

  drive: "dr",
  dr: "drive",

  crescent: "cres",
  cres: "crescent",

  gardens: "gdns",
  gdns: "gardens",

  terrace: "ter",
  ter: "terrace",

  place: "pl",
  pl: "place",

  grove: "gr",
  gr: "grove",

  court: "ct",
  ct: "court",

  square: "sq",
  sq: "square",

  way: "way",
};

function streetsMatch(
  sourceStreet: string | null,
  resultStreet: string | null
): boolean {
  if (
    !sourceStreet ||
    !resultStreet
  ) {
    return false;
  }

  const source =
    normaliseText(
      sourceStreet
    );

  const result =
    normaliseText(
      resultStreet
    );

  if (
    source ===
    result
  ) {
    return true;
  }

  const sourceWords =
    source.split(" ");

  const resultWords =
    result.split(" ");

  const sourceNormalised =
    sourceWords
      .map(
        (word) =>
          STREET_SYNONYMS[
            word
          ] || word
      )
      .sort()
      .join(" ");

  const resultNormalised =
    resultWords
      .map(
        (word) =>
          STREET_SYNONYMS[
            word
          ] || word
      )
      .sort()
      .join(" ");

  if (
    sourceNormalised ===
    resultNormalised
  ) {
    return true;
  }

  const sourceSet =
    new Set(
      sourceWords.filter(
        (word) =>
          word.length >= 3
      )
    );

  const resultSet =
    new Set(
      resultWords.filter(
        (word) =>
          word.length >= 3
      )
    );

  let matches = 0;

  for (
    const word of sourceSet
  ) {
    if (
      resultSet.has(word)
    ) {
      matches++;
    }
  }

  return (
    matches >=
    Math.min(
      2,
      sourceSet.size
    )
  );
}

/*
============================================================
NOMINATIM HELPERS
============================================================
*/

function getResultStreet(
  result: NominatimResult
): string | null {
  const address =
    result.address;

  if (!address) {
    return null;
  }

  return (
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.residential ||
    null
  );
}

function getResultHouseNumber(
  result: NominatimResult
): string | null {
  return (
    result.address
      ?.house_number
      ?.toUpperCase()
      .trim() ||
    null
  );
}

function getResultLocality(
  result: NominatimResult
): string | null {
  const address =
    result.address;

  if (!address) {
    return null;
  }

  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.district ||
    null
  );
}

function resultMatchesProperty(
  propertyAddress: string,
  result: NominatimResult
): boolean {
  const sourceHouse =
    extractHouseNumber(
      propertyAddress
    );

  const sourceStreet =
    extractStreet(
      propertyAddress
    );

  const resultHouse =
    getResultHouseNumber(
      result
    );

  const resultStreet =
    getResultStreet(
      result
    );

  const postcode =
    extractFullPostcode(
      result.address
        ?.postcode
    );

  if (!postcode) {
    return false;
  }

  if (
    !streetsMatch(
      sourceStreet,
      resultStreet
    )
  ) {
    return false;
  }

  if (
    sourceHouse &&
    resultHouse
  ) {
    if (
      sourceHouse !==
      resultHouse
    ) {
      return false;
    }
  } else if (
    sourceHouse &&
    !resultHouse
  ) {
    return false;
  }

  return true;
}

/*
============================================================
NOMINATIM SEARCH
============================================================
*/

async function searchNominatim(
  params: Record<
    string,
    string
  >
): Promise<
  NominatimResult[]
> {
  await respectNominatimRateLimit();

  const url =
    new URL(
      NOMINATIM_URL
    );

  for (
    const [
      key,
      value,
    ] of Object.entries(
      params
    )
  ) {
    url.searchParams.set(
      key,
      value
    );
  }

  url.searchParams.set(
    "format",
    "jsonv2"
  );

  url.searchParams.set(
    "addressdetails",
    "1"
  );

  url.searchParams.set(
    "limit",
    "5"
  );

  url.searchParams.set(
    "countrycodes",
    "gb"
  );

  if (
    NOMINATIM_EMAIL
  ) {
    url.searchParams.set(
      "email",
      NOMINATIM_EMAIL
    );
  }

  console.log(
    `Nominatim lookup: ${url.toString()}`
  );

  try {
    const response =
      await fetch(
        url.toString(),
        {
          headers: {
            "User-Agent":
              NOMINATIM_USER_AGENT,
            Accept:
              "application/json",
          },
        }
      );

    if (
      !response.ok
    ) {
      console.error(
        `Nominatim returned HTTP ${response.status}`
      );

      return [];
    }

    const data =
      (await response.json()) as unknown;

    if (
      !Array.isArray(data)
    ) {
      return [];
    }

    return data as NominatimResult[];
  } catch (error) {
    console.error(
      "Nominatim request failed:",
      error
    );

    return [];
  }
}

async function resolvePostcode(
  propertyAddress: string
): Promise<CachedPostcodeResult> {
  const cleanAddress =
    removePostcode(
      normaliseAddress(
        propertyAddress
      )
    );

  const district =
    extractPostcodeDistrict(
      propertyAddress
    );

  const sourceHouse =
    extractHouseNumber(
      cleanAddress
    );

  const sourceStreet =
    extractStreet(
      cleanAddress
    );

  const sourceLocality =
    extractLocality(
      cleanAddress
    );

  console.log("");
  console.log(
    `Independent postcode lookup: ${cleanAddress}`
  );

  const queries:
    Array<
      Record<string, string>
    > = [];

  /*
   * Query 1:
   * Full free-form address.
   */
  queries.push({
    q: `${cleanAddress}, UK`,
  });

  /*
   * Query 2:
   * House number + street + locality.
   */
  if (
    sourceHouse &&
    sourceStreet &&
    sourceLocality
  ) {
    queries.push({
      street:
        `${sourceHouse} ${sourceStreet}`,
      city:
        sourceLocality,
      country:
        "United Kingdom",
    });
  }

  /*
   * Query 3:
   * House number + street only.
   */
  if (
    sourceHouse &&
    sourceStreet
  ) {
    queries.push({
      street:
        `${sourceHouse} ${sourceStreet}`,
      country:
        "United Kingdom",
    });
  }

  for (
    const query of queries
  ) {
    const results =
      await searchNominatim(
        query
      );

    for (
      const result of results
    ) {
      const postcode =
        extractFullPostcode(
          result.address
            ?.postcode
        );

      if (!postcode) {
        continue;
      }

      if (
        !resultMatchesProperty(
          cleanAddress,
          result
        )
      ) {
        continue;
      }

      console.log(
        `✓ Independently verified full postcode: ${postcode}`
      );

      console.log(
        `  Matched address: ${
          result.display_name ||
          "unknown"
        }`
      );

      return {
        postcode,
        district:
          postcode
            .split(" ")[0]
            .toUpperCase(),
        verified: true,
        source:
          "Nominatim",
        checkedAt:
          new Date().toISOString(),
        matchedAddress:
          result.display_name,
      };
    }
  }

  console.log(
    `✗ No independently verified full postcode found. Keeping postcode district: ${
      district ||
      "UNKNOWN"
    }`
  );

  return {
    postcode: null,
    district,
    verified: false,
    source:
      "Nominatim",
    checkedAt:
      new Date().toISOString(),
  };
}

/*
============================================================
POSTCODE CACHE
============================================================
*/

function getPostcodeCacheKey(
  address: string
): string {
  return normaliseText(
    removePostcode(
      address
    )
  );
}

async function getVerifiedPostcode(
  address: string
): Promise<string | null> {
  const key =
    getPostcodeCacheKey(
      address
    );

  const cached =
    postcodeCache[key];

  if (cached) {
    if (
      cached.verified &&
      cached.postcode
    ) {
      console.log(
        `✓ Cached independently verified postcode: ${cached.postcode}`
      );

      return cached.postcode;
    }

    console.log(
      `Cached postcode lookup failed previously. Keeping district: ${
        cached.district ||
        "UNKNOWN"
      }`
    );

    return (
      cached.district ||
      null
    );
  }

  const result =
    await resolvePostcode(
      address
    );

  postcodeCache[key] =
    result;

  savePostcodeCache(
    postcodeCache
  );

  return (
    result.verified
      ? result.postcode
      : result.district ||
        null
  );
}

/*
============================================================
OTM HTML EXTRACTION
============================================================
*/

function extractScriptContents(
  html: string
): string[] {
  const scripts: string[] =
    [];

  const regex =
    /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

  let match:
    RegExpExecArray | null;

  while (
    (match =
      regex.exec(html)) !== null
  ) {
    if (match[1]) {
      scripts.push(
        match[1]
      );
    }
  }

  return scripts;
}

function extractJsonObjects(
  html: string
): string[] {
  const objects: string[] =
    [];

  const scripts =
    extractScriptContents(
      html
    );

  for (
    const script of scripts
  ) {
    const trimmed =
      script.trim();

    if (
      trimmed.startsWith(
        "{"
      ) ||
      trimmed.startsWith(
        "["
      )
    ) {
      objects.push(
        trimmed
      );
    }
  }

  return objects;
}

function findPropertyObjects(
  html: string
): OTMProperty[] {
  const properties:
    OTMProperty[] = [];

  /*
   * Try embedded JSON.
   */
  const jsonObjects =
    extractJsonObjects(
      html
    );

  for (
    const json of jsonObjects
  ) {
    try {
      const parsed =
        JSON.parse(json);

      const candidates:
        unknown[] = [];

      if (
        Array.isArray(
          parsed
        )
      ) {
        candidates.push(
          ...parsed
        );
      } else if (
        parsed &&
        typeof parsed ===
          "object"
      ) {
        candidates.push(
          parsed
        );

        const obj =
          parsed as Record<
            string,
            unknown
          >;

        for (
          const value of
            Object.values(
              obj
            )
        ) {
          if (
            Array.isArray(
              value
            )
          ) {
            candidates.push(
              ...value
            );
          }
        }
      }

      for (
        const candidate of
          candidates
      ) {
        if (
          !candidate ||
          typeof candidate !==
            "object"
        ) {
          continue;
        }

        const property =
          candidate as OTMProperty;

        if (
          property.address &&
          (
            property.price !==
              undefined ||
            property[
              "short-price"
            ] !== undefined
          )
        ) {
          properties.push(
            property
          );
        }
      }
    } catch {
      /*
       * Ignore scripts that aren't JSON.
       */
    }
  }

  /*
   * Also look for individual
   * embedded address fields.
   */
  const addressRegex =
    /"address"\s*:\s*"([^"]+)"/gi;

  const priceRegex =
    /"(?:price|short-price)"\s*:\s*(?:"([^"]+)"|([0-9]+))/gi;

  const addresses: string[] =
    [];

  let addressMatch:
    RegExpExecArray | null;

  while (
    (addressMatch =
      addressRegex.exec(
        html
      )) !== null
  ) {
    if (
      addressMatch[1]
    ) {
      addresses.push(
        addressMatch[1]
      );
    }
  }

  console.log(
    `Found ${addresses.length} embedded address fields`
  );
/*
 * If normal JSON extraction failed,
 * construct lightweight property objects
 * from the embedded address and price fields.
 */
if (
  properties.length === 0 &&
  addresses.length > 0
) {
  const priceMatches: string[] = [];

  let priceMatch: RegExpExecArray | null;

  while (
    (priceMatch =
      priceRegex.exec(html)) !== null
  ) {
    const value =
      priceMatch[1] ||
      priceMatch[2];

    if (value) {
      priceMatches.push(value);
    }
  }

  for (
    let i = 0;
    i < addresses.length;
    i++
  ) {
    const rawPrice =
      priceMatches[i] || "";

    const cleanedPrice =
      rawPrice
        .replace(/£/g, "")
        .replace(/,/g, "")
        .trim();

    const numericPrice =
      Number(cleanedPrice);

    properties.push({
      id:
        `embedded-${i}-${Date.now()}`,
      address:
        addresses[i],
      price:
        Number.isFinite(numericPrice) &&
        numericPrice > 0
          ? numericPrice
          : 0,
    });
  }

  console.log(
    `Created ${properties.length} fallback properties`
  );
}
  

  /*
   * Remove duplicates.
   */
  const unique =
    new Map<
      string,
      OTMProperty
    >();

  for (
    const property of
      properties
  ) {
    const key =
      String(
        property.id ??
          property.address ??
          ""
      );

    if (!key) {
      continue;
    }

    if (
      !unique.has(key)
    ) {
      unique.set(
        key,
        property
      );
    }
  }

  return [
    ...unique.values(),
  ];
}

/*
============================================================
PROPERTY FIELDS
============================================================
*/

function getImages(
  property: OTMProperty
): string[] {
  const images: string[] =
    [];

  if (
    Array.isArray(
      property.images
    )
  ) {
    for (
      const image of
        property.images
    ) {
      const url =
        cleanUrl(
          image.default
        ) ||
        cleanUrl(
          image.webp
        );

      if (url) {
        images.push(
          url
        );
      }
    }
  }

  if (
    images.length ===
      0 &&
    property[
      "cover-image"
    ]
  ) {
    const url =
      cleanUrl(
        property[
          "cover-image"
        ].default
      ) ||
      cleanUrl(
        property[
          "cover-image"
        ].webp
      );

    if (url) {
      images.push(
        url
      );
    }
  }

  return [
    ...new Set(
      images
    ),
  ];
}

function getPropertyType(
  property: OTMProperty
): string {
  return (
    property[
      "humanised-property-type"
    ] ||
    property.humanisedPropertyType ||
    property[
      "property-title"
    ] ||
    property.propertyTitle ||
    "UNKNOWN"
  );
}

function getListingUrl(
  property: OTMProperty
): string | null {
  const detailsUrl =
    cleanUrl(
      property[
        "details-url"
      ]
    ) ||
    cleanUrl(
      property.detailsUrl
    );

  if (!detailsUrl) {
    return null;
  }

  if (
    detailsUrl.startsWith(
      "http"
    )
  ) {
    return detailsUrl;
  }

  return `${BASE_URL}${detailsUrl}`;
}

function getDescription(
  property: OTMProperty
): string {
  const features =
    Array.isArray(
      property.features
    )
      ? property.features.filter(
          Boolean
        )
      : [];

  if (
    features.length >
    0
  ) {
    return features.join(
      " • "
    );
  }

  return "";
}

function calculateScore(
  price: number,
  value: number,
  refurb: number
): number {
  if (
    !price ||
    price <= 0 ||
    !value ||
    value <= 0
  ) {
    return 0;
  }

  const discount =
    ((value - price) /
      value) *
    100;

  let score = 0;

  if (
    discount >= 30
  )
    score += 50;
  else if (
    discount >= 25
  )
    score += 45;
  else if (
    discount >= 20
  )
    score += 40;
  else if (
    discount >= 15
  )
    score += 30;
  else if (
    discount >= 10
  )
    score += 20;
  else if (
    discount >= 5
  )
    score += 10;

  if (
    refurb <= 10000
  )
    score += 30;
  else if (
    refurb <= 20000
  )
    score += 25;
  else if (
    refurb <= 30000
  )
    score += 20;
  else if (
    refurb <= 40000
  )
    score += 10;

  if (
    discount >= 20 &&
    refurb <= 20000
  ) {
    score += 20;
  }

  return Math.min(
    100,
    score
  );
}

/*
============================================================
SAVE PROPERTY
============================================================
*/

async function saveProperty(
  property: OTMProperty
): Promise<boolean> {
  const rawAddress =
    property.address;

  if (!rawAddress) {
    return false;
  }

  const address =
    normaliseAddress(
      rawAddress
    );

  const price =
  parsePrice(
    property.price
  );

  if (
    !price ||
    price <= 0
  ) {
    return false;
  }

  const propertyId =
    String(
      property.id ??
        ""
    );

  if (!propertyId) {
    return false;
  }

  /*
   * We do not trust the postcode
   * supplied by OnTheMarket.
   */
  const independentlyVerifiedPostcode =
    await getVerifiedPostcode(
      address
    );

  const postcode =
    independentlyVerifiedPostcode ||
    extractPostcodeDistrict(
      address
    ) ||
    "UNKNOWN";

  const listingUrl =
    getListingUrl(
      property
    );

  const images =
    getImages(
      property
    );

  const propertyType =
    getPropertyType(
      property
    );

  const description =
    getDescription(
      property
    );

  /*
   * Asking price is initially
   * used as the baseline value.
   */
  const value =
    price;

  const refurb = 0;

  const score =
    calculateScore(
      price,
      value,
      refurb
    );

  const agent =
    property.agent?.name ||
    null;

  const now =
    new Date();

  /*
   * Check existing listing by URL.
   */
  const existing =
    listingUrl
      ? await prisma.property.findFirst(
          {
            where: {
              listingUrl,
            },
          }
        )
      : await prisma.property.findFirst(
          {
            where: {
              source:
                "OnTheMarket",
              address,
              price,
            },
          }
        );

  if (existing) {
    await prisma.property.update(
      {
        where: {
          id: existing.id,
        },

        data: {
          postcode,

          address,

          price,

          bedrooms:
            property.bedrooms ??
            existing.bedrooms,

          bathrooms:
            property.bathrooms ??
            existing.bathrooms,

          type:
            propertyType !==
            "UNKNOWN"
              ? propertyType
              : existing.type,

          description:
            description ||
            existing.description,

          listingUrl:
            listingUrl ||
            existing.listingUrl,

          images:
            images.length >
            0
              ? JSON.stringify(
                  images
                )
              : existing.images,

          agent:
            agent ||
            existing.agent,

          updatedAt:
            now,
        },
      }
    );

    return true;
  }

  /*
   * Check external ID separately.
   */
  const existingByExternalId =
    await prisma.property.findFirst(
      {
        where: {
          externalId:
            propertyId,
        },
      }
    );

  if (
    existingByExternalId
  ) {
    await prisma.property.update(
      {
        where: {
          id:
            existingByExternalId.id,
        },

        data: {
          postcode,

          address,

          price,

          bedrooms:
            property.bedrooms ??
            existingByExternalId.bedrooms,

          bathrooms:
            property.bathrooms ??
            existingByExternalId.bathrooms,

          type:
            propertyType !==
            "UNKNOWN"
              ? propertyType
              : existingByExternalId.type,

          description:
            description ||
            existingByExternalId.description,

          listingUrl:
            listingUrl ||
            existingByExternalId.listingUrl,

          images:
            images.length >
            0
              ? JSON.stringify(
                  images
                )
              : existingByExternalId.images,

          agent:
            agent ||
            existingByExternalId.agent,

          updatedAt:
            now,
        },
      }
    );

    return true;
  }

  /*
   * Create new property.
   */
  await prisma.property.create(
    {
      data: {
        source:
          "OnTheMarket",

        externalId:
          propertyId,

        address,

        postcode,

        price,

        estimatedValue:
          value,

        bedrooms:
          property.bedrooms ??
          null,

        bathrooms:
          property.bathrooms ??
          null,

        type:
          propertyType,

        description,

        totalRefurbCost:
          refurb,

        aiScore:
          score,

        aiConfidence:
          0,

        listingUrl,

        images:
          JSON.stringify(
            images
          ),

        agent,

        createdAt:
          now,

        updatedAt:
          now,
      },
    }
  );

  return true;
}

/*
============================================================
CITY IMPORT
============================================================
*/

async function importCity(
  city: string
): Promise<number> {
  let saved = 0;

  for (
    let page = 1;
    page <=
      MAX_PAGES_PER_CITY;
    page++
  ) {
    const url =
      `${BASE_URL}/for-sale/property/${city}/` +
      `?search-location=${city}&page=${page}`;

    console.log("");

    console.log(
      `Fetching ${city} page ${page}: ${url}`
    );

    try {
      const response =
        await fetch(
          url,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
                "AppleWebKit/537.36 " +
                "(KHTML, like Gecko) " +
                "Chrome/151.0.0.0 Safari/537.36",

              Accept:
                "text/html,application/xhtml+xml",
            },
          }
        );

      if (
        !response.ok
      ) {
        console.error(
          `${city} page ${page} returned HTTP ${response.status}`
        );

        continue;
      }

      const html =
        await response.text();

      const properties =
        findPropertyObjects(
          html
        );

      console.log(
        `Found ${properties.length} properties on ${city} page ${page}`
      );

      for (
        const property of
          properties
      ) {
        try {
          const result =
            await saveProperty(
              property
            );

          if (result) {
            saved++;
          }
        } catch (
          error
        ) {
          console.error(
            "Failed to save property:",
            error
          );
        }
      }
    } catch (
      error
    ) {
      console.error(
        `Failed to fetch ${city} page ${page}:`,
        error
      );
    }
  }

  console.log(
    `${city}: ${saved} properties saved`
  );

  return saved;
}

/*
============================================================
MAIN
============================================================
*/

async function main(): Promise<void> {
  console.log(
    "FlipFinderAI - OnTheMarket Import"
  );

  console.log("");

  console.log(
    "Independent postcode resolver: Nominatim / OpenStreetMap"
  );

  console.log(
    "OTM postcode is NOT trusted."
  );

  console.log(
    "Only independently matched full postcodes are accepted."
  );

  console.log(
    "Postcode results are cached locally."
  );

  console.log(
    `Nominatim delay: ${NOMINATIM_DELAY_MS}ms`
  );

  console.log("");

  let total = 0;

  for (
    const city of CITIES
  ) {
    total +=
      await importCity(
        city
      );
  }

  console.log("");

  console.log(
    `Import complete. ${total} properties saved/updated.`
  );

  console.log(
    `Postcode cache: ${CACHE_FILE}`
  );

  await prisma.$disconnect();
}

main().catch(
  async (error) => {
    console.error(
      error
    );

    await prisma.$disconnect();

    process.exit(1);
  }
);