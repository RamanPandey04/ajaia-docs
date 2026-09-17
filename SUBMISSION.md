# Ajaia Docs submission

Live product: <ADD VERCEL URL>

Repository: <ADD GITHUB URL>

Walkthrough video: <ADD VIDEO URL>

Google Drive folder: <ADD DRIVE URL>

Demo users: Mira Shah (mira@ajaia.demo), Alex Chen (alex@ajaia.demo), Jordan Lee (jordan@ajaia.demo).

Supported import: `.txt` up to 1 MB.

## What works

Create, rename, rich-text edit, autosave/reopen, import text, share/revoke, switch demo identity, and edit as a shared user. Protected API routes enforce owner/editor permissions.

## Scope and limitations

Real-time collaboration, cursors, comments, suggestions, version history, DOCX, Markdown, and production auth are intentionally excluded. Demo identity is spoofable. Concurrent editing is last-write-wins.

## Next 2–4 hours

Add database-backed API tests, document version checks for conflicts, and stronger navigation handling when a pending save fails.

## Local setup

Run `supabase/schema.sql` in a Supabase project, set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local`, then run `npm install` and `npm run dev`. See README for the full reviewer flow and deployment steps.
