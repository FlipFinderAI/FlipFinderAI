import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.property.deleteMany({});
  console.log(`Deleted ${result.count} properties`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());