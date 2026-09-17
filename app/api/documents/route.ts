import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { currentUser, respondError } from "@/lib/api";
import { createSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    const client = db();
    const [{ data: owned, error: ownedError }, { data: shares, error: sharesError }] = await Promise.all([
      client.from("documents").select("*").eq("owner_id", user.id).order("updated_at", { ascending: false }),
      client.from("document_shares").select("document_id").eq("user_id", user.id),
    ]);
    if (ownedError) throw ownedError;
    if (sharesError) throw sharesError;
    const ids = (shares ?? []).map((share) => share.document_id);
    const sharedResult = ids.length ? await client.from("documents").select("*").in("id", ids).order("updated_at", { ascending: false }) : { data: [], error: null };
    if (sharedResult.error) throw sharedResult.error;
    return NextResponse.json({ owned: (owned ?? []).map((doc) => ({ ...doc, role: "owner" })), shared: (sharedResult.data ?? []).map((doc) => ({ ...doc, role: "editor" })) });
  } catch (error) { return respondError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser(request);
    const input = createSchema.parse(await request.json());
    const { data, error } = await db().from("documents").insert({ owner_id: user.id, title: input.title ?? "Untitled document", content: input.content ?? { type: "doc", content: [{ type: "paragraph" }] } }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ document: { ...data, role: "owner" } }, { status: 201 });
  } catch (error) { return respondError(error); }
}
