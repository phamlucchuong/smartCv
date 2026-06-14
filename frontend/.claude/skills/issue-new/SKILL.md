---
name: issue-new
description: File a new issue through discussion
argument-hint: <summary description>
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Write, Edit, Agent
---

# File an Issue (investigate → discuss → confirm → create)

File an issue about "$ARGUMENTS".

**Important: This skill may only create or edit issue files (under `docs/issues/`). It must not edit source code, configuration files, or anything else.**

## Step 1: Deep investigation

First, thoroughly investigate the related information:
- **Check existing issues**: check `docs/issues/` for similar or related issues
- **Investigate related code**: use Glob/Grep to identify the code involved in the problem and understand the cause and impact scope
  - Frontend: under smartCv-fe/apps/web-candidate/, smartCv-fe/apps/web-recruiter/, smartCv-fe/apps/web-admin/

For existing specifications, do not conclude based on knowledge files or design-decision docs alone; always confirm with the code.

## Step 2: Hearing

After sharing the investigation results, use AskUserQuestion to clarify the following:
- **What is the problem**: a concrete description of the phenomenon/symptom
- **Reproduction conditions**: when, on which screen, and with what operation it occurs
- **Expected behavior**: how it should behave

If the user's explanation is ambiguous, confirm by citing concrete examples found during the investigation.

## Step 3: Create the issue file

Based on the hearing and investigation results, create an issue file in the format below.
File name: `docs/issues/YYYYMMDD_[summary].md`

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
[Files / functions identified during the investigation]

## Notes
[References to related past issues, knowledge, and design decisions]
```

Notes:
- Write thoroughly and in detail, eliminating ambiguity as much as possible
- Bring it to a level where it can be implemented without any hesitation

## Step 4: Confirmation

Share the plan-reviewer-verified issue file with the user, and apply any revisions they request.
If you revise it, run plan-reviewer again and then re-share with the user.
