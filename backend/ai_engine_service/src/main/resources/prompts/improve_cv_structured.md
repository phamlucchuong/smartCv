# Task: Generate Structured CV Improvement Suggestions

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

### 1. `strengths` (array of objects)
What the candidate already does well relative to this job. Be specific — name skills,
experiences, or achievements from the CV that are directly relevant. 3–5 items.
Each item: `{ "area": "category name", "detail": "specific observation from CV" }`

### 2. `weaknesses` (array of objects)
Gaps between the CV and the job requirements. Name the specific missing skill or thin area.
Do not repeat items from `strengths`. 2–5 items. Honest — do not sugarcoat.
Each item: `{ "area": "category name", "detail": "specific gap" }`

### 3. `tips` (array of ImprovementTip objects)
Ordered from highest to lowest impact. Each tip:
- `area`: one of "Skills", "Experience", "Keywords", "Format", "Projects", "Education", "Certifications".
- `suggestion`: specific, actionable advice (1-3 sentences).
- `priority`: "High", "Medium", or "Low".

Return ONLY the JSON object below. No markdown. No explanation.

```json
{
  "strengths": [{ "area": "...", "detail": "..." }],
  "weaknesses": [{ "area": "...", "detail": "..." }],
  "tips": [{ "area": "...", "suggestion": "...", "priority": "High" }]
}
```
