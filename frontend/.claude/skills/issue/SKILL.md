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

1. **Read the issue**: read `docs/issues/$1` and understand its contents
2. **Evaluate existing context**: judge whether the current conversation context already contains enough investigation results (e.g. when `/issue-new` was run earlier in the same session). If sufficient, skip additional investigation and proceed to Phase 2
3. **If anything is missing, do supplementary investigation**:
   - Identify related code: use Glob/Grep to identify the files impacted based on the issue
  - Frontend: under smartCv-fe/apps/web-candidate/, smartCv-fe/apps/web-recruiter/, smartCv-fe/apps/web-admin/

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
git checkout develop && git pull && git checkout -b fix/[issue-name]
```

### Phase 4: Implementation and Verification

Implement the solution step-by-step and verify it using build, lint, and visual validation.

**Step 1: Code Implementation**
1. Implement the minimal code changes needed to address the issue.
2. Ensure you follow the architecture conventions in `CLAUDE.md` (React 19, TypeScript, Tailwind v4, TanStack Router, Zustand).

**Step 2: Lint and Compilation Verification**
3. Run ESLint checks on the modified workspace app to ensure no linting errors:
   - e.g. `pnpm -F web-candidate lint`
4. Run the production build check to ensure TypeScript compile safety:
   - e.g. `pnpm -F web-candidate build`

**Step 3: Refactoring and Manual Verification**
5. Proactively refactor the code:
   - Extract / consolidate duplicate logic.
   - Simplify complex conditional statements.
   - Standardize naming conventions and styles.
6. Verify visually using the development server inside WSL (e.g., `wsl -d Ubuntu-24.04 --cd /home/chuongpl/projects/smartCv-fe npx pnpm -F web-candidate dev`).
7. **Do not move on until all linting, build, and visual issues are resolved.**

## When $0 = "close"

Perform issue close-out.

```markdown
## YYYY/MM/DD: [the decision]
- **Background**: why this decision was needed
- **Rejected options**: the alternatives considered and why they were rejected
- **Decision**: what was chosen
- **Impact**: the impact of this decision
```

### Step 4: Update the implementation status

1. **Overview.md (required)**:
   - Format: `| YYYY/MM/DD | - | ✅ **What was done**: summary |`
### Step 5: Move the issue file

```bash
mv "docs/issues/$1" "docs/issues/✅/✅$1"
```

### Step 6: Commit & merge into develop

Bundle the doc changes and the issue move from Steps 2–5 into a single commit and merge into develop:

```bash
git add -A && git commit -m "docs: [issue name] close-out"
git push origin HEAD
```

After the merge, ask the user before pushing.

### Step 7: Completion check

Report the results of every step.
