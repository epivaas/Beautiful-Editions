import { supabase } from "@/utils/supabase";
import { supabaseUrl } from "@/utils/supabase";
import { fetchAllRows } from "@/utils/supabasePagination";
import { EditionWithRelations } from "@/types/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import ImageCarousel from "@/components/ImageCarousel";
import Image from "next/image";

interface SubEdition {
  id: number;
  impression_label?: string | null;
  publication_year?: number | null;
  catalogue_number?: string | null;
  is_limited_edition?: boolean | null;
  limited_edition_count?: number | null;
}

function getPhotoUrl(storagePath: string) {
  return `${supabaseUrl}/storage/v1/object/public/Book-photos/${storagePath}`;
}

function firstRelation<T>(relation: T | T[] | null | undefined): T | undefined {
  return Array.isArray(relation) ? relation[0] : relation ?? undefined;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

function hasValidString(value: unknown) {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    value.trim().toUpperCase() !== "NULL"
  );
}

function renderField(label: string, value: unknown, opts?: { link?: boolean }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-[#8b6f47] mb-2">{label}</h3>
      {opts?.link && hasValidString(value) ? (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8b6f47] hover:underline"
        >
          {String(value)}
        </a>
      ) : (
        <p className="text-[#6b6b6b]">{formatValue(value)}</p>
      )}
    </div>
  );
}

