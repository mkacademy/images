# Image Hydration (Images viewer)

Rules for **image hydration** in the read-only images viewer: serial `take=1` fetches that fill **typed mime-only image and markdown** slots (`imageurl`) on the opened tutorial / course / quiz instructions. Distinct from main skeleton hydration.

Unlike studio, this app does **not** hydrate audio/video (no Fetch Media setting). Image hydration starts when an instructions container is open and main hydration is idle.

| Layer | Role |
| --- | --- |
| Main hydration | Hydrate dehydrated skeleton rows |
| Image hydration | After main session is idle, fetch base64 into typed mime-only `data:image/…` and `data:text/markdown` slots |

Core: `src/Hooks/useImageHydration.ts`, `src/library/imageHydrationUtils.ts`, `src/library/imageHydrationQueue.ts`, `src/library/imageHydrationCollapseUtils.ts`.

---

## What counts as dehydrated (image hydration)

`isDehydratedImage` → `imageurl` is a **typed mime-only image or markdown** URL:

- Starts with `data:image…` **with a subtype** (e.g. `data:image/jpeg`), **or** `data:text/markdown`
- Has **no** non-empty `;base64,` payload yet (`isMimeOnlyMediaUrl`)

Already-loaded base64 payloads are skipped (`isValidDataUrl` / `hasMediaBase64Payload`).

Audio / video mime-only slots are **not** queued in this repo.

### Permanent bare sentinels (not fetched)

Exact bare URLs are **terminal UI slots** — never queued (`isPermanentMediaSlotSentinel`):

| Sentinel | Typical use | UI via `resolveMediaSlotSrc` |
| --- | --- | --- |
| `data:image` | Empty / abandoned image slot | `imageMimePlaceholder` |
| `data:audio` | Display-only (not hydrated here) | `audioMimePlaceholder` |
| `data:video` | Display-only (not hydrated here) | `videoMimePlaceholder` |
| `data:text` | Empty / abandoned markdown slot | `markdownMimePlaceholder` |

---

## Empty / unusable server response (anti-loop)

When image hydration (`skipQueueLifecycle` + seek ids) gets **no usable media payload** for a seek id — missing row, or row without base64 `imageurl` — the local typed mime-only slot is **collapsed** to a permanent sentinel so it is not re-derived on the next leg:

| Current `imageurl` | Collapsed to |
| --- | --- |
| `data:image/…` | `data:image` |
| `data:text/markdown` | `data:text` |

(Other media groups map the same way if present; this viewer only queues image + markdown.)

Implementation:

1. `partitionImageHydrationRows` — only rows with `hasMediaBase64Payload(imageurl)` are enqueued into the hydration store buffer
2. `buildEmptyImageHydrationCollapseUpdates` — builds `{ id, imageurl: sentinel }` for the rest
3. Dispatch **`mediaHydration`** (not `updateSteps`)

**Important:** collapse (and successful instruction fills) set **`imageurl` without `edited` / `modified`**, so local UI state is not marked dirty for save paths.

Helpers: `toPermanentMediaSlotSentinel` in `imageUtils.ts`; partition/collapse in `imageHydrationCollapseUtils.ts`; branch in `deHydratedRowsDataFetcher`.

Successful instruction fills also go through `mediaHydration` via `applyHydrateRows` (strips server `modified` → does not set `edited`).

---

## When it runs

`useImageHydration(webapp, bannerId, enabled)` starts a session only when **all** of:

1. `enabled` — selected banner / instructions container is open
2. `bannerId > 0`
3. Current pagination route ends with `instructions` (`getInstructionsParentFromRoute` ≠ `null`)
4. Main hydration is idle: `session.hydrationQueries === 0` && `!isHydrationSessionBusy()`
5. At least one leg of queries exists (`deriveNextLeg()` non-empty)

Session key: `webapp:bannerId:route:chapters:followupId`.

### Supersede / stop

`supersedeImageHydration()` clears the queue when:

- Selection disabled or route is not an instructions route
- Session key changes (banner / route / chapters / followup)
- Hook unmounts

If a start is requested while a fetch is in flight, it is queued as `pendingRestart` and applied when the in-flight item finishes.

---

## Scope: which rows are fetched

Queries are built only for the **opened container** and the **current instructions route parent**.

### Route parent (`getInstructionsParentFromRoute`)

| Route suffix | Parent | Included queries |
| --- | --- | --- |
| `…filtersinstructions` | `filters` | filters → instructions only |
| `…siftersinstructions` | `sifters` | sifters → instructions only |
| other `…instructions` | `all` | both |

### By webapp

Same shape as studio (tutorial filters; course sifters + filters; quiz sifters + filters), but the row predicate is **image + markdown** typed mime-only slots (no audio/video).

Every built query is forced to **`take: 1`**.

---

## Execution queue

`startImageHydration` / `imageHydrationQueue.ts`:

1. Split pending queries into legs of size `settings.queryLimit`
2. After each item (and between legs), wait `hydrationDelay`
3. Each item: `deHydratedRowsDataFetcher` with `skipQueueLifecycle: true`
4. On success with base64: buffer → `applyHydrateRows` → `mediaHydration` fill
5. On empty / unusable payload: `mediaHydration` collapse to `data:image` / `data:text`
6. Per-item failure: continue the serial queue
7. After each leg, re-derive remaining typed mime-only image/markdown rows (`deriveNextLeg`)

---

## Relation to main hydration

```
main hydration session (skeleton rows)
        ↓ idle
opened instructions container
        ↓
image hydration (typed data:image/… + data:text/markdown, take=1, serial)
        ↓ empty miss → data:image / data:text (no edited)
```

---

## Key entry points

| Symbol | Role |
| --- | --- |
| `useImageHydration` | Gate + start / supersede by selection |
| `isDehydratedImage` / `isMimeOnlyMediaUrl` | Which image/markdown slots need fetch (excludes bare sentinels) |
| `isPermanentMediaSlotSentinel` / `toPermanentMediaSlotSentinel` | Terminal slots + collapse mapping |
| `partitionImageHydrationRows` / `buildEmptyImageHydrationCollapseUpdates` | Split success vs empty-miss collapse |
| `buildContainerInstructionsQueries` | Scope queries by webapp / route / chapters / followup |
| `createImageHydrationLegDeriver` | Live re-scan of remaining typed mime-only image/markdown rows |
| `startImageHydration` / `supersedeImageHydration` | Serial queue lifecycle |
| `deHydratedRowsDataFetcher` | Network fetch; buffer fills or collapse via `mediaHydration` |
| `mediaHydration` | Instruction `imageurl` fill/collapse without setting `edited` |
| `applyHydrateRows` | Maps instruction payloads to `mediaHydration` |
| `resolveMediaSlotSrc` | UI placeholder for mime-only / bare sentinel slots |
