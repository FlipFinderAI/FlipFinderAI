import { chromium, type Page } from "playwright";
import fs from "fs";
import path from "path";

export type ImportedProperty = {
  externalId: string;
  source: string;
  listingUrl: string;
  address: string;
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

  const cleaned = value.replace(/[^\d.]/g, "");

  if (!cleaned) {
    return 0;
  }

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

/* =========================================================
   POSTCODE
========================================================= */

function normalisePostcode(value: string): string {
  const cleaned = cleanText(value)
    .toUpperCase()
    .replace(/\s+/g, "");

  const match = cleaned.match(
    /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/
  );

  if (!match) {
    return cleanText(value)
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  return `${match[1]} ${match[2]}`;
}

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
   ADDRESS
========================================================= */

function extractTitleAddress(
  title: string
): {
  address: string;
  postcode: string;
} {
  const cleanedTitle = cleanText(title);

  const saleMatch = cleanedTitle.match(
    /for sale in\s+(.+?)(?:\s+\|\s*Rightmove|\s+-\s*Rightmove|\s+Rightmove|$)/i
  );

  if (!saleMatch?.[1]) {
    return {
      address: "",
      postcode: "",
    };
  }

  const location = cleanText(saleMatch[1]);

  const fullPostcode =
    findFullPostcode(location);

  if (fullPostcode) {
    const escapedPostcode =
      fullPostcode.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const address = cleanText(
      location
        .replace(
          new RegExp(
            escapedPostcode,
            "i"
          ),
          ""
        )
        .replace(/,\s*$/, "")
    );

    return {
      address,
      postcode: fullPostcode,
    };
  }

  const district =
    findPostcodeDistrict(location);

  if (district) {
    const escapedDistrict =
      district.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const address = cleanText(
      location
        .replace(
          new RegExp(
            `,?\\s*${escapedDistrict}\\s*$`,
            "i"
          ),
          ""
        )
        .replace(/,\s*$/, "")
    );

    return {
      address,
      postcode: district,
    };
  }

  return {
    address: location,
    postcode: "",
  };
}

/* =========================================================
   PROPERTY DETAILS
========================================================= */

function extractPropertyDetails(
  bodyText: string
): {
  type: string;
  bedrooms: number;
  bathrooms: number;
} {
  let type = "Unknown";
  let bedrooms = 0;
  let bathrooms = 0;

  const typeMatch =
    bodyText.match(
      /PROPERTY TYPE\s+(.+?)(?=\s+BEDROOMS\b)/i
    );

  if (typeMatch?.[1]) {
    type = cleanText(typeMatch[1]);
  }

  const bedroomMatch =
    bodyText.match(
      /BEDROOMS\s+(\d+)/i
    );

  if (bedroomMatch?.[1]) {
    bedrooms = parseNumber(
      bedroomMatch[1]
    );
  }

  const bathroomMatch =
    bodyText.match(
      /BATHROOMS\s+(\d+)/i
    );

  if (bathroomMatch?.[1]) {
    bathrooms = parseNumber(
      bathroomMatch[1]
    );
  }

  if (type.toLowerCase() === "unknown") {
    const types = [
      "Semi-detached",
      "Semi Detached",
      "Detached",
      "End terrace",
      "End-terrace",
      "Mid terrace",
      "Mid-terrace",
      "Terraced",
      "Flat",
      "Apartment",
      "Bungalow",
      "Cottage",
      "Maisonette",
      "Town house",
      "Townhouse",
    ];

    for (const propertyType of types) {
      if (
        bodyText
          .toLowerCase()
          .includes(
            propertyType.toLowerCase()
          )
      ) {
        type = propertyType;
        break;
      }
    }
  }

  return {
    type,
    bedrooms,
    bathrooms,
  };
}

/* =========================================================
   PRICE
========================================================= */

function extractPrice(
  bodyText: string,
  address: string
): number {
  if (address) {
    const escapedAddress =
      address.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const addressPattern =
      new RegExp(
        `${escapedAddress}[\\s\\S]{0,300}?£\\s*([\\d,]+)`,
        "i"
      );

    const addressMatch =
      bodyText.match(
        addressPattern
      );

    if (addressMatch?.[1]) {
      const price = parseNumber(
        addressMatch[1]
      );

      if (price > 0) {
        return price;
      }
    }
  }

  const firstPrice =
    bodyText.match(
      /£\s*([\d,]+)/
    );

  if (firstPrice?.[1]) {
    return parseNumber(
      firstPrice[1]
    );
  }

  return 0;
}

/* =========================================================
   DESCRIPTION
========================================================= */

async function extractDescription(
  page: Page,
  bodyText: string
): Promise<string> {
  const selectors = [
    "[data-testid*='description']",
    "[class*='description']",
    "main p",
  ];

  for (const selector of selectors) {
    const locator =
      page.locator(selector);

    if (
      (await locator.count()) > 0
    ) {
      const text =
        cleanText(
          await locator
            .first()
            .innerText()
        );

      if (text.length > 30) {
        return text;
      }
    }
  }

  return bodyText.slice(
    0,
    2000
  );
}

/* =========================================================
   AGENT
========================================================= */

async function extractAgent(
  page: Page
): Promise<string> {
  const selectors = [
    "[data-testid*='agent']",
    "[class*='agent-name']",
    "[class*='agentName']",
    "[class*='estate-agent']",
    "[class*='estateAgent']",
    "[class*='branch-name']",
    "[class*='branchName']",
  ];

  for (const selector of selectors) {
    const locator =
      page.locator(selector);

    if (
      (await locator.count()) > 0
    ) {
      const text =
        cleanText(
          await locator
            .first()
            .innerText()
        );

      if (text) {
        return text;
      }
    }
  }

  const bodyText =
    cleanText(
      await page
        .locator("body")
        .innerText()
    );

  const marketedByMatch =
    bodyText.match(
      /MARKETED BY\s+(.+?)(?=\s+\d+\s+.+?\s+[A-Z]{1,2}\d|\s+Call agent|\s+Request details)/i
    );

  if (marketedByMatch?.[1]) {
    return cleanText(
      marketedByMatch[1]
    );
  }

  return "";
}

/* =========================================================
   IMAGES
========================================================= */

function cleanImageUrl(
  value: string
): string {
  if (!value) {
    return "";
  }

  let url = value.trim();

  if (
    url.startsWith("//")
  ) {
    url = `https:${url}`;
  }

  if (
    url.startsWith("/")
  ) {
    return "";
  }

  if (
    !/^https?:\/\//i.test(url)
  ) {
    return "";
  }

  /*
   * Remove Rightmove thumbnail sizing.
   * This gives us the larger original image.
   */
  url = url
    .replace(
      /_max_\d+x\d+(?=\.[a-z]+(?:\?|$))/i,
      ""
    )
    .replace(
      /_max_\d+x\d+$/i,
      ""
    );

  return url;
}

function isRightmovePropertyPhoto(
  url: string
): boolean {
  const lower =
    url.toLowerCase();

  /*
   * Only accept genuine property-photo
   * images.
   *
   * This deliberately rejects:
   *
   * - branch logos
   * - branch profile images
   * - agent logos
   * - map markers
   * - industry badges
   * - floorplans
   */
  if (
    !lower.includes(
      "media.rightmove.co.uk"
    )
  ) {
    return false;
  }

  if (
    !lower.includes(
      "/property-photo/"
    )
  ) {
    return false;
  }

  if (
    lower.includes(
      "floorplan"
    )
  ) {
    return false;
  }

  if (
    lower.includes(
      "logo"
    )
  ) {
    return false;
  }

  if (
    lower.includes(
      "branch"
    )
  ) {
    return false;
  }

  if (
    lower.includes(
      "marker"
    )
  ) {
    return false;
  }

  return true;
}

function isRightmoveFloorPlan(
  url: string
): boolean {
  const lower =
    url.toLowerCase();

  return (
    lower.includes(
      "media.rightmove.co.uk"
    ) &&
    (
      lower.includes(
        "floorplan"
      ) ||
      lower.includes(
        "property-floorplan"
      )
    )
  );
}

async function extractImages(
  page: Page
): Promise<string[]> {
  const propertyPhotos =
    new Set<string>();

  const floorPlans =
    new Set<string>();

  /*
   * Get all image sources from the page.
   *
   * Rightmove can put images in:
   * src
   * data-src
   * data-lazy-src
   * srcset
   */
  const sources =
    await page
      .locator("img")
      .evaluateAll(
        (elements: Element[]) =>
          elements.flatMap(
            (element) => {
              const img =
                element as HTMLImageElement;

              const values: string[] =
                [];

              if (img.src) {
                values.push(
                  img.src
                );
              }

              const dataSrc =
                img.getAttribute(
                  "data-src"
                );

              if (dataSrc) {
                values.push(
                  dataSrc
                );
              }

              const lazySrc =
                img.getAttribute(
                  "data-lazy-src"
                );

              if (lazySrc) {
                values.push(
                  lazySrc
                );
              }

              const srcset =
                img.getAttribute(
                  "srcset"
                );

              if (srcset) {
                const srcsetUrls =
                  srcset
                    .split(",")
                    .map(
                      (item) =>
                        item
                          .trim()
                          .split(/\s+/)[0]
                    );

                values.push(
                  ...srcsetUrls
                );
              }

              return values;
            }
          )
      );

  for (const source of sources) {
    const url =
      cleanImageUrl(source);

    if (!url) {
      continue;
    }

    if (
      isRightmovePropertyPhoto(
        url
      )
    ) {
      propertyPhotos.add(
        url
      );
      continue;
    }

    if (
      isRightmoveFloorPlan(
        url
      )
    ) {
      floorPlans.add(
        url
      );
    }
  }

  /*
   * Also inspect links.
   *
   * Sometimes the large image/floorplan is
   * available through an <a href=""> rather
   * than the visible <img>.
   */
  const links =
    await page
      .locator("a")
      .evaluateAll(
        (elements: Element[]) =>
          elements
            .map(
              (element) =>
                element.getAttribute(
                  "href"
                ) || ""
            )
            .filter(Boolean)
      );

  for (const link of links) {
    const url =
      cleanImageUrl(link);

    if (!url) {
      continue;
    }

    if (
      isRightmovePropertyPhoto(
        url
      )
    ) {
      propertyPhotos.add(
        url
      );
    }

    if (
      isRightmoveFloorPlan(
        url
      )
    ) {
      floorPlans.add(
        url
      );
    }
  }

  /*
   * Keep the property photos first.
   *
   * Then append the floor plan(s).
   *
   * The gallery can recognise the floorplan
   * URL and display it separately.
   */
  const result = [
    ...Array.from(
      propertyPhotos
    ),
    ...Array.from(
      floorPlans
    ),
  ];

  /*
   * Rightmove sometimes exposes the same
   * image in several different sizes.
   *
   * Deduplicate by the underlying property
   * image path.
   */
  const unique =
    new Map<string, string>();

  for (const image of result) {
    const key =
      image
        .replace(
          /_max_\d+x\d+/gi,
          ""
        )
        .split("?")[0];

    if (!unique.has(key)) {
      unique.set(
        key,
        image
      );
    }
  }

  return Array.from(
    unique.values()
  );
}

/* =========================================================
   DATE LISTED
========================================================= */

function extractDateListed(
  bodyText: string
): string | null {
  const patterns = [
    /ADDED ON\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    /LISTED ON\s+(\d{1,2}\s+\w+\s+\d{4})/i,
    /ADDED\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match =
      bodyText.match(
        pattern
      );

    if (match?.[1]) {
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
  }

  return null;
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

    /*
     * Load listing.
     */
    await page.goto(
      url,
      {
        waitUntil:
          "domcontentloaded",
        timeout: 30000,
      }
    );

    /*
     * Give Rightmove time to render
     * the photo gallery.
     */
    await page.waitForTimeout(
      5000
    );

    /*
     * Title.
     */
    const title =
      cleanText(
        await page.title()
      );

    /*
     * Body.
     */
    const bodyText =
      cleanText(
        await page
          .locator("body")
          .innerText()
      );

    /*
     * Debug file.
     */
    const debugFile =
      path.join(
        process.cwd(),
        "rightmove-debug.txt"
      );

    const debugText = [
      "========================================",
      "RIGHTMOVE DEBUG",
      "========================================",
      "",
      "REQUESTED URL:",
      url,
      "",
      "ACTUAL URL:",
      page.url(),
      "",
      "TITLE:",
      title,
      "",
      "FULL POSTCODE SEARCH:",
      "",
      await findPostcodeFromPage(
        page
      ),
      "",
      "BODY TEXT:",
      bodyText,
      "",
      "========================================",
      "END RIGHTMOVE DEBUG",
      "========================================",
    ].join("\n");

    fs.writeFileSync(
      debugFile,
      debugText,
      "utf8"
    );

    /* =====================================================
       ADDRESS
    ===================================================== */

    const titleLocation =
      extractTitleAddress(
        title
      );

    let address =
      titleLocation.address;

    let postcode =
      titleLocation.postcode;

    /*
     * H1 fallback.
     */
    if (!address) {
      const h1 =
        page.locator("h1");

      if (
        (await h1.count()) > 0
      ) {
        const h1Text =
          cleanText(
            await h1
              .first()
              .innerText()
          );

        const h1Location =
          extractTitleAddress(
            `For sale in ${h1Text}`
          );

        address =
          h1Location.address;

        postcode =
          h1Location.postcode;
      }
    }

    /*
     * Do NOT search the whole Rightmove page
     * for a full postcode.
     *
     * Other properties and estate-agent
     * information can contain other postcodes.
     */
    if (!postcode) {
      postcode =
        findPostcodeDistrict(
          `${title} ${address}`
        );
    }

    if (!address) {
      address =
        "Address unavailable";
    }

    /* =====================================================
       PROPERTY DETAILS
    ===================================================== */

    const details =
      extractPropertyDetails(
        bodyText
      );

    /* =====================================================
       PRICE
    ===================================================== */

    const price =
      extractPrice(
        bodyText,
        address
      );

    /* =====================================================
       DESCRIPTION
    ===================================================== */

    const description =
      await extractDescription(
        page,
        bodyText
      );

    /* =====================================================
       AGENT
    ===================================================== */

    const agent =
      await extractAgent(
        page
      );

    /* =====================================================
       IMAGES
    ===================================================== */

    const images =
      await extractImages(
        page
      );

    console.log(
      "========================================"
    );

    console.log(
      `RIGHTMOVE PROPERTY PHOTOS FOUND: ${images.length}`
    );

    images.forEach(
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

    /* =====================================================
       DATE
    ===================================================== */

    const dateListed =
      extractDateListed(
        bodyText
      );

    /* =====================================================
       EXTERNAL ID
    ===================================================== */

    const externalId =
      `URL-${Buffer.from(url)
        .toString("base64")
        .replace(
          /[^a-zA-Z0-9]/g,
          ""
        )
        .slice(0, 50)}`;

    /* =====================================================
       RESULT
    ===================================================== */

    const result: ImportedProperty =
      {
        externalId,

        source:
          "Rightmove",

        listingUrl:
          url,

        address,

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

/* =========================================================
   PAGE POSTCODE HELPER
========================================================= */

async function findPostcodeFromPage(
  page: Page
): Promise<string> {
  const html =
    await page.content();

  let postcode =
    findFullPostcode(html);

  if (postcode) {
    return postcode;
  }

  const candidates =
    await page
      .locator(
        [
          "h1",
          "h2",
          "h3",
          "address",
          "[data-testid]",
          "[class*='address']",
          "[class*='postcode']",
          "[class*='location']",
          "meta",
        ].join(",")
      )
      .evaluateAll(
        (
          elements: Element[]
        ) =>
          elements.map(
            (element) => {
              if (
                element.tagName.toLowerCase() ===
                "meta"
              ) {
                return (
                  element.getAttribute(
                    "content"
                  ) || ""
                );
              }

              return (
                element.textContent ||
                ""
              );
            }
          )
      );

  for (const candidate of candidates) {
    postcode =
      findFullPostcode(
        cleanText(
          candidate
        )
      );

    if (postcode) {
      return postcode;
    }
  }

  return "";
}