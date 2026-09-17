import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { ApiError, currentUser, documentAccess, requireOwner, respondError } from "@/lib/api";
import { updateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const user = await currentUser(request);
    const { id } = await params;
    const { document, role } = await documentAccess(id, user.id);
    return NextResponse.json({ document: { ...document, role } });
  } catch (error) { return respondError(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await currentUser(request);
    const { id } = await params;
    const { role } = await documentAccess(id, user.id);
    const input = updateSchema.parse(await request.json());
    if ("title" in input) requireOwner(role);
    if (!("title" in input) && !("content" in input)) throw new ApiError(400, "No changes provided.");
    const { data, error } = await db().from("documents").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ document: { ...data, role } });
  } catch (error) { return respondError(error); }
}
