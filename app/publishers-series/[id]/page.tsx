import { notFound, permanentRedirect } from "next/navigation";
import { supabase } from "@/utils/supabase";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

/**
 * Old address of publisher and series pages. Publishers now live at /publishers/[id] and series at
 * /series/[id]; ?kind=series was how this shared route asked for a series.
 */
export default async function OldPublisherSeriesPage({ params, searchParams }: PageProps) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { kind, ...rest } = await searchParams;

  if (kind !== "series") {
    const { data: publisher } = await supabase.from("publishers").select("id").eq("id", id).maybeSingle();
    if (publisher) {
      const qs = new URLSearchParams(Object.entries(rest).filter((e): e is [string, string] => !!e[1])).toString();
      permanentRedirect(`/publishers/${id}${qs ? `?${qs}` : ""}`);
    }
  }
  const { data: series } = await supabase.from("series").select("id").eq("id", id).maybeSingle();
  if (series) permanentRedirect(`/series/${id}`);
  notFound();
}
