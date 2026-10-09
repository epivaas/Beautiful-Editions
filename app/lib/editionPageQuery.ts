import { supabase } from "@/utils/supabase";
import type { EditionPageRow } from "./editionPage";

const PHOTO = "id, storage_path, caption, copyright_statement, is_main, sort_order";

// One query with nested relations: the edition, its sub-editions, contributors and the titles it contains.
const EDITION_SELECT = `
  id, title, publication_year, language, isbn, catalogue_number, publisher_url,
  binding_type, pages_description, size_dimensions, typeface, printer, binder, notes, details,
  slipcase, dustjacket, clamshell, is_limited_edition, limited_edition_count,
  publisher:publishers ( id, name ),
  series:series ( id, name ),
  photos ( ${PHOTO} ),
  sub_editions (
    id, impression_label, sequence_number, catalogue_number, isbn, binding_type, size_dimensions, typeface,
    slipcase, dustjacket, clamshell, is_limited_edition, limited_edition_count,
    limited_state:limited_states ( name, sort_order ),
    photos ( ${PHOTO} )
  ),
  edition_contributors ( role, contributor:contributors ( id, name ) ),
  work_editions ( id, work:works ( id, original_title, english_title, work_authors ( author:authors ( id, name ) ) ) )
`;

export async function getEditionPage(id: number): Promise<EditionPageRow | null> {
  const { data, error } = await supabase.from("editions").select(EDITION_SELECT).eq("id", id).maybeSingle();

  if (error) {
    console.error("Error fetching edition page:", error);
    return null;
  }

  return data as unknown as EditionPageRow | null;
}
