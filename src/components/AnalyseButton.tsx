"use client";

import { useState } from "react";

type Props = {
  propertyId: number;
};

export default function AnalyseButton({ propertyId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function analyseDeal() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setMessage("AI analysis complete");

      window.location.reload();
    } catch (error) {
      console.error(error);
      setMessage("AI analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={analyseDeal}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50"
      >
        {loading ? "🤖 Analysing..." : "🤖 Analyse Deal"}
      </button>

      {message && (
        <p className="text-xs text-gray-500 text-center mt-2">
          {message}
        </p>
      )}
    </div>
  );
}