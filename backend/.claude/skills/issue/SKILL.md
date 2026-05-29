---
name: issue
description: Start an issue and drive it end-to-end through investigation → planning → TDD implementation → close-out
argument-hint: <start|close> [issue-filename]
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, Agent
---

# Issue Workflow

Operation: $0

## When $0 = "start"

### Phase 1: Investigation

1. **Read the issue**: read `plans/issues/$1` and understand its contents
2. **Evaluate existing context**: judge whether the current conversation context already contains enough investigation results (e.g. when `/issue-new` was run earlier in the same session). If sufficient, skip additional investigation and proceed to Phase 2
3. **If anything is missing, do supplementary investigation**:
   - Check existing knowledge: review `plans/EN/` for related architecture decisions and known issues
   - Identify related code: use Glob/Grep to identify the files impacted based on the issue
     - API Gateway: `api-gateway/src/`
     - User Service: `user-service/src/`
     - Job Service: `job_service/src/`
     - Application Service: `application_service/src/`
     - AI Engine Service: `ai_engine_service/src/`
     - Notification Service (Go): `notification-service/`
     - Tests: `<service>/src/test/` (Java), `notification-service/**/*_test.go` (Go)

### Phase 2: Requirements confirmation (clarifying questions back to the user)

Based on the investigation, report the following and **if anything is unclear, ask via AskUserQuestion**:
- **Summary of the problem**: 1-2 sentences
- **Impact scope**: list of related files
- **Hypothesis for the cause**: current best guess
- **Candidate approaches**: 2-3 options (with pros and cons)

If any of the following apply, **always ask before moving on**:
- The issue's wording is ambiguous and there are multiple interpretations of what to fix
- The impact scope is large and a decision is needed on how far to go
- The intent of the existing spec or business logic is unclear
- The change could be breaking

**Obtain the user's approval** before moving to the next Phase.

### Phase 3: Create the branch

```bash
git checkout dev && git pull && git checkout -b fix/[issue-name]
```

### Phase 4: TDD implementation

Repeat the following cycle. **Do not write code before writing the test.**

**Red (write the test)**
1. Write a failing test first
2. Run the tests and **confirm they fail** (do not skip)
   - Java service: `cd <service-dir> && ./mvnw test -Dtest=<TargetTest> -pl .`
   - Go (notification): `cd notification-service && go test ./... -v -run <TestName>`

**Green (minimal implementation)**
3. Implement the **minimum** code needed to make the test pass (no extra features)
4. Run the tests and **confirm they pass**

**Refactor (do this proactively)**
5. Refactor the changed code and its surroundings from the following angles:
   - Extract / consolidate duplicate code
   - Simplify conditional branches
   - Improve naming (variables, functions, parameters)
   - Remove unnecessary or dead code
   - Split functions (when one function is too long)
6. After refactoring, **re-confirm that all tests pass**

**Verify (quality check)**
8. If you changed a Java service:
   - `cd <service-dir> && ./mvnw test`
   - `cd <service-dir> && ./mvnw clean install -DskipTests` (confirm it compiles clean)
9. If you changed notification-service (Go):
   - `cd notification-service && go build ./cmd/server`
   - `cd notification-service && go test ./... -v`
10. **Do not move on until every error is resolved.**

**Review (code review)**
11. Invoke the code-reviewer agent to review the changes
12. If there are findings, address them and loop back from Verify

### Phase 5: API smoke test (when there are endpoint changes)

Verify the changed endpoint is reachable end-to-end:
1. Start infrastructure: `docker compose up -d`
2. Run the affected service locally (e.g. `make run-user`)
3. Use the Postman collection in `postman/` or curl to hit the endpoint
4. Confirm the response matches the expected behavior described in the issue

---

## When $0 = "close"

Perform issue close-out.

### Step 1: Learning feedback (required)

Before committing, report the following (kept friendly enough for beginners to follow):
1. **What was changed**: what changed and how (file names and key points)
2. **Code walkthrough**: quote the changed code and explain it at the syntax/grammar level
   - Explain "what this line does" line by line
   - The meaning and role of the language features used (decorators, list comprehensions, async/await, JSX syntax, etc.)
   - Why that style was chosen (readability, performance, convention, etc.)
3. **Rationale**: why this approach was chosen, compared with the alternatives
4. **Patterns to learn**: design principles or pattern names involved (e.g. Single Responsibility Principle, the N+1 problem, etc.)
5. **Pitfalls**: things that are easy to get wrong
6. **Tips for the next instruction**: advice so that the user can give more precise instructions next time
   - What worked well in this instruction
   - How they could phrase it to make things smoother
   - The first thing a senior engineer would check for this kind of problem

### Step 2: Decide on knowledge promotion

For the knowledge gained this time, use AskUserQuestion to decide:
- **Recurring pitfall** → add one line to the Important section of `CLAUDE.md`
- **Architecture / tool / service decisions** → add to `plans/EN/` under the relevant topic file
- **No promotion needed** → skip

### Step 3: Design decision log

If any of the following apply, append to `plans/EN/architecture-decisions.md` (create it if it doesn't exist):
- A library/tool/service was selected
- The existing architecture or policy was changed
- A choice was made after considering multiple options
- A decision was made that a future-you might wonder "why is it like this?" about

If none apply, skip.

```markdown
## YYYY/MM/DD: [the decision]
- **Background**: why this decision was needed
- **Rejected options**: the alternatives considered and why they were rejected
- **Decision**: what was chosen
- **Impact**: the impact of this decision
```

### Step 4: Update the plan (if applicable)

If this issue was tracked in a plan file under `plans/`, update the relevant task status in that file to reflect completion.

### Step 5: Move the issue file

```bash
mv "plans/issues/$1" "plans/issues/✅/✅$1"
```

### Step 6: Commit & open PR into dev

Bundle the doc changes and the issue move from Steps 2–5 into a single commit, then open a PR:

```bash
git add -A && git commit -m "docs: [issue name] close-out"
gh pr create --base dev --title "fix: [issue name]" --body "..."
```

Ask the user before pushing or creating the PR.

### Step 7: Completion check

Report the results of every step.
