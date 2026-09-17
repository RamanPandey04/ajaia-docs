"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type DocumentList } from "@/lib/client";
import type { AppDocument } from "@/lib/types";
import { DEMO_USERS } from "@/lib/demo-users";
import { useIdentity } from "./identity-provider";

function textToDoc(text: string) {
  return { type: "doc" as const, content: text.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map((paragraph) => ({ type: "paragraph", content: paragraph ? [{ type: "text", text: paragraph.trim() }] : [] })) };
}

function DocumentSection({ title, documents, empty }: { title: string; documents: AppDocument[]; empty: string }) {
  return <section className="document-section">
    <div className="section-heading"><h2>{title}</h2><span className="count">{documents.length}</span></div>
    {documents.length ? <div className="document-grid">{documents.map((document) => <Link key={document.id} className="document-card" href={`/docs/${document.id}`}>
      <span className="card-icon" aria-hidden="true">▤</span>
      <strong>{document.title}</strong>
      <span className="card-meta">{document.role === "owner" ? "Owner" : "Shared editor"} · Updated {new Date(document.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
    </Link>)}</div> : <div className="empty-state">{empty}</div>}
  </section>;
}

export function Dashboard() {
  const router = useRouter();
  const { userId, ready } = useIdentity();
  const [documents, setDocuments] = useState<DocumentList | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = DEMO_USERS.find((item) => item.id === userId);

  const load = useCallback(async () => {
    if (!userId) return;
    try { setDocuments(await api<DocumentList>("/api/documents", userId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load documents."); }
  }, [userId]);

  useEffect(() => {
    void Promise.resolve().then(() => { setDocuments(null); setError(""); return load(); });
  }, [load]);

  async function createDocument(title?: string, content?: ReturnType<typeof textToDoc>) {
    if (!userId) return;
    setBusy(true); setError("");
    try {
      const result = await api<{ document: AppDocument }>("/api/documents", userId, { method: "POST", body: JSON.stringify({ ...(title ? { title } : {}), ...(content ? { content } : {}) }) });
      router.push(`/docs/${result.document.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create document."); setBusy(false); }
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt") || file.size > 1024 * 1024) { setError("Only .txt files up to 1 MB are supported."); return; }
    try {
      const text = await file.text();
      await createDocument(file.name.slice(0, -4).trim() || "Imported document", textToDoc(text));
    } catch { setError("Could not read this text file."); }
    if (inputRef.current) inputRef.current.value = "";
  }

  if (!ready) return <main className="container"><p className="loading">Loading demo identity…</p></main>;
  return <main className="container dashboard">
    <div className="dashboard-hero">
      <div><p className="eyebrow">YOUR WORKSPACE</p><h1>Good to see you, {user?.name.split(" ")[0]}.</h1><p className="subtitle">Create a document, write together, and pick up where you left off.</p></div>
      <div className="primary-actions">
        <button className="button button-primary" disabled={busy} onClick={() => void createDocument()}>{busy ? "Creating…" : "+ New document"}</button>
        <button className="button button-secondary" disabled={busy} onClick={() => inputRef.current?.click()}>Import .txt</button>
        <input ref={inputRef} className="visually-hidden" type="file" accept=".txt,text/plain" aria-label="Import .txt file" onChange={(event) => void importFile(event.target.files?.[0])} />
      </div>
    </div>
    <p className="helper-text">Import supports plain text (.txt) up to 1 MB. This is a demo identity, not a secure login.</p>
    {error && <div className="notice notice-error" role="alert">{error} <button onClick={() => { setError(""); setDocuments(null); void load(); }}>Retry</button></div>}
    {!documents && !error && <p className="loading">Loading documents…</p>}
    {documents && <>
      <DocumentSection title="Owned by you" documents={documents.owned} empty="No documents yet. Create one to get started." />
      <DocumentSection title="Shared with you" documents={documents.shared} empty="No documents have been shared with you." />
    </>}
  </main>;
}
