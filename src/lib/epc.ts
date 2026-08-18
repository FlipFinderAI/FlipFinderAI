type EPCResult = {
  rating: string | null;
  currentEnergyEfficiency: number | null;
  potentialEnergyEfficiency: number | null;
  potentialEnergyEfficiencyBand: string | null;

  certificateDate: string | null;

  propertyType: string | null;
  totalFloorArea: number | null;

  address: string | null;
  postcode: string | null;

  certificateNumber: string | null;
  lmkKey: string | null;
  uprn: string | null;
  schemaType: string | null;

  heating: string | null;
  mainFuel: string | null;
  walls: string | null;
  roof: string | null;
  windows: string | null;

  recommendations: Array<{
    recommendation: string;
    impact: string;
    typicalSaving: string;
    cost: string;
  }> | null;
  estimatedCosts: Record<string, unknown> | null;

  certificateUrl: string | null;
  certificateImage: string | null;

  fullCertificate: Record<string, unknown> | null;
};

type EPCSearchRow = Record<string, unknown> & {
  certificateNumber?: string;
  lmkKey?: string;

  addressLine1?: string;
  addressLine2?: string | null;
  addressLine3?: string | null;
  addressLine4?: string | null;

  postcode?: string;
  postTown?: string;

  currentEnergyEfficiencyBand?: string;
  currentEnergyEfficiency?: number | string;

  potentialEnergyEfficiency?: number | string;
  potentialEnergyEfficiencyBand?: string;

  registrationDate?: string;

  uprn?: number | string;

  schemaType?: string;

  propertyType?: string;
  totalFloorArea?: number | string;
};

type EPCSearchResponse = {
  data?: EPCSearchRow[];

  pagination?: {
    totalRecords?: number;
    currentPage?: number;
    totalPages?: number;
    nextPage?: number | null;
    prevPage?: number | null;
    pageSize?: number;
  };
};

type EPCCertificateResponse =
  | Record<string, unknown>
  | {
      data?: Record<string, unknown>;
    };

/*
 * ============================================================
 * NORMALISE POSTCODE
 * ============================================================
 */

function normalisePostcode(
  postcode: string
): string {
  return postcode
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();
}

/*
 * ============================================================
 * NORMALISE TEXT
 * ============================================================
 */

