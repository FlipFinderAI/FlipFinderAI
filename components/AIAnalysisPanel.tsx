"use client";

import { useState } from "react";

type AIAnalysis = {
  overallCondition: string;
  refurbRequired: boolean;
  estimatedRefurbCost: number;
  kitchen: string;
  bathroom: string;
  decoration: string;
  flooring: string;
  exterior: string;
  opportunities: string[];
  risks: string[];
  detectedIssues: string[];
  refurbPlan: string[];
  recommendation: "BUY" | "INVESTIGATE" | "AVOID";
  confidence: number;
  summary: string;
};

function formatMoney(value: number) {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

export default function AIAnalysisPanel({
  propertyId,
  existingAnalysis,
}: {
  propertyId: number;
  existingAnalysis?: AIAnalysis | null;
}) {
  const [analysis, setAnalysis] =
    useState<AIAnalysis | null>(
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
      const response =
        await fetch("/api/analyse", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: propertyId,
          }),
        });

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "AI analysis failed."
        );
      }

      setAnalysis(data.analysis);
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
    analysis?.recommendation;

  return (
    <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">
            AI Property Analysis
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            AI analysis of the property photos,
            condition and refurbishment potential.
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
              ? "Run AI Analysis Again"
              : "Analyse Property"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="mt-5 rounded-2xl bg-slate-800 p-5 text-sm text-slate-400">
          Click <strong className="text-white">Analyse Property</strong>{" "}
          to have AI examine the imported property photos and
          assess refurbishment potential.
        </div>
      )}

      {loading && (
        <div className="mt-5 rounded-2xl bg-slate-800 p-6 text-center">
          <div className="text-lg font-semibold">
            🔍 Analysing property...
          </div>

          <p className="mt-2 text-sm text-slate-400">
            AI is examining the property photos and
            investment potential.
          </p>
        </div>
      )}

      {analysis && !loading && (
        <div className="mt-5 space-y-4">

          {/* RECOMMENDATION */}
          <div
            className={`rounded-2xl border p-5 ${
              recommendation === "BUY"
                ? "border-green-500/30 bg-green-500/10"
                : recommendation === "AVOID"
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-yellow-500/30 bg-yellow-500/10"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Recommendation
                </p>

                <p
                  className={`mt-1 text-3xl font-black ${
                    recommendation === "BUY"
                      ? "text-green-400"
                      : recommendation === "AVOID"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {recommendation}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-sm text-slate-400">
                  AI confidence
                </p>

                <p className="text-2xl font-bold text-white">
                  {analysis.confidence}%
                </p>
              </div>

            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              {analysis.summary}
            </p>
          </div>

          {/* CONDITION */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            <div className="rounded-2xl bg-slate-800 p-4">
              <p className="text-xs text-slate-400">
                Overall condition
              </p>
              <p className="mt-1 font-semibold">
                {analysis.overallCondition}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-4">
              <p className="text-xs text-slate-400">
                Kitchen
              </p>
              <p className="mt-1 text-sm font-semibold">
                {analysis.kitchen}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-4">
              <p className="text-xs text-slate-400">
                Bathroom
              </p>
              <p className="mt-1 text-sm font-semibold">
                {analysis.bathroom}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-4">
              <p className="text-xs text-slate-400">
                Decoration
              </p>
              <p className="mt-1 text-sm font-semibold">
                {analysis.decoration}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-4">
              <p className="text-xs text-slate-400">
                Flooring
              </p>
              <p className="mt-1 text-sm font-semibold">
                {analysis.flooring}
              </p>
            </div>

          </div>

          {/* REFURB */}
          <div className="grid gap-3 md:grid-cols-2">

            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">
                  Refurbishment
                </h3>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    analysis.refurbRequired
                      ? "bg-orange-500/10 text-orange-400"
                      : "bg-green-500/10 text-green-400"
                  }`}
                >
                  {analysis.refurbRequired
                    ? "Required"
                    : "Not significant"}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-400">
                Estimated refurbishment cost
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatMoney(
                  analysis.estimatedRefurbCost
                )}
              </p>

              {analysis.refurbPlan.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold">
                    Suggested works
                  </p>

                  <ul className="space-y-2">
                    {analysis.refurbPlan.map(
                      (item, index) => (
                        <li
                          key={`${item}-${index}`}
                          className="text-sm text-slate-300"
                        >
                          🔨 {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-5">
              <h3 className="font-bold">
                Exterior
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                {analysis.exterior}
              </p>
            </div>

          </div>

          {/* ISSUES / RISKS */}
          <div className="grid gap-3 md:grid-cols-2">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="font-bold">
                🔧 Detected Issues
              </h3>

              {analysis.detectedIssues.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {analysis.detectedIssues.map(
                    (item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="text-sm text-slate-300"
                      >
                        • {item}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No obvious issues detected.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="font-bold">
                ⚠️ Investor Risks
              </h3>

              {analysis.risks.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {analysis.risks.map(
                    (item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="text-sm text-slate-300"
                      >
                        • {item}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No major risks identified from
                  the available information.
                </p>
              )}
            </div>

          </div>

          {/* OPPORTUNITIES */}
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <h3 className="font-bold text-green-400">
              💡 Value-Add Opportunities
            </h3>

            {analysis.opportunities.length > 0 ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {analysis.opportunities.map(
                  (item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="rounded-xl bg-slate-800 p-3 text-sm text-slate-300"
                    >
                      ✓ {item}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No obvious value-add opportunities
                identified.
              </p>
            )}
          </div>

        </div>
      )}
    </section>
  );
}