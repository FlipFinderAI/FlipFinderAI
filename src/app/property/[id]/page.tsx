
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyGallery from "@/components/PropertyGallery";
import AIAnalysisPanel from "@/components/AIAnalysisPanel";

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "£0";
  }

  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function reasonForComparable(comparable: {
  exactPostcode: boolean;
  sameStreet: boolean;
  samePropertyType: boolean;
  sameBedrooms: boolean;
  sameSector: boolean;
  recent: boolean;
}) {
  const reasons: string[] = [];

  if (comparable.exactPostcode) {
    reasons.push("Exact postcode");
  }

  if (comparable.sameStreet) {
    reasons.push("Same street");
  }

  if (comparable.samePropertyType) {
    reasons.push("Same property type");
  }

  if (comparable.sameBedrooms) {
    reasons.push("Same bedrooms");
  }

  if (comparable.sameSector) {
    reasons.push("Same postcode sector");
  }

  if (comparable.recent) {
    reasons.push("Recent sale");
  }

  return reasons;
}

function parseJson<T>(
  value: string | null | undefined,
  fallback: T
): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const propertyId = Number(id);

  if (!Number.isInteger(propertyId)) {
    notFound();
  }

  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
    include: {
      photos: true,
    },
  });

  if (!property) {
    notFound();
  }

  /*
   * Re-run comparable valuation when
   * the property page is opened.
   */

  let valuation:
    | Awaited<
        ReturnType<
          typeof import("@/lib/comparableValuation")["calculateComparableValue"]
        >
      >
    | null = null;

  try {
    const { calculateComparableValue } = await import(
      "@/lib/comparableValuation"
    );

    valuation = await calculateComparableValue(property.id);
  } catch (error) {
    console.error(
      "Comparable valuation failed:",
      error
    );
  }

  /*
   * VALUATION
   */

  const estimatedValue =
    valuation?.estimatedValue ??
    property.estimatedValue ??
    0;

  const purchasePrice =
    property.price ?? 0;

  const discountPercent =
    estimatedValue > 0
      ? Math.round(
          ((estimatedValue - purchasePrice) /
            estimatedValue) *
            100
        )
      : 0;

  const profit =
    property.potentialProfit ?? 0;

  /*
   * PHOTOS
   *
   * IMPORTANT:
   * PropertyPhoto records are used first.
   * This is what gives us all 12 imported photos.
   */

  const images =
    property.photos.length > 0
      ? property.photos.map(
          (photo) => photo.url
        )
      : (() => {
          try {
            const parsed = JSON.parse(
              property.images || "[]"
            );

            return Array.isArray(parsed)
              ? parsed.filter(
                  (image): image is string =>
                    typeof image === "string"
                )
              : [];
          } catch {
            return [];
          }
        })();

  /*
   * EXISTING AI DATA
   */

  const photoAnalysis = parseJson<
    Record<string, unknown>
  >(
    property.photoAnalysis,
    {}
  );

  const aiOpportunities =
    parseJson<string[]>(
      property.aiOpportunities,
      []
    );

  const aiRisks =
    parseJson<string[]>(
      property.aiRisks,
      []
    );

  const detectedIssues =
    parseJson<string[]>(
      property.detectedIssues,
      []
    );

  const refurbPlan =
    parseJson<string[]>(
      property.refurbPlan,
      []
    );

  const existingAIAnalysis =
    property.aiSummary
      ? {
          overallCondition:
            typeof photoAnalysis.overallCondition ===
            "string"
              ? photoAnalysis.overallCondition
              : "Previously analysed",

          refurbRequired:
            property.refurbRequired,

          estimatedRefurbCost:
            property.totalRefurbCost ?? 0,

          kitchen:
            typeof photoAnalysis.kitchen ===
            "string"
              ? photoAnalysis.kitchen
              : "Not available",

          bathroom:
            typeof photoAnalysis.bathroom ===
            "string"
              ? photoAnalysis.bathroom
              : "Not available",

          decoration:
            typeof photoAnalysis.decoration ===
            "string"
              ? photoAnalysis.decoration
              : "Not available",

          flooring:
            typeof photoAnalysis.flooring ===
            "string"
              ? photoAnalysis.flooring
              : "Not available",

          exterior:
            typeof photoAnalysis.exterior ===
            "string"
              ? photoAnalysis.exterior
              : "Not available",

          opportunities:
            aiOpportunities,

          risks:
            aiRisks,

          detectedIssues:
            detectedIssues,

          refurbPlan:
            refurbPlan,

          recommendation:
            property.aiRecommendation ===
              "BUY" ||
            property.aiRecommendation ===
              "INVESTIGATE" ||
            property.aiRecommendation ===
              "AVOID"
              ? property.aiRecommendation
              : "INVESTIGATE",

          confidence:
            property.aiConfidence ?? 0,

          summary:
            property.aiSummary,
        }
      : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* BACK */}

        <div className="mb-4">
          <Link
            href="/"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to deals
          </Link>
        </div>

        {/* ==================================================
            PROPERTY HEADER
        ================================================== */}

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">

          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">

            {/* PROPERTY GALLERY */}

            <div>
              <PropertyGallery
                images={images}
                address={property.address}
              />
            </div>

            {/* PROPERTY INFORMATION */}

            <div className="flex flex-col justify-between">

              <div>

                <div className="mb-2 flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-400">
                    {property.type ||
                      "Property"}
                  </span>

                  {discountPercent > 0 && (
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
                      {discountPercent}% BMV
                    </span>
                  )}

                </div>

                <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
                  {property.address}
                </h1>

                <p className="mt-1 text-base text-slate-400">
                  {property.postcode}
                </p>

                <div className="mt-4 flex flex-wrap gap-5 text-slate-300">

                  <span>
                    🛏{" "}
                    {property.bedrooms ??
                      "—"}
                  </span>

                  <span>
                    🛁{" "}
                    {property.bathrooms ??
                      "—"}
                  </span>

                  <span>
                    🏠{" "}
                    {property.type ??
                      "—"}
                  </span>

                </div>

              </div>

              {/* PRICE */}

              <div className="mt-6 grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-slate-800 p-4">

                  <p className="text-sm text-slate-400">
                    Asking price
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {formatMoney(
                      purchasePrice
                    )}
                  </p>

                </div>

                <div className="rounded-2xl bg-green-500/10 p-4">

                  <p className="text-sm text-green-400">
                    Estimated value
                  </p>

                  <p className="mt-1 text-2xl font-bold text-green-400">
                    {formatMoney(
                      estimatedValue
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            COMPARABLE VALUATION
        ================================================== */}

        <section className="mt-6">

          <div className="mb-4">

            <h2 className="text-xl font-bold">
              Comparable Valuation
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Valuation based on recent local
              sold-property evidence.
            </p>

          </div>

          <div className="grid gap-3 md:grid-cols-4">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">

              <p className="text-sm text-slate-400">
                Estimated market value
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatMoney(
                  estimatedValue
                )}
              </p>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">

              <p className="text-sm text-slate-400">
                Valuation range
              </p>

              <p className="mt-1 text-lg font-bold">
                {formatMoney(
                  valuation?.valuationRangeLow ??
                    0
                )}
                {" – "}
                {formatMoney(
                  valuation?.valuationRangeHigh ??
                    0
                )}
              </p>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">

              <p className="text-sm text-slate-400">
                Comparable sales
              </p>

              <p className="mt-1 text-2xl font-bold">
                {valuation?.comparableCount ??
                  0}
              </p>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">

              <p className="text-sm text-slate-400">
                Confidence
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-400">
                {valuation?.confidence ??
                  0}
                %
              </p>

            </div>

          </div>

        </section>

        {/* ==================================================
            VALUATION EVIDENCE
        ================================================== */}

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">

          <h2 className="text-xl font-bold">
            Valuation Evidence
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            How the valuation has been calculated.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-2xl bg-slate-800 p-3">

              <p className="text-sm text-slate-400">
                Exact postcode
              </p>

              <p className="mt-1 text-xl font-bold">
                {valuation?.exactPostcodeCount ??
                  0}
              </p>

              <p className="text-xs text-slate-500">
                Same postcode
              </p>

            </div>

            <div className="rounded-2xl bg-slate-800 p-3">

              <p className="text-sm text-slate-400">
                Same street
              </p>

              <p className="mt-1 text-xl font-bold">
                {valuation?.sameStreetCount ??
                  0}
              </p>

              <p className="text-xs text-slate-500">
                Strong local evidence
              </p>

            </div>

            <div className="rounded-2xl bg-slate-800 p-3">

              <p className="text-sm text-slate-400">
                Same property type
              </p>

              <p className="mt-1 text-xl font-bold">
                {valuation?.sameTypeCount ??
                  0}
              </p>

              <p className="text-xs text-slate-500">
                Matching type
              </p>

            </div>

            <div className="rounded-2xl bg-slate-800 p-3">

              <p className="text-sm text-slate-400">
                Same bedrooms
              </p>

              <p className="mt-1 text-xl font-bold">
                {valuation?.sameBedroomsCount ??
                  0}
              </p>

              <p className="text-xs text-slate-500">
                Where data exists
              </p>

            </div>

            <div className="rounded-2xl bg-slate-800 p-3">

              <p className="text-sm text-slate-400">
                Recent sales
              </p>

              <p className="mt-1 text-xl font-bold">
                {valuation?.recentCount ??
                  0}
              </p>

              <p className="text-xs text-slate-500">
                Within 12 months
              </p>

            </div>

          </div>

        </section>

        {/* ==================================================
            DEAL POSITION
        ================================================== */}

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">

          <h2 className="text-xl font-bold">
            Deal Position
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">

            <div>

              <p className="text-sm text-slate-400">
                Purchase price
              </p>

              <p className="text-xl font-bold">
                {formatMoney(
                  purchasePrice
                )}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-400">
                Estimated market value
              </p>

              <p className="text-xl font-bold">
                {formatMoney(
                  estimatedValue
                )}
              </p>

            </div>

            <div>

              <p className="text-sm text-slate-400">
                Potential BMV
              </p>

              <p
                className={`text-xl font-bold ${
                  discountPercent > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {discountPercent}%
              </p>

            </div>

          </div>

          <div className="mt-4 rounded-2xl bg-slate-800 p-4">

            <div className="flex items-center justify-between">

              <span className="text-slate-400">
                Potential profit
              </span>

              <span
                className={`font-bold ${
                  profit > 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {formatMoney(profit)}
              </span>

            </div>

          </div>

        </section>

        {/* ==================================================
            AI ANALYSIS
        ================================================== */}

        <AIAnalysisPanel
          propertyId={property.id}
          existingAnalysis={
            existingAIAnalysis
          }
        />

        {/* ==================================================
            COMPARABLE SALES
        ================================================== */}

        <section className="mt-6">

          <div className="mb-4">

            <h2 className="text-xl font-bold">
              Comparable Sales
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              The actual sold properties used to
              calculate the valuation.
            </p>

          </div>

          <div className="space-y-3">

            {valuation?.comparables?.map(
              (comparable: any) => {

                const reasons =
                  reasonForComparable(
                    comparable
                  );

                return (
                  <div
                    key={comparable.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >

                    <div className="flex flex-col justify-between gap-3 lg:flex-row">

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-base font-bold">
                            {
                              comparable.address
                            }
                          </h3>

                          {comparable.exactPostcode && (
                            <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-400">
                              Exact postcode
                            </span>
                          )}

                          {comparable.sameStreet && (
                            <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400">
                              Same street
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {
                            comparable.postcode
                          }
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">

                          {reasons.map(
                            (
                              reason: string
                            ) => (
                              <span
                                key={reason}
                                className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                              >
                                ✓ {reason}
                              </span>
                            )
                          )}

                        </div>

                      </div>

                      <div className="text-left lg:text-right">

                        <p className="text-xl font-bold">
                          {formatMoney(
                            comparable.soldPrice
                          )}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Sold{" "}
                          {formatDate(
                            comparable.soldDate
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Comparable score:{" "}
                          {
                            comparable.comparableScore
                          }
                        </p>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* SOURCE */}

        <p className="mt-6 text-xs text-slate-500">
          Comparable sales data sourced from HM
          Land Registry Price Paid Data.
          Valuations are estimates based on
          available transaction evidence and should
          not be treated as a formal survey or
          valuation.
        </p>

      </div>
    </main>
  );
}