"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { api } from "@/lib/client";
import { DEMO_USERS } from "@/lib/demo-users";
import type { AppDocument, Share } from "@/lib/types";
import { useIdentity } from "./identity-provider";

type SaveState = "Saved" | "Saving…" | "Save failed";

function ToolbarButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active ?? false} className={`tool-button ${active ? "active" : ""}`} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{children}</button>;
}

function Editor({ document, userId, onSaveReady, onSaved }: { document: AppDocument; userId: string; onSaveReady: (save: (() => Promise<void>) | null) => void; onSaved: (document: AppDocument) => void }) {
  const [saveState, setSaveState] = useState<SaveState>("Saved");
  const latest = useRef<JSONContent>(document.content);
  const saved = useRef(JSON.stringify(document.content));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const changedWhileSaving = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (inFlight.current) { changedWhileSaving.current = true; await inFlight.current; return; }
    const content = latest.current;
    const serialized = JSON.stringify(content);
    if (serialized === saved.current) { setSaveState("Saved"); return; }
    setSaveState("Saving…");
    const task = api<{ document: AppDocument }>(`/api/documents/${document.id}`, userId, { method: "PATCH", body: JSON.stringify({ content }), keepalive: true }).then((result) => {
      saved.current = serialized;
      onSaved(result.document);
      if (JSON.stringify(latest.current) === serialized) setSaveState("Saved");
    }).catch((error) => { setSaveState("Save failed"); throw error; });
    inFlight.current = task.then(() => {}, () => {});
    try { await task; }
    finally {
      inFlight.current = null;
      if (changedWhileSaving.current) { changedWhileSaving.current = false; if (JSON.stringify(latest.current) !== saved.current) await flush(); }
    }
  }, [document.id, userId, onSaved]);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: document.content,
    immediatelyRender: false,
    editorProps: { attributes: { class: "editor-content", "aria-label": "Document content" } },
    onUpdate: ({ editor }) => {
      latest.current = editor.getJSON();
      setSaveState("Saving…");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { void flush().catch(() => {}); }, 700);
    },
    onBlur: () => { void flush().catch(() => {}); },
  });

  useEffect(() => {
    onSaveReady(flush);
    return () => { if (timer.current) clearTimeout(timer.current); onSaveReady(null); };
  }, [flush, onSaveReady]);

  if (!editor) return <p className="loading">Loading editor…</p>;
  return <>
    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
      <ToolbarButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarButton>
      <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <span className="toolbar-divider" />
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolbarButton>
      <span className="toolbar-divider" />
      <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolbarButton>
      <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolbarButton>
      <span className="toolbar-divider" />
      <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>↶</ToolbarButton>
      <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>↷</ToolbarButton>
    </div>
    <div className="editor-workspace"><div className="paper"><EditorContent editor={editor} /></div></div>
    <div className={`save-status save-${saveState.toLowerCase().replace(/\W/g, "")}`} role="status" aria-live="polite">{saveState === "Saved" ? "✓ " : ""}{saveState}</div>
  </>;
}

