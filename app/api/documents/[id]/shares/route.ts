import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { ApiError, currentUser, documentAccess, requireOwner, respondError } from "@/lib/api";
import { shareSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const user = await currentUser(request);
    const { id } = await params;
    const { role } = await documentAccess(id, user.id);
    requireOwner(role);
    const { data, error } = await db().from("document_shares").select("user_id,permission").eq("document_id", id);
    if (error) throw error;
    return NextResponse.json({ shares: data });
  } catch (error) { return respondError(error); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await currentUser(request);
    const { id } = await params;
    const { role } = await documentAccess(id, user.id);
    requireOwner(role);
    const input = shareSchema.parse(await request.json());
    if (input.userId === user.id) throw new ApiError(400, "You already own this document.");
    const client = db();
    const { data: target, error: userError } = await client.from("app_users").select("id").eq("id", input.userId).maybeSingle();
    if (userError) throw userError;
    if (!target) throw new ApiError(400, "Demo user not found.");
    const { error } = await client.from("document_shares").insert({ document_id: id, user_id: input.userId, permission: "editor" });
    if (error?.code === "23505") throw new ApiError(409, "This user already has access.");
    if (error) throw error;
    return NextResponse.json({ userId: input.userId, permission: "editor" }, { status: 201 });
  } catch (error) { return respondError(error); }
}
