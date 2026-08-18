
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
  bedrooms: number;
  bathrooms: number;
  price: number;
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

  if (
    hostname.includes("rightmove.co.uk") ||
    hostname.includes("rightmove.com")
  ) {
    return {
      source: "rightmove",
      hostname,
    };
  }

  if (
    hostname.includes("onthemarket.com") ||
    hostname.includes("onthemarket.co.uk")
  ) {
    return {
      source: "onthemarket",
      hostname,
    };
  }

  if (
    hostname.includes("zoopla.co.uk") ||
    hostname.includes("zoopla.com")
  ) {
    return {
      source: "zoopla",
      hostname,
    };
  }

  if (
    hostname.includes("primelocation.com") ||
    hostname.includes("primelocation.co.uk")
  ) {
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
    .evaluateAll(
      (elements: Element[]) =>
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
        lower.includes("singlefamily") ||
        lower.includes("product")
      ) {
        return cleanText(type);
      }
    }

    if (typeof object.additionalType === "string") {
      return cleanText(object.additionalType);
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
      images.push(...collectImageValue(item));
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

    const imageUrl = value.imageUrl;

    if (typeof imageUrl === "string") {
      images.push(imageUrl);
    }
  }

  return images;
}

/* =========================================================
   IMAGE URL CLEANING
========================================================= */

