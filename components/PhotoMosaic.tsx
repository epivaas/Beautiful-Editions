import PhotoTile from "./PhotoTile";

type MosaicPhoto = { id: number; src: string; alt: string; credit: string | null };

type PhotoMosaicProps = {
  photos: MosaicPhoto[];
};

const SMALL_SLOTS = 4;

/**
 * One large photo and up to four small ones. With more photos the last slot becomes a "+N" tile
 * for the rest. Fixed tile heights: we don't store photo dimensions yet, so no ratio-justified rows.
 */
export default function PhotoMosaic({ photos }: PhotoMosaicProps) {
  if (photos.length === 0) return null;

  const [large, ...rest] = photos;
  const overflow = photos.length > 1 + SMALL_SLOTS;
  const small = rest.slice(0, overflow ? SMALL_SLOTS - 1 : SMALL_SLOTS);
  const remaining = photos.length - 1 - small.length;

  return (
    <div className={`grid gap-3 ${small.length > 0 ? "md:grid-cols-[3fr_2fr]" : ""}`}>
      <PhotoTile src={large.src} alt={large.alt} credit={large.credit} padding={16} className="h-[280px] md:h-[360px]" />

      {small.length > 0 && (
        <div className="grid grid-cols-4 gap-3 md:grid-cols-2 md:grid-rows-2">
          {small.map((photo) => (
            <PhotoTile
              key={photo.id}
              src={photo.src}
              alt={photo.alt}
              credit={photo.credit}
              padding={8}
              className="h-24 md:h-[174px]"
            />
          ))}
          {overflow && (
            // Links to the Photographs page once it exists
            <div className="flex h-24 flex-col items-center justify-center gap-1 bg-lijn md:h-[174px]">
              <span className="sr-only">{remaining} more photos</span>
              <span aria-hidden="true" className="text-2xl font-extrabold tracking-[-0.02em] text-creme md:text-[32px]">
                +{remaining}
              </span>
              <span aria-hidden="true" className="hidden font-mono text-[13px] text-creme-gedempt md:block">
                more photos
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
