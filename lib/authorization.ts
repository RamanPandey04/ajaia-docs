export type Permission = "owner" | "editor" | null;

// This pure policy is also the policy used after database lookup in protected routes.
export function resolveDocumentPermission(ownerId: string, sharedUserIds: readonly string[], userId: string): Permission {
  if (ownerId === userId) return "owner";
  if (sharedUserIds.includes(userId)) return "editor";
  return null;
}
