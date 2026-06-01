---
name: issue-new
description: File a new issue through investigation, clarification, and structured issue documentation under docs/issues/ for this repository.
metadata:
  short-description: Investigate and create a high-quality issue file (project-local)
---

# Issue New Workflow (Project-local)

Create a new issue file for the user's request.

This local skill may only create/edit issue files under `docs/issues/`.

## Step 1: Deep Investigation

- Check existing issue files in `docs/issues/` (including `docs/issues/✅/`) for duplicates/related context.
- Investigate related code paths with `rg`:
  - `apps/web-candidate/`
  - `apps/web-recruiter/`
  - `apps/web-admin/`
- Validate behavior with code, not only documentation.

## Step 2: Clarify With User

Confirm when unclear:
- Problem statement
- Reproduction conditions
- Expected behavior

If ambiguity remains, present concrete examples and ask for confirmation.

## Step 3: Create Issue File

Create: `docs/issues/YYYYMMDD_[summary].md`

Template:

```markdown
# [Title]

## Overview
[Description of the problem]

## Reproduction steps
1.
2.
3.

## Expected behavior
[How it should be]

## Current behavior
[How it actually behaves]

## Impact scope
- [ ] Backend
- [ ] Frontend
- [ ] Database
- [ ] E2E

## Related code
[Files / functions identified during investigation]

## Notes
[Related issues, decisions, or references]
```

## Step 4: Review and Confirm

- Share draft with user.
- Apply requested revisions.
- Re-check internal consistency after each revision.

