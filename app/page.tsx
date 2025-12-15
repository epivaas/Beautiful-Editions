import { supabase } from "@/utils/supabase";
import { EditionWithPhotos } from "@/types/database";

// De functie om alle edities op te halen, inclusief hun foto's
async function getEditions() {
  const { data, error } = await supabase
    .from("editions")
    .select(
      `
        *,
        photos (id, storage_path, sort_order)
      `
    ) // Haalt alle edition velden op, plus de gekoppelde foto's
    .order("publication_year", { ascending: false }) // Sorteer op jaar (nieuwste eerst)
    .limit(10); // Beperk tot 10 voor de homepage

  if (error) {
    console.error("Fout bij het ophalen van edities:", error);
    return [];
  }

  // De types zijn nu correct dankzij de `types/database.ts` file
  return data as EditionWithPhotos[];
}

export default async function Home() {
  const editions = await getEditions();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-10">
        Prachtige Edities ({editions.length})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full max-w-7xl">
        {editions.map((edition) => (
          <div
            key={edition.id}
            className="border p-4 rounded-lg shadow-lg hover:shadow-xl transition duration-300"
          >
            {/* TOON DE FOTO */}
            {edition.photos && edition.photos.length > 0 && (
              <div className="mb-4">
                <img
                  // We construeren de URL met de storage_path, aangezien we de URL niet opslaan in de DB
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Book-photos/${edition.photos[0].storage_path}`}
                  alt={`Foto van ${edition.title}`}
                  className="w-full h-48 object-cover rounded-md"
                />
              </div>
            )}

            {/* TOON DE INFO */}
            <h2 className="text-xl font-semibold mb-2">{edition.title}</h2>
            <p className="text-gray-600 mb-1">Jaar: {edition.publication_year}</p>
            {/* Hier kunt u meer info tonen */}
          </div>
        ))}
      </div>
    </main>
  );
}