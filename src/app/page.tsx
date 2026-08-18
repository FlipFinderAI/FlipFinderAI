import prisma from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const properties =
    await prisma.property.findMany({
      orderBy: [
        {
          aiScore: "desc",
        },
        {
          lastSeen: "desc",
        },
      ],
    });

  return (
    <HomeClient
      properties={properties}
    />
  );
}