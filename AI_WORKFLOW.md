# AI workflow

OpenAI Codex / ChatGPT assisted with project scaffolding, route-handler boilerplate, validation, authorization tests, code review, and documentation. I used it as a coding partner and checked generated code against the assignment's narrow reviewer loop.

I kept the architecture to one Next.js app and three database tables. Production auth and CRDT/WebSocket collaboration were rejected as outside the timebox. The UI was shaped around visible demo identity, Owned/Shared sections, and save status so the flow is easy to evaluate. Server authorization was checked independently from client controls.

Verification completed: `npm run test` passed (3 tests), `npm run lint` passed, and `npm run build` passed, including TypeScript. The Supabase migration was applied, and a real local API smoke test covered owner creation, read, rename, edit and share; shared-editor read and edit; 403 for editor rename and share; and 403 for an unrelated user. The same authorization flow passed against the Vercel production API. A visual browser walkthrough has not yet been completed and should happen before recording the video.