function SharePanel({ document, userId, onClose }: { document: AppDocument; userId: string; onClose: () => void }) {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { const result = await api<{ shares: Share[] }>(`/api/documents/${document.id}/shares`, userId); setShares(result.shares); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load sharing."); }
  }, [document.id, userId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function toggle(targetId: string, hasAccess: boolean) {
    setBusyId(targetId); setError("");
    try {
      if (hasAccess) await api<void>(`/api/documents/${document.id}/shares/${targetId}`, userId, { method: "DELETE" });
      else await api(`/api/documents/${document.id}/shares`, userId, { method: "POST", body: JSON.stringify({ userId: targetId, permission: "editor" }) });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update sharing."); }
    finally { setBusyId(null); }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="modal-heading"><div><p className="eyebrow">DOCUMENT ACCESS</p><h2 id="share-title">Share “{document.title}”</h2></div><button className="icon-button" aria-label="Close sharing" onClick={onClose}>×</button></div>
      <p className="modal-description">Give another demo user editor access to the document body.</p>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {!shares && !error && <p className="loading">Loading access…</p>}
      {shares && <div className="share-list">{DEMO_USERS.filter((user) => user.id !== userId).map((user) => {
        const hasAccess = shares.some((share) => share.user_id === user.id);
        return <div className="share-row" key={user.id}><span className="avatar">{user.name.split(" ").map((part) => part[0]).join("")}</span><div className="share-person"><strong>{user.name}</strong><small>{user.email}</small></div><button className="button button-small" disabled={busyId === user.id} onClick={() => void toggle(user.id, hasAccess)}>{busyId === user.id ? "Working…" : hasAccess ? "Revoke" : "Share as editor"}</button></div>;
      })}</div>}
    </section>
  </div>;
}

export function DocumentPage({ id }: { id: string }) {
  const router = useRouter();
  const { userId, ready, registerPendingSave } = useIdentity();
  const [document, setDocument] = useState<AppDocument | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [renameError, setRenameError] = useState("");
  const [sharing, setSharing] = useState(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);

  const registerSave = useCallback((save: (() => Promise<void>) | null) => { saveRef.current = save; registerPendingSave(save); }, [registerPendingSave]);
  const onSaved = useCallback((updated: AppDocument) => { setDocument((previous) => previous ? { ...previous, updated_at: updated.updated_at } : previous); }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    api<{ document: AppDocument }>(`/api/documents/${id}`, userId).then((result) => {
      if (active) { setDocument(result.document); setTitle(result.document.title); setError(""); }
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not open document."); });
    return () => { active = false; };
  }, [id, userId]);

  async function navigateHome() {
    try { await saveRef.current?.(); router.push("/"); }
    catch { setError("Could not save changes. Please retry before leaving."); }
  }

  async function rename() {
    if (!document || document.role !== "owner" || title === document.title) return;
    setRenameError("");
    try {
      const result = await api<{ document: AppDocument }>(`/api/documents/${id}`, userId!, { method: "PATCH", body: JSON.stringify({ title }) });
      setDocument((previous) => previous ? { ...previous, title: result.document.title } : previous);
      setTitle(result.document.title);
    } catch (cause) { setRenameError(cause instanceof Error ? cause.message : "Could not rename document."); }
  }

  if (!ready || (!document && !error)) return <main className="container"><p className="loading">Loading document…</p></main>;
  if (error && !document) return <main className="container"><div className="notice notice-error" role="alert">{error}</div><Link href="/" className="button button-secondary">Back to dashboard</Link></main>;
  if (!document || !userId) return null;
  return <main className="document-page">
    <div className="document-header container">
      <button className="back-button" onClick={() => void navigateHome()} aria-label="Back to dashboard">←</button>
      <div className="title-group">
        {document.role === "owner" ? <input aria-label="Document title" className="title-input" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} onBlur={() => void rename()} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /> : <h1 className="shared-title">{document.title}</h1>}
        <div className="document-subline"><span className="role-pill">{document.role === "owner" ? "Owner" : "Shared editor"}</span><span>·</span><span>{document.role === "owner" ? "You can edit and manage access" : "You can edit this document"}</span></div>
        {renameError && <span className="field-error" role="alert">{renameError}</span>}
      </div>
      <button className="button button-secondary share-button" onClick={() => setSharing(true)} disabled={document.role !== "owner"}>{document.role === "owner" ? "Share" : "View access: editor"}</button>
    </div>
    {error && <div className="container notice notice-error" role="alert">{error}</div>}
    <Editor key={`${id}-${userId}`} document={document} userId={userId} onSaveReady={registerSave} onSaved={onSaved} />
    {sharing && document.role === "owner" && <SharePanel document={document} userId={userId} onClose={() => setSharing(false)} />}
  </main>;
}
