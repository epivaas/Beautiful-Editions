import { supabase } from "@/utils/supabase";
import type { SeriesEditionRow } from "./seriesPage";

/** A series with its publisher and its editions (a series has a few dozen at most). */
export async function getSeriesPage(id: number) {
  const { data: series, error } = await supabase
    .from("series")
    .select("id, name, description, publisher:publishers ( id, name )")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("Error fetching series:", error);
  if (!series) return null;

  const { data: editions, error: editionsError } = await supabase
    .from("editions")
    .select("id, title, publication_year, sequence_number, work_editions ( work:works ( work_authors ( author:authors ( name ) ) ) )")
    .eq("series_id", id)
    .order("id");
  if (editionsError) console.error("Error fetching series editions:", editionsError);

  return {
    series: series as unknown as { id: number; name: string; description: string | null; publisher: { id: number; name: string } | null },
    editions: (editions ?? []) as unknown as SeriesEditionRow[],
  };
}
