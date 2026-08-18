
import { chromium, type Page } from "playwright";
import crypto from "crypto";

export type ImportedProperty = {
  externalId: string;
  source: string;
  listingUrl: string;
  address: string;
  houseNumber: string;
  postcode: string;
  type: string;
  images: string[];
  floorPlans: string[];
  primaryPhoto: string | null;
  bedrooms: number;
  bathrooms: number;
  price: number;
  floorArea: number | null;
  description: string;
  agent: string;
  dateListed: string | null;
};

type JsonLdObject = Record<string, unknown>;

type SourceInfo = {
  source: string;
  hostname: string;
};

/* =========================================================
   CLEANING
========================================================= */

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const match = value
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return 0;
  }

  const number = Number(match[0]);

  return Number.isFinite(number) ? number : 0;
}

function normalisePostcode(value: string): string {
  const cleaned = cleanText(value)
    .toUpperCase()
    .replace(/\s+/g, "");

  const match = cleaned.match(
    /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/
  );

  if (!match) {
    return cleanText(value).toUpperCase();
  }

  return `${match[1]} ${match[2]}`;
}

/* =========================================================
   SOURCE DETECTION
========================================================= */

function detectSource(url: string): SourceInfo {
  let hostname = "";

  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return {
      source: "unknown",
      hostname: "",
    };
  }

  if (hostname.includes("rightmove.co.uk")) {
    return {
      source: "rightmove",
      hostname,
    };
  }

  if (hostname.includes("onthemarket.com")) {
    return {
      source: "onthemarket",
      hostname,
    };
  }

  if (hostname.includes("zoopla.co.uk")) {
    return {
      source: "zoopla",
      hostname,
    };
  }

  if (hostname.includes("primelocation.com")) {
    return {
      source: "primelocation",
      hostname,
    };
  }

  if (hostname.includes("purplebricks.co.uk")) {
    return {
      source: "purplebricks",
      hostname,
    };
  }

  if (hostname.includes("struttandparker.com")) {
    return {
      source: "strutt-parker",
      hostname,
    };
  }

  if (hostname.includes("savills.co.uk")) {
    return {
      source: "savills",
      hostname,
    };
  }

  if (hostname.includes("foxtons.co.uk")) {
    return {
      source: "foxtons",
      hostname,
    };
  }

  if (hostname.includes("sequencehome.co.uk")) {
    return {
      source: "sequence",
      hostname,
    };
  }

  if (hostname.includes("countrywide.co.uk")) {
    return {
      source: "countrywide",
      hostname,
    };
  }

  if (hostname.includes("auctionhouse.co.uk")) {
    return {
      source: "auction-house",
      hostname,
    };
  }

  if (hostname.includes("iamsold.co.uk")) {
    return {
      source: "iamsold",
      hostname,
    };
  }

  if (hostname.includes("propertyauctions.com")) {
    return {
      source: "property-auctions",
      hostname,
    };
  }

  const cleanedHostname = hostname
    .replace(/^www\./, "")
    .split(".")[0];

  return {
    source: cleanedHostname || "unknown",
    hostname,
  };
}

/* =========================================================
   HOUSE NUMBER
========================================================= */

function extractHouseNumber(address: string): string {
  if (!address) {
    return "";
  }

  const cleaned = cleanText(address);

  const patterns = [
    /^(?:Flat|Apartment|Apt)\s+\d+[A-Z]?,?\s+(\d+[A-Z]?(?:-\d+[A-Z]?)?)\b/i,
    /^(\d+[A-Z]?(?:-\d+[A-Z]?)?)\b/i,
    /,\s*(\d+[A-Z]?(?:-\d+[A-Z]?)?)\b/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);

    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return "";
}

/* =========================================================
   POSTCODE
========================================================= */

function findFullPostcode(text: string): string {
  if (!text) {
    return "";
  }

  const match = text.match(
    /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i
  );

  if (!match?.[1]) {
    return "";
  }

  return normalisePostcode(match[1]);
}

function findPostcodeDistrict(text: string): string {
  if (!text) {
    return "";
  }

  const match = text.match(
    /\b([A-Z]{1,2}\d{1,2})\b/i
  );

  if (!match?.[1]) {
    return "";
  }

  return match[1].toUpperCase();
}

/* =========================================================
   JSON-LD
========================================================= */

function isObject(
  value: unknown
): value is JsonLdObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function flattenJsonLd(
  value: unknown
): JsonLdObject[] {
  const results: JsonLdObject[] = [];

  if (Array.isArray(value)) {
    for (const item of value) {
      results.push(...flattenJsonLd(item));
    }

    return results;
  }

  if (!isObject(value)) {
    return results;
  }

  results.push(value);

  const graph = value["@graph"];

  if (Array.isArray(graph)) {
    for (const item of graph) {
      results.push(...flattenJsonLd(item));
    }
  }

  return results;
}

async function extractJsonLd(
  page: Page
): Promise<JsonLdObject[]> {
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((elements: Element[]) =>
      elements.map(
        (element) => element.textContent || ""
      )
    );

  const results: JsonLdObject[] = [];

  for (const script of scripts) {
    if (!script.trim()) {
      continue;
    }

    try {
      const parsed = JSON.parse(script);

      results.push(...flattenJsonLd(parsed));
    } catch {
      // Ignore malformed JSON-LD.
    }
  }

  return results;
}

function findJsonLdProperty(
  objects: JsonLdObject[],
  keys: string[]
): unknown {
  for (const object of objects) {
    for (const key of keys) {
      if (
        Object.prototype.hasOwnProperty.call(
          object,
          key
        )
      ) {
        const value = object[key];

        if (
          value !== null &&
          value !== undefined &&
          value !== ""
        ) {
          return value;
        }
      }
    }
  }

  return null;
}

/* =========================================================
   JSON-LD ADDRESS
========================================================= */

function extractJsonLdAddress(
  objects: JsonLdObject[]
): string {
  for (const object of objects) {
    const address = object.address;

    if (typeof address === "string") {
      return cleanText(address);
    }

    if (isObject(address)) {
      const parts = [
        address.streetAddress,
        address.addressLocality,
        address.addressRegion,
        address.postalCode,
      ]
        .filter(
          (value): value is string =>
            typeof value === "string"
        )
        .map(cleanText)
        .filter(Boolean);

      if (parts.length > 0) {
        return cleanText(parts.join(", "));
      }
    }
  }

  return "";
}

function extractJsonLdPostcode(
  objects: JsonLdObject[]
): string {
  for (const object of objects) {
    const address = object.address;

    if (isObject(address)) {
      const postcode = address.postalCode;

      if (typeof postcode === "string") {
        return normalisePostcode(postcode);
      }
    }
  }

  return "";
}

/* =========================================================
   JSON-LD PROPERTY TYPE
========================================================= */

function extractJsonLdType(
  objects: JsonLdObject[]
): string {
  for (const object of objects) {
    const type = object["@type"];

    if (typeof type === "string") {
      const lower = type.toLowerCase();

      if (
  lower.includes("residence") ||
  lower.includes("house") ||
  lower.includes("apartment") ||
  lower.includes("singlefamily")
) {
        return cleanText(type);
      }
    }

    if (
      typeof object.additionalType === "string"
    ) {
      return cleanText(
        object.additionalType
      );
    }
  }

  return "";
}

