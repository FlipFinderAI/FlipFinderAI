
"use client";

import { useState } from "react";

type EPCRecommendation = {
  recommendation: string;
  impact: string;
  typicalSaving: string;
  cost: string;
};

type EPCCertificateProps = {
  rating: string | null;
  potentialRating: string | null;
  score: number | null;
  potentialScore: number | null;
  certificateDate: Date | null;
  floorArea: number | null;
  heating: string | null;
  source: string | null;
  propertyType: string | null;
  mainFuel: string | null;
  walls: string | null;
  roof: string | null;
  windows: string | null;
  recommendations: EPCRecommendation[] | null;
  estimatedCosts: Record<string, unknown> | null;
  certificateUrl: string | null;
};

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

function getRatingColor(rating: string | null) {
  switch (rating?.toUpperCase()) {
    case "A":
      return "bg-green-500 text-white";
    case "B":
      return "bg-lime-500 text-white";
    case "C":
      return "bg-yellow-400 text-slate-900";
    case "D":
      return "bg-orange-400 text-white";
    case "E":
      return "bg-orange-600 text-white";
    case "F":
      return "bg-red-500 text-white";
    case "G":
      return "bg-red-800 text-white";
    default:
      return "bg-slate-700 text-slate-300";
  }
}

function getRatingDescription(rating: string | null) {
  switch (rating?.toUpperCase()) {
    case "A":
      return "Excellent energy efficiency";
    case "B":
      return "Very good energy efficiency";
    case "C":
      return "Good energy efficiency";
    case "D":
      return "Average energy efficiency";
    case "E":
      return "Below average energy efficiency";
    case "F":
      return "Poor energy efficiency";
    case "G":
      return "Very poor energy efficiency";
    default:
      return "Energy rating unavailable";
  }
}

