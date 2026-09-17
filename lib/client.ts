import type { AppDocument } from "./types";

export async function api<T>(path: string, userId: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "x-demo-user": userId, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export type DocumentList = { owned: AppDocument[]; shared: AppDocument[] };
