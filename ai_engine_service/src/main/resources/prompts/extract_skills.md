# Task: Extract Skills from CV

Parse the candidate's CV and return all skills, technologies, tools, and competencies the
candidate possesses, including explicitly listed skills and clearly implied skills from work
history or project descriptions.

---

## Candidate CV

{{CV_TEXT}}

---

## Instructions

1. Identify technical skills: programming languages, frameworks, databases, cloud platforms,
   DevOps tools, testing frameworks, APIs, protocols, and architecture practices.
2. Identify professional competencies when explicit, for example Agile, Scrum,
   Technical Leadership, and System Design.
3. Normalize synonyms to canonical names where possible:
   - ReactJS -> React, Golang -> Go, Postgres -> PostgreSQL.
4. Remove duplicates. Exclude vague terms like programming, development, coding.
5. Return only real skills found in the CV. Do not fabricate items.

Return only this JSON object:

```json
{"skills": ["<skill1>", "<skill2>"]}
```