export default function EPCCertificate({
  rating,
  potentialRating,
  score,
  potentialScore,
  certificateDate,
  floorArea,
  heating,
  source,
  propertyType,
  mainFuel,
  walls,
  roof,
  windows,
  recommendations,
  estimatedCosts,
  certificateUrl,
}: EPCCertificateProps) {
  const currentRating =
    rating?.toUpperCase() || null;

  const potential =
    potentialRating?.toUpperCase() || null;

  const [showDetails, setShowDetails] =
    useState(false);

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
      {/* HEADER */}

      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                ⚡
              </span>

              <h2 className="text-xl font-bold text-white">
                Energy Performance Certificate
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Property energy efficiency information
            </p>
          </div>

          {source && (
            <div className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-400">
              Source: {source}
            </div>
          )}
        </div>
      </div>

      {/* CERTIFICATE BODY */}

      <div className="p-5">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* CURRENT RATING */}

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-sm font-medium text-slate-400">
              Current energy rating
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-2xl text-5xl font-black shadow-lg ${
                  getRatingColor(currentRating)
                }`}
              >
                {currentRating || "—"}
              </div>

              <div>
                <p className="text-lg font-bold text-white">
                  {getRatingDescription(
                    currentRating
                  )}
                </p>

                {score !== null && (
                  <p className="mt-1 text-sm text-slate-400">
                    EPC score:{" "}
                    <span className="font-semibold text-white">
                      {score}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* EPC SCALE */}

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                EPC rating scale
              </p>

              <div className="flex h-8 overflow-hidden rounded-lg">
                {[
                  ["A", "bg-green-500"],
                  ["B", "bg-lime-500"],
                  ["C", "bg-yellow-400"],
                  ["D", "bg-orange-400"],
                  ["E", "bg-orange-600"],
                  ["F", "bg-red-500"],
                  ["G", "bg-red-800"],
                ].map(([letter, colour]) => (
                  <div
                    key={letter}
                    className={`flex flex-1 items-center justify-center text-xs font-bold text-white ${colour} ${
                      currentRating === letter
                        ? "ring-2 ring-white ring-inset"
                        : ""
                    }`}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CERTIFICATE DETAILS */}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-800 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Potential rating
              </p>

              <div className="mt-2 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black ${
                    getRatingColor(potential)
                  }`}
                >
                  {potential || "—"}
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    {potential
                      ? `Could improve to ${potential}`
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Floor area
              </p>

              <p className="mt-2 text-xl font-bold text-white">
                {floorArea
                  ? `${floorArea} m²`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Main heating
              </p>

              <p className="mt-2 text-sm font-semibold text-white">
                {heating || "Not available"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Certificate date
              </p>

              <p className="mt-2 text-sm font-semibold text-white">
                {formatDate(
                  certificateDate
                )}
              </p>
            </div>
          </div>
        </div>

        {/* POTENTIAL IMPROVEMENT */}

        {currentRating &&
          potential &&
          currentRating !== potential && (
            <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  💡
                </span>

                <div>
                  <p className="font-semibold text-blue-300">
                    Improvement potential
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    This property is currently rated{" "}
                    <strong>{currentRating}</strong>{" "}
                    and has the potential to reach{" "}
                    <strong>{potential}</strong>.
                    This may indicate opportunities
                    for energy-efficiency improvements
                    during refurbishment.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* EXPANDABLE FULL DETAILS */}

        {(walls || roof || windows || mainFuel || propertyType || recommendations || estimatedCosts) && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() =>
                setShowDetails((prev) => !prev)
              }
              className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
            >
              <span>
                {showDetails ? "Hide" : "Show"} full certificate details
              </span>
              <span className="text-slate-500">
                {showDetails ? "▲" : "▼"}
              </span>
            </button>

            {showDetails && (
              <div className="mt-3 space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                {/* PROPERTY DETAILS */}

                {(propertyType || mainFuel) && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Property details
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {propertyType && (
                        <div className="rounded-xl bg-slate-800 p-3">
                          <p className="text-xs text-slate-500">Property type</p>
                          <p className="mt-1 text-sm font-semibold text-white">{propertyType}</p>
                        </div>
                      )}

                      {mainFuel && (
                        <div className="rounded-xl bg-slate-800 p-3">
                          <p className="text-xs text-slate-500">Main fuel</p>
                          <p className="mt-1 text-sm font-semibold text-white">{mainFuel}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* BUILDING ENVELOPE */}

                {(walls || roof || windows) && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Building envelope
                    </p>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {walls && (
                        <div className="rounded-xl bg-slate-800 p-3">
                          <p className="text-xs text-slate-500">Walls</p>
                          <p className="mt-1 text-sm font-semibold text-white">{walls}</p>
                        </div>
                      )}

                      {roof && (
                        <div className="rounded-xl bg-slate-800 p-3">
                          <p className="text-xs text-slate-500">Roof</p>
                          <p className="mt-1 text-sm font-semibold text-white">{roof}</p>
                        </div>
                      )}

                      {windows && (
                        <div className="rounded-xl bg-slate-800 p-3">
                          <p className="text-xs text-slate-500">Windows</p>
                          <p className="mt-1 text-sm font-semibold text-white">{windows}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ESTIMATED COSTS */}

                {estimatedCosts && Object.keys(estimatedCosts).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Estimated energy costs
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(estimatedCosts).map(([key, value]) => (
                        <div key={key} className="rounded-xl bg-slate-800 p-3">
                          <p className="text-xs text-slate-500">{key}</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {typeof value === "number" ? `£${value}` : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RECOMMENDATIONS */}

                {recommendations && recommendations.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Recommended improvements
                    </p>

                    <div className="space-y-2">
                      {recommendations.map(
                        (rec, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-slate-800 bg-slate-800 p-3"
                          >
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {rec.recommendation}
                                </p>

                                {rec.impact && (
                                  <p className="mt-0.5 text-xs text-slate-400">
                                    Impact: {rec.impact}
                                  </p>
                                )}
                              </div>

                              <div className="flex gap-3 text-xs text-slate-400">
                                {rec.typicalSaving && (
                                  <span>
                                    Saving:{" "}
                                    <span className="font-semibold text-green-400">
                                      {rec.typicalSaving}
                                    </span>
                                  </span>
                                )}

                                {rec.cost && (
                                  <span>
                                    Cost:{" "}
                                    <span className="font-semibold text-white">
                                      {rec.cost}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* CERTIFICATE LINK */}

                {certificateUrl && (
                  <div className="mt-2 border-t border-slate-800 pt-3">
                    <a
                      href={certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 transition hover:text-blue-300"
                    >
                      View full EPC certificate ↗
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Energy Performance Certificate
          </span>

          <span>
            {source || "EPC data"}
          </span>
        </div>
      </div>
    </section>
  );
}