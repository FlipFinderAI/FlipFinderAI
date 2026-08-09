
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

function getPropertyImage(imagesString?: string | null): string {
  if (!imagesString) {
    return "/house-placeholder.jpg";
  }

  try {
    const parsed = JSON.parse(imagesString);

    if (!Array.isArray(parsed)) {
      return "/house-placeholder.jpg";
    }

    for (const item of parsed) {
      if (typeof item !== "string") {
        continue;
      }

      let url = item.trim();

      /*
       * Extract URL from Markdown:
       *
       * [https://example.com/photo.jpg](https://example.com/photo.jpg)
       */
      const markdownMatch = url.match(
        /\]\((https?:\/\/[^)]+)\)/
      );

      if (markdownMatch?.[1]) {
        url = markdownMatch[1];
      } else {
        /*
         * Also handle:
         *
         * [https://example.com/photo.jpg]
         */
        const bracketMatch = url.match(
          /\[(https?:\/\/[^\]]+)\]/
        );

        if (bracketMatch?.[1]) {
          url = bracketMatch[1];
        }
      }

      /*
       * Remove any remaining brackets/parentheses.
       */
      url = url
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .trim();

      /*
       * We specifically want an actual property photo.
       *
       * Ignore:
       * - branch profile images
       * - partner logos
       * - floorplans
       * - map markers
       * - industry affiliation images
       * - other Rightmove assets
       */
      const isPropertyPhoto =
        url.includes("/property-photo/") &&
        !url.includes("floorplan") &&
        !url.includes("logo") &&
        !url.includes("marker");

      if (isPropertyPhoto) {
        return url;
      }
    }
  } catch (error) {
    console.error(
      "Could not parse property images:",
      error
    );
  }

  return "/house-placeholder.jpg";
}

export default function PropertyCard({
  property,
}: Props) {
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState("");

  const value =
    property.estimatedValue ?? 0;

  const refurb =
    property.totalRefurbCost ?? 0;

  const profit =
    property.potentialProfit ??
    value - property.price - refurb;

  const discount =
    property.discountPercent ??
    (value > 0
      ? ((value - property.price) / value) * 100
      : 0);

  const score =
    property.aiScore ?? 0;

  const image =
    getPropertyImage(property.images);

  async function analyseDeal() {
    setAnalysing(true);
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
            propertyId: property.id,
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

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex flex-col h-full">

      {/* PROPERTY IMAGE */}

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

      {/* PROPERTY DETAILS */}

      <div className="p-5 flex flex-col gap-4 flex-1">

        <div>

          <h2 className="font-bold text-lg leading-tight">
            {property.address}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {property.postcode ||
              "Leeds"}
          </p>

        </div>

        {/* PROPERTY TYPE */}

        <div className="flex gap-2 text-xs flex-wrap">

          <span className="bg-gray-100 px-3 py-1.5 rounded-full">
            🛏{" "}
            {property.bedrooms ?? 0}
          </span>

          <span className="bg-gray-100 px-3 py-1.5 rounded-full">
            🛁{" "}
            {property.bathrooms ?? 0}
          </span>

          <span className="bg-gray-100 px-3 py-1.5 rounded-full">
            🏠{" "}
            {property.type ||
              "Property"}
          </span>

        </div>

        {/* FINANCIALS */}

        <div className="grid grid-cols-2 gap-4">

          <div>

            <p className="text-xs text-gray-500">
              Purchase
            </p>

            <p className="font-bold text-lg">
              £
              {property.price.toLocaleString()}
            </p>

          </div>

          <div>

            <p className="text-xs text-gray-500">
              Market Value
            </p>

            <p className="font-bold text-lg">
              £
              {value.toLocaleString()}
            </p>

          </div>

          <div>

            <p className="text-xs text-gray-500">
              Refurb
            </p>

            <p className="font-bold">
              £
              {refurb.toLocaleString()}
            </p>

          </div>

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

        {/* ACTIONS */}

        <div className="mt-auto">

          <button
            onClick={analyseDeal}
            disabled={analysing}
            className="w-full bg-black text-white text-center py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analysing
              ? "🤖 Analysing Deal..."
              : "🤖 Analyse Deal"}
          </button>

          {error && (
            <p className="text-red-600 text-xs text-center mt-2">
              {error}
            </p>
          )}

          <Link
            href={`/property/${property.id}`}
            className="block text-center text-sm font-semibold text-gray-500 hover:text-black mt-3"
          >
            View Deal
          </Link>

        </div>

      </div>

    </div>
  );
}