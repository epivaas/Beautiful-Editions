"use client";

import { useEffect, useState } from "react";
import { Photo } from "@/types/database";

function getPhotoUrl(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${storagePath}`;
}

export default function ImageCarousel({ photos }: { photos: Photo[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const visiblePhotos = photos.slice(startIndex, startIndex + 6);
  const currentPhoto = photos[currentIndex];
  const imageUrl = getPhotoUrl(currentPhoto.storage_path);

  const goToPreviousPage = () => {
    setStartIndex((prev) => (prev - 6 >= 0 ? prev - 6 : Math.max(0, photos.length - 6)));
  };

  const goToNextPage = () => {
    setStartIndex((prev) => (prev + 6 < photos.length ? prev + 6 : 0));
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsLightboxOpen(true);
  };

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
      } else if (event.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="relative bg-white border border-[#e0ddd0] rounded p-4">
      <div className="mb-4 flex items-center justify-between text-sm text-[#6b6b6b]">
        <span>{photos.length} photos</span>
        {photos.length > 6 && (
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              className="border border-[#e0ddd0] rounded-full p-2 text-[#8b6f47] hover:bg-[#f9f8f0] transition"
              aria-label="Previous photos"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextPage}
              className="border border-[#e0ddd0] rounded-full p-2 text-[#8b6f47] hover:bg-[#f9f8f0] transition"
              aria-label="Next photos"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        className="gap-2"
        style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(6, visiblePhotos.length)}, 1fr)`, gap: "0.5rem" }}
      >
        {visiblePhotos.map((photo, index) => {
          const realIndex = startIndex + index;
          return (
            <button
              key={photo.id}
              onClick={() => openLightbox(realIndex)}
              className={`group relative overflow-hidden rounded border-2 transition ${
                realIndex === currentIndex
                  ? "border-[#8b6f47]"
                  : "border-[#e0ddd0] hover:border-[#8b6f47]"
              }`}
              aria-label={`Open photo ${realIndex + 1}`}
              style={{ width: "100%", minHeight: 90, maxHeight: 90 }}
            >
              <img
                src={getPhotoUrl(photo.storage_path)}
                alt={`Thumbnail ${realIndex + 1}`}
                className="w-full h-full object-contain bg-[#f6f4ea] p-1"
                style={{ objectPosition: 'center' }}
              />
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-left text-[11px] text-white line-clamp-2">
                  {photo.caption}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-5xl w-full" onClick={(event) => event.stopPropagation()}>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/80 px-3 py-2 text-[#8b6f47] hover:bg-white"
              aria-label="Close lightbox"
            >
              ✕
            </button>
            <img
              src={imageUrl}
              alt={currentPhoto.caption || "Enlarged photo"}
              className="max-h-[80vh] w-full object-contain rounded"
            />
            {currentPhoto.caption && (
              <p className="mt-3 text-center text-white">{currentPhoto.caption}</p>
            )}
            {photos.length > 1 && (
              <div className="mt-4 flex justify-center gap-4">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                  className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                  className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

