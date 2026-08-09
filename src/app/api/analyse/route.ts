
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  analysePropertyWithAI,
} from "@/lib/aiPropertyAnalysis";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    /*
     * The AIAnalysisPanel sends propertyId.
     */
    const id = Number(body.propertyId);

    if (!Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid property ID is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Load the property and all
     * correctly imported photos.
     */
    const property =
      await prisma.property.findUnique({
        where: {
          id,
        },
        include: {
          photos: true,
        },
      });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Property not found.",
        },
        { status: 404 }
      );
    }

    /*
     * PropertyPhoto is our preferred
     * source for listing photographs.
     */
    let imageUrls =
      property.photos
        .map((photo) => photo.url)
        .filter(
          (url) =>
            typeof url === "string" &&
            url.trim().length > 0
        );

    /*
     * Fallback to the legacy images
     * field if necessary.
     */
    if (
      imageUrls.length === 0 &&
      property.images
    ) {
      try {
        const parsed =
          JSON.parse(property.images);

        if (Array.isArray(parsed)) {
          imageUrls =
            parsed.filter(
              (
                image
              ): image is string =>
                typeof image === "string" &&
                image.trim().length > 0
            );
        }
      } catch {
        console.log(
          "Could not parse property.images"
        );
      }
    }

    console.log(
      `Running AI analysis for property ${property.id} using ${imageUrls.length} photos`
    );

    /*
     * Run the AI analysis.
     */
    const analysis =
      await analysePropertyWithAI({
        address:
          property.address,

        postcode:
          property.postcode,

        type:
          property.type,

        bedrooms:
          property.bedrooms,

        bathrooms:
          property.bathrooms,

        price:
          property.price,

        estimatedValue:
          property.estimatedValue ?? 0,

        description:
          property.description,

        images:
          imageUrls,
      });

    /*
     * Save the AI results back onto
     * the Property record.
     */
    const updatedProperty =
      await prisma.property.update({
        where: {
          id: property.id,
        },

        data: {
          refurbRequired:
            analysis.refurbRequired,

          totalRefurbCost:
            analysis.estimatedRefurbCost,

          kitchenCost:
            null,

          bathroomCost:
            null,

          decorationCost:
            null,

          extensionCost:
            null,

          aiConfidence:
            analysis.confidence,

          aiRecommendation:
            analysis.recommendation,

          aiSummary:
            analysis.summary,

          aiOpportunities:
            JSON.stringify(
              analysis.opportunities
            ),

          aiRisks:
            JSON.stringify(
              analysis.risks
            ),

          photoAnalysis:
            JSON.stringify({
              overallCondition:
                analysis.overallCondition,

              kitchen:
                analysis.kitchen,

              bathroom:
                analysis.bathroom,

              decoration:
                analysis.decoration,

              flooring:
                analysis.flooring,

              exterior:
                analysis.exterior,
            }),

          detectedIssues:
            JSON.stringify(
              analysis.detectedIssues
            ),

          refurbPlan:
            JSON.stringify(
              analysis.refurbPlan
            ),
        },

        include: {
          photos: true,
        },
      });

    /*
     * Store the complete AI response
     * separately as an AIAnalysis record.
     */
    await prisma.aIAnalysis.create({
      data: {
        propertyId:
          property.id,

        model:
          "gpt-5.6",

        prompt:
          "Property photo and investment analysis",

        response:
          JSON.stringify(
            analysis
          ),

        confidence:
          analysis.confidence,
      },
    });

    return NextResponse.json({
      success: true,
      property: updatedProperty,
      analysis,
    });

  } catch (error) {
    console.error(
      "AI property analysis error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "AI property analysis failed.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}