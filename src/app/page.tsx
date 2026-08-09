
import prisma from "@/lib/prisma";
import PropertyCard from "@/components/PropertyCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const properties = await prisma.property.findMany({
    include: {
      photos: true,
    },

    orderBy: {
      lastSeen: "desc",
    },

    take: 8,
  });

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow p-8 mb-8">
          <h1 className="text-4xl font-bold">
            FlipFinderAI
          </h1>

          <p className="text-gray-600 mt-2">
            AI powered property deals, BMV opportunities and refurbishment analysis.
          </p>
        </div>

        {/* PROPERTIES */}
        {properties.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow">
            <h2 className="text-xl font-bold">
              No properties found
            </h2>

            <p className="text-gray-500 mt-2">
              Import properties to start analysing deals.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}