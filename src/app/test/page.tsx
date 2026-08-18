

import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

import PropertyGallery from "@/components/PropertyGallery";
import AIAnalysisPanel from "@/components/AIAnalysisPanel";
import EPCCertificate from "@/components/EPCCertificate";
import PropertyCard from "@/components/PropertyCard";
import PropertyHeader from "@/components/property/PropertyHeader";
import ComparableValuation from "@/components/property/ComparableValuation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

function getSortLabel(sort: string) {
  switch (sort) {
    case "bmv":
      return "Best BMV";
    case "profit":
      return "Highest Profit";
    case "score":
      return "Best AI Score";
    case "price":
      return "Lowest Price";
    default:
      return "Best Deals";
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const search =
    typeof params.search === "string"
      ? params.search.trim()
      : "";

  const minPrice =
    params.minPrice &&
    !Number.isNaN(Number(params.minPrice))
      ? Number(params.minPrice)
      : undefined;

  const maxPrice =
    params.maxPrice &&
    !Number.isNaN(Number(params.maxPrice))
      ? Number(params.maxPrice)
      : undefined;

  const sort =
    typeof params.sort === "string"
      ? params.sort
      : "deals";

  /*
   * ==================================================
   * BUILD DATABASE FILTER
   * ==================================================
   */

  const where: any = {};

  if (search) {
    where.OR = [
      {
        address: {
          contains: search,
        },
      },
      {
        postcode: {
          contains: search,
        },
      },
    ];
  }

  if (
    minPrice !== undefined ||
    maxPrice !== undefined
  ) {
    where.price = {};

    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }

    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  /*
   * ==================================================
   * GET PROPERTIES
   * ==================================================
   *
   * We deliberately fetch more than 20.
   *
   * The homepage only displays the best 20.
   * This means the database can contain thousands
   * of properties without limiting the actual
   * property database.
   */

  const properties =
    await prisma.property.findMany({
      where,

      include: {
        photos: true,
      },

      take: 500,

      orderBy: {
        lastSeen: "desc",
      },
    });

  /*
   * ==================================================
   * DEAL RANKING
   * ==================================================
   *
   * FlipFinderAI's homepage should not simply show
   * the newest properties.
   *
   * We rank the available properties using:
   *
   * - AI score
   * - BMV percentage
   * - potential profit
   * - valuation
   *
   * Properties without valuation evidence are
   * naturally pushed down the list.
   */

  const rankedProperties =
    [...properties].sort(
      (a, b) => {
        if (sort === "bmv") {
          return (
            (b.discountPercent ?? 0) -
            (a.discountPercent ?? 0)
          );
        }

        if (sort === "profit") {
          return (
            (b.potentialProfit ?? 0) -
            (a.potentialProfit ?? 0)
          );
        }

        if (sort === "score") {
          return (
            (b.aiScore ?? 0) -
            (a.aiScore ?? 0)
          );
        }

        if (sort === "price") {
          return (
            (a.price ?? 0) -
            (b.price ?? 0)
          );
        }

        /*
         * DEFAULT "BEST DEALS"
         *
         * Weighted ranking:
         *
         * AI score = strongest signal
         * BMV = second strongest
         * profit = third
         */

        const scoreA =
          (a.aiScore ?? 0) * 0.5 +
          (a.discountPercent ?? 0) * 0.3 +
          Math.min(
            (a.potentialProfit ?? 0) /
              1000,
            20
          ) * 0.2;

        const scoreB =
          (b.aiScore ?? 0) * 0.5 +
          (b.discountPercent ?? 0) * 0.3 +
          Math.min(
            (b.potentialProfit ?? 0) /
              1000,
            20
          ) * 0.2;

        return scoreB - scoreA;
      }
    );

  const topDeals =
    rankedProperties.slice(0, 20);

  /*
   * ==================================================
   * COUNTERS
   * ==================================================
   */

  const totalFound =
    rankedProperties.length;

  const bmvCount =
    rankedProperties.filter(
      (property) =>
        (property.discountPercent ?? 0) > 10
    ).length;

  const profitableCount =
    rankedProperties.filter(
      (property) =>
        (property.potentialProfit ?? 0) > 0
    ).length;

  /*
   * ==================================================
   * BUILD FILTER URL
   * ==================================================
   */

  function buildUrl(
    changes: Record<string, string | undefined>
  ) {
    const query =
      new URLSearchParams();

    const values = {
      search,
      minPrice:
        minPrice !== undefined
          ? String(minPrice)
          : undefined,
      maxPrice:
        maxPrice !== undefined
          ? String(maxPrice)
          : undefined,
      sort,
      ...changes,
    };

    Object.entries(values).forEach(
      ([key, value]) => {
        if (value) {
          query.set(key, value);
        }
      }
    );

    const queryString =
      query.toString();

    return queryString
      ? `/?${queryString}`
      : "/";
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm md:p-8">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                FlipFinderAI
              </h1>

              <p className="mt-2 max-w-2xl text-gray-600">
                Find the best below-market-value
                property deals, analyse refurbishment
                potential and identify profitable flips.
              </p>
            </div>

            <div className="rounded-2xl bg-black px-5 py-4 text-white">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Current view
              </p>

              <p className="mt-1 text-lg font-bold">
                {getSortLabel(sort)}
              </p>
            </div>

          </div>

        </div>

        {/* ==================================================
            SEARCH / FILTER TOOLBAR
        ================================================== */}

        <section className="mb-8 rounded-3xl bg-white p-5 shadow-sm">

          <form
            method="GET"
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-5"
          >

            {/* ADDRESS */}

            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Address / Postcode
              </label>

              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="e.g. LS8, Leeds, street..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
              />
            </div>

            {/* MIN PRICE */}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Min Price
              </label>

              <input
                type="number"
                name="minPrice"
                defaultValue={
                  minPrice ?? ""
                }
                placeholder="£0"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
              />
            </div>

            {/* MAX PRICE */}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Max Price
              </label>

              <input
                type="number"
                name="maxPrice"
                defaultValue={
                  maxPrice ?? ""
                }
                placeholder="£300,000"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
              />
            </div>

            {/* SORT */}

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Sort By
              </label>

              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-black focus:bg-white"
              >
                <option value="deals">
                  Best Deals
                </option>

                <option value="bmv">
                  Best BMV
                </option>

                <option value="profit">
                  Highest Profit
                </option>

                <option value="score">
                  Best AI Score
                </option>

                <option value="price">
                  Lowest Price
                </option>
              </select>
            </div>

            {/* BUTTON */}

            <div className="flex items-end lg:col-span-5">

              <button
                type="submit"
                className="w-full rounded-xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
              >
                🔎 Find Deals
              </button>

            </div>

          </form>

          {/* QUICK FILTERS */}

          <div className="mt-4 flex flex-wrap gap-2">

            <Link
              href={buildUrl({
                sort: "deals",
              })}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                sort === "deals"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ⭐ Best Deals
            </Link>

            <Link
              href={buildUrl({
                sort: "bmv",
              })}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                sort === "bmv"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              📉 Best BMV
            </Link>

            <Link
              href={buildUrl({
                sort: "profit",
              })}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                sort === "profit"
                  ? "bg-green-600 text-white"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              💰 Highest Profit
            </Link>

            <Link
              href={buildUrl({
                sort: "score",
              })}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                sort === "score"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              🤖 Best AI Score
            </Link>

            <Link
              href="/"
              className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200"
            >
              Clear Filters
            </Link>

          </div>

        </section>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Properties found
            </p>

            <p className="mt-1 text-2xl font-bold">
              {totalFound}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Showing
            </p>

            <p className="mt-1 text-2xl font-bold">
              {topDeals.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              BMV opportunities
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {bmvCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Profitable deals
            </p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {profitableCount}
            </p>
          </div>

        </section>

        {/* ==================================================
            TOP 20
        ================================================== */}

        <div className="mb-4 flex items-end justify-between">

          <div>
            <h2 className="text-2xl font-bold">
              🏆 Best 20 Deals
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              The strongest available opportunities
              based on FlipFinderAI's current analysis.
            </p>
          </div>

          <span className="hidden rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white sm:block">
            TOP {topDeals.length}
          </span>

        </div>

        {/* ==================================================
            PROPERTY GRID
        ================================================== */}

        {topDeals.length === 0 ? (

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="text-4xl">
              🔍
            </div>

            <h2 className="mt-4 text-xl font-bold">
              No properties found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Try widening your price range or
              changing the address/postcode search.
            </p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
            >
              Clear Search
            </Link>

          </div>

        ) : (

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {topDeals.map(
              (property, index) => (
                <div
                  key={property.id}
                  className="relative"
                >

                  {/* DEAL RANK */}

                  <div className="absolute -left-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-bold text-white shadow-lg">
                    {index + 1}
                  </div>

                  <PropertyCard
                    property={property}
                  />

                </div>
              )
            )}

          </div>

        )}

      </div>
    </main>
  );
}