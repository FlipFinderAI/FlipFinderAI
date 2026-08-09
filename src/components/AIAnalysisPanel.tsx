
"use client";

import { useState } from "react";

type Analysis = {
  overallCondition?: string;
  refurbRequired?: boolean;
  estimatedRefurbCost?: number;
  kitchen?: string;
  bathroom?: string;
  decoration?: string;
  flooring?: string;
  exterior?: string;
  opportunities?: string[];
  risks?: string[];
  detectedIssues?: string[];
  refurbPlan?: string[];
  recommendation?: string;
  confidence?: number;
  summary?: string | null;
};

type Props = {
  propertyId: number;
  existingAnalysis?: Analysis | null;
};

function formatMoney(value: number) {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

export default function AIAnalysisPanel({
  propertyId,
  existingAnalysis,
}: Props) {
  const [analysis, setAnalysis] =
    useState<Analysis | null>(
      existingAnalysis ?? null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function runAnalysis() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/analyse",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            propertyId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "AI analysis failed."
        );
      }

      setAnalysis(
        data.analysis
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI analysis failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const recommendation =
    analysis?.recommendation ||
    "";

  const recommendationClass =
    recommendation === "BUY"
      ? "bg-green-500/10 text-green-400 border-green-500/20"
      : recommendation === "AVOID"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

  return (
    <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h2 className="text-xl font-bold">
            AI Property Analysis
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            AI assessment of the property's
            condition, refurbishment potential
            and investment risks.
          </p>
        </div>

        <button
          type="button"
          onClick={runAnalysis}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Analysing..."
            : analysis
            ? "Run AI Again"
            : "Analyse Property"}
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* NO ANALYSIS */}

      {!analysis &&
        !loading &&
        !error && (
          <div className="mt-5 rounded-2xl bg-slate-800 p-5 text-center">

            <p className="text-slate-300">
              This property has not been
              analysed by AI yet.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Click "Analyse Property" to
              assess the deal.
            </p>

          </div>
        )}

      {/* LOADING */}

      {loading && (
        <div className="mt-5 rounded-2xl bg-slate-800 p-6 text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />

          <p className="mt-3 text-sm text-slate-400">
            AI is analysing the property...
          </p>

        </div>
      )}

      {/* RESULTS */}

      {analysis && !loading && (

        <div className="mt-5 space-y-4">

          {/* RECOMMENDATION */}

          <div className="grid gap-3 md:grid-cols-3">

            <div className="rounded-2xl bg-slate-800 p-4">

              <p className="text-sm text-slate-400">
                Recommendation
              </p>

              <div
                className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold ${recommendationClass}`}
              >
                {recommendation ||
                  "INVESTIGATE"}
              </div>

            </div>

            <div className="rounded-2xl bg-slate-800 p-4">

              <p className="text-sm text-slate-400">
                AI confidence
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-400">
                {analysis.confidence ??
                  0}
                %
              </p>

            </div>

            <div className="rounded-2xl bg-slate-800 p-4">

              <p className="text-sm text-slate-400">
                Estimated refurb
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatMoney(
                  analysis.estimatedRefurbCost ??
                    0
                )}
              </p>

            </div>

          </div>

          {/* SUMMARY */}

          {analysis.summary && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

              <p className="text-sm font-semibold text-slate-300">
                AI Summary
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {analysis.summary}
              </p>

            </div>
          )}

          {/* CONDITION */}

          <div className="grid gap-3 md:grid-cols-2">

            <div className="rounded-2xl bg-slate-800 p-4">

              <p className="text-sm font-semibold text-slate-300">
                Overall condition
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {analysis.overallCondition ||
                  "Not available"}
              </p>

            </div>

            <div className="rounded-2xl bg-slate-800 p-4">

              <p className="text-sm font-semibold text-slate-300">
                Refurbishment required
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {analysis.refurbRequired
                  ? "Yes"
                  : "No"}
              </p>

            </div>

          </div>

          {/* ROOM ANALYSIS */}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-2xl bg-slate-800 p-3">
              <p className="text-xs text-slate-500">
                Kitchen
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {analysis.kitchen ||
                  "Not available"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-3">
              <p className="text-xs text-slate-500">
                Bathroom
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {analysis.bathroom ||
                  "Not available"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-3">
              <p className="text-xs text-slate-500">
                Decoration
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {analysis.decoration ||
                  "Not available"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-3">
              <p className="text-xs text-slate-500">
                Flooring
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {analysis.flooring ||
                  "Not available"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-3">
              <p className="text-xs text-slate-500">
                Exterior
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {analysis.exterior ||
                  "Not available"}
              </p>
            </div>

          </div>

          {/* OPPORTUNITIES / RISKS */}

          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl bg-green-500/5 p-4">

              <h3 className="font-semibold text-green-400">
                Opportunities
              </h3>

              {analysis.opportunities &&
              analysis.opportunities.length >
                0 ? (
                <ul className="mt-3 space-y-2">
                  {analysis.opportunities.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-sm text-slate-300"
                      >
                        ✓ {item}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  None identified.
                </p>
              )}

            </div>

            <div className="rounded-2xl bg-red-500/5 p-4">

              <h3 className="font-semibold text-red-400">
                Risks
              </h3>

              {analysis.risks &&
              analysis.risks.length >
                0 ? (
                <ul className="mt-3 space-y-2">
                  {analysis.risks.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-sm text-slate-300"
                      >
                        ⚠ {item}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  None identified.
                </p>
              )}

            </div>

          </div>

          {/* DETECTED ISSUES */}

          {analysis.detectedIssues &&
            analysis.detectedIssues.length >
              0 && (
              <div className="rounded-2xl bg-slate-800 p-4">

                <h3 className="font-semibold">
                  Detected Issues
                </h3>

                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {analysis.detectedIssues.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-sm text-slate-300"
                      >
                        • {item}
                      </li>
                    )
                  )}
                </ul>

              </div>
            )}

          {/* REFURB PLAN */}

          {analysis.refurbPlan &&
            analysis.refurbPlan.length >
              0 && (
              <div className="rounded-2xl bg-slate-800 p-4">

                <h3 className="font-semibold">
                  Suggested Refurbishment
                </h3>

                <ol className="mt-3 space-y-2">
                  {analysis.refurbPlan.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="text-sm text-slate-300"
                      >
                        {index + 1}. {item}
                      </li>
                    )
                  )}
                </ol>

              </div>
            )}

        </div>
      )}

    </section>
  );
}