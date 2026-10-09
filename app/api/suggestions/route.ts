import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabaseAdmin";
import { checkSuggestion, MAX_PER_HOUR, type SuggestionInput } from "@/app/lib/suggestions";

const SAVE_FAILED = "We could not save your suggestion right now. Please try again later.";

/** A hash of the visitor's IP with a secret salt: enough for the hourly limit, never the IP itself. */
function ipHash(request: Request) {
  const salt = process.env.SUGGESTIONS_SALT;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  if (!salt || !ip) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * "Suggest a change" (board Opmerkingen): POST /api/suggestions with the form as JSON. Everything goes
 * into a queue only Eric sees; nothing is published automatically.
 */
export async function POST(request: Request) {
  let input: SuggestionInput;
  try {
    input = (await request.json()) as SuggestionInput;
  } catch {
    return NextResponse.json({ error: "Send the form as JSON." }, { status: 400 });
  }

  const check = checkSuggestion(input, Date.now());
  // Spam gets the same answer as a real suggestion, without a number, and nothing is saved
  if (!check.ok && check.reason === "spam") return NextResponse.json({ id: null });
  if (!check.ok) return NextResponse.json({ error: check.message }, { status: 400 });

  try {
    const db = supabaseAdmin();
    const hash = ipHash(request);
    if (hash) {
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await db
        .from("suggestions")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", hash)
        .gte("created_at", since);
      if ((count ?? 0) >= MAX_PER_HOUR) {
        return NextResponse.json(
          { error: "Too many suggestions from this connection. Please try again in an hour." },
          { status: 429 }
        );
      }
    }
    const { data, error } = await db.from("suggestions").insert({ ...check.row, ip_hash: hash }).select("id").single();
    if (error || !data) {
      console.error("Saving suggestion:", error);
      return NextResponse.json({ error: SAVE_FAILED }, { status: 503 });
    }
    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error("Saving suggestion:", e);
    return NextResponse.json({ error: SAVE_FAILED }, { status: 503 });
  }
}
