import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { importProperty } from "@/lib/propertyImporter";

export async function POST() {
  try {
    const properties =
      await prisma.property.findMany({
        where: {
          listingUrl: {
            not: "",
          },
        },
        select: {
          id: true,
          listingUrl: true,
          address: true,
        },
      });

    console.log(
      "REFRESH STARTED",
      properties.length,
      "properties"
    );

    const results = [];

    for (const property of properties) {
      try {
        console.log(
          "REFRESHING:",
          property.address
        );

        const imported =
          await importProperty(
            property.listingUrl ?? ""
          );

        results.push({
          id: property.id,
          address: property.address,
          success: true,
          images:
            imported.images.length,
        });

      } catch (error) {

        console.error(
          "FAILED:",
          property.listingUrl,
          error
        );

        results.push({
          id: property.id,
          address: property.address,
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      refreshed:
        properties.length,
      results,
    });

  } catch (error) {

    console.error(
      "REFRESH ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Refresh failed",
      },
      {
        status: 500,
      }
    );
  }
}