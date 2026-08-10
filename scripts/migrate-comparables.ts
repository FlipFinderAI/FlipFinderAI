import Database from "better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sqlite = new Database("dev.db", { readonly: true });

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const rows = sqlite
    .prepare(`
      SELECT
        id,
        transactionId,
        postcode,
        address,
        soldPrice,
        soldDate,
        bedrooms,
        bathrooms,
        floorArea,
        epcRating,
        propertyType,
        source,
        createdAt
      FROM ComparableSale
    `)
    .all() as any[];

  console.log(`SQLite comparable sales found: ${rows.length}`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      await prisma.comparableSale.upsert({
        where: {
          transactionId: row.transactionId || `sqlite-${row.id}`,
        },
        update: {
          postcode: row.postcode,
          address: row.address,
          soldPrice: row.soldPrice,
          soldDate: row.soldDate
            ? new Date(row.soldDate)
            : null,
          bedrooms: row.bedrooms,
          bathrooms: row.bathrooms,
          floorArea: row.floorArea,
          epcRating: row.epcRating,
          propertyType: row.propertyType,
          source: row.source,
        },
        create: {
          transactionId: row.transactionId || `sqlite-${row.id}`,
          postcode: row.postcode,
          address: row.address,
          soldPrice: row.soldPrice,
          soldDate: row.soldDate
            ? new Date(row.soldDate)
            : null,
          bedrooms: row.bedrooms,
          bathrooms: row.bathrooms,
          floorArea: row.floorArea,
          epcRating: row.epcRating,
          propertyType: row.propertyType,
          source: row.source,
        },
      });

      imported++;

      if (imported % 500 === 0) {
        console.log(`Imported ${imported} / ${rows.length}`);
      }
    } catch (error) {
      skipped++;

      console.error(
        `Skipped comparable ${row.id}:`,
        error
      );
    }
  }

  const count = await prisma.comparableSale.count();

  console.log("");
  console.log(`SQLite comparable sales: ${rows.length}`);
  console.log(`Imported:                ${imported}`);
  console.log(`Skipped:                 ${skipped}`);
  console.log(`PostgreSQL comparables:  ${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });