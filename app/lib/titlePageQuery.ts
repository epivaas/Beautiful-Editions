import { supabase } from "@/utils/supabase";
import type { TitleWorkRow } from "./titlePage";

const PHOTO = "id, storage_path, caption, copyright_statement, is_main, sort_order";

/** Fields of an edition as shown on cards (TitleEditionRow); shared with the home page. */
export const EDITION_CARD_SELECT = `
  id, title, publication_year, language, binding_type, pages_description, notes,
  slipcase, dustjacket, clamshell, is_limited_edition, limited_edition_count,
  publisher:publishers ( id, name ),
  photos ( ${PHOTO} ),
  sub_editions (
    id, is_limited_edition, limited_edition_count,
    limited_state:limited_states ( name, sort_order ),
    photos ( ${PHOTO} )
  ),
  edition_contributors ( role, contributor:contributors ( id, name ) ),
  work_editions ( id, work:works ( id, original_title ) )
`;

// One query with nested relations; a title has at most a few dozen editions, so no pagination needed.
const TITLE_SELECT = `
  id, original_title, english_title, original_publication_year, original_language, wiki_link,
  work_authors ( author:authors ( id, name ) ),
  work_editions ( edition:editions ( ${EDITION_CARD_SELECT} ) )
`;

export async function getTitlePage(id: number): Promise<TitleWorkRow | null> {
  const { data, error } = await supabase.from("works").select(TITLE_SELECT).eq("id", id).maybeSingle();

  if (error) {
    console.error("Error fetching title page:", error);
    return null;
  }

  return data as unknown as TitleWorkRow | null;
}
