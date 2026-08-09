"use client";

import { useEffect, useMemo, useState } from "react";

type PropertyGalleryProps = {
  images: string | null | undefined;
};

function parseImages(
  images: string | null | undefined
): string[] {
  if (!images) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(images);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (
          image
        ): image is string =>
          typeof image === "string" &&
          image.trim().length > 0
      );
    }
  } catch {
    /*
     * Ignore invalid JSON.
     */
  }

  /*
   * Fallback in case an older property
   * has comma-separated images.
   */
  return images
    .split(",")
    .map(
      (image) =>
        image.trim()
    )
    .filter(Boolean);
}

function isFloorPlan(
  url: string
): boolean {
  const lower =
    url.toLowerCase();

  return (
    lower.includes(
      "floorplan"
    ) ||
    lower.includes(
      "property-floorplan"
    ) ||
    lower.includes(
      "floor-plan"
    )
  );
}

export default function PropertyGallery({
  images,
}: PropertyGalleryProps) {
  const allImages =
    useMemo(
      () =>
        parseImages(
          images
        ),
      [images]
    );

  const propertyImages =
    useMemo(
      () =>
        allImages.filter(
          (image) =>
            !isFloorPlan(image)
        ),
      [allImages]
    );

  const floorPlans =
    useMemo(
      () =>
        allImages.filter(
          (image) =>
            isFloorPlan(image)
        ),
      [allImages]
    );

  const galleryImages =
    useMemo(
      () => [
        ...propertyImages,
        ...floorPlans,
      ],
      [
        propertyImages,
        floorPlans,
      ]
    );

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const [lightboxOpen, setLightboxOpen] =
    useState(false);

  /*
   * Make sure the selected image is still
   * valid when the property changes.
   */
  useEffect(() => {
    setSelectedIndex(0);
    setLightboxOpen(false);
  }, [images]);

  /*
   * Keyboard controls for the large viewer.
   */
  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
        setLightboxOpen(false);
      }

      if (
        event.key === "ArrowRight"
      ) {
        setSelectedIndex(
          (current) =>
            galleryImages.length ===
            0
              ? 0
              : (
                  current + 1
                ) %
                galleryImages.length
        );
      }

      if (
        event.key === "ArrowLeft"
      ) {
        setSelectedIndex(
          (current) =>
            galleryImages.length ===
            0
              ? 0
              : (
                  current -
                  1 +
                  galleryImages.length
                ) %
                galleryImages.length
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    lightboxOpen,
    galleryImages.length,
  ]);

  if (
    galleryImages.length === 0
  ) {
    return (
      <div className="flex h-[360px] w-full items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
        No images available
      </div>
    );
  }

  const selectedImage =
    galleryImages[
      selectedIndex
    ];

  const selectedIsFloorPlan =
    isFloorPlan(
      selectedImage
    );

  const previousImage =
    () => {
      setSelectedIndex(
        (current) =>
          (
            current -
            1 +
            galleryImages.length
          ) %
          galleryImages.length
      );
    };

  const nextImage =
    () => {
      setSelectedIndex(
        (current) =>
          (
            current + 1
          ) %
          galleryImages.length
      );
    };

  return (
    <>
      <div className="w-full">
        {/* =================================================
            MAIN IMAGE
        ================================================= */}

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <button
            type="button"
            onClick={() =>
              setLightboxOpen(
                true
              )
            }
            className="group block w-full cursor-zoom-in"
            aria-label="Open property photos"
          >
            <div className="flex h-[420px] w-full items-center justify-center bg-slate-950">
              <img
                src={
                  selectedImage
                }
                alt={
                  selectedIsFloorPlan
                    ? "Property floor plan"
                    : "Property photo"
                }
                className={`max-h-[420px] w-full object-contain transition duration-200 group-hover:scale-[1.01] ${
                  selectedIsFloorPlan
                    ? "p-4"
                    : ""
                }`}
              />
            </div>

            <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              Click to expand
            </div>
          </button>

          {/* IMAGE COUNTER */}

          <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            {selectedIndex +
              1}{" "}
            /{" "}
            {
              galleryImages.length
            }
          </div>

          {/* MAIN IMAGE ARROWS */}

          {galleryImages.length >
            1 && (
            <>
              <button
                type="button"
                onClick={
                  previousImage
                }
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-xl text-white backdrop-blur transition hover:bg-black/90"
                aria-label="Previous photo"
              >
                ←
              </button>

              <button
                type="button"
                onClick={
                  nextImage
                }
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-xl text-white backdrop-blur transition hover:bg-black/90"
                aria-label="Next photo"
              >
                →
              </button>
            </>
          )}
        </div>

        {/* =================================================
            THUMBNAILS
        ================================================= */}

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {galleryImages.map(
            (
              image,
              index
            ) => {
              const floorPlan =
                isFloorPlan(
                  image
                );

              const selected =
                index ===
                selectedIndex;

              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() =>
                    setSelectedIndex(
                      index
                    )
                  }
                  className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-900 transition ${
                    selected
                      ? "border-blue-500"
                      : "border-slate-800 hover:border-slate-600"
                  }`}
                  aria-label={
                    floorPlan
                      ? "View floor plan"
                      : `View photo ${
                          index +
                          1
                        }`
                  }
                >
                  <img
                    src={
                      image
                    }
                    alt={
                      floorPlan
                        ? "Floor plan thumbnail"
                        : "Property thumbnail"
                    }
                    className={`h-full w-full object-cover ${
                      floorPlan
                        ? "object-contain p-1"
                        : ""
                    }`}
                  />

                  {floorPlan && (
                    <span className="absolute bottom-1 left-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[10px] font-semibold text-white">
                      FLOOR PLAN
                    </span>
                  )}
                </button>
              );
            }
          )}
        </div>

        {/* =================================================
            FLOOR PLAN LABEL
        ================================================= */}

        {floorPlans.length >
          0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
            <span className="rounded-full bg-blue-500/10 px-3 py-1 font-medium text-blue-400">
              Floor plan included
            </span>

            <span>
              {
                floorPlans.length
              }{" "}
              floor plan
              {floorPlans.length !==
              1
                ? "s"
                : ""}
            </span>
          </div>
        )}
      </div>

      {/* =================================================
          FULL SCREEN LIGHTBOX
      ================================================= */}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() =>
            setLightboxOpen(
              false
            )
          }
        >
          {/* CLOSE */}

          <button
            type="button"
            onClick={() =>
              setLightboxOpen(
                false
              )
            }
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Close photos"
          >
            ×
          </button>

          {/* COUNTER */}

          <div className="absolute left-5 top-5 z-20 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
            {selectedIndex +
              1}{" "}
            /{" "}
            {
              galleryImages.length
            }
          </div>

          {/* PREVIOUS */}

          {galleryImages.length >
            1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                previousImage();
              }}
              className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition hover:bg-white/20 md:left-8"
              aria-label="Previous photo"
            >
              ←
            </button>
          )}

          {/* IMAGE */}

          <div
            className="flex h-full w-full items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <img
              src={
                selectedImage
              }
              alt={
                selectedIsFloorPlan
                  ? "Property floor plan"
                  : "Property photo"
              }
              className={`max-h-[92vh] max-w-[92vw] object-contain ${
                selectedIsFloorPlan
                  ? "rounded-lg bg-white p-3"
                  : ""
              }`}
            />
          </div>

          {/* NEXT */}

          {galleryImages.length >
            1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition hover:bg-white/20 md:right-8"
              aria-label="Next photo"
            >
              →
            </button>
          )}

          {/* FLOOR PLAN LABEL */}

          {selectedIsFloorPlan && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              Floor Plan
            </div>
          )}
        </div>
      )}
    </>
  );
}