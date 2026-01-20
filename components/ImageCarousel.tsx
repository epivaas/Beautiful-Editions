"use client";

import { useState } from "react";
import { Photo } from "@/types/database";

export default function ImageCarousel({ photos }: { photos: Photo[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${currentPhoto.storage_path}`;

  return (
    <div className="relative bg-white border border-[#e0ddd0] rounded p-4">
      <div className="relative aspect-[3/4] max-w-2xl mx-auto mb-4">
        <img
          src={imageUrl}
          alt={currentPhoto.caption || `Photo ${currentIndex + 1}`}
          className="w-full h-full object-contain rounded"
        />
        
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-[#e0ddd0] rounded-full p-2 transition"
              aria-label="Previous photo"
            >
              <svg
                className="w-6 h-6 text-[#8b6f47]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-[#e0ddd0] rounded-full p-2 transition"
              aria-label="Next photo"
            >
              <svg
                className="w-6 h-6 text-[#8b6f47]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {currentPhoto.caption && (
        <p className="text-center text-[#6b6b6b] mb-4">{currentPhoto.caption}</p>
      )}

      {photos.length > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => goToSlide(index)}
              className={`w-16 h-20 rounded border-2 transition ${
                index === currentIndex
                  ? "border-[#8b6f47]"
                  : "border-[#e0ddd0] opacity-60 hover:opacity-100"
              }`}
              aria-label={`Go to photo ${index + 1}`}
            >
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${photo.storage_path}`}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover rounded"
              />
            </button>
          ))}
        </div>
      )}

      {photos.length > 1 && (
        <p className="text-center text-sm text-[#6b6b6b] mt-4">
          {currentIndex + 1} of {photos.length}
        </p>
      )}
    </div>
  );
}




