import { describe, expect, it } from "vitest";
import { resolveDocumentPermission } from "../lib/authorization";

describe("document authorization policy", () => {
  const owner = "mira";
  const shared = "alex";
  const unrelated = "jordan";
  const shares = [shared];

  it("grants owner permission to the owner", () => {
    expect(resolveDocumentPermission(owner, shares, owner)).toBe("owner");
  });
  it("grants editor permission to an explicitly shared user", () => {
    expect(resolveDocumentPermission(owner, shares, shared)).toBe("editor");
  });
  it("denies an unrelated user", () => {
    expect(resolveDocumentPermission(owner, shares, unrelated)).toBeNull();
  });
});
