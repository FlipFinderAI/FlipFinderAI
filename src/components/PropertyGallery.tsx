"use client";

import { useState } from "react";

type PropertyGalleryProps = {
  images: string[];
  floorPlans?: string[];
  address: string;
};

export default function PropertyGallery({
  images,
  floorPlans = [],
  address,
}: PropertyGalleryProps) {

  const cleanImages = Array.from(
    new Set(
      images
        .map((image) => {
          if (
            typeof image !== "string" ||
            image.trim().length === 0
          ) {
            return null;
          }

          let cleaned = image.trim();

          const markdownMatch = cleaned.match(
            /^\[(.*?)\]\(.*?\)$/
          );

          if (markdownMatch) {
            cleaned = markdownMatch[1];
          }

          return cleaned;
        })
        .filter(
          (image): image is string =>
            Boolean(image)
        )
    )
  );

  const cleanFloorPlans = Array.from(
    new Set(
      floorPlans
        .map((image) => {
          if (
            typeof image !== "string" ||
            image.trim().length === 0
          ) {
            return null;
          }

          let cleaned = image.trim();

          const markdownMatch = cleaned.match(
            /^\[(.*?)\]\(.*?\)$/
          );

          if (markdownMatch) {
            cleaned = markdownMatch[1];
          }

          return cleaned;
        })
        .filter(
          (image): image is string =>
            Boolean(image)
        )
    )
  );


  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<"photos" | "floorplans">("photos");

  const hasFloorPlans = cleanFloorPlans.length > 0;
  const displayImages = activeTab === "floorplans" ? cleanFloorPlans : cleanImages;


  if (cleanImages.length === 0 && cleanFloorPlans.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
        No images available
      </div>
    );
  }


  const selectedImage =
    displayImages[selectedIndex] ??
    displayImages[0];


  function previousImage() {
    setSelectedIndex((current) =>
      current === 0
        ? displayImages.length - 1
        : current - 1
    );
  }


  function nextImage() {
    setSelectedIndex((current) =>
      current === displayImages.length - 1
        ? 0
        : current + 1
    );
  }


  return (
    <>
      <div className="w-full">

        {/* TAB NAVIGATION */}

        {hasFloorPlans && (
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("photos");
                setSelectedIndex(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === "photos"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Photos ({cleanImages.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("floorplans");
                setSelectedIndex(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === "floorplans"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Floor Plans ({cleanFloorPlans.length})
            </button>
          </div>
        )}

        <div
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-800"
          onClick={() =>
            setIsFullscreen(true)
          }
        >

          <img
            src={selectedImage}
            alt={`${address} photo`}
            className="h-[420px] w-full object-cover"
          />


          <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-4 py-2 text-sm text-white">
            {selectedIndex + 1} / {displayImages.length}
          </div>


          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  previousImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-4 py-2 text-2xl text-white"
              >
                ←
              </button>


              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-4 py-2 text-2xl text-white"
              >
                →
              </button>
            </>
          )}

        </div>


        <div className="mt-3 grid grid-cols-6 gap-2">

          {displayImages.map((image,index)=>(
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() =>
                setSelectedIndex(index)
              }
            >

              <img
                src={image}
                alt={`${address} thumbnail`}
                className={`h-16 w-full rounded-lg object-cover ${
                  selectedIndex === index
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              />

            </button>
          ))}

        </div>

      </div>


      {isFullscreen && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-5"
          onClick={() =>
            setIsFullscreen(false)
          }
        >

          <img
            src={selectedImage}
            alt={address}
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain"
            onClick={(e)=>
              e.stopPropagation()
            }
          />

        </div>

      )}

    </>
  );
}