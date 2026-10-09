import { unstable_cache } from "next/cache";
import { supabase } from "@/utils/supabase";
import { getAuthorList, getTitleList } from "./overviewQueries";

/** "In numbers" on the About page: titles, authors, editions and photographs. Cached for an hour. */
export const getAboutCounts = unstable_cache(
  async () => {
    const [titles, authors, editions, photos] = await Promise.all([
      getTitleList(),
      getAuthorList(),
      supabase.from("editions").select("id", { count: "exact", head: true }),
      supabase.from("photos").select("id", { count: "exact", head: true }),
    ]);
    return {
      titles: titles.length,
      authors: authors.length,
      editions: editions.count ?? 0,
      photographs: photos.count ?? 0,
    };
  },
  ["about-counts"],
  { revalidate: 3600, tags: ["about-counts"] }
);
