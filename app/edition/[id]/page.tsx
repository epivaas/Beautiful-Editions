import { supabase } from "@/utils/supabase";
import { EditionWithRelations } from "@/types/database";
import { notFound } from "next/navigation";
import ImageCarousel from "@/components/ImageCarousel";

function getPhotoUrl(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${storagePath}`;
}

async function getEdition(id: number): Promise<EditionWithRelations | null> {
  const { data, error } = await supabase
    .from("editions")
    .select(`
      *,
      work:works (
        id,
        original_title,
        english_title,
        original_publication_year,
        original_language,
        wiki_link,
        work_authors (
          author:authors (
            id,
            name,
            wiki_link
          )
        )
      ),
      publisher:publishers (
        id,
        name
      ),
      series:series (
        id,
        name
      ),
      photos (
        id,
        storage_path,
        sort_order,
        caption
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as EditionWithRelations;
}

async function getSubEditions(parentId: number) {
  // The `sub_editions` table contains rows that reference `editions` via `edition_id`.
  // Query `sub_editions` for rows where `edition_id` = parentId and return them.
  const { data, error } = await supabase
    .from("sub_editions")
    .select(`id, edition_id, impression_label, sequence_number, publication_year, catalogue_number`)
    .eq("edition_id", parentId)
    .order("sequence_number", { ascending: true });

  if (error || !data) return [];
  return data;
}

export default async function EditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  // Handle both Promise and object formats for Next.js compatibility
  const resolvedParams = params instanceof Promise ? await params : params;
  const edition = await getEdition(parseInt(resolvedParams.id));

  if (!edition) {
    notFound();
  }

  const authors = edition.work?.work_authors?.map((wa) => wa.author) || [];
  const photos = edition.photos?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const featuredPhoto = photos[0];
  const secondaryPhotos = photos.slice(1);
  const subEditions = (await getSubEditions(edition.id)) || [];

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.4fr_420px] gap-8 items-start mb-8">
          <div>
            <h1 className="text-4xl font-serif text-[#8b6f47] mb-2">
              {edition.title}
            </h1>
            {edition.work?.original_title && (
              <p className="text-xl text-[#6b6b6b] italic">
                {edition.work.original_title}
              </p>
            )}
            {authors.length > 0 && (
              <p className="text-lg text-[#6b6b6b] mt-2">
                by {authors.map((a) => a.name).join(", ")}
              </p>
            )}
          </div>

          {featuredPhoto && (
            <div className="lg:justify-self-end">
              <div className="bg-white border border-[#e0ddd0] rounded p-3 shadow-sm w-full max-w-[240px]">
                <img
                  src={getPhotoUrl(featuredPhoto.storage_path)}
                  alt={featuredPhoto.caption || "Edition photo"}
                  className="w-full h-[220px] object-contain rounded mx-auto"
                />
              </div>
            </div>
          )}
        </div>

        {/* Edition Details */}
        <div className="bg-white border border-[#e0ddd0] rounded p-8 mb-8">
          <h2 className="text-2xl font-serif text-[#8b6f47] mb-6">
            Edition Details
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-[#8b6f47] mb-2">Publisher</h3>
              <p className="text-[#6b6b6b] mb-4">
                {edition.publisher?.name || "—"}
              </p>

              {edition.series && (
                <>
                  <h3 className="font-semibold text-[#8b6f47] mb-2">Series</h3>
                  <p className="text-[#6b6b6b] mb-4">{edition.series.name}</p>
                </>
              )}

              <h3 className="font-semibold text-[#8b6f47] mb-2">Publication Year</h3>
              <p className="text-[#6b6b6b] mb-4">
                {edition.publication_year || "—"}
              </p>

              <h3 className="font-semibold text-[#8b6f47] mb-2">Language</h3>
              <p className="text-[#6b6b6b] mb-4">
                {edition.language || "—"}
              </p>

              {edition.isbn && (
                <>
                  <h3 className="font-semibold text-[#8b6f47] mb-2">ISBN</h3>
                  <p className="text-[#6b6b6b] mb-4">{edition.isbn}</p>
                </>
              )}
            </div>

            <div>
              {edition.size_dimensions && (
                <>
                  <h3 className="font-semibold text-[#8b6f47] mb-2">Dimensions</h3>
                  <p className="text-[#6b6b6b] mb-4">{edition.size_dimensions}</p>
                </>
              )}

              {edition.pages_description && (
                <>
                  <h3 className="font-semibold text-[#8b6f47] mb-2">Pages</h3>
                  <p className="text-[#6b6b6b] mb-4">{edition.pages_description}</p>
                </>
              )}

              {edition.binding_type && (
                <>
                  <h3 className="font-semibold text-[#8b6f47] mb-2">Binding</h3>
                  <p className="text-[#6b6b6b] mb-4">{edition.binding_type}</p>
                </>
              )}

              <div className="flex gap-4 mb-4">
                {edition.slipcase && (
                  <span className="px-3 py-1 bg-[#f9f8f0] border border-[#e0ddd0] rounded text-sm">
                    Slipcase
                  </span>
                )}
                {edition.dustjacket && (
                  <span className="px-3 py-1 bg-[#f9f8f0] border border-[#e0ddd0] rounded text-sm">
                    Dust Jacket
                  </span>
                )}
              </div>

              {edition.typeface && (
                <>
                  <h3 className="font-semibold text-[#8b6f47] mb-2">Typeface</h3>
                  <p className="text-[#6b6b6b] mb-4">{edition.typeface}</p>
                </>
              )}

              {edition.printer && (
                <>
                  <h3 className="font-semibold text-[#8b6f47] mb-2">Printer</h3>
                  <p className="text-[#6b6b6b] mb-4">{edition.printer}</p>
                </>
              )}

              {edition.binder && (
                <>
                  <h3 className="font-semibold text-[#8b6f47] mb-2">Binder</h3>
                  <p className="text-[#6b6b6b] mb-4">{edition.binder}</p>
                </>
              )}
            </div>
          </div>

          {edition.details && (
            <div className="mt-6 pt-6 border-t border-[#e0ddd0]">
              <h3 className="font-semibold text-[#8b6f47] mb-2">Details</h3>
              <p className="text-[#6b6b6b] whitespace-pre-line">{edition.details}</p>
            </div>
          )}

          {edition.notes && (
            <div className="mt-6 pt-6 border-t border-[#e0ddd0]">
              <h3 className="font-semibold text-[#8b6f47] mb-2">Notes</h3>
              <p className="text-[#6b6b6b] whitespace-pre-line">{edition.notes}</p>
            </div>
          )}
        </div>

        {/* Secondary Photo Carousel */}
        {secondaryPhotos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-serif text-[#8b6f47] mb-6">
              Other Photos
            </h2>
            <ImageCarousel photos={secondaryPhotos} />
          </div>
        )}

        {/* Work Information */}
        {edition.work && (
          <div className="bg-white border border-[#e0ddd0] rounded p-8">
            <h2 className="text-2xl font-serif text-[#8b6f47] mb-6">
              Work Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {edition.work.english_title && (
                  <>
                    <h3 className="font-semibold text-[#8b6f47] mb-2">
                      English Title
                    </h3>
                    <p className="text-[#6b6b6b] mb-4">
                      {edition.work.english_title}
                    </p>
                  </>
                )}
                {edition.work.original_publication_year && (
                  <>
                    <h3 className="font-semibold text-[#8b6f47] mb-2">
                      Original Publication Year
                    </h3>
                    <p className="text-[#6b6b6b] mb-4">
                      {edition.work.original_publication_year}
                    </p>
                  </>
                )}
              </div>
              <div>
                {edition.work.original_language && (
                  <>
                    <h3 className="font-semibold text-[#8b6f47] mb-2">
                      Original Language
                    </h3>
                    <p className="text-[#6b6b6b] mb-4">
                      {edition.work.original_language}
                    </p>
                  </>
                )}
                {edition.work.wiki_link && (
                  <>
                    <h3 className="font-semibold text-[#8b6f47] mb-2">
                      Reference
                    </h3>
                    <a
                      href={edition.work.wiki_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8b6f47] hover:underline"
                    >
                      View Source
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sub-editions */}
        {subEditions && subEditions.length > 0 && (
          <div className="bg-white border border-[#e0ddd0] rounded p-8 mt-8">
            <h2 className="text-2xl font-serif text-[#8b6f47] mb-4">Sub-editions</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {subEditions.map((sub: any) => (
                <a
                  key={sub.id}
                  href={`/sub-editions/${sub.id}`}
                  className="flex items-center gap-4 p-3 border border-[#e9e7dd] rounded hover:shadow-sm"
                >
                  <div className="flex-1">
                    <div className="text-[#8b6f47] font-medium">
                      {sub.impression_label || `Variant ${sub.sequence_number || sub.id}`}
                    </div>
                    <div className="text-sm text-[#6b6b6b]">
                      {sub.publication_year ? `${sub.publication_year}` : "—"}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

