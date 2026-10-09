import { NextResponse } from "next/server";
import { getEditionIndex } from "@/app/lib/searchQueries";
import { parseCriteria, suggestFor, type SuggestField } from "@/app/lib/search";

const FIELDS: SuggestField[] = ["author", "illustrator", "binding"];

/**
 * Suggestions for the text fields of the detailed search, limited to the editions that meet the other
 * criteria: GET /api/search/suggest?field=author&q=king&publisher=5
 */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const field = params.field as SuggestField | undefined;
  if (!field || !FIELDS.includes(field)) return NextResponse.json([], { status: 400 });
  const index = await getEditionIndex();
  return NextResponse.json(suggestFor(index, parseCriteria(params), field, params.q ?? ""));
}
