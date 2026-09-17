import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { currentUser, documentAccess, requireOwner, respondError } from "@/lib/api";

type Context = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(request: Request, { params }: Context) {
  try {
    const user = await currentUser(request);
    const { id, userId } = await params;
    const { role } = await documentAccess(id, user.id);
    requireOwner(role);
    const { error } = await db().from("document_shares").delete().eq("document_id", id).eq("user_id", userId);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) { return respondError(error); }
}
