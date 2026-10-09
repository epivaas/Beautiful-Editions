import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/utils/supabaseAdmin";
import { KINDS, STATUSES, isStatus, senderLabel, timeAgo, type Status } from "@/app/lib/suggestions";
import DataTable, { CELL_LINK, ROW_TITLE, type Column } from "@/components/DataTable";
import EmptyState from "@/components/EmptyState";
import { FilterChip } from "@/components/Chip";

export const metadata: Metadata = { title: "Suggestions · Shelfhound" };

type Row = {
  id: number;
  created_at: string;
  status: Status;
  kind: string;
  page_path: string;
  page_label: string | null;
  name: string | null;
  wants_credit: boolean;
  email_verified: boolean;
};

type PageProps = { searchParams: Promise<{ status?: string }> };

function columns(now: Date): Column<Row>[] {
  return [
    {
      key: "id",
      label: "No.",
      width: "80px",
      render: (r) => (
        <Link href={`/admin/suggestions/${r.id}`} className={`${CELL_LINK} ${ROW_TITLE} font-mono font-bold`}>
          #{r.id}
        </Link>
      ),
    },
    { key: "status", label: "Status", width: "110px", render: (r) => STATUSES.find((s) => s.key === r.status)?.label },
    { key: "kind", label: "Type", width: "120px", render: (r) => KINDS.find((k) => k.key === r.kind)?.label ?? r.kind },
    {
      key: "about",
      label: "About",
      render: (r) => (
        <Link href={r.page_path} className={`${CELL_LINK} text-sm text-amber hover:underline`}>
          {r.page_label || r.page_path}
        </Link>
      ),
    },
    { key: "from", label: "From", width: "24%", render: (r) => <span className="text-sm">{senderLabel(r)}</span> },
    {
      key: "when",
      label: "When",
      width: "120px",
      render: (r) => <span className="font-mono text-[13px] text-creme-gedempt">{timeAgo(new Date(r.created_at), now)}</span>,
    },
  ];
}

/** The queue (board Opmerkingen, step 5): only for Eric, behind the password in proxy.ts. */
export default async function SuggestionsQueue({ searchParams }: PageProps) {
  const query = await searchParams;
  const filter: Status | "all" = query.status === "all" ? "all" : isStatus(query.status) ? query.status : "new";
  const now = new Date();

  let rows: Row[] = [];
  let counts = new Map<string, number>();
  let failed = false;
  try {
    const db = supabaseAdmin();
    const [all, list] = await Promise.all([
      db.from("suggestions").select("status").limit(10000),
      (filter === "all" ? db.from("suggestions").select("*") : db.from("suggestions").select("*").eq("status", filter))
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    if (all.error || list.error) throw all.error ?? list.error;
    counts = new Map<string, number>();
    for (const r of all.data as { status: string }[]) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    rows = list.data as Row[];
  } catch (e) {
    console.error("Suggestions queue:", e);
    failed = true;
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-4xl leading-none tracking-[-0.03em] sm:text-5xl sm:leading-[52px]">Suggestions</h1>
      {failed ? (
        <EmptyState
          title="The queue could not be loaded"
          text="Check that the suggestions table exists and that SUPABASE_SERVICE_ROLE_KEY is set."
        />
      ) : (
        <>
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <FilterChip key={s.key} href={`/admin/suggestions?status=${s.key}`} count={counts.get(s.key) ?? 0} selected={filter === s.key}>
                {s.label}
              </FilterChip>
            ))}
            <FilterChip href="/admin/suggestions?status=all" count={total} selected={filter === "all"}>
              All
            </FilterChip>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Nothing here" text="No suggestions with this status." />
          ) : (
            <DataTable caption="Suggestions" columns={columns(now)} rows={rows} getRowKey={(r) => r.id} />
          )}
        </>
      )}
    </div>
  );
}
