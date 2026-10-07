import { supabase } from "@/utils/supabase";
import ImageCarousel from "@/components/ImageCarousel";
import { notFound } from "next/navigation";
import { fetchAllRows } from "@/utils/supabasePagination";
import Image from "next/image";

type ParentPhoto = {
  id: number;
  storage_path: string;
  sort_order: number;
  caption: string | null;
};

type ParentEdition = {
  id: number;
  title: string;
  publication_year: number | null;
  publisher: { id: number; name: string } | null;
  work: { id: number; original_title: string | null; english_title: string | null } | null;
  photos: ParentPhoto[] | null;
};

type SubEditionRecord = {
  id: number;
  edition_id: number;
  impression_label: string | null;
  sequence_number: number | null;
  publication_year: number | null;
  catalogue_number: string | null;
  is_limited_edition: boolean | null;
  limited_edition_count: number | null;
  publisher_url: string | null;
  edition: ParentEdition | null;
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

function getPhotoUrl(storagePath: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${storagePath}`;
}

async function getSubEdition(id: string) {
  const { data: subEdition, error: subEditionError } = await supabase
    .from("sub_editions")
    .select("*")
    .eq("id", id)
    .single();

  if (subEditionError || !subEdition) return null;

  const { data: edition } = await supabase
    .from("editions")
    .select(`
      id,
      title,
      publication_year,
      publisher:publishers(id,name),
      work:works(id,original_title,english_title),
      photos:photos(id,storage_path,sort_order,caption)
    `)
    .eq("id", subEdition.edition_id)
    .single();

  return { ...subEdition, edition: edition as ParentEdition | null } as SubEditionRecord;
}

export default async function SubEditionPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const sub = await getSubEdition(resolvedParams.id);
  if (!sub) notFound();

  const parent = sub.edition;
  const work = parent?.work;
  const parentPhotos = [...(parent?.photos || [])].sort((a, b) => a.sort_order - b.sort_order);
  const basePhoto = parentPhotos[0];

  // Photos specifically attached to this sub-edition
  const { data: subPhotos } = await fetchAllRows(() =>
    supabase
      .from("photos")
      .select("id,storage_path,sort_order,caption")
      .eq("sub_edition_id", sub.id)
      .order("sort_order", { ascending: true })
  );
  const photos = ((subPhotos || []) as ParentPhoto[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({
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
            </div>
          </div>

          <div className="justify-self-end">
            {basePhoto ? (
              <Image
                src={getPhotoUrl(basePhoto.storage_path)}
                alt={basePhoto.caption || "Base photo"}
                width={220}
                height={220}
                className="w-[220px] h-[220px] object-contain rounded"
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-[#f6f4ea] flex items-center justify-center text-sm text-[#9b9b9b]">No image</div>
            )}
          </div>
        </div>

        <div className="border-t border-[#e0ddd0] pt-6">
          <h3 className="text-xl font-serif text-[#8b6f47] mb-4">Sub-edition details</h3>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm text-[#6b6b6b]">
            <div><strong>ID:</strong> {formatValue(sub.id)}</div>
            <div><strong>Edition ID:</strong> {formatValue(sub.edition_id)}</div>
            <div><strong>Impression label:</strong> {formatValue(sub.impression_label)}</div>
            <div><strong>Sequence number:</strong> {formatValue(sub.sequence_number)}</div>
            <div><strong>Publication year:</strong> {formatValue(sub.publication_year)}</div>
            <div><strong>Catalogue number:</strong> {formatValue(sub.catalogue_number)}</div>
            <div><strong>Limited edition:</strong> {formatValue(sub.is_limited_edition)}</div>
            <div><strong>Limited edition count:</strong> {formatValue(sub.limited_edition_count)}</div>
            <div className="sm:col-span-2"><strong>Publisher URL:</strong> {formatValue(sub.publisher_url)}</div>
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
