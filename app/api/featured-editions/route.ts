import { supabase } from "@/utils/supabase";
import { NextResponse } from "next/server";

type FeaturedPhoto = {
  id: number;
  storage_path: string;
  sort_order: number;
  copyright_statement: string | null;
  is_main: boolean;
};

type FeaturedEditionRow = {
  id: number;
  title: string;
  publisher_id: number;
  series_id: number | null;
  photos: FeaturedPhoto[] | null;
  work_editions: { work_id: number | null }[] | null;
};

type FeaturedWork = {
  id: number;
  original_title: string;
  work_authors: { author: { id: number; name: string } | { id: number; name: string }[] | null }[] | null;
};

type FeaturedPublisher = { id: number; name: string };
type FeaturedSeries = { id: number; name: string; publisher_id: number | null };

// Fisher-Yates shuffle for random selection
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET() {
  try {
    // Fetch editions with their related data (fetch batch without specific order for better randomness)
    const { data: editions, error } = await supabase
      .from("editions")
      .select(`
        id,
        title,
        publisher_id,
        series_id,
        photos (
          id,
          storage_path,
          sort_order,
          copyright_statement,
          is_main
        ),
        work_editions (
          work_id
        )
      `)
      .limit(100);

    if (error) {
      console.error("Error fetching editions:", error);
      return NextResponse.json(
        { error: "Failed to fetch editions", details: error.message },
        { status: 500 }
      );
    }

    // Get work IDs from editions
    const editionRows = (editions || []) as FeaturedEditionRow[];
    const workIds = [
      ...new Set(
        editionRows
          .flatMap((edition) => edition.work_editions || [])
          .map((link) => link.work_id)
          .filter((id): id is number => id !== null)
      ),
    ];
    const publisherIds = [...new Set(editionRows.map((edition) => edition.publisher_id))];
    const seriesIds = [...new Set(editionRows.map((edition) => edition.series_id).filter((id): id is number => id !== null))];

    // Fetch works data
    const works: Record<number, FeaturedWork> = {};
    if (workIds.length > 0) {
      const { data: worksData } = await supabase
        .from("works")
        .select(`
          id,
          original_title,
          work_authors (
            author:authors (
              id,
              name
            )
          )
        `)
        .in("id", workIds);

      if (worksData) {
        (worksData as FeaturedWork[]).forEach((w) => {
          works[w.id] = w;
        });
      }
    }

    // Fetch publishers data
    const publishers: Record<number, FeaturedPublisher> = {};
    if (publisherIds.length > 0) {
      const { data: publishersData } = await supabase
        .from("publishers")
        .select("id, name")
        .in("id", publisherIds);

      if (publishersData) {
        (publishersData as FeaturedPublisher[]).forEach((p) => {
          publishers[p.id] = p;
        });
      }
    }

    // Fetch series data
    const series: Record<number, FeaturedSeries> = {};
    if (seriesIds.length > 0) {
      const { data: seriesData } = await supabase
        .from("series")
        .select("id, name, publisher_id")
        .in("id", seriesIds);

      if (seriesData) {
        (seriesData as FeaturedSeries[]).forEach((s) => {
          series[s.id] = s;
        });
      }
    }

    // Enrich editions with work, publisher, and series data
    const enrichedEditions = editionRows
      .map((e) => ({
        ...e,
        work: e.work_editions?.[0]?.work_id != null
          ? works[e.work_editions[0].work_id]
          : undefined,
        publisher: publishers[e.publisher_id],
        series: e.series_id != null ? series[e.series_id] : undefined,
      }))
      .filter((e) => e.photos && e.photos.length > 0);

    // Shuffle and select random 8 editions
    const randomEditions = shuffle(enrichedEditions).slice(0, 8);

    console.log("Fetched editions:", randomEditions);
    return NextResponse.json(randomEditions);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
