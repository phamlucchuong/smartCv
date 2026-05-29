---
name: issue
description: Run issue workflow end-to-end for this repository: investigate, align scope with user, implement with TDD, verify, and close issue docs/branch/PR safely.
---

# Issue Skill

Use this skill when the user asks to start or close an issue workflow, typically from `docs/issues/<file>`.

## Invocation

- `start <issue-filename>`
- `close <issue-filename>`

If the user does not provide operation or filename, ask a concise follow-up question.

## Operation: `start`

### 1. Investigation

1. Read `docs/issues/<issue-filename>`.
2. Reuse existing conversation context if already sufficient.
3. If missing context, investigate:
- Read related docs in `docs/EN/`.
- Locate impacted code via `rg`/`rg --files`.
- Service roots:
  - `api-gateway/src/`
  - `user-service/src/`
  - `job_service/src/`
  - `application_service/src/`
  - `ai_engine_service/src/`
  - `notification-service/`
- Test roots:
  - Java: `<service>/src/test/`
  - Go: `notification-service/**/*_test.go`

### 2. Confirm requirements with user before coding

Report briefly:
- Problem summary (1-2 sentences)
- Impacted files
- Root-cause hypothesis
- 2-3 implementation options with trade-offs

Ask user for approval before implementing when scope/intent is ambiguous, broad, potentially breaking, or business rules are unclear.

### 3. Branch setup

Run non-interactive git commands:

```bash
git checkout dev
git pull
git checkout -b fix/<issue-name>
```

If working tree has unexpected changes unrelated to your work, stop and ask user how to proceed.

### 4. TDD implementation loop

Follow Red -> Green -> Refactor -> Verify.

Red:
1. Write a failing test first.
2. Run test and confirm failure.

Green:
3. Implement minimum code to pass.
4. Re-run and confirm pass.

Refactor:
5. Clean duplication/branches/naming/function size/dead code.
6. Re-run tests.

Verify:
7. Java service changed:
```bash
cd <service-dir> && ./mvnw test
cd <service-dir> && ./mvnw clean install -DskipTests
```
8. Go service changed:
```bash
cd notification-service && go build ./cmd/server
cd notification-service && go test ./... -v
```
9. Do not continue until verification is clean.

### 5. API smoke test (if endpoint behavior changed)

1. Start infra: `docker compose up -d`
2. Run target service (for example `make run-user`)
3. Hit endpoint via Postman collection or `curl`
4. Confirm behavior matches issue expectation

## Operation: `close`

### 1. Learning feedback (required)

Before commit, provide to user:
1. What changed (files + key points)
2. Code walkthrough at syntax level (line-by-line intent for key changed sections)
3. Why this approach vs alternatives
4. Patterns/principles used
5. Common pitfalls
6. Tips for writing better next instruction

### 2. Decide knowledge promotion with user

Ask user whether to promote learnings:
- Recurring pitfall -> add 1 concise line to important guidance (project-level guidance file in use)
- Architecture/tool/service decision -> add doc entry in `docs/EN/`
- No promotion -> skip

### 3. Architecture decision log

If a meaningful decision was made, append to `docs/EN/architecture-decisions.md`:

```markdown
## YYYY/MM/DD: <decision title>
- **Background**: ...
- **Rejected options**: ...
- **Decision**: ...
- **Impact**: ...
```

### 4. Plan tracking update

If issue maps to a file under `plans/`, update status in `plans/plan.md` (or relevant plan file) concisely in English.

### 5. Move issue file

```bash
mkdir -p docs/issues/✅
mv "docs/issues/<issue-filename>" "docs/issues/✅/✅<issue-filename>"
```

### 6. Commit and PR

Prepare one close-out commit including doc updates and issue move:

```bash
git add -A
git commit -m "docs: <issue-name> close-out"
```

Ask user before push or PR creation. If approved:

```bash
gh pr create --base dev --title "fix: <issue-name>" --body "..."
```

### 7. Completion report

Report result of each close step and note anything skipped with reason.

## Execution rules

- Prefer `rg`/`rg --files` for search.
- Avoid destructive git operations unless explicitly requested.
- Never revert unrelated user changes.
- Keep commands non-interactive.
- If sandbox/network restrictions block required validation, request escalation with a concise justification.
