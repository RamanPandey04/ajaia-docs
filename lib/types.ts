import type { JSONContent } from "@tiptap/react";

export type DocumentRole = "owner" | "editor";
export type AppDocument = {
  id: string;
  title: string;
  content: JSONContent;
  owner_id: string;
  created_at: string;
  updated_at: string;
  role: DocumentRole;
};
export type Share = { user_id: string; permission: "editor" };
