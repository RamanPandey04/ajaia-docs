# Ajaia Docs walkthrough (about 5 minutes)

**0:00–0:30 — Product and scope.** “This is Ajaia Docs, a deliberately small collaborative editor. The demo identity selector lets a reviewer try sharing without signup. It is mocked identity, so it is not production authentication.”

**0:30–1:30 — Create and edit.** “I am Mira. I’ll create a document, name it Launch Plan, type a short plan, make the title H1 and Goals H2, bold a phrase, and turn the action items into bullets. The toolbar also has italic, underline, numbered lists, undo, and redo.”

**1:30–2:00 — Persistence.** “Changes debounce for roughly 700 milliseconds. The status changes from Saving to Saved. I’ll refresh; the content and formatting come back from Postgres.”

**2:00–3:00 — Sharing.** “As owner, I can share with Alex. Switching the demo identity to Alex shows Launch Plan under Shared with you. Alex can add ‘Reviewed by Alex.’ to the body, but cannot edit the title or manage access. Switching back to Mira shows Alex’s persisted edit.”

**3:00–3:30 — Import.** “Back on the dashboard, I’ll import demo-import.txt. This creates an ordinary document that can be edited and shared. The importer only supports plain text up to 1 MB.”

**3:30–4:10 — Architecture.** “The app is one Next.js deployment. Route handlers validate requests with Zod and check identity and document permission server-side. Tiptap JSON is stored in Supabase Postgres. The database key stays on the server.”

**4:10–4:40 — AI workflow.** “I used Codex/ChatGPT for scaffolding, repetitive API code, tests, and docs, then reviewed the authorization boundaries and simplified the design around the core reviewer journey.”

**4:40–5:00 — Tradeoffs.** “This does not do live simultaneous editing. Concurrent writes are last-write-wins. Next I would add document versions and database-backed route tests; only then would I evaluate a CRDT if real-time collaboration became necessary.”
