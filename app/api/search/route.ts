import { NextResponse } from "next/server";
import { getAuthorList, getPublisherList, getTitleList } from "@/app/lib/overviewQueries";
import { quickSearch } from "@/app/lib/search";

// The lists behind it are cached for an hour on the server; the browser may keep an answer for 5 minutes
const CACHE = { "Cache-Control": "public, max-age=300" };

/** Live results for the search field in the header: GET /api/search?q=hom */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const [titles, authors, publishers] = await Promise.all([getTitleList(), getAuthorList(), getPublisherList()]);
  return NextResponse.json(quickSearch({ titles, authors, publishers }, q), { headers: CACHE });
}
