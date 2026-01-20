import { supabase } from "@/utils/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all editions with their related data
    const { data: editions, error } = await supabase
      .from("editions")
      .select(`
        id,
        title,
        publisher_id,
        series_id,
        work_id,
        photos (
          id,
          storage_path,
          sort_order,
          copyright_statement
        )
      `)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching editions:", error);
      return NextResponse.json(
        { error: "Failed to fetch editions", details: error.message },
        { status: 500 }
      );
    }

    // Get work IDs from editions
    const workIds = [...new Set((editions || []).map((e: any) => e.work_id).filter(Boolean))];
    const publisherIds = [...new Set((editions || []).map((e: any) => e.publisher_id).filter(Boolean))];
    const seriesIds = [...new Set((editions || []).map((e: any) => e.series_id).filter(Boolean))];

    // Fetch works data
    let works: any = {};
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
        worksData.forEach((w: any) => {
          works[w.id] = w;
        });
      }
    }

    // Fetch publishers data
    let publishers: any = {};
    if (publisherIds.length > 0) {
      const { data: publishersData } = await supabase
        .from("publishers")
        .select("id, name")
        .in("id", publisherIds);

      if (publishersData) {
        publishersData.forEach((p: any) => {
          publishers[p.id] = p;
        });
      }
    }

    // Fetch series data
    let series: any = {};
    if (seriesIds.length > 0) {
      const { data: seriesData } = await supabase
        .from("series")
        .select("id, name, publisher_id")
        .in("id", seriesIds);

      if (seriesData) {
        seriesData.forEach((s: any) => {
          series[s.id] = s;
        });
      }
    }

    // Enrich editions with work, publisher, and series data
    const enrichedEditions = (editions || [])
      .map((e: any) => ({
        ...e,
        work: works[e.work_id],
        publisher: publishers[e.publisher_id],
        series: series[e.series_id],
      }))
      .filter((e: any) => e.photos && e.photos.length > 0)
      .slice(0, 8);

    console.log("Fetched editions:", enrichedEditions);
    return NextResponse.json(enrichedEditions);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
