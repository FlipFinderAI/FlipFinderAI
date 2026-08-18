import PropertyHeader from "@/components/property/PropertyHeader";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import AIAnalysisPanel from "@/components/AIAnalysisPanel";
import EPCCertificate from "@/components/EPCCertificate";
import ValuationEvidence from "@/components/property/ValuationEvidence";

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "£0";
  }

  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function reasonForComparable(comparable: any) {
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
   * ============================================================
   * COMPARABLE VALUATION
   * ============================================================
   */

  let valuation: any = null;

  try {
    const {
      calculateComparableValue,
    } = await import(
      "@/lib/comparableValuation"
    );

    valuation =
      await calculateComparableValue(
        property.id
      );
  } catch (error) {
    console.error(
      "Comparable valuation failed:",
      error
    );
  }

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
   * ============================================================
   * PROPERTY PHOTOS
   * ============================================================
   */

  const images = Array.from(
    new Set(
      property.photos
        .map((photo) => photo.url)
        .filter(
          (url): url is string =>
            typeof url === "string" &&
            url.trim().length > 0
        )
        .map((url) => {
          const markdownMatch =
            url.match(
              /\]\((https?:\/\/[^)]+)\)/
            );

          if (markdownMatch?.[1]) {
            return markdownMatch[1];
          }

          const bracketMatch =
            url.match(
              /\[(https?:\/\/[^\]]+)\]/
            );

          if (bracketMatch?.[1]) {
            return bracketMatch[1];
          }

          return url
            .replace(/^\[/, "")
            .replace(/\]$/, "")
            .trim();
        })
        .filter((url) => {
          const isLocalPropertyImage =
            url.startsWith(
              "/uploads/properties/"
            );

          const isOnTheMarket =
            url.includes(
              "media.onthemarket.com/properties"
            );

          const isZoopla =
            url.includes(
              "lid.zoocdn.com"
            );

          const isZooplaAgentLogo =
            url.includes(
              "st.zoocdn.com/zoopla_static_agent_logo"
            );

          const isLikelyImage =
            /\.(jpg|jpeg|png|webp)(?:[?#].*)?$/i.test(
              url
            );

          return (
            (
              isLocalPropertyImage ||
              isOnTheMarket ||
              isZoopla
            ) &&
            !isZooplaAgentLogo &&
            isLikelyImage
          );
        })
    )
  );

  /*
   * ============================================================
   * FLOOR PLANS
   * ============================================================
   */

  const floorPlans: string[] =
    parseJson<string[]>(
      property.floorPlanImages,
      []
    ).filter(
      (url): url is string =>
        typeof url === "string" &&
        url.trim().length > 0
    );

  /*
   * ============================================================
   * EPC DATA
   * ============================================================
   */

  const epcRating =
    property.epcRating ?? null;

  const epcPotentialRating =
    property.epcPotentialRating ?? null;

  const epcScore =
    property.epcScore ?? null;

  const epcCertificateDate =
    property.epcCertificateDate ?? null;

  const epcFloorArea =
    property.epcFloorArea ?? null;

  const epcHeating =
    property.epcHeating ?? null;

  const epcSource =
    property.epcSource ?? null;

  const epcPotentialScore =
    property.epcPotentialScore ?? null;

  const epcPropertyType =
    property.epcPropertyType ?? null;

  const epcMainFuel =
    property.epcMainFuel ?? null;

  const epcWalls =
    property.epcWalls ?? null;

  const epcRoof =
    property.epcRoof ?? null;

  const epcWindows =
    property.epcWindows ?? null;

  const epcRecommendations =
    parseJson<
      Array<{
        recommendation: string;
        impact: string;
        typicalSaving: string;
        cost: string;
      }>
    >(
      property.epcRecommendations,
      []
    );

  const epcEstimatedCosts =
    parseJson<Record<string, unknown> | null>(
      property.epcEstimatedCosts,
      null
    );

  const epcCertificateUrl =
    property.epcCertificateUrl ?? null;

  /*
   * ============================================================
   * EXISTING AI DATA
   * ============================================================
   */

  const photoAnalysis =
    parseJson<Record<string, unknown>>(
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
            property.aiRecommendation === "BUY" ||
            property.aiRecommendation ===
              "INVESTIGATE" ||
            property.aiRecommendation === "AVOID"
              ? property.aiRecommendation
              : "INVESTIGATE",

          confidence:
            property.aiConfidence ?? 0,

          summary:
            property.aiSummary,
        }
      : null;

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* BACK */}

        <div className="mb-4">
          <Link
            href="/"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to deals
          </Link>
        </div>

        {/* PROPERTY HEADER */}

        <PropertyHeader
          property={property}
          images={images}
          floorPlans={floorPlans}
          purchasePrice={purchasePrice}
          estimatedValue={estimatedValue}
          discountPercent={discountPercent}
          formatMoney={formatMoney}
        />

        {/* EPC */}

        <EPCCertificate
          rating={epcRating}
          potentialRating={epcPotentialRating}
          score={epcScore}
          potentialScore={epcPotentialScore}
          certificateDate={epcCertificateDate}
          floorArea={
            epcFloorArea ??
            property.floorArea
          }
          heating={epcHeating}
          source={epcSource}
          propertyType={epcPropertyType}
          mainFuel={epcMainFuel}
          walls={epcWalls}
          roof={epcRoof}
          windows={epcWindows}
          recommendations={
            epcRecommendations.length > 0
              ? epcRecommendations
              : null
          }
          estimatedCosts={epcEstimatedCosts}
          certificateUrl={epcCertificateUrl}
        />

        {/* LOCATION */}

        {(property.latitude || property.postcode) && (
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl font-bold">
              Location
            </h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {property.latitude && property.longitude && (
                <div className="rounded-2xl bg-slate-800 p-4">
                  <p className="text-xs text-slate-500">Coordinates</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {property.latitude.toFixed(5)}, {property.longitude.toFixed(5)}
                  </p>
                </div>
              )}

              {property.postcode && (
                <div className="rounded-2xl bg-slate-800 p-4">
                  <p className="text-xs text-slate-500">Postcode</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {property.postcode}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FLOOR PLANS */}

        {floorPlans.length > 0 && (
          <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl font-bold">
              Floor Plans
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {floorPlans.length} floor plan image{floorPlans.length !== 1 ? "s" : ""} available
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {floorPlans.map(
                (fp, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800"
                  >
                    <img
                      src={fp}
                      alt={`Floor plan ${index + 1}`}
                      className="h-48 w-full object-contain bg-white"
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* COMPARABLE VALUATION */}

        <section className="mt-6">

          <div className="mb-4">

            <h2 className="text-xl font-bold">
              Comparable Valuation
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Valuation based on recent local sold-property evidence.
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
                {valuation?.comparableCount ?? 0}
              </p>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">

              <p className="text-sm text-slate-400">
                Confidence
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-400">
                {valuation?.confidence ?? 0}%
              </p>

            </div>

          </div>

        </section>

        {/* VALUATION EVIDENCE */}

        <ValuationEvidence
          valuation={valuation}
        />

        {/* DEAL POSITION */}

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
                {formatMoney(
                  profit
                )}
              </span>

            </div>

          </div>

        </section>

        {/* AI ANALYSIS */}

        <AIAnalysisPanel
          propertyId={property.id}
          existingAnalysis={
            existingAIAnalysis
          }
        />

        {/* COMPARABLE SALES */}

        <section className="mt-6">

          <div className="mb-4">

            <h2 className="text-xl font-bold">
              Comparable Sales
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              The actual sold properties used to calculate the valuation.
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
                            {comparable.address ??
                              "Unknown address"}
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
                          {comparable.postcode}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">

                          {reasons.map(
                            (reason: string) => (
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
                          {comparable.comparableScore}
                        </p>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* SOURCE DISCLAIMER */}

        <p className="mt-6 text-xs text-slate-500">
          Comparable sales data sourced from HM Land Registry
          Price Paid Data. Valuations are estimates based on
          available transaction evidence and should not be treated
          as a formal survey or valuation.
        </p>

      </div>
    </main>
  );
}
