import { supabase } from "@/utils/supabase";
import { EditionWithRelations } from "@/types/database";
import Link from "next/link";

async function getEditions(): Promise<EditionWithRelations[]> {
  const { data, error } = await supabase
    .from("editions")
    .select(`
      *,
      work:works (
        id,
        original_title,
        english_title,
        work_authors (
          author:authors (
            id,
            name
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
        sort_order
      )
    `)
    .order("title", { ascending: true });

  if (error) {
    console.error("Error fetching editions:", error);
    return [];
  }

  return (data || []) as EditionWithRelations[];
}

export default async function PublishersSeriesPage() {
  const editions = await getEditions();

  return (
    <div className="py-8">
      <h1 className="text-4xl font-serif text-[#8b6f47] mb-8">
        Publishers & Series
      </h1>

      <div className="bg-white border border-[#e0ddd0] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f9f8f0] border-b border-[#e0ddd0]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b6f47]">
                  Edition Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b6f47]">
                  Author
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b6f47]">
                  Original Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b6f47]">
                  Publisher
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#8b6f47]">
                  Photo
                </th>
              </tr>
            </thead>
            <tbody>
              {editions.map((edition) => {
                const authors = edition.work?.work_authors?.map((wa) => wa.author.name).join(", ") || "Unknown";
                const originalTitle = edition.work?.original_title || "—";
                const firstPhoto = edition.photos && edition.photos.length > 0 ? edition.photos[0] : null;

                return (
                  <tr
                    key={edition.id}
                    className="border-b border-[#e0ddd0] hover:bg-[#fdfcf0] transition"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/edition/${edition.id}`}
                        className="text-[#8b6f47] hover:underline font-medium"
                      >
                        {edition.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[#6b6b6b]">{authors}</td>
                    <td className="px-6 py-4 text-[#6b6b6b]">{originalTitle}</td>
                    <td className="px-6 py-4 text-[#6b6b6b]">
                      {edition.publisher?.name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {firstPhoto ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${firstPhoto.storage_path}`}
                          alt={edition.title}
                          className="w-20 h-28 object-cover rounded border border-[#e0ddd0]"
                        />
                      ) : (
                        <span className="text-[#d0d0d0]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

