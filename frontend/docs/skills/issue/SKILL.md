---
name: issue
description: Start or close an issue with investigation, confirmation, implementation discipline, and close-out documentation for this repository.
metadata:
  short-description: Run issue start/close workflow end-to-end (project-local)
---

# Issue Workflow (Project-local)

Operation: `start` or `close`.

This local skill is scoped to this repository and must follow `AGENTS.md`.

## When operation is `start`

### Phase 1: Investigation

1. Read issue file in `docs/issues/<issue-file>`.
2. Reuse current session context if sufficient.
3. If missing context, investigate code with `rg`:
   - `apps/web-candidate/`
   - `apps/web-recruiter/`
   - `apps/web-admin/`

### Phase 2: Requirement Confirmation

Report to user:
- Problem summary (1-2 sentences)
- Impact scope (related files)
- Cause hypothesis
- Candidate approaches (2-3 options with pros/cons)

Ask for confirmation before implementation when scope/intent is ambiguous or potentially breaking.

### Phase 3: Branching

Use feature/fix branch from `develop`:

```bash
git checkout develop && git pull && git checkout -b fix/[issue-name]
```

### Phase 4: Implementation and Verification

1. Implement minimal changes.
2. Keep consistency with monorepo conventions.
3. Run lint/build for affected apps.
4. Refactor opportunistically if safe.
5. Manually verify UI changes when needed.

Note:
- `start` does **not** move issue files to done folder.
- Issue move/mark done happens only in `close`.

## When operation is `close`

Use this when implementation is complete and accepted.

### Step 1: Decision Log

Append decision note:

```markdown
## YYYY/MM/DD: [decision]
- **Background**:
- **Rejected options**:
- **Decision**:
- **Impact**:
```

### Step 2: Update Completion Notes

If repository has tracking/overview docs, add completion entry in existing format.

### Step 3: Move Issue File (Required)

Must move and mark completed:

```bash
mv "docs/issues/<issue-file>" "docs/issues/✅/✅<issue-file>"
```

### Step 4: Commit/Merge

Commit close-out docs + moved file together using Conventional Commits, then proceed with project merge flow.

### Step 5: Completion Report

Report completed work, validation status, and follow-up actions.

