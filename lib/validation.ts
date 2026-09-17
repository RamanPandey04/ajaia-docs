import { z } from "zod";

export const contentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.json()).optional(),
}).strict();

export const titleSchema = z.string().trim().min(1, "Title is required").max(120, "Title must be at most 120 characters");
export const createSchema = z.object({ title: titleSchema.optional(), content: contentSchema.optional() }).strict();
export const updateSchema = z.union([
  z.object({ title: titleSchema }).strict(),
  z.object({ content: contentSchema }).strict(),
]);
export const shareSchema = z.object({ userId: z.uuid(), permission: z.literal("editor") }).strict();
