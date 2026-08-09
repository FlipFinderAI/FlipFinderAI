import prisma from "@/lib/prisma";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        insideQuotes =
          !insideQuotes;
      }
    } else if (
      char === "," &&
      !insideQuotes
    ) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);

  return values;
}

function clean(value: string): string {
  return value
    .replace(/^"|"$/g, "")
    .trim();
}

function mapPropertyType(
  value: string
): string {
  switch (value) {
    case "D":
      return "Detached";

    case "S":
      return "Semi-detached";

    case "T":
      return "Terraced";

    case "F":
      return "Flat";

    default:
      return "Other";
  }
}

function mapTenure(
  value: string
): string | null {
  switch (value) {
    case "F":
      return "Freehold";

    case "L":
      return "Leasehold";

    default:
      return value || null;
  }
}

export async function importLandRegistryCsv(
  csv: string,
  options?: {
    postcodePrefix?: string;
    town?: string;
    limit?: number;
  }
) {
  const lines =
    csv
      .split(/\r?\n/)
      .filter(Boolean);

  let imported = 0;
  let skipped = 0;

  const postcodePrefix =
    options?.postcodePrefix
      ?.toUpperCase()
      .trim();

  const town =
    options?.town
      ?.toUpperCase()
      .trim();

  const limit =
    options?.limit ?? 10000;

  /*
   * --------------------------------------------
   * THREE YEAR CUTOFF
   * --------------------------------------------
   *
   * Only sales from the last three years
   * are imported.
   */

  const threeYearsAgo =
    new Date();

  threeYearsAgo.setFullYear(
    threeYearsAgo.getFullYear() - 3
  );

  console.log(
    `Importing sales from ${threeYearsAgo
      .toISOString()
      .slice(0, 10)} onwards`
  );

  /*
   * --------------------------------------------
   * PROCESS CSV
   * --------------------------------------------
   */

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {
    if (
      imported >= limit
    ) {
      break;
    }

    const values =
      parseCsvLine(
        lines[i]
      ).map(clean);

    /*
     * HM Land Registry Price Paid Data
     * normally contains at least 14 columns.
     */

    if (
      values.length < 14
    ) {
      skipped++;
      continue;
    }

    /*
     * ------------------------------------------
     * BASIC FIELDS
     * ------------------------------------------
     */

    const transactionId =
      values[0];

    const price =
      Number(values[1]);

    const date =
      values[2];

    const postcode =
      values[3]
        ?.toUpperCase()
        .trim();

    const propertyType =
      mapPropertyType(
        values[4]
      );

    const tenure =
      mapTenure(
        values[6]
      );

    const paon =
      values[7] || "";

    const saon =
      values[8] || "";

    const street =
      values[9] || "";

    const locality =
      values[10] || "";

    const transactionTown =
      values[11]
        ?.toUpperCase()
        .trim();

    /*
     * ------------------------------------------
     * VALIDATION
     * ------------------------------------------
     */

    if (
      !transactionId ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !postcode ||
      !date
    ) {
      skipped++;
      continue;
    }

    /*
     * ------------------------------------------
     * POSTCODE FILTER
     * ------------------------------------------
     */

    if (
      postcodePrefix &&
      !postcode.startsWith(
        postcodePrefix
      )
    ) {
      continue;
    }

    /*
     * ------------------------------------------
     * TOWN FILTER
     * ------------------------------------------
     */

    if (
      town &&
      transactionTown !== town
    ) {
      continue;
    }

    /*
     * ------------------------------------------
     * DATE
     * ------------------------------------------
     */

    const soldDate =
      new Date(date);

    if (
      Number.isNaN(
        soldDate.getTime()
      )
    ) {
      skipped++;
      continue;
    }

    /*
     * ------------------------------------------
     * THREE YEAR FILTER
     * ------------------------------------------
     *
     * This is the important part.
     *
     * Anything older than three years is
     * completely ignored.
     */

    if (
      soldDate <
      threeYearsAgo
    ) {
      skipped++;
      continue;
    }

    /*
     * ------------------------------------------
     * ADDRESS
     * ------------------------------------------
     */

    const address = [
      paon,
      saon,
      street,
      locality,
      transactionTown,
    ]
      .filter(Boolean)
      .join(", ");

    /*
     * ------------------------------------------
     * DUPLICATE CHECK
     * ------------------------------------------
     */

    try {
      const existing =
        await prisma.comparableSale.findFirst(
          {
            where: {
              postcode,

              soldPrice:
                price,

              soldDate,

              address,
            },
          }
        );

      if (existing) {
        skipped++;
        continue;
      }

      /*
       * ----------------------------------------
       * CREATE COMPARABLE
       * ----------------------------------------
       */

      await prisma.comparableSale.create(
        {
          data: {
            postcode,

            address,

            soldPrice:
              price,

            soldDate,

            /*
             * HM Land Registry does not provide
             * bedroom count.
             *
             * We will enrich this later using
             * property/listing data.
             */

            bedrooms:
              null,

            propertyType,

            source:
              "HM Land Registry Price Paid Data",
          },
        }
      );

      imported++;

      /*
       * Progress indicator every 500 records.
       */

      if (
        imported % 500 === 0
      ) {
        console.log(
          `Imported ${imported} comparable sales...`
        );
      }
    } catch (error) {
      console.error(
        "Land Registry row import failed:",
        error
      );

      skipped++;
    }
  }

  /*
   * --------------------------------------------
   * RESULT
   * --------------------------------------------
   */

  return {
    imported,
    skipped,
  };
}