async function getEdition(id: number): Promise<EditionWithRelations | null> {
  const { data: editionData, error: editionError } = await supabase
    .from("editions")
    .select(`
      id,
      publisher_id,
      series_id,
      title,
      isbn,
      publication_year,
      language,
      slipcase,
      dustjacket,
      clamshell,
      is_limited_edition,
      limited_edition_count,
      publisher_url,
      sequence_number,
      catalogue_number,
      size_dimensions,
      pages_description,
      binding_type,
      typeface,
      printer,
      binder,
      details,
      notes,
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

  if (editionError || !editionData) {
    return null;
  }

  const { data: contributorsData, error: contributorsError } = await fetchAllRows(() =>
    supabase
      .from("edition_contributors")
      .select(`
        role,
        contributor:contributors (
          id,
          name,
          wiki_link
        )
      `)
      .eq("edition_id", id)
      .order("role", { ascending: true })
  );

  if (contributorsError) {
    console.error("Error fetching edition contributors:", contributorsError);
  }

  const { data: workLinkData, error: workLinkError } = await supabase
    .from("work_editions")
    .select("work_id")
    .eq("edition_id", id)
    .limit(1)
    .single();

  if (workLinkError || !workLinkData?.work_id) {
    return {
      ...editionData,
      publisher: firstRelation(editionData.publisher),
      series: firstRelation(editionData.series),
      work: undefined,
      contributors: (contributorsData || []).map((entry) => ({
        role: entry.role,
        contributor: firstRelation(entry.contributor),
      })),
    } as unknown as EditionWithRelations;
  }

  const { data: workData, error: workError } = await supabase
    .from("works")
    .select(`
      id,
      original_title,
      english_title,
      original_publication_year,
      original_language,
      wiki_link,
      notes,
      sort_title,
      work_authors (
        author:authors (
          id,
          name,
          wiki_link
        )
      )
    `)
    .eq("id", workLinkData.work_id)
    .single();

  if (workError || !workData) {
    return {
      ...editionData,
      publisher: firstRelation(editionData.publisher),
      series: firstRelation(editionData.series),
      work: undefined,
      contributors: (contributorsData || []).map((entry) => ({
        role: entry.role,
        contributor: firstRelation(entry.contributor),
      })),
    } as unknown as EditionWithRelations;
  }

  return {
    ...editionData,
    publisher: firstRelation(editionData.publisher),
    series: firstRelation(editionData.series),
    work: {
      ...workData,
      work_authors: (workData.work_authors || [])
        .map((entry) => ({ author: firstRelation(entry.author) }))
        .filter((entry): entry is { author: NonNullable<typeof entry.author> } => Boolean(entry.author)),
    },
    contributors: (contributorsData || []).map((entry) => ({
      role: entry.role,
      contributor: firstRelation(entry.contributor),
    })),
  } as unknown as EditionWithRelations;
}

async function getSubEditions(parentId: number): Promise<SubEdition[]> {
  // The `sub_editions` table contains rows that reference `editions` via `edition_id`.
  // Query `sub_editions` for rows where `edition_id` = parentId and return them.
  const { data, error } = await fetchAllRows(() =>
    supabase
      .from("sub_editions")
      .select(`
        id,
        impression_label,
        publication_year,
        catalogue_number,
        is_limited_edition,
        limited_edition_count
      `)
      .eq("edition_id", parentId)
      .order("sequence_number", { ascending: true })
  );

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
            <h1 className="text-4xl md:text-5xl font-serif text-[#8b6f47] mb-4 leading-tight">
              {edition.title}
            </h1>

            {edition.work?.original_title && (
              <p className="text-xl text-[#6b6b6b] italic mb-2">
                Original title: {edition.work.original_title}
              </p>
            )}

            {edition.work?.english_title &&
              edition.work.english_title !== edition.work.original_title && (
                <p className="text-lg text-[#6b6b6b] mb-2">
                  English title: {edition.work.english_title}
                </p>
              )}
          </div>

          <div className="lg:justify-self-end w-full max-w-[280px]">
            {edition.publisher && (
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#8b6f47] mb-1">
                  Publisher
                </p>
                <Link
                  href={`/publisher/${edition.publisher.id}`}
                  className="text-lg font-medium text-[#4f4a3d] hover:text-[#8b6f47] hover:underline"
                >
                  {edition.publisher.name}
                </Link>
              </div>
            )}

            {authors.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8b6f47] mb-1">
                  Author{authors.length > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-lg text-[#4f4a3d]">
                  {authors.map((author, index) => (
                    <span key={author.id || `${author.name}-${index}`} className="flex items-center gap-2">
                      <Link
                        href={`/author/${author.id}`}
                        className="font-medium hover:text-[#8b6f47] hover:underline"
                      >
                        {author.name}
                      </Link>
                      {index < authors.length - 1 && <span className="text-[#6b6b6b]">,</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {featuredPhoto && (
            <div className="lg:justify-self-end">
              <div className="relative bg-white border border-[#e0ddd0] rounded p-3 shadow-sm w-full max-w-[240px] h-[244px]">
                <Image
                  fill
                  src={getPhotoUrl(featuredPhoto.storage_path)}
                  alt={featuredPhoto.caption || "Edition photo"}
                  sizes="(max-width: 1024px) 100vw, 240px"
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
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Edition ID</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.id)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Work</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.work?.original_title || edition.work?.id)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Publisher</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.publisher?.name)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Series</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.series?.name)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Title</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.title)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">ISBN</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.isbn)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Publication Year</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.publication_year)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Language</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.language)}</p>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Publisher URL</h3>
                {edition.publisher_url ? (
                  <a
                    href={edition.publisher_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8b6f47] hover:underline"
                  >
                    {edition.publisher_url}
                  </a>
                ) : (
                  <p className="text-[#6b6b6b]">{formatValue(edition.publisher_url)}</p>
                )}
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Sequence Number</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.sequence_number)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Catalogue Number</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.catalogue_number)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Slipcase</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.slipcase)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Dustjacket</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.dustjacket)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Clamshell</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.clamshell)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Limited Edition</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.is_limited_edition)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Limited Edition Count</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.limited_edition_count)}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Size / Dimensions</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.size_dimensions)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Pages Description</h3>
                <p className="text-[#6b6b6b] whitespace-pre-line">{formatValue(edition.pages_description)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Binding Type</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.binding_type)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Typeface</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.typeface)}</p>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Printer</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.printer)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Binder</h3>
                <p className="text-[#6b6b6b]">{formatValue(edition.binder)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Details</h3>
                <p className="text-[#6b6b6b] whitespace-pre-line">{formatValue(edition.details)}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold text-[#8b6f47] mb-2">Notes</h3>
                <p className="text-[#6b6b6b] whitespace-pre-line">{formatValue(edition.notes)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contributors */}
        {edition.contributors && edition.contributors.length > 0 && (
          <div className="bg-white border border-[#e0ddd0] rounded p-8 mb-8">
            <h2 className="text-2xl font-serif text-[#8b6f47] mb-6">Contributors</h2>
            <div className="grid gap-3">
              {edition.contributors.map((entry, index) => (
                <div key={`${entry.contributor?.id || index}-${entry.role || "role"}`} className="flex flex-wrap items-center gap-2 border-b border-[#f0eee4] pb-3 last:border-b-0 last:pb-0">
                  <span className="text-sm text-[#6b6b6b]">
                    ID: {formatValue(entry.contributor?.id)}
                  </span>
                  <span className="font-medium text-[#4f4a3d]">
                    Name: {entry.contributor?.name || "Unknown contributor"}
                  </span>
                  <span className="text-sm text-[#6b6b6b]">
                    Role: {formatValue(entry.role)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
        <div className="bg-white border border-[#e0ddd0] rounded p-8">
          <h2 className="text-2xl font-serif text-[#8b6f47] mb-6">
            Work Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {renderField("Work ID", edition.work?.id)}
              {renderField("Original Title", edition.work?.original_title)}
              {renderField("English Title", edition.work?.english_title)}
              {renderField("Original Publication Year", edition.work?.original_publication_year)}
            </div>
            <div>
              {renderField("Original Language", edition.work?.original_language)}
              {renderField("Reference", edition.work?.wiki_link, { link: true })}
              {renderField("Sort Title", edition.work?.sort_title)}
              {renderField("Work Notes", edition.work?.notes)}
            </div>
          </div>
        </div>

        {/* Sub-editions */}
        {subEditions && subEditions.length > 0 && (
          <div className="bg-white border border-[#e0ddd0] rounded p-8 mt-8">
            <h2 className="text-2xl font-serif text-[#8b6f47] mb-4">Sub-editions</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[#e0ddd0] text-xs uppercase tracking-[0.12em] text-[#8b6f47]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">id</th>
                    <th className="px-4 py-3 font-semibold">impression_label</th>
                    <th className="px-4 py-3 font-semibold">publication_year</th>
                    <th className="px-4 py-3 font-semibold">catalogue_number</th>
                    <th className="px-4 py-3 font-semibold">is_limited_edition</th>
                    <th className="px-4 py-3 font-semibold">limited_edition_count</th>
                  </tr>
                </thead>
                <tbody>
                  {subEditions.map((sub) => (
                    <tr key={sub.id} className="border-b border-[#f0eee4] last:border-b-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/sub-editions/${sub.id}`}
                          className="text-[#8b6f47] hover:underline"
                        >
                          {formatValue(sub.id)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{formatValue(sub.impression_label)}</td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{formatValue(sub.publication_year)}</td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{formatValue(sub.catalogue_number)}</td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{formatValue(sub.is_limited_edition)}</td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{formatValue(sub.limited_edition_count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

