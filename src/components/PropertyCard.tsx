
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
  property: Property;
};

/* =========================================================
   PROPERTY IMAGE
========================================================= */

function getPropertyImage(
  imagesString?: string | null
): string {
  const fallback =
    "/house-placeholder.jpg";

  if (!imagesString) {
    return fallback;
  }

  try {
    const parsed =
      JSON.parse(imagesString);

    if (!Array.isArray(parsed)) {
      return fallback;
    }

    for (const item of parsed) {
      if (
        typeof item !== "string"
      ) {
        continue;
      }

      let url =
        item.trim();

      if (!url) {
        continue;
      }

      /*
       * Handle markdown-style URLs.
       */
      const markdownMatch =
        url.match(
          /\]\((https?:\/\/[^)]+)\)/
        );

      if (
        markdownMatch?.[1]
      ) {
        url =
          markdownMatch[1];
      }

      /*
       * Handle:
       *
       * [https://example.com/image.jpg]
       */
      const bracketMatch =
        url.match(
          /\[(https?:\/\/[^\]]+)\]/
        );

      if (
        bracketMatch?.[1]
      ) {
        url =
          bracketMatch[1];
      }

      /*
       * Remove accidental wrappers.
       */
      url =
        url
          .replace(/^\[/, "")
          .replace(/\]$/, "")
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .trim();

      /*
 * Accept both:
 *
 * 1. External property image URLs
 * 2. Local images saved by FlipFinderAI
 */
if (
  !/^https?:\/\//i.test(url) &&
  !url.startsWith("/")
) {
  continue;
}

      const lower =
        url.toLowerCase();

      /*
       * Reject obvious non-property images.
       */
      const blockedTerms = [
        "logo",
        "icon",
        "avatar",
        "agent-photo",
        "branch",
        "floorplan",
        "floor-plan",
        "map-marker",
        "marker",
        "favicon",
        "sprite",
        "placeholder",
      ];

      const blocked =
        blockedTerms.some(
          (term) =>
            lower.includes(term)
        );

      if (blocked) {
        continue;
      }

      /*
       * IMPORTANT:
       *
       * Do NOT restrict this to
       * /property-photo/.
       *
       * Different UK property
       * websites use different
       * image URL structures.
       */
      return url;
    }
  } catch (error) {
    console.error(
      "Could not parse property images:",
      error
    );
  }

  return fallback;
}

/* =========================================================
   PROPERTY CARD
========================================================= */

export default function PropertyCard({
  property,
}: Props) {
  const [
    analysing,
    setAnalysing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * FINANCIAL VALUES
   */

  const value =
    property.estimatedValue ??
    0;

  const refurb =
    property.totalRefurbCost ??
    0;

  const profit =
    property.potentialProfit ??
    value -
      property.price -
      refurb;

  const discount =
    property.discountPercent ??
    (value > 0
      ? ((value -
          property.price) /
          value) *
        100
      : 0);

  const score =
    property.aiScore ??
    0;

  /*
   * PROPERTY IMAGE
   */

  const image =
    getPropertyImage(
      property.images
    );

  /* =======================================================
     AI ANALYSIS
  ======================================================= */

  async function analyseDeal() {
    setAnalysing(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/analyse",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              propertyId:
                property.id,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "AI analysis failed"
        );
      }

      window.location.href =
        `/property/${property.id}`;
    } catch (err) {
      console.error(err);

      setError(
        "AI analysis failed. Please try again."
      );

      setAnalysing(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex flex-col h-full">

      {/* ===================================================
          PROPERTY IMAGE
      =================================================== */}

      <div className="relative h-48 w-full bg-gray-100">

        <Image
          src={image}
          alt={property.address}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          unoptimized
        />

        {/* AI SCORE */}

        <div className="absolute top-3 left-3 bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
          AI {score}/100
        </div>

        {/* BMV */}

        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
          {discount.toFixed(0)}% BMV
        </div>

      </div>

      {/* ===================================================
          PROPERTY DETAILS
      =================================================== */}

      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* ADDRESS */}

        <div>

          <h2 className="font-bold text-lg leading-tight">
            {property.address}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {property.postcode ||
              "Leeds"}
          </p>

        </div>

        {/* =================================================
            PROPERTY TYPE
        ================================================= */}

        <div className="flex gap-2 text-xs flex-wrap">

          <span className="bg-gray-100 px-3 py-1.5 rounded-full">
            🛏{" "}
            {property.bedrooms ??
              0}
          </span>

          <span className="bg-gray-100 px-3 py-1.5 rounded-full">
            🛁{" "}
            {property.bathrooms ??
              0}
          </span>

          <span className="bg-gray-100 px-3 py-1.5 rounded-full">
            🏠{" "}
            {property.type ||
              "Property"}
          </span>

        </div>

        {/* =================================================
            FINANCIALS
        ================================================= */}

        <div className="grid grid-cols-2 gap-4">

          {/* PURCHASE */}

          <div>

            <p className="text-xs text-gray-500">
              Purchase
            </p>

            <p className="font-bold text-lg">
              £
              {property.price.toLocaleString()}
            </p>

          </div>

          {/* MARKET VALUE */}

          <div>

            <p className="text-xs text-gray-500">
              Market Value
            </p>

            <p className="font-bold text-lg">
              £
              {value.toLocaleString()}
            </p>

          </div>

          {/* REFURB */}

          <div>

            <p className="text-xs text-gray-500">
              Refurb
            </p>

            <p className="font-bold">
              £
              {refurb.toLocaleString()}
            </p>

          </div>

          {/* PROFIT */}

          <div>

            <p className="text-xs text-gray-500">
              Profit
            </p>

            <p className="font-bold text-green-700">
              £
              {profit.toLocaleString()}
            </p>

          </div>

        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="mt-auto">

          <button
            onClick={
              analyseDeal
            }
            disabled={
              analysing
            }
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {analysing
              ? "Analysing..."
              : "Analyse Deal"}
          </button>

          {error && (
            <p className="text-red-600 text-xs mt-2 text-center">
              {error}
            </p>
          )}

          <Link
            href={`/property/${property.id}`}
            className="block text-center text-sm text-gray-500 mt-3 hover:text-black"
          >
            View Property
          </Link>

        </div>

      </div>

    </div>
  );
}