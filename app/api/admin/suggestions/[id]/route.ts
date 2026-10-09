import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabaseAdmin";
import { isStatus } from "@/app/lib/suggestions";

/** Sets the status of one suggestion (form post from the queue), then goes back to it. Behind proxy.ts. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const status = (await request.formData()).get("status");
  if (!Number.isInteger(id) || !isStatus(status)) return NextResponse.json({ error: "Unknown suggestion or status." }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from("suggestions")
    .update({ status, handled_at: status === "new" ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Updating suggestion:", error);
    return NextResponse.json({ error: "Could not update the suggestion." }, { status: 503 });
  }
  return NextResponse.redirect(new URL(`/admin/suggestions/${id}`, request.url), 303);
}
