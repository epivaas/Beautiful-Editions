import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/utils/supabaseAdmin";
import { KINDS, STATUSES, senderLabel, timeAgo, type Status } from "@/app/lib/suggestions";
import FactGrid from "@/components/FactGrid";
import { Button, TextLink } from "@/components/Button";

export const metadata: Metadata = { title: "Suggestion · Shelfhound" };

type Suggestion = {
  id: number;
  created_at: string;
  status: Status;
  kind: string;
  page_path: string;
  page_label: string | null;
  field: string | null;
  body: string;
  name: string | null;
  email: string | null;
  wants_credit: boolean;
  email_verified: boolean;
  handled_at: string | null;
};

// "Publish as a collector's note" comes with the notes under the page (board: later)
const ACTIONS: { status: Status; label: string; primary?: boolean }[] = [
  { status: "accepted", label: "Accept (applied to the data)", primary: true },
  { status: "rejected", label: "Reject" },
  { status: "spam", label: "Spam" },
  { status: "new", label: "Back to New" },
];

/** One suggestion with its sender and the actions (board Opmerkingen, step 5). Behind proxy.ts. */
export default async function SuggestionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = supabaseAdmin();
  const { data } = await db.from("suggestions").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = data as Suggestion;
  const earlier = s.email
    ? (await db.from("suggestions").select("id, status").eq("email", s.email).neq("id", s.id)).data ?? []
    : [];
  const used = earlier.filter((e) => e.status === "accepted" || e.status === "published").length;

  return (
    <div className="flex max-w-[860px] flex-col gap-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-creme-gedempt">
        <TextLink href="/admin/suggestions" standalone>
          Suggestions
        </TextLink>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-mono text-creme">
          #{s.id}
        </span>
      </nav>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[13px] uppercase tracking-[0.08em] text-creme-gedempt">
          {STATUSES.find((x) => x.key === s.status)?.label} · {KINDS.find((k) => k.key === s.kind)?.label ?? s.kind} ·{" "}
          {timeAgo(new Date(s.created_at), new Date())}
        </span>
        <h1 className="m-0 text-[32px] leading-9">
          <Link href={s.page_path} className="text-amber hover:underline">
            {s.page_label || s.page_path}
          </Link>
          {s.field && <span className="text-creme-gedempt"> · {s.field}</span>}
        </h1>
      </div>

      <p className="m-0 whitespace-pre-line rounded-card border border-lijn bg-oppervlak p-5 text-[17px] leading-[27px]">{s.body}</p>

      <FactGrid
        items={[
          { label: "From", value: senderLabel(s) },
          {
            label: "E-mail",
            value: s.email && (
              <a href={`mailto:${s.email}?subject=${encodeURIComponent(`Your suggestion #${s.id} on Shelfhound`)}`} className="break-all text-amber hover:underline">
                {s.email}
              </a>
            ),
          },
          { label: "Credit", value: s.wants_credit ? "Asks to be credited" : "Anonymous" },
          {
            label: "Earlier",
            value: s.email ? `${earlier.length} earlier ${earlier.length === 1 ? "suggestion" : "suggestions"}, ${used} used` : null,
          },
        ]}
      />

      <section aria-labelledby="decide" className="flex flex-col gap-3">
        <h2 id="decide" className="m-0 text-[22px] leading-7">
          Decide
        </h2>
        <div className="flex flex-wrap gap-3">
          {ACTIONS.filter((a) => a.status !== s.status).map((a) => (
            <form key={a.status} action={`/api/admin/suggestions/${s.id}`} method="post">
              <input type="hidden" name="status" value={a.status} />
              <Button type="submit" variant={a.primary ? "primary" : "secondary"}>
                {a.label}
              </Button>
            </form>
          ))}
        </div>
        <p className="m-0 text-[13px] text-creme-gedempt">
          Accepting does not change the data: apply the correction yourself, then mark it here.
        </p>
      </section>
    </div>
  );
}
