# Porting read-only viewer from `frontend`

Source: [mkacademy/frontend](https://github.com/mkacademy/frontend) (`~/Desktop/frontend`)

Plan: `.cursor/plans/read-only_viewer_port_f7a11211.plan.md` (copy from frontend) or `frontend/.cursor/plans/read-only_viewer_port_f7a11211.plan.md`

## Workspace

Open both repos together:

```bash
open ~/Desktop/mkacademy.code-workspace
```

## Stack (target)

- Parcel + React (already in this repo)
- TypeScript (to add during port)
- Redux Toolkit + thunk; minimal custom middleware for PNC route sync
- react-router-dom
- `buffer`, `jwt-decode`, bootstrap

**Library trim (done):** Removed 18 unused files from `src/library/` (video/ffmpeg probes, media playback, tabulator ordering, banner clipboard paste, editor dispatch helpers, etc.). `src/library/` now has ~30 viewer-focused modules.

**Dead code cleanup (done):** Removed editor-only middleware (59 files), unused routes (`RequireAuth`, `ViewerHeader`), editor hooks, legacy comments tree utils, cpanel formatters, and ~30 other unused library files. Store trimmed to viewer slices; type-only slice files kept where still referenced.

**Route sync middleware (done):** `src/store/middleware/selectedRouteMatcher.ts` — ports editor `UrlDataMatcher` PNC route logic (`toggleTutorial/Course/Quiz`, `setSelected`, `setChapters`/`resetChapters`) so `pagination.selectedRoutes` tracks open/closed/chapter state like the editor.

## Phase 2 (done)

- **Thunk-only pipeline** in `src/store/thunks/`: `loadPncContent`, `unzipMessage`, `hydrateContent`, `hydrateContainer`, `applyHydration`, `applyInsertStats`
- **Route middleware** — `selectedRouteMatcher` syncs `pagination.selectedRoutes` on PNC toggle/chapter; stats/hydration/comments stay thunk-based (`applyInsertStats`, `hydrateContent`, `fetchMessageComments`)
- **Comments API**: `fetchCommsMessage` + `fetchCommentsSequence` (message types only); `useCommentsReadOnly` hook
- **Loading** dispatches `loadPncContent` (fetch → unzip → hydrate)
- **Deep-link auto-open**: `useApplyRouterSelections` + `useHydrateContainer` on read-only routes

## Implementation order

1. Scaffold: RTK store, routes (`/login`, `/`, `/convolution/tutorial|course|quiz`)
2. Auth: `authenticate` thunk, `RequireAuth`, login form
3. Port trimmed slices + bulk `fetchData`
4. Unzip + hydration thunks
5. Loading hub: param-gated fetch, dial 404, 1–3 nav links
6. Read-only PNC layouts + ArticleSelector / ChaptersSelector / FollowupsSelector
7. Read-only comments + `fetchCommentsSequence`

## Copy discipline

Copy **files listed in the plan**, not the whole `frontend` tree. Collapse middleware into thunks in `src/store/thunks/`.

**Cleanup (done):** Removed ~300 editor-only files (Tabulator, Settings, Formulator, offline formatters, 59 middleware files, etc.). Middleware trimmed to viewer pipeline only (stats, unzip, hydrate). `library/Thunks.ts` slimmed to auth + fetch + hydration. Build verified with `npm run fresh-build`.

## Local dev

```bash
npm install
npm run dev
```

Runs on http://localhost:3001 (editor in `~/Desktop/frontend` uses 3000).

API: `/api` via `.proxyrc` (gateway).

## Viewer routes (implemented)

| Route | Purpose |
|-------|---------|
| `/login` | Optional sign-in (via shortcuts icon) — no forced redirect |
| `/` | Loading hub — deep-link params trigger bulk fetch (anonymous or authenticated); no params → dial 404 |
| `/convolution/tutorial` | Read-only tutorial viewer |
| `/convolution/course` | Read-only course viewer |
| `/convolution/quiz` | Read-only quiz viewer |

Deep-link example: `/?tutorials=1&tutorial=42` → fetch → link to open tutorial with banner 42 selected.

## Key viewer files

- `src/App.tsx` — viewer shell (auth + routes)
- `src/routes/Loading.tsx` — param-gated fetch, nav links (no auto-navigate)
- `src/routes/*ReadOnly.tsx` — stripped PNC layouts
- `src/store/thunks/fetchCommentsSequence.ts` — message-type comments API
- `src/api/commsMessage.ts` — `POST /api/comms/message/comments` client