function normaliseText(
  value: string
): string {
  return value
    .toUpperCase()
    .replace(/[,.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * ============================================================
 * EXTRACT HOUSE NUMBER
 * ============================================================
 */

function extractHouseNumber(
  value: string
): string | null {
  const match =
    value.match(
      /^\s*(\d+[A-Z]?(?:-\d+[A-Z]?)?)\b/i
    );

  return match
    ? match[1].toUpperCase()
    : null;
}

/*
 * ============================================================
 * BUILD ADDRESS
 * ============================================================
 */

function buildAddress(
  row: EPCSearchRow
): string | null {
  const addressParts = [
    row.addressLine1,
    row.addressLine2,
    row.addressLine3,
    row.addressLine4,
    row.postTown,
  ].filter(Boolean);

  return addressParts.length > 0
    ? addressParts.join(", ")
    : null;
}

/*
 * ============================================================
 * SAFE NUMBER
 * ============================================================
 */

function safeNumber(
  value:
    | number
    | string
    | null
    | undefined
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed =
      Number(value);

    if (
      Number.isFinite(parsed)
    ) {
      return parsed;
    }
  }

  return null;
}

/*
 * ============================================================
 * SAFE STRING
 * ============================================================
 */

function safeString(
  value:
    | string
    | null
    | undefined
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned
    ? cleaned
    : null;
}

/*
 * ============================================================
 * FIND VALUE IN FULL CERTIFICATE
 * ============================================================
 *
 * The full certificate contains considerably more information
 * than the postcode search result.
 *
 * Because the API's certificate payload can contain additional
 * fields depending on the certificate schema, we deliberately
 * read known fields safely rather than assuming every property
 * exists.
 */

function findCertificateValue(
  certificate: Record<string, unknown>,
  keys: string[]
): unknown {
  for (const key of keys) {
    if (
      certificate[key] !== undefined &&
      certificate[key] !== null
    ) {
      return certificate[key];
    }
  }

  return null;
}

function normaliseCertificateKeys(
  cert: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(cert)) {
    if (key.includes("_")) {
      const camel = key.replace(
        /_([a-z])/g,
        (_, c: string) => c.toUpperCase()
      );
      out[camel] = value;
      out[key] = value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

/*
 * ============================================================
 * FETCH FULL CERTIFICATE
 * ============================================================
 *
 * IMPORTANT:
 *
 * The postcode search is NOT the certificate.
 *
 * Once we have identified the exact property and its
 * certificateNumber, we make a second request to:
 *
 * /api/certificate?certificate_number=...
 *
 * This is what pulls the complete EPC certificate payload.
 */

async function fetchFullCertificate(
  certificateNumber: string,
  token: string
): Promise<Record<string, unknown> | null> {
  const url =
    "https://api.get-energy-performance-data.communities.gov.uk/api/certificate" +
    `?certificate_number=${encodeURIComponent(
      certificateNumber
    )}`;

  console.log(
    "========================================"
  );

  console.log(
    "FETCHING FULL EPC CERTIFICATE"
  );

  console.log(
    "Certificate number:",
    certificateNumber
  );

  console.log(
    "Certificate URL:",
    url
  );

  console.log(
    "========================================"
  );

  const response =
    await fetch(
      url,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        cache: "no-store",
      }
    );

  const responseText =
    await response.text();

  if (!response.ok) {
    console.error(
      `FULL EPC API returned ${response.status}:`,
      responseText.slice(
        0,
        2000
      )
    );

    return null;
  }

  let parsed:
    EPCCertificateResponse;

  try {
    parsed =
      JSON.parse(
        responseText
      ) as EPCCertificateResponse;
  } catch {
    console.error(
      "Full EPC API returned invalid JSON:",
      responseText.slice(
        0,
        2000
      )
    );

    return null;
  }

  /*
   * Some API responses are wrapped in { data: ... }.
   * Others can expose the certificate object directly.
   */

  if (
  "data" in parsed &&
  parsed.data &&
  typeof parsed.data === "object"
) {
  return parsed.data as Record<string, unknown>;
}

return parsed as Record<string, unknown>;
}

/*
 * ============================================================
 * GET EPC FOR EXACT PROPERTY
 * ============================================================
 */

export async function getEPCByAddress(
  postcode: string,
  houseNumber: string,
  propertyAddress?: string | null
): Promise<EPCResult | null> {
  const token =
    process.env.EPC_API_TOKEN ||
    process.env.EPC_AUTH_TOKEN;

  console.log(
    "EPC TOKEN PRESENT:",
    !!token
  );

  console.log(
    "EPC TOKEN LENGTH:",
    token?.length ?? 0
  );

  if (!token) {
    console.error(
      "EPC_API_TOKEN / EPC_AUTH_TOKEN is not configured."
    );

    return null;
  }

  const cleanPostcode =
    normalisePostcode(
      postcode
    );

  const cleanHouseNumber =
    houseNumber
      .trim()
      .toUpperCase();

  if (
    !cleanPostcode ||
    !cleanHouseNumber
  ) {
    console.log(
      "EPC lookup skipped: missing postcode or house number."
    );

    return null;
  }

  try {
    /*
     * ========================================================
     * SEARCH EPC RECORDS
     * ========================================================
     */

    const searchUrl =
      `https://api.get-energy-performance-data.communities.gov.uk/api/domestic/search` +
      `?postcode=${encodeURIComponent(
        cleanPostcode
      )}` +
      `&pageSize=100`;

    console.log(
      "========================================"
    );

    console.log(
      "EXACT EPC PROPERTY LOOKUP"
    );

    console.log(
      "Verified postcode:",
      postcode
    );

    console.log(
      "AI house number:",
      houseNumber
    );

    console.log(
      "Property address:",
      propertyAddress ||
        "UNKNOWN"
    );

    console.log(
      "EPC search:",
      searchUrl
    );

    console.log(
      "========================================"
    );

    const response =
      await fetch(
        searchUrl,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          cache: "no-store",
        }
      );

    const responseText =
      await response.text();

    if (!response.ok) {
      console.error(
        `EPC search returned ${response.status}:`,
        responseText.slice(
          0,
          2000
        )
      );

      return null;
    }

    let data:
      EPCSearchResponse;

    try {
      data =
        JSON.parse(
          responseText
        ) as EPCSearchResponse;
    } catch {
      console.error(
        "EPC search returned invalid JSON:",
        responseText.slice(
          0,
          2000
        )
      );

      return null;
    }

    const rows =
      data.data ?? [];

    console.log(
      "EPC records returned:",
      rows.length
    );

    if (
      rows.length === 0
    ) {
      console.log(
        "No EPC records found for:",
        postcode
      );

      return null;
    }

    /*
     * ========================================================
     * EXACT HOUSE NUMBER MATCH
     * ========================================================
     */

    const matchingRows =
      rows.filter(
        (row) => {
          const address =
            buildAddress(row);

          if (!address) {
            return false;
          }

          const epcHouseNumber =
            extractHouseNumber(
              row.addressLine1 ||
                address
            );

          if (
            !epcHouseNumber
          ) {
            return false;
          }

          return (
            epcHouseNumber ===
            cleanHouseNumber
          );
        }
      );

    console.log(
      "EPC exact house-number matches:",
      matchingRows.length
    );

    if (
      matchingRows.length === 0
    ) {
      console.warn(
        "NO EXACT EPC HOUSE NUMBER MATCH"
      );

      for (
        const row of rows
      ) {
        console.log(
          "EPC candidate:",
          buildAddress(row) ||
            "UNKNOWN"
        );
      }

      return null;
    }

    /*
     * ========================================================
     * MOST RECENT CERTIFICATE FOR EXACT PROPERTY
     * ========================================================
     */

    const sortedMatches =
      [...matchingRows].sort(
        (a, b) => {
          const dateA =
            a.registrationDate
              ? new Date(
                  a.registrationDate
                ).getTime()
              : 0;

          const dateB =
            b.registrationDate
              ? new Date(
                  b.registrationDate
                ).getTime()
              : 0;

          return (
            dateB - dateA
          );
        }
      );

    const result =
      sortedMatches[0];

    const certificateNumber =
      safeString(
        result.certificateNumber
      );

    if (
      !certificateNumber
    ) {
      console.error(
        "Exact EPC match has no certificate number."
      );

      return null;
    }

    /*
     * ========================================================
     * FETCH FULL CERTIFICATE
     * ========================================================
     */

    const fullCertificate =
      await fetchFullCertificate(
        certificateNumber,
        token
      );

    if (
      !fullCertificate
    ) {
      console.error(
        "Exact EPC found, but FULL certificate could not be retrieved."
      );

      return null;
    }

    console.log(
      "========================================"
    );

    console.log(
      "FULL EPC CERTIFICATE RETRIEVED"
    );

    console.log(
      JSON.stringify(
        fullCertificate,
        null,
        2
      )
    );

    console.log(
      "========================================"
    );

    const normalisedCert =
      normaliseCertificateKeys(
        fullCertificate as Record<string, unknown>
      );

    /*
     * ========================================================
     * READ FULL CERTIFICATE VALUES
     * ========================================================
     */

    const fullCurrentEfficiency =
      safeNumber(
        findCertificateValue(
          normalisedCert,
          [
            "currentEnergyEfficiency",
            "CURRENT_ENERGY_EFFICIENCY",
          ]
        ) as
          | number
          | string
          | null
          | undefined
      );

    const fullPotentialEfficiency =
      safeNumber(
        findCertificateValue(
          normalisedCert,
          [
            "potentialEnergyEfficiency",
            "POTENTIAL_ENERGY_EFFICIENCY",
          ]
        ) as
          | number
          | string
          | null
          | undefined
      );

    const fullFloorArea =
      safeNumber(
        findCertificateValue(
          normalisedCert,
          [
            "totalFloorArea",
            "TOTAL_FLOOR_AREA",
          ]
        ) as
          | number
          | string
          | null
          | undefined
      );

    const fullHeating =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "mainHeating",
              "MAIN_HEATING",
              "mainFuel",
              "MAIN_FUEL",
            ]
          ) ?? ""
        )
      );

    const fullMainFuel =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "mainFuel",
              "MAIN_FUEL",
            ]
          ) ?? ""
        )
      );

    const fullWalls =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "walls",
              "WALLS",
              "wallDescription",
              "WALL_DESCRIPTION",
            ]
          ) ?? ""
        )
      );

    const fullRoof =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "roof",
              "ROOF",
              "roofDescription",
              "ROOF_DESCRIPTION",
            ]
          ) ?? ""
        )
      );

    const fullWindows =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "windows",
              "WINDOWS",
              "windowDescription",
              "WINDOW_DESCRIPTION",
            ]
          ) ?? ""
        )
      );

    /*
     * Extract EPC recommendations from the full certificate.
     */
    let recommendations: Array<{
      recommendation: string;
      impact: string;
      typicalSaving: string;
      cost: string;
    }> | null = null;

    try {
      const rawRecs = findCertificateValue(
        fullCertificate,
        ["recommendations", "RECOMMENDATIONS", "improvements", "IMPROVEMENTS"]
      );

      if (Array.isArray(rawRecs) && rawRecs.length > 0) {
        recommendations = rawRecs.map((rec: any) => ({
          recommendation: String(rec.recommendation || rec.improvement || rec.RECOMMENDATION || ""),
          impact: String(rec.impact || rec.IMPACT || rec.improvementPriority || ""),
          typicalSaving: String(rec.typicalSaving || rec.TYPICAL_SAVING || rec.saving || ""),
          cost: String(rec.cost || rec.COST || rec.typicalCost || ""),
        }));
      }
    } catch {
      // recommendations are optional
    }

    /*
     * Extract estimated energy costs.
     */
    let estimatedCosts: Record<string, unknown> | null = null;

    try {
      const rawCosts = findCertificateValue(
        fullCertificate,
        ["estimatedEnergyCosts", "ENERGY_COSTS", "energyCosts", "ENERGY_COST"]
      );

      if (rawCosts && typeof rawCosts === "object" && !Array.isArray(rawCosts)) {
        estimatedCosts = rawCosts as Record<string, unknown>;
      }
    } catch {
      // costs are optional
    }

    const currentRating =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "currentEnergyRating",
              "CURRENT_ENERGY_RATING",
            ]
          ) ??
            result.currentEnergyEfficiencyBand ??
            ""
        )
      );

    const potentialRating =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "potentialEnergyRating",
              "POTENTIAL_ENERGY_RATING",
            ]
          ) ??
            result.potentialEnergyEfficiencyBand ??
            ""
        )
      );

    const certificateDate =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "registrationDate",
              "REGISTRATION_DATE",
            ]
          ) ??
            result.registrationDate ??
            ""
        )
      );

    const fullPropertyType =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "propertyType",
              "PROPERTY_TYPE",
            ]
          ) ??
            result.propertyType ??
            ""
        )
      );

    const fullPostcode =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "postcode",
              "POSTCODE",
            ]
          ) ??
            result.postcode ??
            ""
        )
      );

    const fullUprn =
      findCertificateValue(
        fullCertificate,
        [
          "uprn",
          "UPRN",
        ]
      );

    const uprn =
      fullUprn !== null &&
      fullUprn !== undefined
        ? String(fullUprn)
        : result.uprn !==
              undefined &&
          result.uprn !== null
        ? String(result.uprn)
        : null;

    const schemaType =
      safeString(
        String(
          findCertificateValue(
            fullCertificate,
            [
              "schemaType",
              "SCHEMA_TYPE",
            ]
          ) ??
            result.schemaType ??
            ""
        )
      );

    /*
     * ========================================================
     * GOVERNMENT CERTIFICATE LINK
     * ========================================================
     */

    const certificateUrl =
      `https://find-energy-certificate.service.gov.uk/energy-certificate/${encodeURIComponent(
        certificateNumber
      )}`;

    /*
     * ========================================================
     * FINAL RESULT
     * ========================================================
     */

    return {
      rating:
        currentRating,

      currentEnergyEfficiency:
        fullCurrentEfficiency ??
        safeNumber(
          result.currentEnergyEfficiency
        ),

      potentialEnergyEfficiency:
        fullPotentialEfficiency ??
        safeNumber(
          result.potentialEnergyEfficiency
        ),

      potentialEnergyEfficiencyBand:
        potentialRating,

      certificateDate,

      propertyType:
        fullPropertyType,

      totalFloorArea:
        fullFloorArea ??
        safeNumber(
          result.totalFloorArea
        ) ??
        safeNumber(
          (result as Record<string, unknown>)
            .total_floor_area as
            | number
            | string
            | null
            | undefined
        ),

      address:
        buildAddress(result),

      postcode:
        fullPostcode,

      certificateNumber,

      lmkKey:
        safeString(
          result.lmkKey
        ),

      uprn,

      schemaType,

      heating:
        fullHeating,

      mainFuel:
        fullMainFuel,

      walls:
        fullWalls,

      roof:
        fullRoof,

      windows:
        fullWindows,

      recommendations,

      estimatedCosts,

      certificateUrl,

      certificateImage:
        null,

      fullCertificate,
    };
  } catch (
    error
  ) {
    console.error(
      "Exact EPC lookup failed:",
      error
    );

    return null;
  }
}