/* =========================================================
   JSON-LD IMAGES
========================================================= */

function collectImageValue(
  value: unknown
): string[] {
  const images: string[] = [];

  if (typeof value === "string") {
    images.push(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      images.push(
        ...collectImageValue(item)
      );
    }
  }

  if (isObject(value)) {
    const url = value.url;

    if (typeof url === "string") {
      images.push(url);
    }

    const contentUrl = value.contentUrl;

    if (typeof contentUrl === "string") {
      images.push(contentUrl);
    }

    const image = value.image;

    if (typeof image === "string") {
      images.push(image);
    }
  }

  return images;
}

/* =========================================================
   IMAGE URL CLEANING
========================================================= */
function upgradeImageUrl(url: string): string {

  return url
    .replace(
      /-\d+x\d+(?=\.)/i,
      ""
    );

}

function cleanImageUrl(
  value: string
): string {
  if (!value) {
    return "";
  }

  let url = value
    .trim()
    .replace(/^["']|["']$/g, "");

  if (!url) {
    return "";
  }

  // Decode common escaped URLs.
  url = url
    .replace(/\\u002F/gi, "/")
    .replace(/\\u003A/gi, ":")
    .replace(/\\u0026/gi, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/gi, "&");

  // Zoopla sometimes exposes URLs with :p suffix.
  url = url.replace(/:p$/i, "");

  if (url.startsWith("//")) {
    url = `https:${url}`;
  }

  if (!/^https?:\/\//i.test(url)) {
    return "";
  }

    try {
    const parsed = new URL(url);

    parsed.hash = "";

    return upgradeImageUrl(
      parsed.toString()
    );
  } catch {
    return "";
  }
}

/* =========================================================
   IMAGE QUALITY SCORE
========================================================= */

function getUrlResolutionScore(
  url: string
): number {
  const lower = url.toLowerCase();

  let score = 0;

  const highQualityTerms = [
    "original",
    "fullsize",
    "full-size",
    "full_size",
    "fullimage",
    "full-image",
    "large",
    "highres",
    "high-res",
    "high_res",
    "master",
    "source",
    "raw",
  ];

  for (const term of highQualityTerms) {
    if (lower.includes(term)) {
      score += 25;
    }
  }

  const lowQualityTerms = [
    "thumbnail",
    "thumb",
    "small",
    "tiny",
    "medium",
    "resize",
    "resized",
    "preview",
    "placeholder",
  ];

  for (const term of lowQualityTerms) {
    if (lower.includes(term)) {
      score -= 20;
    }
  }

  const widthMatches =
    lower.match(
      /(?:width|w)[=_-]?(\d{3,4})/g
    ) || [];

  for (const item of widthMatches) {
    const match = item.match(
      /(\d{3,4})/
    );

    if (!match?.[1]) {
      continue;
    }

    const width = Number(match[1]);

    if (width >= 2000) {
      score += 50;
    } else if (width >= 1500) {
      score += 35;
    } else if (width >= 1200) {
      score += 20;
    } else if (width < 700) {
      score -= 30;
    }
  }

  return score;
}

/* =========================================================
   IMAGE FILTERING
========================================================= */
function isPropertyGalleryImage(url:string): boolean {

  const lower = url.toLowerCase();

  const bad = [
    "logo",
    "icon",
    "avatar",
    "agent",
    "branch",
    "epc",
    "brochure",
    "map",
    "energy",
    "virtual",
    "video",
    "tour"
  ];

  return !bad.some(term =>
    lower.includes(term)
  );
}

function isFloorPlanImage(url: string): boolean {
  const lower = url.toLowerCase();
  const floorPlanTerms = [
    "floorplan",
    "floor-plan",
    "floor_plan",
    "floorplanimage",
  ];
  return floorPlanTerms.some(term => lower.includes(term));
}
function isProbablyBadImage(
  url: string,
  alt = "",
  title = "",
  className = ""
): boolean {

  const combined = [
    url,
    alt,
    title,
    className,
  ]
    .join(" ")
    .toLowerCase();


  const blockedTerms = [
    "bat.bing.com",
    "doubleclick",
    "google-analytics",
    "googleadservices",
    "facebook.com/tr",
    "pixel",
    "tracking",
    "beacon",
    "analytics",

    "map",
    "maps",
    "mapbox",
    "googlemap",
    "google-maps",
    "streetview",
    "street-view",
    "staticmap",
    "static-map",
    "location-map",
    "locationmap",
    "geocode",
    "satellite",
    "aerial",
    "tile",
    "tiles",

    "agent-image",
    "agentimage",
    "branch-photo",
    "floorplan",
    "floor-plan",
    "epc",
    "energy-performance",
    "brochure",
    "pdf",

    "favicon",
    "sprite",
    "placeholder",
    "no-image",
    "noimage",
    "default-image",
    "defaultimage",
    "watermark",
    "thumbnail-placeholder",
    "mortgage",
    "calculator",
    "virtual-tour",
    "virtualtour",
    "commute",
    "transport",
  ];


  if (
url === "https://lid.zoocdn.com/"
) {
return true;
}


  return blockedTerms.some((term) =>
    combined.includes(term)
  );
}
/* =========================================================
   IMAGE CANDIDATE
========================================================= */

type ImageCandidate = {
  url: string;
  alt: string;
  title: string;
  className: string;
  width: number;
  height: number;
  area: number;
  galleryScore: number;
  sourcePriority: number;
  urlQualityScore: number;
  discoveryIndex: number;
};

/* =========================================================
   IMAGE SCORING
========================================================= */

function scoreImageCandidate(
  candidate: ImageCandidate
): number {
  let score = 0;

  /*
   * IMAGE RESOLUTION
   */

  if (
    candidate.width >= 1000 ||
    candidate.height >= 700
  ) {
    score += 20;
  }

  if (
    candidate.width >= 1200 &&
    candidate.height >= 800
  ) {
    score += 20;
  }

  if (
    candidate.width >= 1600 &&
    candidate.height >= 1000
  ) {
    score += 25;
  }

  if (
    candidate.width >= 2000 &&
    candidate.height >= 1200
  ) {
    score += 35;
  }

  /*
   * IMAGE ASPECT RATIO
   */

  const ratio =
    candidate.width > 0 &&
    candidate.height > 0
      ? candidate.width /
        candidate.height
      : 0;

  if (
    ratio >= 0.55 &&
    ratio <= 2.4
  ) {
    score += 10;
  }

  /*
   * SOURCE / GALLERY QUALITY
   */

  score += candidate.galleryScore;
  score += candidate.sourcePriority;
  score += candidate.urlQualityScore;

  /*
   * IMAGE AREA
   */

  if (candidate.area > 0) {
    if (
      candidate.area >= 4_000_000
    ) {
      score += 40;
    } else if (
      candidate.area >= 2_000_000
    ) {
      score += 25;
    } else if (
      candidate.area >= 1_000_000
    ) {
      score += 15;
    } else if (
      candidate.area < 250_000
    ) {
      score -= 25;
    }
  }

  /*
   * EXTREME ASPECT RATIOS
   *
   * Very wide/tall images are unlikely to be
   * normal property photographs.
   */

  if (
    ratio > 3.2 ||
    ratio < 0.35
  ) {
    score -= 30;
  }

  /*
   * TEXT / URL SIGNALS
   *
   * Penalise images that look like website assets,
   * agent images, thumbnails, floorplans, etc.
   */

  const combined = [
    candidate.url,
    candidate.alt,
    candidate.title,
    candidate.className,
  ]
    .join(" ")
    .toLowerCase();

  /*
   * Strongly reject website/agent imagery.
   */

  if (
    combined.includes("logo") ||
    combined.includes("agent") ||
    combined.includes("avatar") ||
    combined.includes("branch")
  ) {
    score -= 100;
  }

  /*
   * Penalise thumbnail/small versions.
   */

  if (
    combined.includes("thumbnail") ||
    combined.includes("thumb") ||
    combined.includes("small")
  ) {
    score -= 50;
  }

  /*
   * Strongly penalise non-property imagery.
   */

  if (
    combined.includes("floorplan") ||
    combined.includes("floor-plan") ||
    combined.includes("brochure")
  ) {
    score -= 100;
  }

  /*
   * Additional website/UI imagery.
   */

  if (
    combined.includes("icon") ||
    combined.includes("sprite") ||
    combined.includes("favicon") ||
    combined.includes("placeholder") ||
    combined.includes("no-image") ||
    combined.includes("noimage")
  ) {
    score -= 100;
  }

  /*
   * Maps and location imagery should never compete
   * with actual property photographs.
   */

  if (
    combined.includes("map") ||
    combined.includes("maps") ||
    combined.includes("streetview") ||
    combined.includes("street-view") ||
    combined.includes("satellite") ||
    combined.includes("aerial")
  ) {
    score -= 100;
  }

  /*
   * Tracking / analytics imagery.
   */

  if (
    combined.includes("pixel") ||
    combined.includes("tracking") ||
    combined.includes("analytics") ||
    combined.includes("beacon")
  ) {
    score -= 100;
  }

  return score;
}

/* =========================================================
   IMAGE DEDUPLICATION
========================================================= */

function getImageDedupKey(
  url: string
): string {

  let key = url
    .toLowerCase()
    .trim();

  try {

    const parsed =
      new URL(key);

    key =
      parsed.pathname;

  } catch {

    return key;

  }


  /*
   * Zoopla CDN:
   *
   * /u/1024/768/hash.jpg
   * /u/480/360/hash.jpg
   *
   * same image.
   */

  key =
    key.replace(
      /\/u\/\d+\/\d+\//,
      "/"
    );


  return key;

}
/* =========================================================
   ADD IMAGE CANDIDATE
========================================================= */

function addImageCandidate(
  candidates: Map<string, ImageCandidate>,
  candidate: ImageCandidate
): void {
  const key = getImageDedupKey(
    candidate.url
  );

  const existing = candidates.get(key);

  if (!existing) {
    candidates.set(key, candidate);
    return;
  }

  const existingScore =
    scoreImageCandidate(existing);

  const newScore =
    scoreImageCandidate(candidate);

  if (newScore > existingScore) {
    candidates.set(key, candidate);
    return;
  }

  if (
    newScore === existingScore &&
    candidate.area > existing.area
  ) {
    candidates.set(key, candidate);
  }
}

/* =========================================================
   GENERIC IMAGE EXTRACTION
========================================================= */

async function extractImages(
  page: Page,
  jsonLd: JsonLdObject[]
): Promise<string[]> {
  const candidates =
    new Map<string, ImageCandidate>();

  let discoveryIndex = 0;
 console.log(
  "================================================="
);

console.log(
  "ZOOPLA IMAGE DEBUG START"
);

console.log(
  "PAGE URL:",
  page.url()
);

console.log(
  "================================================="
);

try {
  const html = await page.content();

  console.log(
    "PAGE HTML LENGTH:",
    html.length
  );

  console.log(
    "ZOOPLA CDN COUNT:",
    (
      html.match(
        /zoocdn/gi
      ) || []
    ).length
  );

  console.log(
    "LID.ZOOPLA COUNT:",
    (
      html.match(
        /lid\.zoocdn/gi
      ) || []
    ).length
  );

  console.log(
    "IMAGE WORD COUNT:",
    (
      html.match(
        /image/gi
      ) || []
    ).length
  );

  console.log(
    "JPG COUNT:",
    (
      html.match(
        /\.jpg/gi
      ) || []
    ).length
  );

  console.log(
    "WEBP COUNT:",
    (
      html.match(
        /\.webp/gi
      ) || []
    ).length
  );

  console.log(
    "JPEG COUNT:",
    (
      html.match(
        /\.jpeg/gi
      ) || []
    ).length
  );

  const zoocdnSnippets =
    html.match(
      /.{0,150}zoocdn.{0,300}/gi
    ) || [];

  console.log(
    "ZOOPLA CDN SNIPPETS:",
    zoocdnSnippets
      .slice(0, 20)
  );

} catch (error) {

  console.error(
    "ZOOPLA IMAGE DEBUG FAILED:",
    error
  );

}

console.log(
  "================================================="
);

console.log(
  "ZOOPLA IMAGE DEBUG END"
);

console.log(
  "================================================="
);
  /* JSON-LD IMAGES */

  for (const object of jsonLd) {
    const values = [
      object.image,
      object.images,
      object.photo,
      object.photos,
    ];

    for (const value of values) {
      for (const image of collectImageValue(value)) {
        const cleaned =
          cleanImageUrl(image);

        if (!cleaned) {
          continue;
        }

        if (isProbablyBadImage(cleaned)) {
          continue;
        }

        addImageCandidate(
          candidates,
          {
            url: cleaned,
            alt: "",
            title: "",
            className: "",
            width: 0,
            height: 0,
            area: 0,
            galleryScore: 15,
            sourcePriority: 35,
            urlQualityScore:
              getUrlResolutionScore(cleaned),
            discoveryIndex:
              discoveryIndex++,
          }
        );
      }
    }
  }

  /* IMG ELEMENTS */

  const imageElements =
    await page
      .locator("img")
      .evaluateAll(
        (elements: Element[]) =>
          elements.map((element) => {
            const img =
              element as HTMLImageElement;

            const parent =
              img.closest(
                "a, button, figure, li, div"
              );

            const parentClass =
              parent instanceof HTMLElement
                ? String(
                    parent.className || ""
                  )
                : "";

            const parentText =
              parent instanceof HTMLElement
                ? parent.innerText || ""
                : "";

            const values: {
              url: string;
              priority: number;
            }[] = [];

            const push = (
              value: string | null,
              priority: number
            ) => {
              if (
                value &&
                value.trim()
              ) {
                values.push({
                  url: value.trim(),
                  priority,
                });
              }
            };

            push(img.currentSrc, 10);
            push(img.src, 5);

            const highQualityAttributes = [
              "data-full",
              "data-full-src",
              "data-fullsize",
              "data-original",
              "data-original-src",
              "data-large",
              "data-large-src",
              "data-image",
              "data-image-url",
              "data-property-image",
              "data-property-image-url",
            ];

            for (const attribute of highQualityAttributes) {
              push(
                img.getAttribute(attribute),
                40
              );
            }

            for (const attribute of [
              "data-src",
              "data-lazy-src",
              "data-url",
            ]) {
              push(
                img.getAttribute(attribute),
                20
              );
            }

            const srcset =
              img.getAttribute("srcset");

            if (srcset) {
              const parsed = srcset
                .split(",")
                .map((item) => {
                  const parts =
                    item
                      .trim()
                      .split(/\s+/);

                  const url =
                    parts[0] || "";

                  const descriptor =
                    parts[1] || "";

                  const widthMatch =
                    descriptor.match(
                      /(\d+)w/i
                    );

                  const width =
                    widthMatch
                      ? Number(
                          widthMatch[1]
                        )
                      : 0;

                  return {
                    url,
                    width,
                  };
                })
                .filter((item) =>
                  Boolean(item.url)
                )
                .sort(
                  (a, b) =>
                    b.width - a.width
                );

              for (const item of parsed) {
                push(
                  item.url,
                  35 +
                    Math.min(
                      item.width / 100,
                      30
                    )
                );
              }
            }

            const className =
              typeof img.className ===
              "string"
                ? img.className
                : "";

            const alt =
              img.getAttribute("alt") || "";

            const title =
              img.getAttribute("title") || "";

            const galleryText = [
              className,
              parentClass,
              alt,
              title,
              parentText,
            ]
              .join(" ")
              .toLowerCase();

            let galleryScore = 0;

            if (
              galleryText.includes(
                "gallery"
              )
            ) {
              galleryScore += 25;
            }

            if (
              galleryText.includes(
                "carousel"
              )
            ) {
              galleryScore += 20;
            }

            if (
              galleryText.includes(
                "property"
              )
            ) {
              galleryScore += 15;
            }

            if (
              galleryText.includes(
                "photo"
              )
            ) {
              galleryScore += 10;
            }

            if (
              galleryText.includes(
                "listing"
              )
            ) {
              galleryScore += 10;
            }

            return {
              values,
              alt,
              title,
              className: [
                className,
                parentClass,
              ].join(" "),
              width:
                img.naturalWidth ||
                img.width ||
                0,
              height:
                img.naturalHeight ||
                img.height ||
                0,
              galleryScore,
            };
          })
      );

  for (const element of imageElements) {
    for (const image of element.values) {
      const cleaned =
        cleanImageUrl(image.url);

      if (!cleaned) {
        continue;
      }

      if (
        isProbablyBadImage(
          cleaned,
          element.alt,
          element.title,
          element.className
        )
      ) {
        continue;
      }

      if (
        element.width > 0 &&
        element.height > 0 &&
        (
          element.width < 250 ||
          element.height < 180
        )
      ) {
        continue;
      }

      const width =
        element.width;

      const height =
        element.height;

      addImageCandidate(
        candidates,
        {
          url: cleaned,
          alt: element.alt,
          title: element.title,
          className:
            element.className,
          width,
          height,
          area:
            width * height,
          galleryScore:
            element.galleryScore,
          sourcePriority:
            image.priority,
          urlQualityScore:
            getUrlResolutionScore(cleaned),
          discoveryIndex:
            discoveryIndex++,
        }
      );
    }
  }

  /* OPEN GRAPH IMAGE */

  const ogImages =
    await page
      .locator(
        'meta[property="og:image"], meta[property="og:image:url"]'
      )
      .evaluateAll(
        (elements: Element[]) =>
          elements
            .map(
              (element) =>
                element.getAttribute(
                  "content"
                ) || ""
            )
            .filter(Boolean)
      );

  for (const image of ogImages) {
    const cleaned =
      cleanImageUrl(image);

    if (!cleaned) {
      continue;
    }

    if (isProbablyBadImage(cleaned)) {
      continue;
    }

    addImageCandidate(
      candidates,
      {
        url: cleaned,
        alt: "",
        title: "",
        className: "og-image",
        width: 0,
        height: 0,
        area: 0,
        galleryScore: 5,
        sourcePriority: 15,
        urlQualityScore:
          getUrlResolutionScore(cleaned),
        discoveryIndex:
          discoveryIndex++,
      }
    );
  }
/* RIGHTMOVE GALLERY DATA */

try {

  const scripts =
    await page.locator("script")
      .allInnerTexts();

  for (const script of scripts) {

    if (
      !script.includes("image")
      &&
      !script.includes("photos")
    ) {
      continue;
    }

    const matches =
      script.match(
        /https?:\/\/[^"'\\s]+?\.(jpg|jpeg|png|webp)/gi
      ) || [];


    for (const image of matches) {

      const cleaned =
        cleanImageUrl(image);

      if (!cleaned) continue;

      if (
        isProbablyBadImage(cleaned)
      ) continue;


      addImageCandidate(
        candidates,
        {
          url: cleaned,
          alt:"",
          title:"",
          className:
            "rightmove-script-image",
          width:0,
          height:0,
          area:0,
          galleryScore:40,
          sourcePriority:70,
          urlQualityScore:
            getUrlResolutionScore(cleaned),
          discoveryIndex:
            discoveryIndex++,
        }
      );
    }
  }


} catch(error){

 console.log(
   "Rightmove script image scan failed",
   error
 );

}

  /* RAW PAGE IMAGE DISCOVERY */

  try {
    const html =
      await page.content();

    const rawImageMatches =
      html.match(
        /https?:\/\/[^"'\\\s<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s<>]*)?/gi
      ) || [];

    console.log(
      "RAW IMAGE URL MATCHES:",
      rawImageMatches.length
    );

    for (const rawImage of rawImageMatches) {
      const cleaned =
        cleanImageUrl(rawImage);

      if (!cleaned) {
        continue;
      }

      if (isProbablyBadImage(cleaned)) {
        continue;
      }

      addImageCandidate(
        candidates,
        {
          url: cleaned,
          alt: "",
          title: "",
          className:
            "raw-page-image",
          width: 0,
          height: 0,
          area: 0,
          galleryScore: 20,
          sourcePriority: 45,
          urlQualityScore:
            getUrlResolutionScore(cleaned),
          discoveryIndex:
            discoveryIndex++,
        }
      );
    }

    console.log(
      "CANDIDATES AFTER RAW PAGE SCAN:",
      candidates.size
    );
  } catch (error) {
    console.error(
      "Raw image discovery failed:",
      error
    );
  }

  /* ZOOPLA RAW IMAGE DISCOVERY */

  try {
    const hostname =
      new URL(page.url())
        .hostname
        .toLowerCase();

    if (hostname.includes("zoopla")) {
      const html =
        await page.content();

      const zooplaMatches =
        html.match(
          /https?:\/\/[^"'\\\s<>]*zoocdn\.com[^"'\\\s<>]*/gi
        ) || [];

      console.log(
        "ZOOPLA RAW IMAGE URL MATCHES:",
        zooplaMatches.length
      );

      for (const rawImage of zooplaMatches) {
        const decoded =
          rawImage
            .replace(/\\u002F/gi, "/")
            .replace(/\\\//g, "/")
            .replace(/&amp;/gi, "&")
            .replace(/\\u003A/gi, ":")
            .replace(/\\u0026/gi, "&");

        const cleaned =
          cleanImageUrl(decoded);

        if (!cleaned) {
          continue;
        }

        if (isProbablyBadImage(cleaned)) {
          continue;
        }

        addImageCandidate(
          candidates,
          {
            url: cleaned,
            alt: "",
            title: "",
            className:
              "zoopla-raw-page",
            width: 0,
            height: 0,
            area: 0,
            galleryScore: 35,
            sourcePriority: 60,
            urlQualityScore:
              getUrlResolutionScore(cleaned),
            discoveryIndex:
              discoveryIndex++,
          }
        );
      }

      console.log(
        "ZOOPLA CANDIDATES AFTER RAW PAGE SCAN:",
        candidates.size
      );
    }
  } catch (error) {
    console.error(
      "Zoopla raw image discovery failed:",
      error
    );
  }

  /* SCORE AND SORT */

  const scored =
    Array.from(
      candidates.values()
    ).map((candidate) => ({
      candidate,
      score:
        scoreImageCandidate(candidate),
    }));
console.log(
  "SCORED IMAGE COUNT:",
  scored.length
);

scored
  .slice(0, 10)
  .forEach((item, index) => {
    console.log(
      "IMAGE SCORE",
      index + 1,
      item.score,
      item.candidate.url
    );
  });
  
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (
      b.candidate.area !==
      a.candidate.area
    ) {
      return (
        b.candidate.area -
        a.candidate.area
      );
    }

    return (
      a.candidate.discoveryIndex -
      b.candidate.discoveryIndex
    );
  });

   /* FINAL IMAGE LIST */

  /*
   * Zoopla can return the same photograph at multiple
   * resolutions, for example:
   *
   * /u/480/360/ABC123.jpg
   * /u/1024/768/ABC123.jpg
   *
   * These are the same physical photograph.
   *
   * We want ONE copy only.
   *
   * When multiple Zoopla resolutions exist, always
   * keep the highest-resolution version available.
   */

  const bestImages =
    new Map<string, {
      url: string;
      score: number;
      width: number;
      height: number;
    }>();

  for (const item of scored) {
    const image =
      item.candidate;

    const url =
      image.url;

    /*
     * Extract the underlying Zoopla image ID.
     *
     * Example:
     *
     * https://lid.zoocdn.com/u/480/360/ABC123.jpg
     *
     * becomes:
     *
     * ABC123.jpg
     */

    let key =
      getImageDedupKey(url);

    /*
     * Extra protection specifically for Zoopla.
     *
     * Remove the resolution portion of the URL so:
     *
     * /480/360/ABC123.jpg
     * /1024/768/ABC123.jpg
     *
     * produce the same key.
     */

    try {
      const parsed =
        new URL(url);

      if (
        parsed.hostname
          .toLowerCase()
          .includes("zoocdn.com")
      ) {
        const match =
  parsed.pathname.match(
    /\/u\/(?:original\/)?(?:\d+\/\d+\/)([^/]+)$/i
  );

        if (match?.[1]) {
          key =
            `zoopla:${match[1]
              .toLowerCase()}`;
        }
      }
    } catch {
      /*
       * If the URL cannot be parsed,
       * keep the existing deduplication key.
       */
    }

    const existing =
      bestImages.get(key);

    if (!existing) {
      bestImages.set(
        key,
        {
          url,
          score: item.score,
          width:
            image.width || 0,
          height:
            image.height || 0,
        }
      );

      continue;
    }

    /*
     * Prefer the higher-resolution image.
     *
     * We compare:
     *
     * 1. Pixel area
     * 2. URL resolution score
     * 3. Overall candidate score
     */

    const currentArea =
      (image.width || 0) *
      (image.height || 0);

    const existingArea =
      existing.width *
      existing.height;

    const currentResolutionScore =
      getUrlResolutionScore(url);

    const existingResolutionScore =
      getUrlResolutionScore(
        existing.url
      );

    const shouldReplace =
      currentArea >
        existingArea ||
      (
        currentArea ===
          existingArea &&
        currentResolutionScore >
          existingResolutionScore
      ) ||
      (
        currentArea ===
          existingArea &&
        currentResolutionScore ===
          existingResolutionScore &&
        item.score >
          existing.score
      );

    if (shouldReplace) {
      bestImages.set(
        key,
        {
          url,
          score: item.score,
          width:
            image.width || 0,
          height:
            image.height || 0,
        }
      );
    }
  }

  /*
   * Preserve the existing ranking order.
   *
   * The Map above contains only one copy of
   * each physical photograph.
   */

  const finalImages =
    Array.from(
      bestImages.values()
    ).map(
      (image) =>
        upgradeImageUrl(image.url)
    );
    
  console.log(
  "========================================"
);

console.log(
  "PROPERTY IMAGE EXTRACTION DEBUG"
);

console.log(
  "TOTAL IMAGE CANDIDATES:",
  candidates.size
);

console.log(
  "SCORED IMAGE COUNT:",
  scored.length
);

console.log(
  "TOP 20 SCORED IMAGES:"
);

scored
  .slice(0, 20)
  .forEach(
    (item, index) => {
      console.log(
        `${index + 1}. SCORE ${item.score}`
      );

      console.log(
        item.candidate.url
      );

      console.log(
        {
          width:
            item.candidate.width,

          height:
            item.candidate.height,

          area:
            item.candidate.area,

          source:
            item.candidate.className,

          galleryScore:
            item.candidate.galleryScore,

          sourcePriority:
            item.candidate.sourcePriority,

          urlQuality:
            item.candidate.urlQualityScore,
        }
      );
    }
  );


console.log(
  "FINAL PROPERTY PHOTOS:",
  finalImages.length
);


finalImages.forEach(
  (image, index) => {
    console.log(
      `FINAL ${index + 1}:`,
      image
    );
  }
);


console.log(
  "========================================"
);


console.log(
  "RETURNING IMAGES TO IMPORTER:",
  finalImages
);

return finalImages;
}

/* =========================================================
   FLOOR PLAN IMAGE EXTRACTION
========================================================= */

async function extractFloorPlanImages(
  page: Page,
  source: string
): Promise<string[]> {
  const candidates = new Map<string, string>();

  /*
   * Try extracting floor plans from the current page first.
   */
  try {
    const html = await page.content();

    const fpMatches = html.match(
      /https?:\/\/[^"'\\\s<>]*(?:floorplan|floor-plan|floor_plan)[^"'\\\s<>]*?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s<>]*)?/gi
    ) || [];

    for (const url of fpMatches) {
      let cleaned = url.trim();
      cleaned = cleaned.replace(/\\u002F/gi, "/");
      cleaned = cleaned.replace(/\\\//g, "/");
      cleaned = cleaned.replace(/&amp;/gi, "&");

      if (!/^https?:\/\//i.test(cleaned)) continue;

      try {
        const parsed = new URL(cleaned);
        parsed.hash = "";
        const key = parsed.pathname.toLowerCase();
        if (!candidates.has(key)) {
          candidates.set(key, parsed.toString());
        }
      } catch {
        // skip invalid URLs
      }
    }
  } catch {
    // not fatal
  }

  try {
    const images = await page
      .locator("img")
      .evaluateAll((elements: Element[]) =>
        elements
          .map((el) => {
            const img = el as HTMLImageElement;
            const combined = [
              img.src,
              img.currentSrc,
              img.getAttribute("data-src") || "",
              img.getAttribute("data-full") || "",
              img.getAttribute("alt") || "",
              img.getAttribute("title") || "",
              img.className || "",
              (img.closest("a, figure, div") as HTMLElement)?.className || "",
            ].join(" ").toLowerCase();

            if (combined.includes("floorplan") || combined.includes("floor-plan") || combined.includes("floor_plan")) {
              return img.currentSrc || img.src || img.getAttribute("data-src") || "";
            }
            return "";
          })
          .filter(Boolean)
      );

    for (const url of images) {
      let cleaned = url.trim();
      if (!/^https?:\/\//i.test(cleaned)) continue;

      try {
        const parsed = new URL(cleaned);
        parsed.hash = "";
        const key = parsed.pathname.toLowerCase();
        if (!candidates.has(key)) {
          candidates.set(key, parsed.toString());
        }
      } catch {
        // skip
      }
    }
  } catch {
    // not fatal
  }

  /*
   * If no floor plans found on the main page, try navigating
   * to the Zoopla floor-plans tab.
   */
  if (
    candidates.size === 0 &&
    source === "zoopla"
  ) {
    try {
      const currentUrl = new URL(page.url());

      const floorPlanUrl =
        `${currentUrl.origin}${currentUrl.pathname}?tab=floor_plans`;

      console.log(
        "ZOOPLA FLOOR PLAN TAB:",
        floorPlanUrl
      );

      await page.goto(floorPlanUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });

      await page.waitForTimeout(2_000);

      const fpHtml = await page.content();

      const fpTabMatches = fpHtml.match(
        /https?:\/\/[^"'\\\s<>]*(?:floorplan|floor-plan|floor_plan)[^"'\\\s<>]*?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s<>]*)?/gi
      ) || [];

      for (const url of fpTabMatches) {
        let cleaned = url.trim();
        cleaned = cleaned.replace(/\\u002F/gi, "/");
        cleaned = cleaned.replace(/\\\//g, "/");
        cleaned = cleaned.replace(/&amp;/gi, "&");

        if (!/^https?:\/\//i.test(cleaned)) continue;

        try {
          const parsed = new URL(cleaned);
          parsed.hash = "";
          const key = parsed.pathname.toLowerCase();
          if (!candidates.has(key)) {
            candidates.set(key, parsed.toString());
          }
        } catch {
          // skip
        }
      }

      const fpImages = await page
        .locator("img")
        .evaluateAll((elements: Element[]) =>
          elements
            .map((el) => {
              const img = el as HTMLImageElement;
              const combined = [
                img.src,
                img.currentSrc,
                img.getAttribute("data-src") || "",
                img.getAttribute("alt") || "",
                img.className || "",
              ].join(" ").toLowerCase();

              if (
                combined.includes("floorplan") ||
                combined.includes("floor-plan") ||
                combined.includes("floor_plan")
              ) {
                return img.currentSrc || img.src || img.getAttribute("data-src") || "";
              }
              return "";
            })
            .filter(Boolean)
        );

      for (const url of fpImages) {
        let cleaned = url.trim();
        if (!/^https?:\/\//i.test(cleaned)) continue;

        try {
          const parsed = new URL(cleaned);
          parsed.hash = "";
          const key = parsed.pathname.toLowerCase();
          if (!candidates.has(key)) {
            candidates.set(key, parsed.toString());
          }
        } catch {
          // skip
        }
      }

      /*
       * Navigate back to the main listing page
       * so subsequent scraping is unaffected.
       */
      await page.goto(currentUrl.toString(), {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });

      await page.waitForTimeout(1_000);
    } catch (fpNavError) {
      console.log(
        "Floor plan tab navigation failed (non-fatal):",
        fpNavError instanceof Error
          ? fpNavError.message
          : fpNavError
      );
    }
  }

  return Array.from(candidates.values());
}

/* =========================================================
   FRONT-OF-HOUSE DETECTION
========================================================= */

function detectFrontOfHouse(
  images: string[],
  floorPlans: string[]
): string | null {
  if (images.length === 0) return null;

  const fpSet = new Set(
    floorPlans.map((u) => u.toLowerCase())
  );

  const nonFloorPlan = images.filter(
    (img) => !fpSet.has(img.toLowerCase())
  );

  if (nonFloorPlan.length === 0) return images[0];

  const frontKeywords = [
    "front",
    "exterior",
    "outside",
    "facade",
    "elevation",
    "street",
    "curb",
    "kerb",
    "frontage",
    "entrance",
    "door",
    "house-front",
    "property-front",
  ];

  for (const img of nonFloorPlan) {
    const lower = img.toLowerCase();
    if (frontKeywords.some((kw) => lower.includes(kw))) {
      return img;
    }
  }

  /*
   * Zoopla and most portals put the front-of-house
   * photograph as the first image in the gallery.
   *
   * CDN URL hashes are meaningless so keyword matching
   * on the URL itself will rarely work. Gallery position
   * is the strongest available heuristic when no URL
   * keyword matches.
   */
  return nonFloorPlan[0];
}

/* =========================================================
   PRICE
========================================================= */

function extractJsonLdPrice(
  objects: JsonLdObject[]
): number {
  for (const object of objects) {
    const offers =
      object.offers;

    const offerObjects =
      Array.isArray(offers)
        ? offers
        : [offers];

    for (const offer of offerObjects) {
      if (!isObject(offer)) {
        continue;
      }

      const price =
        parseNumber(offer.price);

      if (
        price > 0 &&
        price < 100_000_000
      ) {
        return price;
      }
    }

    const directPrice =
      parseNumber(object.price);

    if (
      directPrice > 0 &&
      directPrice < 100_000_000
    ) {
      return directPrice;
    }
  }

  return 0;
}

function extractPrice(
  bodyText: string,
  jsonLd: JsonLdObject[]
): number {
  const jsonPrice =
    extractJsonLdPrice(jsonLd);

  if (jsonPrice > 0) {
    return jsonPrice;
  }

  const patterns = [
    /offers over\s*£\s*([\d,]+)/i,
    /offers in excess of\s*£\s*([\d,]+)/i,
    /guide price\s*£\s*([\d,]+)/i,
    /asking price\s*£\s*([\d,]+)/i,
    /price\s*£\s*([\d,]+)/i,
    /£\s*([\d,]{3,})/i,
  ];

  for (const pattern of patterns) {
    const match =
      bodyText.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const price =
      parseNumber(match[1]);

    if (
      price >= 10_000 &&
      price <= 100_000_000
    ) {
      return price;
    }
  }

  return 0;
}

/* =========================================================
   BEDROOMS / BATHROOMS / TYPE
========================================================= */

function extractPropertyDetails(
  bodyText: string,
  jsonLd: JsonLdObject[]
): {
  type: string;
  bedrooms: number;
  bathrooms: number;
} {
  let type =
    extractJsonLdType(jsonLd);

  let bedrooms = 0;
  let bathrooms = 0;

  const bedroomPatterns = [
    /(\d+)\s*bedrooms?\b/i,
    /(\d+)\s*beds?\b/i,
  ];

  const bathroomPatterns = [
    /(\d+)\s*bathrooms?\b/i,
    /(\d+)\s*baths?\b/i,
  ];

  for (const pattern of bedroomPatterns) {
    const match =
      bodyText.match(pattern);

    if (match?.[1]) {
      bedrooms =
        parseNumber(match[1]);

      break;
    }
  }

  for (const pattern of bathroomPatterns) {
    const match =
      bodyText.match(pattern);

    if (match?.[1]) {
      bathrooms =
        parseNumber(match[1]);

      break;
    }
  }

  if (bedrooms === 0) {
    const value =
      findJsonLdProperty(
        jsonLd,
        [
          "numberOfBedrooms",
          "bedrooms",
        ]
      );

    bedrooms =
      parseNumber(value);
  }

  if (bathrooms === 0) {
    const value =
      findJsonLdProperty(
        jsonLd,
        [
          "numberOfBathroomsTotal",
          "numberOfBathrooms",
          "bathrooms",
        ]
      );

    bathrooms =
      parseNumber(value);
  }

  if (!type) {
    const types = [
      "semi-detached",
      "semi detached",
      "detached",
      "end terrace",
      "end-terrace",
      "mid terrace",
      "mid-terrace",
      "terraced",
      "flat",
      "apartment",
      "bungalow",
      "cottage",
      "maisonette",
      "town house",
      "townhouse",
      "duplex",
      "mews",
      "studio",
    ];

    const lower =
      bodyText.toLowerCase();

    for (const candidate of types) {
      if (
        lower.includes(candidate)
      ) {
        type = candidate;
        break;
      }
    }
  }

  if (!type) {
    type = "Unknown";
  }

  return {
    type: cleanText(type),
    bedrooms,
    bathrooms,
  };
}

function extractFloorArea(
  bodyText: string,
  jsonLd: JsonLdObject[]
): number | null {

  // 1. Try JSON-LD first
  for (const object of jsonLd) {

    const possibleValues = [
      object.floorSize,
      object.floorArea,
      object.size,
      object.livingArea,
    ];

    for (const value of possibleValues) {

      if (typeof value === "string") {

        const match = value.match(
          /(\d{2,4})\s*(sq\s*ft|sqft|square feet|m²|sqm|square metres)/i
        );

        if (match?.[1]) {
          return Number(match[1]);
        }
      }
    }
  }


  // 2. Search page text
  const match = bodyText.match(
    /(\d{2,4})\s*(sq\s*ft|sqft|square feet|m²|sqm|square metres)/i
  );


  if (match?.[1]) {
    return Number(match[1]);
  }


  return null;
}

/* =========================================================
   ADDRESS
========================================================= */

function extractAddress(
  title: string,
  bodyText: string,
  jsonLd: JsonLdObject[]
): {
  address: string;
  postcode: string;
} {
  let address =
    extractJsonLdAddress(jsonLd);

  let postcode =
    extractJsonLdPostcode(jsonLd);

  if (!postcode) {
    postcode =
      findFullPostcode(
        `${title} ${bodyText}`
      );
  }

  if (!address) {
    const candidates = [
      title,
      bodyText.slice(0, 1000),
    ];

    for (const candidate of candidates) {
      const cleaned =
        cleanText(candidate);

      if (!cleaned) {
        continue;
      }

      const stripped =
        cleaned
          .replace(
            /^\d+\s*bed(?:room)?s?\s*/i,
            ""
          )
          .replace(
            /^property for sale\s*/i,
            ""
          )
          .replace(
            /^for sale\s*/i,
            ""
          )
          .trim();

      if (
        stripped.length > 5 &&
        stripped.length < 200
      ) {
        address = stripped;
        break;
      }
    }
  }

  if (address && postcode) {
    const escapedPostcode =
      postcode.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    address =
      address
        .replace(
          new RegExp(
            escapedPostcode,
            "i"
          ),
          ""
        )
        .replace(
          /,\s*$/,
          ""
        )
        .trim();
  }

  return {
    address: cleanText(address),
    postcode: cleanText(postcode),
  };
}

/* =========================================================
   DESCRIPTION
========================================================= */

async function extractDescription(
  page: Page,
  bodyText: string,
  jsonLd: JsonLdObject[]
): Promise<string> {
  const jsonDescription =
    findJsonLdProperty(
      jsonLd,
      ["description"]
    );

  if (
    typeof jsonDescription ===
      "string" &&
    cleanText(jsonDescription).length > 30
  ) {
    return cleanText(
      jsonDescription
    ).slice(0, 10_000);
  }

  const selectors = [
    '[data-testid*="description"]',
    '[data-testid*="Description"]',
    '[class*="description"]',
    '[class*="Description"]',
    '[id*="description"]',
    "article p",
    "main p",
  ];

  for (const selector of selectors) {
    try {
      const locator =
        page.locator(selector);

      const count =
        await locator.count();

      if (count === 0) {
        continue;
      }

      const texts =
        await locator.allInnerTexts();

      const combined =
        texts
          .map(cleanText)
          .filter(
            (text) =>
              text.length > 30
          )
          .join(" ");

      if (combined.length > 30) {
        return combined.slice(
          0,
          10_000
        );
      }
    } catch {
      continue;
    }
  }

  return bodyText.slice(0, 3000);
}

/* =========================================================
   AGENT
========================================================= */

async function extractAgent(
  page: Page,
  jsonLd: JsonLdObject[],
  bodyText: string
): Promise<string> {
  for (const object of jsonLd) {
    const seller =
      object.seller;

    if (typeof seller === "string") {
      const value =
        cleanText(seller);

      if (value) {
        return value;
      }
    }

    if (isObject(seller)) {
      const name =
        seller.name;

      if (typeof name === "string") {
        const value =
          cleanText(name);

        if (value) {
          return value;
        }
      }
    }

    const provider =
      object.provider;

    if (isObject(provider)) {
      const name =
        provider.name;

      if (typeof name === "string") {
        const value =
          cleanText(name);

        if (value) {
          return value;
        }
      }
    }
  }

  const selectors = [
    '[data-testid*="agent"]',
    '[data-testid*="Agent"]',
    '[class*="agent-name"]',
    '[class*="agentName"]',
    '[class*="estate-agent"]',
    '[class*="estateAgent"]',
    '[class*="branch-name"]',
    '[class*="branchName"]',
    '[class*="agent"]',
  ];

  for (const selector of selectors) {
    try {
      const locator =
        page.locator(selector);

      if (
        (await locator.count()) === 0
      ) {
        continue;
      }

      const text =
        cleanText(
          await locator
            .first()
            .innerText()
        );

      if (
        text &&
        text.length < 200
      ) {
        return text;
      }
    } catch {
      continue;
    }
  }

  const patterns = [
    /marketed by\s+(.+?)(?=\s+(?:call|request|contact|email|telephone|tel)\b)/i,
    /agent\s*[:\-]\s*(.+?)(?=\s+(?:call|contact)\b)/i,
    /estate agent\s*[:\-]\s*(.+?)(?=\s+(?:call|contact)\b)/i,
  ];

  for (const pattern of patterns) {
    const match =
      bodyText.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const value =
      cleanText(match[1]);

    if (
      value &&
      value.length < 200
    ) {
      return value;
    }
  }

  return "";
}

/* =========================================================
   DATE LISTED
========================================================= */

function extractDateListed(
  bodyText: string,
  jsonLd: JsonLdObject[]
): string | null {
  const jsonDate =
    findJsonLdProperty(
      jsonLd,
      [
        "datePosted",
        "datePublished",
        "dateCreated",
      ]
    );

  if (typeof jsonDate === "string") {
    const date =
      new Date(jsonDate);

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date.toISOString();
    }
  }

  const patterns = [
    /added on\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    /listed on\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    /added\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    /listed\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match =
      bodyText.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const date =
      new Date(match[1]);

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return date.toISOString();
    }
  }

  return null;
}

/* =========================================================
   WAIT / COOKIE HANDLING
========================================================= */

async function handleCommonPopups(
  page: Page
): Promise<void> {
  const selectors = [
    'button:has-text("Accept all")',
    'button:has-text("Accept All")',
    'button:has-text("Accept cookies")',
    'button:has-text("I agree")',
    'button:has-text("Allow all")',
    '[id*="accept"]',
  ];

  for (const selector of selectors) {
    try {
      const locator =
        page.locator(selector);

      if (
        (await locator.count()) > 0
      ) {
        await locator
          .first()
          .click({
            timeout: 1500,
          });

        await page.waitForTimeout(500);

        break;
      }
    } catch {
      // Popup wasn't present.
    }
  }
}

/* =========================================================
   URL NORMALISATION
========================================================= */

function normalizeListingUrl(url: string): string {
  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes("zoopla.co.uk")
    ) {
      const match = parsed.pathname.match(
        /\/details\/(\d+)\//
      );

      if (match?.[1]) {
        return `https://www.zoopla.co.uk/for-sale/details/${match[1]}/`;
      }
    }

    parsed.search = "";
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return url;
  }
}

/* =========================================================
   EXTERNAL ID
========================================================= */

function createExternalId(
  url: string,
  source: string
): string {
  const normalizedUrl =
    normalizeListingUrl(url);

  const hash =
    crypto
      .createHash("sha256")
      .update(`${source}|${normalizedUrl}`)
      .digest("hex")
      .slice(0, 40);

  return `${source}-${hash}`;
}

/* =========================================================
   MAIN IMPORTER
========================================================= */

export async function importProperty(
  url: string
): Promise<ImportedProperty> {
  if (
    !url ||
    !/^https?:\/\//i.test(url)
  ) {
    throw new Error(
      "A valid property listing URL is required"
    );
  }

  const sourceInfo =
    detectSource(url);

  console.log(
    "========================================"
  );

  console.log(
    "PROPERTY IMPORT"
  );

  console.log("URL:", url);
  console.log(
    "SOURCE:",
    sourceInfo.source
  );
  console.log(
    "HOST:",
    sourceInfo.hostname
  );

  console.log(
    "========================================"
  );

  const browser =
    await chromium.launch({
      headless: true,
    });

  try {
    const page =
      await browser.newPage({
        viewport: {
          width: 1440,
          height: 1000,
        },

        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151 Safari/537.36",

        locale: "en-GB",
      });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    await page.waitForTimeout(4_000);

    await handleCommonPopups(page);

    /*
     * Scroll progressively through the page so
     * lazy-loaded gallery images have a chance
     * to load.
     */

    try {
      await page.evaluate(async () => {
        const maxScroll =
          Math.max(
            document.body.scrollHeight,
            document.documentElement
              .scrollHeight
          );

        const step = 700;

        for (
          let position = 0;
          position < maxScroll;
          position += step
        ) {
          window.scrollTo(
            0,
            position
          );

          await new Promise<void>(
            (resolve) =>
              setTimeout(
                resolve,
                250
              )
          );
        }

        window.scrollTo(0, 0);
      });

      await page.waitForTimeout(1500);
    } catch {
      // Not fatal.
    }

    const title =
      cleanText(
        await page.title()
      );

    const bodyText =
      cleanText(
        await page
          .locator("body")
          .innerText()
      );

    const jsonLd =
      await extractJsonLd(page);

    console.log(
      "JSON-LD objects:",
      jsonLd.length
    );

    const extractedAddress =
      extractAddress(
        title,
        bodyText,
        jsonLd
      );

    let address =
      extractedAddress.address;

    let postcode =
      extractedAddress.postcode;

    if (!address) {
      const headings =
        await page
          .locator("h1, h2")
          .allInnerTexts();

      for (const heading of headings) {
        const cleaned =
          cleanText(heading);

        if (
          cleaned.length < 200 &&
          cleaned.length > 5
        ) {
          address = cleaned;
          break;
        }
      }
    }

    if (!postcode) {
      postcode =
        findFullPostcode(
          `${title} ${address} ${bodyText.slice(
            0,
            5000
          )}`
        );
    }

    if (!postcode) {
      postcode =
        findPostcodeDistrict(
          `${title} ${address}`
        );
    }

    address =
      cleanText(address) ||
      "Address unavailable";

    const houseNumber =
      extractHouseNumber(address);

    const details =
  extractPropertyDetails(
    bodyText,
    jsonLd
  );

const price =
  extractPrice(
    bodyText,
    jsonLd
  );

const floorArea =
  extractFloorArea(
    bodyText,
    jsonLd
  );

    const description =
      await extractDescription(
        page,
        bodyText,
        jsonLd
      );

    const agent =
      await extractAgent(
        page,
        jsonLd,
        bodyText
      );

    const images =
      await extractImages(
        page,
        jsonLd
      );

    const floorPlans =
      await extractFloorPlanImages(page, sourceInfo.source);

    const primaryPhoto =
      detectFrontOfHouse(images, floorPlans);

    const dateListed =
      extractDateListed(
        bodyText,
        jsonLd
      );

    const externalId =
      createExternalId(
        url,
        sourceInfo.source
      );

    const result: ImportedProperty = {
  externalId,
  source:
    sourceInfo.source,
  listingUrl:
    url,
  address,
  houseNumber,
  postcode,
  type:
    details.type,
  images,
  floorPlans,
  primaryPhoto,
  bedrooms:
    details.bedrooms,
  bathrooms:
    details.bathrooms,
  price,
  floorArea,
  description,
  agent,
  dateListed,
};

    console.log(
      "========================================"
    );

    console.log(
      "EXTRACTED PROPERTY"
    );

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );

    console.log(
      "========================================"
    );

    return result;
    } finally {
    await browser.close();
  }
}