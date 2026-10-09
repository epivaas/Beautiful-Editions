import PhotoTile from "./PhotoTile";
import { Button } from "./Button";
import { VariantLabel } from "./Chip";

type LimitedEditionCardProps = {
  name: string;
  /** "Edition of 26"; hidden when the print run is unknown. */
  copies?: string | null;
  description?: string | null;
  photos?: { id: number; src: string; alt: string; credit: string | null }[];
  href: string;
};

/** A limited edition (Lettered, Numbered, Artist...) on the edition page. Each has its own page. */
export default function LimitedEditionCard({ name, copies, description, photos = [], href }: LimitedEditionCardProps) {
  const main = photos[0];

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-lijn bg-oppervlak">
      <PhotoTile src={main?.src} alt={main?.alt ?? name} credit={main?.credit} className="h-[190px]" />
      <div className="flex flex-1 flex-col gap-2.5 px-[18px] pb-[18px] pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="m-0 text-2xl leading-7 tracking-[-0.02em]">{name}</h3>
          {copies && <VariantLabel>{copies}</VariantLabel>}
        </div>
        {description && (
          <p className="m-0 line-clamp-4 text-sm leading-[21px] text-creme-gedempt">{description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
          <span className="font-mono text-[13px] text-creme-gedempt">
            {photos.length > 0 ? `${photos.length} ${photos.length === 1 ? "photo" : "photos"}` : ""}
          </span>
          <Button href={href}>Open page →</Button>
        </div>
      </div>
    </article>
  );
}
