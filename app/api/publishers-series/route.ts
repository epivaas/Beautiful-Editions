import { supabase } from "@/utils/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch publishers
    const { data: publishers, error: publishersError } = await supabase
      .from("publishers")
      .select("id, name")
      .order("name", { ascending: true });

    if (publishersError) {
      console.error("Error fetching publishers:", publishersError);
    }

    // Fetch series with their publishers
    const { data: series, error: seriesError } = await supabase
      .from("series")
      .select(`
        id,
        name,
        publisher:publishers (
          id,
          name
        )
      `)
      .order("name", { ascending: true });

    if (seriesError) {
      console.error("Error fetching series:", seriesError);
    }

    return NextResponse.json({
      publishers: publishers || [],
      series: series || [],
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




