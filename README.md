# Ajaia Docs

Ajaia Docs is a focused document editor demo. Three seeded identities make it quick to review the complete loop: create, format, autosave, share, switch users, edit as a collaborator, and reopen the persisted result. The scope favors a reliable product slice over a Google Docs clone.

## Features

- Tiptap rich text: H1, H2, bold, italic, underline, bullet and numbered lists, undo and redo.
- Debounced autosave (700 ms), save on editor blur, and visible Saved / Saving… / Save failed status.
- Owned by you and Shared with you dashboard sections, document rename, editor sharing and revocation.
- Plain text `.txt` import (1 MB maximum) into a normal editable document.
- Server authorization for every protected route. Owner can manage title and access; shared editors can change content only.

## Stack and architecture

Next.js App Router, React, TypeScript, Tiptap, Supabase Postgres, Zod, Vitest, and plain CSS. Browser requests include an `x-demo-user` header. Route handlers validate the identity against seeded users, check document permission, validate mutation bodies, and access Supabase with a server-only secret key. Documents store Tiptap JSON in Postgres `jsonb`; no filesystem persistence is used. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Demo users

| Name | Email |
| --- | --- |
| Mira Shah | mira@ajaia.demo |
| Alex Chen | alex@ajaia.demo |
| Jordan Lee | jordan@ajaia.demo |

The navbar explicitly says **Demo identity**. This is mocked identity, not secure authentication: anyone can spoof the header. Production would use signed sessions or Supabase Auth and RLS policies tied to authenticated user IDs.

## Local setup

1. Create a Supabase project.
2. Apply the database schema. Either run `supabase/schema.sql` in the project's SQL Editor, or use the identical migration in `supabase/migrations/` with `npx supabase@latest link --project-ref <PROJECT_REF>`, `npx supabase@latest db push --dry-run`, then `npx supabase@latest db push`. Choose one setup path for a fresh project.
3. Copy `.env.example` to `.env.local` and set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from the Supabase project dashboard. Use the server secret/service-role key; never prefix it with `NEXT_PUBLIC_` or commit it.
4. Run `npm install` and `npm run dev`.
5. Open `http://localhost:3000`.

Commands: `npm run dev` starts local development, `npm run test` runs policy tests, `npm run lint` checks lint, and `npm run build` creates the production build. `npm run start` serves that build.

Missing database credentials produce a useful API error in the UI. The production build does not need to contact Supabase.

## Reviewer walkthrough

Select Mira Shah. Create a document and rename it **Launch Plan**. Add headings, bold text and bullets; wait for **Saved**, then refresh. Share with Alex Chen. Switch the demo identity to Alex, find the document in **Shared with you**, add “Reviewed by Alex.”, and note that Alex cannot rename or manage sharing. Switch back to Mira and confirm the edit. Return to the dashboard and import `demo-import.txt`.

For the exact 3–5 minute narration, see [WALKTHROUGH_SCRIPT.md](WALKTHROUGH_SCRIPT.md).

## Data model and API

`app_users(id, name, email)`, `documents(id, title, content, owner_id, created_at, updated_at)`, and `document_shares(id, document_id, user_id, permission)`. Shares are unique by `(document_id, user_id)` and support `editor` permission. Useful owner, user, and document indexes are in the schema.

| Route | Purpose |
| --- | --- |
| `GET /api/users` | List demo identities |
| `GET, POST /api/documents` | List accessible documents; create one |
| `GET, PATCH /api/documents/[id]` | Read, rename, or update content |
| `GET, POST /api/documents/[id]/shares` | Owner lists or grants access |
| `DELETE /api/documents/[id]/shares/[userId]` | Owner revokes access |

Protected routes use `x-demo-user`. Unrelated users receive 403 and missing documents receive 404. Mutation bodies are validated with Zod.

## Import restrictions and limitations

Only `.txt` files up to 1 MB are accepted. Text is read in the browser and converted into paragraphs of Tiptap JSON. DOCX, Markdown, and arbitrary uploaded HTML are unsupported. Simultaneous editing uses last-write-wins persistence, so concurrent writers can overwrite each other. There is no real-time presence, comments, suggestions, version history, or production authentication.

## Deployment to Vercel

The source is backed up in a private GitHub repository and a Vercel project is linked. Create or select a suitable Supabase project and apply the schema first. In Vercel Project Settings → Environment Variables, add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` for Production (and Preview if needed). Deploy, open the live URL, and run the reviewer walkthrough against the deployed app. Do not expose the secret through public env variables. The application has not yet been deployed or database-smoke-tested.

## Another 2–4 hours

I would add route-level integration tests with a disposable database, improve navigation handling for failed pending saves, and add conflict detection using document versions. For true simultaneous editing, I would first define write-conflict behavior, then evaluate a CRDT system such as Yjs/Hocuspocus.
