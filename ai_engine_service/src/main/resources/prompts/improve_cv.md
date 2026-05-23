# Task: Generate CV Improvement Suggestions

Provide concrete, prioritized advice to help the candidate improve their CV specifically
for the target job.

---

## Job Details

**Title:** {{JOB_TITLE}}

**Job Description:**
{{JOB_DESCRIPTION}}

**Required Skills:**
{{JOB_SKILLS}}

**Requirements:**
- {{JOB_REQUIREMENTS}}

---

## Candidate CV

{{CV_TEXT}}

---

## Instructions

Produce three sections:

### 1. `strengths` (list of strings)
What the candidate already does well relative to this job. Be specific — name skills,
experiences, or achievements from the CV that are directly relevant. 3–5 items.

### 2. `weaknesses` (list of strings)
Gaps between the CV and the job requirements. Name the specific missing skill or thin area.
Do not repeat items from `strengths`. 2–5 items. Honest — do not sugarcoat.

### 3. `tips` (list of ImprovementTip objects)
Ordered from highest to lowest impact. Each tip has:
- `area`: one of `"Skills"`, `"Experience"`, `"Keywords"`, `"Format"`, `"Projects"`,
  `"Education"`, `"Certifications"`.
- `suggestion`: specific, actionable advice (1–3 sentences). Name exact tools, courses,
  certifications, or actions. Use phrases like "Add…", "Rename… to…", "Include a
  bullet point that quantifies…", "Obtain the [Name] certification".
- `priority`: `"High"` (must fix to be competitive), `"Medium"` (would significantly help),
  or `"Low"` (nice-to-have polish).

**Quality bar for tips:**
- Each tip must address a different `area` (no duplicate areas unless genuinely needed).
- Minimum 3 tips, maximum 7.
- At least one `"High"` priority tip if there are any meaningful gaps.
- At least one `"Keywords"` tip if the CV is missing terminology that appears in the JD.

Return ONLY the JSON object matching the format specification below.
