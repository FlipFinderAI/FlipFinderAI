
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { importProperty } from "@/lib/propertyImporter";
import { resolveAddress } from "@/lib/addressResolver";
import { calculateComparableValue } from "@/lib/comparableValuation";
import { calculateFlip } from "@/lib/flipCalculator";
import { calculateDealScore } from "@/lib/dealScore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const url =
      typeof body.url === "string"
        ? body.url.trim()
        : "";

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "Property listing URL is required.",
        },
        { status: 400 }
      );
    }

    /*
     * ==================================================
     * SCRAPE LISTING
     * ==================================================
     */

    const imported = await importProperty(url);

    console.log("========================================");
    console.log("IMPORTED FROM RIGHTMOVE");
    console.log("Address:", imported.address);
    console.log("Postcode:", imported.postcode);
    console.log("Images found:", imported.images.length);
    console.log("========================================");

    /*
     * ==================================================
     * RESOLVE FULL POSTCODE
     * ==================================================
     */

    let resolvedAddress = imported.address;
    let resolvedPostcode = imported.postcode;

    try {
      if (
        imported.address &&
        imported.postcode
      ) {
        console.log(
          `Resolving full postcode for: ${imported.address} ${imported.postcode}`
        );

        const postcodeDistrict =
          imported.postcode
            .trim()
            .toUpperCase()
            .split(/\s+/)[0];

        const candidates =
          await resolveAddress(
            imported.address,
            postcodeDistrict
          );

        if (
          candidates.length > 0 &&
          candidates[0].postcode
        ) {
          resolvedPostcode =
            candidates[0].postcode;

          if (candidates[0].address) {
            resolvedAddress =
              candidates[0].address;
          }

          console.log(
            "========================================"
          );
          console.log(
            "FULL POSTCODE RESOLVED"
          );
          console.log(
            "Original address:",
            imported.address
          );
          console.log(
            "Resolved address:",
            resolvedAddress
          );
          console.log(
            "Original postcode:",
            imported.postcode
          );
          console.log(
            "Full postcode:",
            resolvedPostcode
          );
          console.log(
            "Score:",
            candidates[0].score
          );
          console.log(
            "Source:",
            candidates[0].source
          );
          console.log(
            "========================================"
          );
        } else {
          console.log(
            "No independently verified full postcode found."
          );

          resolvedPostcode =
            imported.postcode;
        }
      }
    } catch (addressError) {
      console.error(
        "Address resolution failed:",
        addressError
      );

      resolvedPostcode =
        imported.postcode;
    }

    /*
     * ==================================================
     * CLEAN IMAGES
     * ==================================================
     *
     * Only keep valid HTTP/HTTPS image URLs.
     *
     * Remove duplicates.
     */

    const imageUrls = Array.from(
      new Set(
        Array.isArray(imported.images)
          ? imported.images.filter(
              (
                image
              ): image is string =>
                typeof image === "string" &&
                /^https?:\/\//i.test(
                  image.trim()
                ) &&
                image.trim().length > 0
            ).map((image) =>
              image.trim()
            )
          : []
      )
    );

    console.log(
      "========================================"
    );
    console.log(
      "CLEAN PROPERTY PHOTOS"
    );
    console.log(
      "Photos to save:",
      imageUrls.length
    );

    imageUrls.forEach(
      (image, index) => {
        console.log(
          `${index + 1}: ${image}`
        );
      }
    );

    console.log(
      "========================================"
    );

    /*
     * ==================================================
     * CHECK EXISTING PROPERTY
     * ==================================================
     */

    const existing =
      await prisma.property.findUnique({
        where: {
          externalId:
            imported.externalId,
        },
      });

    let property: Awaited<
  ReturnType<typeof prisma.property.findUnique>
