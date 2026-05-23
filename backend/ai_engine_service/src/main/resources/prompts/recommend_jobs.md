# Task: Recommend Best-Matching Jobs for Candidate

Rank the provided active jobs by how well they match the candidate's CV and return the
top matches with explanation.

---

## Candidate CV

{{CV_TEXT}}

---

## Available Active Jobs (JSON array)

{{JOBS_JSON}}

---

## Instructions

1. Read the candidate's CV and extract their skill set, experience level, domain expertise,
   and any stated preferences (location, job type, seniority).

2. For each job in the list, evaluate fit across three dimensions:
   - **Skill alignment** (50% weight): how many of the job's required skills does the
     candidate have?
   - **Experience alignment** (30% weight): does the candidate's seniority match the role?
   - **Domain alignment** (20% weight): is the company's industry / role domain related to
     the candidate's background?

3. Calculate a `matchScore` (0–100) for each job using the weighted dimensions above.

4. Rank all jobs by `matchScore` descending.

5. Return only the top-K results (the caller specifies K in the prompt suffix).

6. For each returned job:
   - `jobId`: copy verbatim from the input JSON — NEVER invent an ID.
   - `title`: copy verbatim from the input JSON.
   - `company`: copy verbatim from the input JSON.
   - `matchScore`: 0–100.
   - `matchReason`: 1–2 sentences explaining WHY this job fits the candidate specifically.
     Reference actual skills or experience from their CV. Do not use generic phrases like
     "your skills match well".
   - `alignedSkills`: list of specific skills the candidate has that this job requires.
     Use terms that appear in the candidate's CV (not the JD). 3–7 items.

**Critical constraint**: only use `jobId` values that exist verbatim in `{{JOBS_JSON}}`.
Do not fabricate job IDs, titles, or company names.

Return ONLY the JSON object matching the format specification below.
