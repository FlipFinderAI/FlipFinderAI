"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ImportPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleImport(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Property import failed"
        );
      }

      setMessage(
        `Property imported successfully. ID: ${data.property.id}`
      );

      setUrl("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Property import failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-600 hover:text-black"
          >
            ← Back to properties
          </Link>

          <h1 className="text-4xl font-bold mt-5">
            Import Property
          </h1>

          <p className="text-gray-600 mt-2">
            Paste a property listing URL and
            FlipFinderAI will attempt to extract
            the property details automatically.
          </p>
        </div>

        <form
          onSubmit={handleImport}
          className="bg-white rounded-2xl shadow-sm border p-8"
        >
          <label className="block text-sm font-semibold mb-2">
            Property Listing URL
          </label>

          <input
            required
            type="url"
            value={url}
            onChange={(event) =>
              setUrl(event.target.value)
            }
            placeholder="https://www.rightmove.co.uk/properties/..."
            className="w-full border rounded-xl px-4 py-4 text-lg outline-none focus:ring-2 focus:ring-black"
          />

          <p className="text-sm text-gray-500 mt-3">
            Paste the full URL of the property listing.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-black text-white rounded-xl py-4 font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? "Finding property details..."
              : "Import Property"}
          </button>

          {message && (
            <div className="mt-6 bg-gray-50 border rounded-xl p-4 text-sm">
              {message}
            </div>
          )}
        </form>

        <div className="mt-8 bg-white rounded-2xl border p-6">
          <h2 className="text-xl font-bold">
            How it works
          </h2>

          <div className="mt-5 space-y-4 text-sm text-gray-600">
            <div>
              <strong className="text-black">
                1. Paste the listing
              </strong>
              <p>
                Give FlipFinderAI the URL of the
                property you want to investigate.
              </p>
            </div>

            <div>
              <strong className="text-black">
                2. Extract the details
              </strong>
              <p>
                FlipFinderAI attempts to find the
                address, price, bedrooms, bathrooms,
                property type, agent, description and
                photographs.
              </p>
            </div>

            <div>
              <strong className="text-black">
                3. Analyse the deal
              </strong>
              <p>
                The property can then be assessed
                against comparable sales and the
                FlipFinderAI investment calculations.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <p className="text-sm text-yellow-900">
            <strong>Note:</strong> Some property
            websites block automated access. If a
            website prevents FlipFinderAI from
            reading the listing, we can add other
            import methods later.
          </p>
        </div>

      </div>
    </main>
  );
}