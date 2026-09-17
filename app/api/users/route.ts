import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { respondError } from "@/lib/api";

export async function GET() {
  try {
    const { data, error } = await db().from("app_users").select("id,name,email").order("name");
    if (error) throw error;
    return NextResponse.json({ users: data });
  } catch (error) { return respondError(error); }
}