>;

    /*
     * ==================================================
     * UPDATE EXISTING PROPERTY
     * ==================================================
     */

    if (existing) {
      property =
        await prisma.property.update({
          where: {
            id: existing.id,
          },

          data: {
            address:
              resolvedAddress,

            postcode:
              resolvedPostcode,

            type:
              imported.type,

            description:
              imported.description ||
              null,

            listingUrl:
              imported.listingUrl,

            agent:
              imported.agent ||
              null,

            source:
              imported.source,

            price:
              imported.price,

            bedrooms:
              imported.bedrooms,

            bathrooms:
              imported.bathrooms,

            /*
             * Store the fresh image list
             * in the Property.images field.
             */

            images:
              JSON.stringify(
                imageUrls
              ),

            dateListed:
              imported.dateListed
                ? new Date(
                    imported.dateListed
                  )
                : null,

            lastSeen:
              new Date(),
          },
        });

      /*
       * ==================================================
       * REPLACE OLD PHOTOS
       * ==================================================
       *
       * IMPORTANT:
       * Delete ALL existing photos for this property.
       *
       * We do NOT add to the old collection.
       *
       * This prevents old/wrong Rightmove images
       * from remaining in the database.
       */

      await prisma.propertyPhoto.deleteMany({
        where: {
          propertyId:
            property.id,
        },
      });

      /*
       * Add the fresh photos from Rightmove.
       */

      if (imageUrls.length > 0) {
        await prisma.propertyPhoto.createMany({
          data: imageUrls.map(
            (imageUrl) => ({
              propertyId:
                property!.id,

              url:
                imageUrl,
            })
          ),
        });
      }

      console.log(
        "========================================"
      );
      console.log(
        "EXISTING PROPERTY UPDATED"
      );
      console.log(
        "Property ID:",
        property.id
      );
      console.log(
        "Old photos deleted."
      );
      console.log(
        "Fresh photos saved:",
        imageUrls.length
      );
      console.log(
        "========================================"
      );
    }

    /*
     * ==================================================
     * CREATE NEW PROPERTY
     * ==================================================
     */

    else {
      property =
        await prisma.property.create({
          data: {
            externalId:
              imported.externalId,

            address:
              resolvedAddress,

            postcode:
              resolvedPostcode,

            type:
              imported.type,

            description:
              imported.description ||
              null,

            listingUrl:
              imported.listingUrl,

            agent:
              imported.agent ||
              null,

            source:
              imported.source,

            images:
              JSON.stringify(
                imageUrls
              ),

            price:
              imported.price,

            bedrooms:
              imported.bedrooms,

            bathrooms:
              imported.bathrooms,

            estimatedValue:
              0,

            soldComparableAvg:
              0,

            discountPercent:
              0,

            refurbRequired:
              false,

            kitchenCost:
              0,

            bathroomCost:
              0,

            decorationCost:
              0,

            extensionCost:
              0,

            totalRefurbCost:
              0,

            purchaseCosts:
              0,

            stampDuty:
              0,

            legalCosts:
              0,

            totalInvestment:
              imported.price,

            resaleValue:
              0,

            potentialProfit:
              0,

            rentalValue:
              0,

            yield:
              0,

            aiScore:
              0,

            aiConfidence:
              0,

            aiRecommendation:
              null,

            aiSummary:
              null,

            aiOpportunities:
              null,

            aiRisks:
              null,

            photoAnalysis:
              null,

            detectedIssues:
              null,

            refurbPlan:
              null,

            valuationReasoning:
              null,

            comparableAnalysis:
              null,

            marketAnalysis:
              null,

            aiTrainingData:
              null,

            actualOutcome:
              null,

            dealSuccessful:
              null,

            dateListed:
              imported.dateListed
                ? new Date(
                    imported.dateListed
                  )
                : null,

            lastSeen:
              new Date(),

            /*
             * Create the photos belonging
             * to this new property.
             */

            photos: {
              create:
                imageUrls.map(
                  (imageUrl) => ({
                    url:
                      imageUrl,
                  })
                ),
            },
          },

          include: {
            photos: true,
          },
        });

      console.log(
        "========================================"
      );
      console.log(
        "NEW PROPERTY CREATED"
      );
      console.log(
        "Property ID:",
        property.id
      );
      console.log(
        "Photos saved:",
        imageUrls.length
      );
      console.log(
        "========================================"
      );
    }

    /*
     * ==================================================
     * RUN COMPARABLE VALUATION
     * ==================================================
     */

    let valuation = {
      estimatedValue: 0,
      comparableAverage: 0,
      comparableCount: 0,
      comparables: [] as any[],
    };

    try {
      valuation =
        await calculateComparableValue(
          property.id
        );
    } catch (valuationError) {
      console.error(
        "Comparable valuation failed:",
        valuationError
      );
    }

    /*
     * ==================================================
     * CALCULATE FLIP
     * ==================================================
     */

    const estimatedValue =
      valuation.estimatedValue;

    const refurb =
      property.totalRefurbCost ??
      0;

    const flip =
      calculateFlip({
        purchasePrice:
          property.price,

        resaleValue:
          estimatedValue,

        refurbCost:
          refurb,
      });

    /*
     * ==================================================
     * DEAL SCORE
     * ==================================================
     */

    const dealScore =
      calculateDealScore({
        price:
          property.price,

        value:
          estimatedValue,

        address:
          property.address,

        type:
          property.type,

        bedrooms:
          property.bedrooms,

        description:
          property.description,

        postcode:
          property.postcode,
      });

    const aiScore =
      dealScore.score;

    /*
     * ==================================================
     * SAVE CALCULATED DATA
     * ==================================================
     */

    const updatedProperty =
      await prisma.property.update({
        where: {
          id:
            property.id,
        },

        data: {
          estimatedValue:
            estimatedValue,

          soldComparableAvg:
            valuation.comparableAverage,

          discountPercent:
            estimatedValue > 0
              ? Math.round(
                  (
                    (
                      estimatedValue -
                      property.price
                    ) /
                    estimatedValue
                  ) *
                    100
                )
              : 0,

          totalInvestment:
            flip.totalProjectCost,

          resaleValue:
            flip.resaleValue,

          potentialProfit:
            flip.netProfit,

          purchaseCosts:
            flip.stampDuty +
            flip.legalCosts,

          stampDuty:
            flip.stampDuty,

          legalCosts:
            flip.legalCosts,

          aiScore:
            aiScore,
        },

        include: {
          photos: true,
        },
      });

    /*
     * ==================================================
     * RETURN RESULT
     * ==================================================
     */

    return NextResponse.json({
      success: true,

      action:
        existing
          ? "updated"
          : "created",

      property:
        updatedProperty,

      valuation: {
        estimatedValue:
          valuation.estimatedValue,

        comparableAverage:
          valuation.comparableAverage,

        comparableCount:
          valuation.comparableCount,
      },

      dealScore: {
        score:
          dealScore.score,

        rating:
          dealScore.rating,

        discountPercent:
          dealScore.discountPercent,

        discountAmount:
          dealScore.discountAmount,

        reasons:
          dealScore.reasons,

        warnings:
          dealScore.warnings,
      },

      flip: {
        totalProjectCost:
          flip.totalProjectCost,

        netProfit:
          flip.netProfit,

        roi:
          flip.roi,

        maximumPurchasePrice:
          flip.maximumPurchasePrice,

        recommendedOffer:
          flip.recommendedOffer,
      },

      message:
        existing
          ? "Existing property updated, old photos replaced, postcode resolved, revaluated and rescored."
          : "Property imported, photos saved, postcode resolved, valued and scored successfully.",
    });
  } catch (error) {
    console.error(
      "Property import error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Property import failed.";

    return NextResponse.json(
      {
        success: false,
        error:
          message,
      },
      {
        status: 500,
      }
    );
  }
}