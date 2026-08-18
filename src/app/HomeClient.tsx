
"use client";

import { useMemo, useState } from "react";
import PropertyCard from "@/components/PropertyCard";

type Property = {
  id: number;
  address: string;
  postcode?: string | null;
  type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  price: number;
  estimatedValue?: number | null;
  totalRefurbCost?: number | null;
  potentialProfit?: number | null;
  aiScore?: number | null;
  discountPercent?: number | null;
  images?: string | null;
};

type Props = {
  properties: Property[];
};

type SortOption =
  | "best"
  | "bmv"
  | "profit"
  | "price-low"
  | "price-high"
  | "score";

export default function HomeClient({
  properties,
}: Props) {
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBmv, setMinBmv] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [sortBy, setSortBy] =
    useState<SortOption>("best");

  /*
   * --------------------------------------------------
   * CALCULATE DEAL METRICS
   * --------------------------------------------------
   */

  function getMetrics(property: Property) {
    const value =
      property.estimatedValue ?? 0;

    const refurb =
      property.totalRefurbCost ?? 0;

    const profit =
      property.potentialProfit ??
      value - property.price - refurb;

    const bmv =
      property.discountPercent ??
      (value > 0
        ? ((value - property.price) /
            value) *
          100
        : 0);

    const score =
      property.aiScore ?? 0;

    return {
      value,
      refurb,
      profit,
      bmv,
      score,
    };
  }

  /*
   * --------------------------------------------------
   * PROPERTY TYPES
   * --------------------------------------------------
   */

  const propertyTypes = useMemo(() => {
    const types = new Set<string>();

    properties.forEach((property) => {
      if (property.type) {
        types.add(property.type);
      }
    });

    return Array.from(types).sort();
  }, [properties]);

  /*
   * --------------------------------------------------
   * FILTER + SORT
   * --------------------------------------------------
   */

  const filteredProperties =
    useMemo(() => {
      let result = [...properties];

      const searchTerm =
        search.trim().toLowerCase();

      const maximumPrice =
        maxPrice.trim()
          ? Number(maxPrice)
          : null;

      const minimumBmv =
        minBmv.trim()
          ? Number(minBmv)
          : null;

      /*
       * SEARCH
       */

      if (searchTerm) {
        result = result.filter(
          (property) => {
            const address =
              property.address
                ?.toLowerCase() || "";

            const postcode =
              property.postcode
                ?.toLowerCase() || "";

            return (
              address.includes(
                searchTerm
              ) ||
              postcode.includes(
                searchTerm
              )
            );
          }
        );
      }

      /*
       * MAX PRICE
       */

      if (
        maximumPrice !== null &&
        !Number.isNaN(maximumPrice)
      ) {
        result = result.filter(
          (property) =>
            property.price <=
            maximumPrice
        );
      }

      /*
       * MINIMUM BMV
       */

      if (
        minimumBmv !== null &&
        !Number.isNaN(minimumBmv)
      ) {
        result = result.filter(
          (property) =>
            getMetrics(property).bmv >=
            minimumBmv
        );
      }

      /*
       * PROPERTY TYPE
       */

      if (propertyType !== "all") {
        result = result.filter(
          (property) =>
            property.type ===
            propertyType
        );
      }

      /*
       * BEDROOMS
       */

      if (bedrooms !== "all") {
        const minimumBedrooms =
          Number(bedrooms);

        result = result.filter(
          (property) =>
            (property.bedrooms ?? 0) >=
            minimumBedrooms
        );
      }

      /*
       * SORT
       */

      result.sort((a, b) => {
        const aMetrics =
          getMetrics(a);

        const bMetrics =
          getMetrics(b);

        switch (sortBy) {
          case "bmv":
            return (
              bMetrics.bmv -
              aMetrics.bmv
            );

          case "profit":
            return (
              bMetrics.profit -
              aMetrics.profit
            );

          case "price-low":
            return (
              a.price - b.price
            );

          case "price-high":
            return (
              b.price - a.price
            );

          case "score":
            return (
              bMetrics.score -
              aMetrics.score
            );

          case "best":
          default:
            const aBest =
              aMetrics.bmv * 0.45 +
              aMetrics.score * 0.35 +
              Math.min(
                Math.max(
                  aMetrics.profit /
                    1000,
                  0
                ),
                20
              );

            const bBest =
              bMetrics.bmv * 0.45 +
              bMetrics.score * 0.35 +
              Math.min(
                Math.max(
                  bMetrics.profit /
                    1000,
                  0
                ),
                20
              );

            return (
              bBest - aBest
            );
        }
      });

      return result;
    }, [
      properties,
      search,
      maxPrice,
      minBmv,
      propertyType,
      bedrooms,
      sortBy,
    ]);

  /*
   * --------------------------------------------------
   * TOP 20
   * --------------------------------------------------
   */

  const isFiltered =
    search.trim() !== "" ||
    maxPrice.trim() !== "" ||
    minBmv.trim() !== "" ||
    propertyType !== "all" ||
    bedrooms !== "all" ||
    sortBy !== "best";

  const displayedProperties =
    isFiltered
      ? filteredProperties
      : filteredProperties.slice(
          0,
          20
        );

  /*
   * --------------------------------------------------
   * CLEAR FILTERS
   * --------------------------------------------------
   */

  function clearFilters() {
    setSearch("");
    setMaxPrice("");
    setMinBmv("");
    setPropertyType("all");
    setBedrooms("all");
    setSortBy("best");
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                FlipFinderAI
              </h1>

              <p className="mt-2 max-w-2xl text-gray-600">
                Find the best below-market-value
                property deals and refurbishment
                opportunities.
              </p>
            </div>

            <div className="rounded-2xl bg-black px-5 py-3 text-white">
              <p className="text-xs text-gray-400">
                Deals in database
              </p>

              <p className="text-2xl font-bold">
                {properties.length}
              </p>
            </div>

          </div>

        </div>

        {/* SEARCH / FILTER BAR */}

        <section className="mb-8 rounded-3xl bg-white p-5 shadow-sm">

          <div className="mb-4">
            <h2 className="text-lg font-bold">
              Find a deal
            </h2>

            <p className="text-sm text-gray-500">
              Search the entire property database
              using the filters below.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">

            {/* ADDRESS */}

            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Address / postcode
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="e.g. LS8, Leeds, Street..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
              />
            </div>

           {/* MAX PRICE */}

<div>
  <label className="mb-1 block text-xs font-semibold text-gray-500">
    Max price
  </label>

  <select
    value={maxPrice}
    onChange={(event) =>
      setMaxPrice(event.target.value)
    }
    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
  >
    <option value="">Any price</option>

    <option value="50000">£50k</option>
    <option value="75000">£75k</option>
    <option value="100000">£100k</option>
    <option value="125000">£125k</option>
    <option value="150000">£150k</option>
    <option value="175000">£175k</option>
    <option value="200000">£200k</option>
    <option value="225000">£225k</option>
    <option value="250000">£250k</option>
    <option value="275000">£275k</option>
    <option value="300000">£300k</option>
    <option value="350000">£350k</option>
    <option value="400000">£400k</option>
    <option value="450000">£450k</option>
    <option value="500000">£500k</option>
    <option value="600000">£600k</option>
    <option value="700000">£700k</option>
    <option value="800000">£800k</option>
    <option value="900000">£900k</option>
    <option value="1000000">£1m</option>
    <option value="1250000">£1.25m</option>
    <option value="1500000">£1.5m</option>
    <option value="1750000">£1.75m</option>
    <option value="2000000">£2m</option>
    <option value="2500000">£2.5m</option>
    <option value="3000000">£3m</option>
    <option value="4000000">£4m</option>
    <option value="5000000">£5m</option>
    <option value="6000000">£6m</option>
    <option value="7000000">£7m</option>
    <option value="8000000">£8m</option>
    <option value="9000000">£9m</option>
    <option value="10000000">£10m</option>
  </select>
</div>

            {/* BMV */}

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Minimum BMV
              </label>

              <select
                value={minBmv}
                onChange={(event) =>
                  setMinBmv(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-black focus:bg-white"
              >
                <option value="">
                  Any BMV
                </option>

                <option value="5">
                  5%+
                </option>

                <option value="10">
                  10%+
                </option>

                <option value="15">
                  15%+
                </option>

                <option value="20">
                  20%+
                </option>

                <option value="25">
                  25%+
                </option>

                <option value="30">
                  30%+
                </option>
              </select>
            </div>

            {/* PROPERTY TYPE */}

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Property type
              </label>

              <select
                value={propertyType}
                onChange={(event) =>
                  setPropertyType(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-black focus:bg-white"
              >
                <option value="all">
                  All types
                </option>

                {propertyTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* BEDROOMS */}

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Bedrooms
              </label>

              <select
                value={bedrooms}
                onChange={(event) =>
                  setBedrooms(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-black focus:bg-white"
              >
                <option value="all">
                  Any
                </option>

                <option value="1">
                  1+
                </option>

                <option value="2">
                  2+
                </option>

                <option value="3">
                  3+
                </option>

                <option value="4">
                  4+
                </option>

                <option value="5">
                  5+
                </option>
              </select>
            </div>

            {/* SORT */}

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Sort by
              </label>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as SortOption
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-black focus:bg-white"
              >
                <option value="best">
                  Best deals
                </option>

                <option value="bmv">
                  Best BMV
                </option>

                <option value="profit">
                  Highest profit
                </option>

                <option value="score">
                  Highest AI score
                </option>

                <option value="price-low">
                  Lowest price
                </option>

                <option value="price-high">
                  Highest price
                </option>
              </select>
            </div>

          </div>

          {/* CLEAR BUTTON */}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-black"
            >
              Clear filters
            </button>
          </div>

        </section>

        {/* RESULTS HEADER */}

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-2xl font-bold">
              {isFiltered
                ? "Property deals"
                : "Best 20 deals near you"}
            </h2>

            <p className="text-sm text-gray-500">
              {isFiltered
                ? `Showing ${filteredProperties.length} matching properties`
                : "Showing the top 20 deals"}
            </p>
          </div>

        </div>

        {/* PROPERTIES */}

        {displayedProperties.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold">
              No properties found
            </h2>

            <p className="mt-2 text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedProperties.map(
              (property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                />
              )
            )}
          </div>
        )}

        {/* DATABASE COUNT */}

        <div className="mt-8 rounded-2xl bg-white p-5 text-center text-sm text-gray-500 shadow-sm">
          There are{" "}
          <strong className="text-gray-900">
            {properties.length}
          </strong>{" "}
          properties in the database.
          <br />
          Use the filters above to find properties
          outside the top 20.
        </div>

      </div>
    </main>
  );
}