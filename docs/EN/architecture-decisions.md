# Architecture Decisions

## 2026/06/18: Two-axis job state machine (moderationStatus × visibilityStatus)

- **Background**: The original job entity had a single `status` field (`DRAFT | ACTIVE | CLOSED | EXPIRED`). This conflated two independent concerns: whether a job has passed admin moderation, and whether it is currently visible to candidates. Recruiters needed to be able to temporarily hide a published job without un-publishing it.

- **Rejected options**:
  - Flat enum with all state combinations (e.g. `DRAFT_INACTIVE`, `PENDING_INACTIVE`, `PUBLISHED_ACTIVE`, …): combinatorial explosion, hard to add new transitions without touching every consumer.
  - Single `moderationStatus` only: cannot represent a recruiter-paused published job without re-entering the moderation queue.

- **Decision**: Replace `status` with two independent enums:
  - `moderationStatus`: `DRAFT | PENDING | PUBLISHED` — controls admin review lifecycle.
  - `visibilityStatus`: `INACTIVE | ACTIVE | EXPIRED` — controls candidate-facing visibility.
  - Candidate/public APIs filter on `moderationStatus = PUBLISHED AND visibilityStatus = ACTIVE`.
  - Admin rejection returns the job to `DRAFT` (no separate `REJECTED` state) with a `moderationNote`. Resubmit clears the note.

- **Impact**: `job_service` Job entity, JobService state transitions, JobController endpoints, Elasticsearch indexing (ES index only on `PUBLISHED + ACTIVE`), and all frontend job list/edit/admin views updated. Existing `status` field removed from the entity.

---

## 2026/06/18: Hand-written hooks for new PATCH endpoints in packages/api

- **Background**: Orval generates React Query hooks from the OpenAPI spec. New transition endpoints (`/submit`, `/withdraw`, `/approve`, `/reject`, etc.) were added to `job_service` but the swagger was not regenerated, so Orval didn't know about them.

- **Rejected options**:
  - Regenerate swagger and run `pnpm generate:api` every time a backend endpoint is added: requires the backend to be running locally during frontend development.
  - Inline the API calls in each component: duplicates HTTP logic and loses the TanStack Query caching/invalidation benefit.

- **Decision**: Hand-write hooks in `packages/api/src/job-moderation-hooks.ts` using the same `customInstance` as Orval-generated code. A `createIdMutationHook` factory reduces boilerplate for the common `PATCH /{id}` pattern. Export from `packages/api/src/index.ts`.

- **Impact**: Pattern is established for future endpoints that can't wait for a swagger regeneration cycle. Generated files remain authoritative for documented endpoints; `*-hooks.ts` files are the extension point.