function cleanImageUrl(
  value: string
): string {
  if (!value) {
    return "";
  }

  let url = value.trim();

  // Remove Markdown-style wrappers if they somehow
  // arrive in scraped content.
  url = url
    .replace(/^["']+/, "")
    .replace(/["']+$/, "");

  if (url.startsWith("//")) {
    url = `https:${url}`;
  }

  // Zoopla sometimes exposes the :p transformation
  // suffix. It is not part of the actual image URL.
  url = url.replace(/:p$/i, "");

  if (!/^https?:\/\//i.test(url)) {
    return "";
  }

  try {
    const parsed = new URL(url);

    // Remove tracking/query parameters.
    parsed.search = "";
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return "";
  }
}

/* =========================================================
   IMAGE FILTERING
========================================================= */

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

  /* -------------------------------------------------------
     Tracking / telemetry
  ------------------------------------------------------- */

  const trackingTerms = [
    "bat.bing.com",
    "doubleclick",
    "google-analytics",
    "googleadservices",
    "facebook.com/tr",
    "pixel",
    "tracking",
    "beacon",
    "analytics",
    "telemetry",
  ];

  if (
    trackingTerms.some((term) =>
      combined.includes(term)
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     Maps
  ------------------------------------------------------- */

  const mapTerms = [
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
  ];

  if (
    mapTerms.some((term) =>
      combined.includes(term)
    )
  ) {
    return true;
  }

  /* -------------------------------------------------------
     Known map hosts
  ------------------------------------------------------- */

  const blockedHosts = [
    "maps.prod.zoopla.co.uk",
    "maps.googleapis.com",
    "maps.google.com",
    "maps.gstatic.com",
    "tile.openstreetmap.org",
    "tiles.openstreetmap.org",
    "mapbox.com",
    "tiles.mapbox.com",
  ];

  try {
    const hostname =
      new URL(url).hostname.toLowerCase();

    if (
      blockedHosts.some((host) =>
        hostname.includes(host)
      )
    ) {
      return true;
    }
  } catch {
    return true;
  }

  /* -------------------------------------------------------
     Website graphics / non-property images
  ------------------------------------------------------- */

  const blockedTerms = [
    "logo",
    "icon",
    "avatar",
    "agent-photo",
    "agentphoto",
    "agent_photo",
    "agent-image",
    "agentimage",
    "agent_image",
    "branch",
    "branch-photo",
    "branchphoto",
    "floorplan",
    "floor-plan",
    "floor_plan",
    "floor plan",
    "epc",
    "energy-performance",
    "energyperformance",
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
    "street-view",
    "streetview",
    "commute",
    "transport",
  ];

  if (
    blockedTerms.some((term) =>
      combined.includes(term)
    )
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   IMAGE QUALITY
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
};

function scoreImageCandidate(
  candidate: ImageCandidate
): number {
  let score = 0;

  /*
   * Large images are much more likely to be actual
   * listing photographs.
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
    score += 10;
  }

  /*
   * Reasonable photographic aspect ratios.
   */

  const ratio =
    candidate.width > 0 &&
    candidate.height > 0
      ? candidate.width / candidate.height
      : 0;

  if (
    ratio >= 0.55 &&
    ratio <= 2.4
  ) {
    score += 10;
  }

  /*
   * Gallery-related attributes.
   */

  score += candidate.galleryScore;

  /*
   * JSON-LD is generally a strong source because
   * it often contains actual listing photographs.
   */

  score += candidate.sourcePriority;

  /*
   * Extremely wide/tall images are often banners
   * or website graphics.
   */

  if (
    ratio > 3.2 ||
    ratio < 0.35
  ) {
    score -= 30;
  }

  return score;
}

/* =========================================================
   IMAGE KEY / DEDUPLICATION
========================================================= */

/*
 * Portals frequently expose the exact same photograph
 * through several URLs:
 *
 *   /480/360/image.jpg
 *   /1024/768/image.jpg
 *   /max/1200/image.jpg
 *   image.jpg?width=1024
 *
 * We want ONE copy of the photograph, preferably the
 * highest-quality version.
 */

function normaliseImageKey(
  url: string
): string {
  let value = url
    .toLowerCase()
    .trim();

  try {
    const parsed = new URL(value);

    parsed.search = "";
    parsed.hash = "";

    value = parsed.toString();
  } catch {
    // Continue with string normalisation.
  }

  value = value
    .replace(/:p$/i, "")
    .replace(
      /\/(?:u\/)?\d+\/\d+\//gi,
      "/"
    )
    .replace(
      /\/(?:max|width|height)[-_]?\d+(?:x\d+)?\//gi,
      "/"
    )
    .replace(
      /[-_](?:width|height|size|quality)[-_]?\d+(?:x\d+)?/gi,
      ""
    )
    .replace(
      /[?&](?:width|height|size|quality|format)=[^&]+/gi,
      ""
    );

  return value;
}

/* =========================================================
   PROGRESSIVE LAZY LOADING
========================================================= */

/*
 * Many portals do NOT put all property photographs into
 * the DOM immediately.
 *
 * This function progressively scrolls through the page,
 * giving lazy-loaded galleries time to request their
 * remaining images.
 *
 * There is deliberately NO "20 photos" or other arbitrary
 * stopping point.
 */

async function loadAllLazyImages(
  page: Page
): Promise<void> {
  try {
    await page.evaluate(async () => {
      const delay = (ms: number) =>
        new Promise<void>((resolve) =>
          setTimeout(resolve, ms)
        );

      const maxIdleRounds = 4;

      let idleRounds = 0;
      let previousHeight = 0;
      let previousImageCount = 0;

      for (let round = 0; round < 80; round++) {
        const currentHeight =
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          );

        window.scrollTo({
          top: currentHeight,
          behavior: "auto",
        });

        await delay(500);

        const imageCount =
          document.images.length;

        const newHeight =
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
          );

        if (
          newHeight === previousHeight &&
          imageCount === previousImageCount
        ) {
          idleRounds++;
        } else {
          idleRounds = 0;
        }

        previousHeight = newHeight;
        previousImageCount = imageCount;

        /*
         * Once the page has stopped growing and no new
         * images are appearing for several rounds, we can
         * assume lazy loading has finished.
         */

        if (idleRounds >= maxIdleRounds) {
          break;
        }
      }

      /*
       * Return to the top so any gallery currently
       * visible near the top is left in a sensible state.
       */

      window.scrollTo({
        top: 0,
        behavior: "auto",
      });
    });
  } catch {
    // Lazy loading failure is not fatal.
  }

  /*
   * Give network requests a final opportunity to finish.
   */

  await page.waitForTimeout(1000);
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

  /* -------------------------------------------------------
     JSON-LD IMAGES
  ------------------------------------------------------- */

  for (const object of jsonLd) {
    const values = [
      object.image,
      object.images,
      object.photo,
      object.photos,
      object.contentUrl,
      object.imageUrl,
    ];

    for (const value of values) {
      for (const image of collectImageValue(value)) {
        const cleaned =
          cleanImageUrl(image);

        if (!cleaned) {
          continue;
        }

        if (
          isProbablyBadImage(cleaned)
        ) {
          continue;
        }

        const key =
          normaliseImageKey(cleaned);

        const existing =
          candidates.get(key);

        if (existing) {
          /*
           * Prefer the longer/higher-quality URL if the
           * portal gives us multiple variants.
           */

          if (
            cleaned.length >
            existing.url.length
          ) {
            existing.url = cleaned;
          }

          continue;
        }

        candidates.set(
          key,
          {
            url: cleaned,
            alt: "",
            title: "",
            className: "",
            width: 0,
            height: 0,
            area: 0,
            galleryScore: 10,
            sourcePriority: 30,
          }
        );
      }
    }
  }

  /* -------------------------------------------------------
     IMG ELEMENTS
  ------------------------------------------------------- */

  const imageElements =
    await page
      .locator("img")
      .evaluateAll(
        (elements: Element[]) =>
          elements.map(
            (element) => {
              const img =
                element as HTMLImageElement;

              const parent =
                img.closest(
                  "a, button, figure, li, div"
                );

              const parentClass =
                parent instanceof HTMLElement
                  ? String(parent.className || "")
                  : "";

              const parentText =
                parent instanceof HTMLElement
                  ? parent.innerText || ""
                  : "";

              const values: string[] = [];

              if (img.currentSrc) {
                values.push(
                  img.currentSrc
                );
              }

              if (img.src) {
                values.push(
                  img.src
                );
              }

              for (const attribute of [
                "data-src",
                "data-lazy-src",
                "data-original",
                "data-image",
                "data-url",
                "data-large",
                "data-full",
                "data-full-src",
                "data-full-image",
                "data-image-url",
              ]) {
                const value =
                  img.getAttribute(
                    attribute
                  );

                if (value) {
                  values.push(value);
                }
              }

              const srcset =
                img.getAttribute(
                  "srcset"
                );

              if (srcset) {
                values.push(
                  ...srcset
                    .split(",")
                    .map(
                      (item) =>
                        item
                          .trim()
                          .split(/\s+/)[0]
                    )
                    .filter(Boolean)
                );
              }

              /*
               * Some portals store responsive images
               * in data-srcset rather than srcset.
               */

              const dataSrcset =
                img.getAttribute(
                  "data-srcset"
                );

              if (dataSrcset) {
                values.push(
                  ...dataSrcset
                    .split(",")
                    .map(
                      (item) =>
                        item
                          .trim()
                          .split(/\s+/)[0]
                    )
                    .filter(Boolean)
                );
              }

              const className =
                typeof img.className ===
                "string"
                  ? img.className
                  : "";

              const alt =
                img.getAttribute(
                  "alt"
                ) || "";

              const title =
                img.getAttribute(
                  "title"
                ) || "";

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
                galleryScore += 20;
              }

              if (
                galleryText.includes(
                  "carousel"
                )
              ) {
                galleryScore += 15;
              }

              if (
                galleryText.includes(
                  "property"
                )
              ) {
                galleryScore += 10;
              }

              if (
                galleryText.includes(
                  "photo"
                )
              ) {
                galleryScore += 5;
              }

              if (
                galleryText.includes(
                  "listing"
                )
              ) {
                galleryScore += 5;
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
            }
          )
      );

  for (const element of imageElements) {
    for (const image of element.values) {
      const cleaned =
        cleanImageUrl(image);

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

      /*
       * Ignore tiny images when actual dimensions are
       * available. If dimensions are unavailable, keep it
       * because some lazy-loaded property images initially
       * report zero dimensions.
       */

      if (
        element.width > 0 &&
        element.height > 0
      ) {
        if (
          element.width < 250 ||
          element.height < 180
        ) {
          continue;
        }
      }

      const key =
        normaliseImageKey(cleaned);

      const existing =
        candidates.get(key);

      if (existing) {
        /*
         * Keep the highest-resolution version.
         */

        const existingArea =
          existing.width *
          existing.height;

        const newArea =
          element.width *
          element.height;

        if (
          newArea > existingArea
        ) {
          existing.url =
            cleaned;

          existing.width =
            element.width;

          existing.height =
            element.height;

          existing.area =
            newArea;
        }

        existing.galleryScore =
          Math.max(
            existing.galleryScore,
            element.galleryScore
          );

        continue;
      }

      candidates.set(
        key,
        {
          url: cleaned,
          alt: element.alt,
          title: element.title,
          className: element.className,
          width: element.width,
          height: element.height,
          area:
            element.width *
            element.height,
          galleryScore:
            element.galleryScore,
          sourcePriority: 10,
        }
      );
    }
  }

  /* -------------------------------------------------------
     OPEN GRAPH IMAGE
  ------------------------------------------------------- */

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

    if (
      isProbablyBadImage(cleaned)
    ) {
      continue;
    }

    const key =
      normaliseImageKey(cleaned);

    if (!candidates.has(key)) {
      candidates.set(
        key,
        {
          url: cleaned,
          alt: "",
          title: "",
          className: "",
          width: 0,
          height: 0,
          area: 0,
          galleryScore: 0,
          sourcePriority: 5,
        }
      );
    }
  }

  /* -------------------------------------------------------
     SCORE AND SORT
  ------------------------------------------------------- */

  const scored =
    Array.from(
      candidates.values()
    ).map(
      (candidate) => ({
        candidate,
        score:
          scoreImageCandidate(
            candidate
          ),
      })
    );

  scored.sort(
    (a, b) =>
      b.score - a.score
  );

  /*
   * IMPORTANT:
   *
   * There is NO maximum image count here.
   *
   * If Zoopla has 14 genuine property photos,
   * we return all 14.
   *
   * If it has 25, we return 25.
   *
   * If it has 40, we return 40.
   *
   * The only photos removed are duplicates or images
   * classified as non-property/website graphics.
   */

  const finalImages: string[] = [];

  const finalKeys =
    new Set<string>();

  for (const item of scored) {
    const image =
      item.candidate;

    const key =
      normaliseImageKey(
        image.url
      );

    if (
      finalKeys.has(key)
    ) {
      continue;
    }

    finalKeys.add(key);

    finalImages.push(
      image.url
    );
  }

  console.log(
    "========================================"
  );

  console.log(
    "PROPERTY IMAGE EXTRACTION"
  );

  console.log(
    "IMAGE CANDIDATES:",
    candidates.size
  );

  console.log(
    "FINAL PROPERTY PHOTOS:",
    finalImages.length
  );

  finalImages.forEach(
    (image, index) => {
      console.log(
        `${index + 1}. ${image}`
      );
    }
  );

  console.log(
    "========================================"
  );

  return finalImages;
}

/* =========================================================
   PRICE
========================================================= */

function extractJsonLdPrice(
  objects: JsonLdObject[]
): number {
  for (const object of objects) {
    const offers = object.offers;

    const offerObjects =
      Array.isArray(offers)
        ? offers
        : [offers];

    for (const offer of offerObjects) {
      if (!isObject(offer)) {
        continue;
      }

      const price =
        parseNumber(
          offer.price
        );

      if (
        price > 0 &&
        price < 100000000
      ) {
        return price;
      }
    }

    const directPrice =
      parseNumber(
        object.price
      );

    if (
      directPrice > 0 &&
      directPrice < 100000000
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
    extractJsonLdPrice(
      jsonLd
    );

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
      bodyText.match(
        pattern
      );

    if (!match?.[1]) {
      continue;
    }

    const price =
      parseNumber(
        match[1]
      );

    if (
      price >= 10000 &&
      price <= 100000000
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
    extractJsonLdType(
      jsonLd
    );

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

  for (
    const pattern of
    bedroomPatterns
  ) {
    const match =
      bodyText.match(
        pattern
      );

    if (match?.[1]) {
      bedrooms =
        parseNumber(
          match[1]
        );

      break;
    }
  }

  for (
    const pattern of
    bathroomPatterns
  ) {
    const match =
      bodyText.match(
        pattern
      );

    if (match?.[1]) {
      bathrooms =
        parseNumber(
          match[1]
        );

      break;
    }
  }

  if (
    bedrooms === 0
  ) {
    const value =
      findJsonLdProperty(
        jsonLd,
        [
          "numberOfBedrooms",
          "bedrooms",
        ]
      );

    bedrooms =
      parseNumber(
        value
      );
  }

  if (
    bathrooms === 0
  ) {
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
      parseNumber(
        value
      );
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

    for (
      const candidate of
      types
    ) {
      if (
        lower.includes(
          candidate
        )
      ) {
        type =
          candidate;

        break;
      }
    }
  }

  if (!type) {
    type = "Unknown";
  }

  return {
    type:
      cleanText(type),
    bedrooms,
    bathrooms,
  };
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
    extractJsonLdAddress(
      jsonLd
    );

  let postcode =
    extractJsonLdPostcode(
      jsonLd
    );

  if (!postcode) {
    postcode =
      findFullPostcode(
        `${title} ${bodyText}`
      );
  }

  if (!address) {
    const candidates = [
      title,
      bodyText.slice(
        0,
        1000
      ),
    ];

    for (
      const candidate of
      candidates
    ) {
      const cleaned =
        cleanText(
          candidate
        );

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
        address =
          stripped;

        break;
      }
    }
  }

  if (
    address &&
    postcode
  ) {
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
    address:
      cleanText(address),
    postcode:
      cleanText(postcode),
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
    cleanText(
      jsonDescription
    ).length > 30
  ) {
    return cleanText(
      jsonDescription
    ).slice(
      0,
      10000
    );
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

  for (
    const selector of
    selectors
  ) {
    try {
      const locator =
        page.locator(
          selector
        );

      const count =
        await locator.count();

      if (
        count === 0
      ) {
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

      if (
        combined.length > 30
      ) {
        return combined.slice(
          0,
          10000
        );
      }
    } catch {
      continue;
    }
  }

  return bodyText.slice(
    0,
    3000
  );
}

/* =========================================================
   AGENT
========================================================= */

async function extractAgent(
  page: Page,
  jsonLd: JsonLdObject[],
  bodyText: string
): Promise<string> {
  for (
    const object of
    jsonLd
  ) {
    const seller =
      object.seller;

    if (
      typeof seller ===
      "string"
    ) {
      const value =
        cleanText(
          seller
        );

      if (value) {
        return value;
      }
    }

    if (
      isObject(seller)
    ) {
      const name =
        seller.name;

      if (
        typeof name ===
        "string"
      ) {
        const value =
          cleanText(
            name
          );

        if (value) {
          return value;
        }
      }
    }

    const provider =
      object.provider;

    if (
      isObject(provider)
    ) {
      const name =
        provider.name;

      if (
        typeof name ===
        "string"
      ) {
        const value =
          cleanText(
            name
          );

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

  for (
    const selector of
    selectors
  ) {
    try {
      const locator =
        page.locator(
          selector
        );

      if (
        (await locator.count()) ===
        0
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

  for (
    const pattern of
    patterns
  ) {
    const match =
      bodyText.match(
        pattern
      );

    if (
      match?.[1]
    ) {
      const value =
        cleanText(
          match[1]
        );

      if (
        value &&
        value.length < 200
      ) {
        return value;
      }
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

  if (
    typeof jsonDate ===
    "string"
  ) {
    const date =
      new Date(
        jsonDate
      );

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

  for (
    const pattern of
    patterns
  ) {
    const match =
      bodyText.match(
        pattern
      );

    if (
      !match?.[1]
    ) {
      continue;
    }

    const date =
      new Date(
        match[1]
      );

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

  for (
    const selector of
    selectors
  ) {
    try {
      const locator =
        page.locator(
          selector
        );

      if (
        (await locator.count()) >
        0
      ) {
        await locator
          .first()
          .click({
            timeout: 1500,
          });

        await page.waitForTimeout(
          500
        );

        break;
      }
    } catch {
      // Popup wasn't present or couldn't be clicked.
    }
  }
}

/* =========================================================
   EXTERNAL ID
========================================================= */

function createExternalId(
  url: string,
  source: string
): string {
  const hash =
    crypto
      .createHash(
        "sha256"
      )
      .update(
        `${source}|${url}`
      )
      .digest("hex")
      .slice(
        0,
        40
      );

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
    !/^https?:\/\//i.test(
      url
    )
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

  console.log(
    "URL:",
    url
  );

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

        locale:
          "en-GB",
      });

    await page.goto(
      url,
      {
        waitUntil:
          "domcontentloaded",
        timeout: 45000,
      }
    );

    await page.waitForTimeout(
      4000
    );

    await handleCommonPopups(
      page
    );

    /*
     * IMPORTANT:
     *
     * Load the entire lazy-loaded page before extracting
     * images.
     *
     * This is what allows a Zoopla listing with 14 photos
     * to return all 14 instead of only the first few.
     */

    await loadAllLazyImages(
      page
    );

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
      await extractJsonLd(
        page
      );

    console.log(
      "JSON-LD objects:",
      jsonLd.length
    );

    /* -----------------------------------------------------
       ADDRESS
    ----------------------------------------------------- */

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
          .locator(
            "h1, h2"
          )
          .allInnerTexts();

      for (
        const heading of
        headings
      ) {
        const cleaned =
          cleanText(
            heading
          );

        if (
          cleaned.length < 200 &&
          cleaned.length > 5
        ) {
          address =
            cleaned;

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
      cleanText(
        address
      ) ||
      "Address unavailable";

    const houseNumber =
      extractHouseNumber(
        address
      );

    /* -----------------------------------------------------
       PROPERTY DETAILS
    ----------------------------------------------------- */

    const details =
      extractPropertyDetails(
        bodyText,
        jsonLd
      );

    /* -----------------------------------------------------
       PRICE
    ----------------------------------------------------- */

    const price =
      extractPrice(
        bodyText,
        jsonLd
      );

    /* -----------------------------------------------------
       DESCRIPTION
    ----------------------------------------------------- */

    const description =
      await extractDescription(
        page,
        bodyText,
        jsonLd
      );

    /* -----------------------------------------------------
       AGENT
    ----------------------------------------------------- */

    const agent =
      await extractAgent(
        page,
        jsonLd,
        bodyText
      );

    /* -----------------------------------------------------
       ALL PROPERTY PHOTOS
    ----------------------------------------------------- */

    const images =
      await extractImages(
        page,
        jsonLd
      );

    /* -----------------------------------------------------
       DATE
    ----------------------------------------------------- */

    const dateListed =
      extractDateListed(
        bodyText,
        jsonLd
      );

    /* -----------------------------------------------------
       EXTERNAL ID
    ----------------------------------------------------- */

    const externalId =
      createExternalId(
        url,
        sourceInfo.source
      );

    const result:
      ImportedProperty = {
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
        bedrooms:
          details.bedrooms,
        bathrooms:
          details.bathrooms,
        price,
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