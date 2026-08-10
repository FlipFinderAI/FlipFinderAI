
import fs from "fs";
import path from "path";
import readline from "readline";
import prisma from "@/lib/prisma";

type ParsedSale = {
  postcode: string;
  address: string;
  soldPrice: number;
  soldDate: Date;
  propertyType: string;
  source: string;
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);

  return values.map((value) =>
    value.replace(/^"|"$/g, "").trim()
  );
}

function mapPropertyType(value: string): string {
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

function buildAddress(values: string[]): string {
  const paon = values[7] || "";
  const saon = values[8] || "";
  const street = values[9] || "";
  const locality = values[10] || "";
  const town = values[11] || "";

  return [
    paon,
    saon,
    street,
    locality,
    town,
  ]
    .filter(Boolean)
    .join(", ");
}

async function main() {
  console.log("");
  console.log("============================================");
  console.log("FlipFinderAI - HM Land Registry Import");
  console.log("============================================");
  console.log("");

  const csvPath = path.join(
    process.cwd(),
    "data",
    "land-registry.csv"
  );

  if (!fs.existsSync(csvPath)) {
    console.error("CSV FILE NOT FOUND");
    console.error("");
    console.error(`Expected: ${csvPath}`);
    console.error("");
    process.exit(1);
  }

  /*
   * Last 3 years.
   */

  const threeYearsAgo = new Date();

  threeYearsAgo.setFullYear(
    threeYearsAgo.getFullYear() - 3
  );

  console.log(`CSV: ${csvPath}`);
  console.log(
    `Only importing sales from ${threeYearsAgo
      .toISOString()
      .slice(0, 10)} onwards`
  );
  console.log("Postcodes: LS");
  console.log("");

  /*
   * Read the CSV as a stream.
   *
   * This is important because the combined file
   * is approximately 351 MB.
   */

  const stream = fs.createReadStream(csvPath, {
    encoding: "utf8",
  });

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  let processed = 0;
  let matched = 0;
  let imported = 0;
  let skipped = 0;

  const batch: ParsedSale[] = [];

  const BATCH_SIZE = 1000;

  /*
   * We use a small in-memory set for the current
   * import batch.
   */

  async function flushBatch() {
    if (batch.length === 0) {
      return;
    }

    for (const sale of batch) {
      try {
        /*
         * Avoid importing the same transaction twice.
         *
         * We use postcode + price + date + address
         * because the existing schema does not yet
         * contain the Land Registry transaction ID.
         */

        const existing =
          await prisma.comparableSale.findFirst({
            where: {
              postcode: sale.postcode,
              soldPrice: sale.soldPrice,
              soldDate: sale.soldDate,
              address: sale.address,
            },
          });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.comparableSale.create({
          data: {
            postcode: sale.postcode,
            address: sale.address,
            soldPrice: sale.soldPrice,
            soldDate: sale.soldDate,
            bedrooms: null,
            propertyType: sale.propertyType,
            source: sale.source,
          },
        });

        imported++;
      } catch (error) {
        console.error(
          `Failed importing ${sale.postcode} ${sale.address}`,
          error
        );

        skipped++;
      }
    }

    batch.length = 0;

    if (
      imported > 0 &&
      imported % 1000 === 0
    ) {
      console.log(
        `Imported: ${imported.toLocaleString()} | ` +
          `Processed: ${processed.toLocaleString()}`
      );
    }
  }

  /*
   * Process each CSV line.
   */

  for await (const line of rl) {
    processed++;

    if (!line.trim()) {
      continue;
    }

    const values = parseCsvLine(line);

    /*
     * Land Registry has 16 fields.
     */

    if (values.length < 14) {
      skipped++;
      continue;
    }

    /*
     * Ignore CSV header rows.
     */

    if (
      values[0] === "Transaction unique identifier"
    ) {
      continue;
    }

    const transactionDate =
      new Date(values[2]);

    if (
      Number.isNaN(
        transactionDate.getTime()
      )
    ) {
      skipped++;
      continue;
    }

    /*
     * Last 3 years only.
     */

    if (
      transactionDate < threeYearsAgo
    ) {
      continue;
    }

    /*
     * Postcode.
     */

    const postcode =
      values[3]
        ?.toUpperCase()
        .trim();

    if (
      !postcode ||
      !postcode.startsWith("LS")
    ) {
      continue;
    }

    /*
     * Only normal residential property
     * transactions.
     *
     * D = Detached
     * S = Semi-detached
     * T = Terraced
     * F = Flat
     */

    const propertyTypeCode =
      values[4];

    if (
      !["D", "S", "T", "F"].includes(
        propertyTypeCode
      )
    ) {
      continue;
    }

    const soldPrice =
      Number(values[1]);

    if (
      !Number.isFinite(soldPrice) ||
      soldPrice <= 0
    ) {
      continue;
    }

    matched++;

    const sale: ParsedSale = {
      postcode,
      address: buildAddress(values),
      soldPrice,
      soldDate: transactionDate,
      propertyType:
        mapPropertyType(
          propertyTypeCode
        ),
      source:
        "HM Land Registry Price Paid Data",
    };

    batch.push(sale);

    if (
      batch.length >= BATCH_SIZE
    ) {
      await flushBatch();
    }
  }

  /*
   * Import anything remaining.
   */

  await flushBatch();

  console.log("");
  console.log("============================================");
  console.log("IMPORT COMPLETE");
  console.log("============================================");
  console.log("");

  console.log(
    `CSV rows processed: ${processed.toLocaleString()}`
  );

  console.log(
    `LS sales matched:    ${matched.toLocaleString()}`
  );

  console.log(
    `Imported:            ${imported.toLocaleString()}`
  );

  console.log(
    `Skipped/duplicates:  ${skipped.toLocaleString()}`
  );

  console.log("");

  const total =
    await prisma.comparableSale.count();

  console.log(
    `Comparable sales in database: ${total.toLocaleString()}`
  );

  console.log("");

  /*
   * Show a few recent Leeds sales.
   */

  const recent =
    await prisma.comparableSale.findMany({
      where: {
        postcode: {
          startsWith: "LS",
        },
      },

      orderBy: {
        soldDate: "desc",
      },

      take: 10,
    });

  console.log("Latest Leeds sales:");
  console.log("");

  for (const sale of recent) {
    console.log(
      `${sale.soldDate
        ?.toISOString()
        .slice(0, 10)} | ` +
        `${sale.postcode} | ` +
        `£${sale.soldPrice.toLocaleString()} | ` +
        `${sale.propertyType || "Unknown"} | ` +
        `${sale.address || ""}`
    );
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("SOLD PRICE IMPORT FAILED");
    console.error("");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });