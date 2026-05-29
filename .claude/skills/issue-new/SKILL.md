---
name: issue-new
description: File a new issue through discussion
argument-hint: <summary description>
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Write, Edit, Agent
---

# File an Issue (investigate → discuss → confirm → create)

File an issue about "$ARGUMENTS".

**Important: This skill may only create or edit issue files (under `plans/issues/`). It must not edit source code, configuration files, or anything else.**

## Step 1: Deep investigation

First, thoroughly investigate the related information:
- **Check existing issues**: check `plans/issues/` for similar or related issues
- **Investigate related code**: use Glob/Grep to identify the code involved in the problem and understand the cause and impact scope
  - API Gateway: `api-gateway/src/`
  - User Service: `user-service/src/`
  - Job Service: `job_service/src/`
  - Application Service: `application_service/src/`
  - AI Engine Service: `ai_engine_service/src/`
  - Notification Service (Go): `notification-service/`
- **Check docs**: review `plans/EN/` for related architecture decisions or known issues

For existing specifications, do not conclude based on knowledge files or design-decision docs alone; always confirm with the code.

## Step 2: Hearing

After sharing the investigation results, use AskUserQuestion to clarify the following:
- **What is the problem**: a concrete description of the phenomenon/symptom
- **Reproduction conditions**: which service, which endpoint, and what request triggers it
- **Expected behavior**: how it should behave

If the user's explanation is ambiguous, confirm by citing concrete examples found during the investigation.

## Step 3: Create the issue file

Based on the hearing and investigation results, create an issue file in the format below.
File name: `plans/issues/YYYYMMDD_HHmm_[summary].md`

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
- [ ] api-gateway
- [ ] user-service
- [ ] job_service
- [ ] application_service
- [ ] ai_engine_service
- [ ] notification-service
- [ ] Infrastructure (Docker / RabbitMQ / MongoDB / Elasticsearch)

## Related code
[Files / functions identified during the investigation]

## Notes
[References to related issues or docs]
```

Notes:
- Write thoroughly and in detail, eliminating ambiguity as much as possible
- Bring it to a level where it can be implemented without any hesitation

## Step 3.5: Verification with plan-reviewer (required)

**After creating or modifying the issue file, always invoke three plan-reviewer agents before asking the user to confirm.**
- Pass the path of the issue file to plan-reviewer, and have it verify ambiguity in the spec and consistency with the existing code
- If plan-reviewer raises any points, fix them and run plan-reviewer again (repeat until there are zero findings)
- Proceed to Step 4 only after plan-reviewer's verification is complete

## Step 4: Confirmation

Share the plan-reviewer-verified issue file with the user, and apply any revisions they request.
If you revise it, run plan-reviewer again and then re-share with the user.
