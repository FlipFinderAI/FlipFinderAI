"use client";

import { useState } from "react";

type PropertyGalleryProps = {
  images: string[];
  address: string;
};

export default function PropertyGallery({
  images,
  address,
}: PropertyGalleryProps) {
  const validImages = images.filter(
    (image) =>
      typeof image === "string" &&
      image.trim().length > 0
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (validImages.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
        No images available
      </div>
    );
  }

  const selectedImage =
    validImages[selectedIndex] || validImages[0];

  function previousImage() {
    setSelectedIndex((current) =>
      current === 0
        ? validImages.length - 1
        : current - 1
    );
  }

  function nextImage() {
    setSelectedIndex((current) =>
      current === validImages.length - 1
        ? 0
        : current + 1
    );
  }

  return (
    <>
      {/* MAIN GALLERY */}
      <div className="w-full">
        <div
          className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-800"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={selectedImage}
            alt={`${address} - property photo ${
              selectedIndex + 1
            }`}
            className="h-[420px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />

          {/* IMAGE COUNT */}
          <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            {selectedIndex + 1} / {validImages.length}
          </div>

          {/* EXPAND */}
          <div className="absolute left-4 bottom-4 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
            Click to expand
          </div>

          {/* LEFT ARROW */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                previousImage();
              }}
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-2xl text-white backdrop-blur transition hover:bg-black/85"
              aria-label="Previous photo"
            >
              ←
            </button>
          )}

          {/* RIGHT ARROW */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-2xl text-white backdrop-blur transition hover:bg-black/85"
              aria-label="Next photo"
            >
              →
            </button>
          )}
        </div>

        {/* THUMBNAILS */}
        {validImages.length > 1 && (
          <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {validImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() =>
                  setSelectedIndex(index)
                }
                className={`relative overflow-hidden rounded-lg border-2 transition ${
                  selectedIndex === index
                    ? "border-blue-500"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={image}
                  alt={`${address} thumbnail ${
                    index + 1
                  }`}
                  className="h-16 w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FULLSCREEN VIEW */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() =>
            setIsFullscreen(false)
          }
        >
          {/* CLOSE */}
          <button
            type="button"
            onClick={() =>
              setIsFullscreen(false)
            }
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur hover:bg-white/20"
            aria-label="Close gallery"
          >
            ×
          </button>

          {/* COUNTER */}
          <div className="absolute left-5 top-5 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
            {selectedIndex + 1} / {validImages.length}
          </div>

          {/* PREVIOUS */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                previousImage();
              }}
              className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white backdrop-blur hover:bg-white/20"
              aria-label="Previous photo"
            >
              ←
            </button>
          )}

          {/* IMAGE */}
          <img
            src={selectedImage}
            alt={`${address} - property photo ${
              selectedIndex + 1
            }`}
            className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain"
            onClick={(event) =>
              event.stopPropagation()
            }
          />

          {/* NEXT */}
          {validImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl text-white backdrop-blur hover:bg-white/20"
              aria-label="Next photo"
            >
              →
            </button>
          )}
        </div>
      )}
    </>
  );
}