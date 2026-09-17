import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { db } from "./supabase";
import { resolveDocumentPermission } from "./authorization";
import type { DocumentRole } from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function respondError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  console.error("API error", error);
  return NextResponse.json({ error: error instanceof Error && error.message.startsWith("Supabase is not configured") ? error.message : "An unexpected server error occurred." }, { status: 500 });
}

export async function currentUser(request: Request) {
  const id = request.headers.get("x-demo-user");
  if (!id) throw new ApiError(401, "Select a demo identity to continue.");
  if (!z.uuid().safeParse(id).success) throw new ApiError(401, "Demo identity is invalid.");
  const { data, error } = await db().from("app_users").select("id,name,email").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(401, "Demo identity is invalid.");
  return data;
}

export async function documentAccess(documentId: string, userId: string): Promise<{ document: Record<string, unknown>; role: DocumentRole }> {
  if (!z.uuid().safeParse(documentId).success) throw new ApiError(400, "Invalid document ID.");
  const client = db();
  const { data: document, error } = await client.from("documents").select("*").eq("id", documentId).maybeSingle();
  if (error) throw error;
  if (!document) throw new ApiError(404, "Document not found.");
  let sharedUserIds: string[] = [];
  if (document.owner_id !== userId) {
    const { data: shares, error: sharesError } = await client.from("document_shares").select("user_id").eq("document_id", documentId).eq("user_id", userId);
    if (sharesError) throw sharesError;
    sharedUserIds = (shares ?? []).map((share) => share.user_id);
  }
  const role = resolveDocumentPermission(document.owner_id, sharedUserIds, userId);
  if (!role) throw new ApiError(403, "You do not have access to this document.");
  return { document, role };
}

export function requireOwner(role: DocumentRole) {
  if (role !== "owner") throw new ApiError(403, "Only the owner can manage this document.");
}
