import { supabase } from "@/utils/supabase";
import ImageCarousel from "@/components/ImageCarousel";
import { notFound } from "next/navigation";

function getPhotoUrl(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${storagePath}`;
}

async function getSubEdition(id: number) {
  const { data, error } = await supabase
    .from("sub_editions")
    .select(`
      *,
      edition:editions (
        id,
        title,
        publication_year,
        publisher:publishers(id,name),
        work:works(id,original_title,english_title),
        photos:photos(id,storage_path,sort_order,caption)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function SubEditionPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = parseInt(resolvedParams.id, 10);
  const sub = await getSubEdition(id);
  if (!sub) notFound();

  const parent = sub.edition;
  const work = parent?.work;
  const parentPhotos = (parent?.photos || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const basePhoto = parentPhotos[0];

  // Photos specifically attached to this sub-edition
  const { data: subPhotos } = await supabase
    .from("photos")
    .select("id,storage_path,sort_order,caption")
    .eq("sub_edition_id", sub.id)
    .order("sort_order", { ascending: true });
  const photos = (subPhotos || [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((p: any) => ({
      id: p.id,
      storage_path: p.storage_path,
      sort_order: p.sort_order,
      caption: p.caption,
      edition_id: null,
      sub_edition_id: sub.id,
    }));

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto bg-white border border-[#e0ddd0] rounded p-8">
        {work && (
          <h1 className="text-3xl font-serif text-[#8b6f47] mb-2">
            {work.original_title || work.english_title}
          </h1>
        )}

        <div className="grid md:grid-cols-[1fr_240px] gap-6 items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#8b6f47]">Edition</h2>
            <p className="text-lg text-[#6b6b6b] mb-2">{parent?.title}</p>

            <div className="text-sm text-[#6b6b6b]">
              <div>
                <strong>Publisher:</strong> {parent?.publisher?.name || "—"}
              </div>
              <div>
                <strong>Year:</strong> {parent?.publication_year || "—"}
              </div>
            </div>

            <div className="mt-6 p-4 bg-[#f9f8f0] border border-[#e9e7dd] rounded">
              <div className="text-sm text-[#8b6f47] font-medium">Sub-edition</div>
              <div className="text-base text-[#6b6b6b] mt-1">{sub.impression_label || `Variant ${sub.sequence_number || sub.id}`}</div>
+            </div>
          </div>

          <div className="justify-self-end">
            {basePhoto ? (
              <img src={getPhotoUrl(basePhoto.storage_path)} alt={basePhoto.caption || 'Base photo'} className="w-[220px] h-[220px] object-contain rounded" />
            ) : (
              <div className="w-[220px] h-[220px] bg-[#f6f4ea] flex items-center justify-center text-sm text-[#9b9b9b]">No image</div>
            )}
          </div>
        </div>

        {photos.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-serif text-[#8b6f47] mb-4">Photos for this Sub-edition</h3>
            <ImageCarousel photos={photos} />
          </div>
        )}
      </div>
    </div>
  );
}
