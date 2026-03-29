# FEATURE DESIGN DOCUMENT - SMARTCV

This document bridges the gap between System logic and UI/UX flows covering core feature deployments within SmartCV.

## 1. Feature 1: Core AI Scorer (AI Screener & Skill Gap)
**Description:** The centerpiece feature asserting "SmartCV" superiority over traditional Job portals.
### UI/UX Components:
*   **Upload Widget:** Drag-n-drop CV File zone (supporting .pdf, .docx). Visual progress bar loading. Warning text: 10MB limit.
*   **Result Modal/Page:** After Candidate Apply action, `PENDING_REVIEW` status populates a radar chart loading graphic.
*   Upon Result formulation:
    *   **Score Badge:** A circular matching % encompassing 3 colors (Red < 50, Yellow 50-69, Green >70).
    *   **Skill Gap Card:** Two-column visual layout. Col 1: "Employer required skills". Col 2: "Your Experience". Highlights missing elements in Red.
    *   **Recommender Button:** A direct Call-To-Action titled "Find Better Fitting Jobs" (Only appears if Score triggers Red).
### Tech Pipeline:
*   Frontend polls (restrikes API) every 3 seconds or locks onto a Golang WebSocket to listen for the `cv_processed` message.
*   Spring AI packages a Prompt "Act as a recruitment expert... analyze... return JSON" dispatched to the Llama 3 API.

## 2. Feature 2: Drag-and-Drop Recruitment Management (Kanban ATS)
**Description:** A massive upgrade from a mundane Admin Table; offering Employers an interactive workflow management tool for hiring campaigns.
### UI/UX Components:
*   **Board View (Kanban):** Columns represent standard workflows: **Qualified** -> **Under Review** -> **Interview Scheduled** -> **Offer Sent** -> **Accepted** (or terminal **Rejected**).
*   **Drag and Drop Library:** Engages the `dnd-kit` or `react-beautiful-dnd` React library validating hold-press and Candidate card drops into new columns.
*   **Candidate Card:** Displays Name, short Candidate Avatar, Automated AI Score badged top right.
*   **Action Drawer:** Double-clicking an Applicant Card slides a Drawer pane across the screen exposing an integrated embedded CV PDF alongside an HR Note (Comments) tab.
### Tech Pipeline:
*   Alters `Application Status` on an OnChange listener. Gateway secures the endpoint mandating HR/Employer Roles exclusively.
*   Simultaneously triggers the `Mail notification queue` to update the candidate.

## 3. Feature 3: Job Package Payment Transactions (Payment Package)
**Description:** The monetization gateway of the thesis system project.
### UI/UX Components:
*   **Pricing Page:** Exploiting a `Shadcn UI` 3-column layout (Basic, Pro, Enterprise) highlighting the middle block as the favored deal.
*   **Checkout Logic:** Modal cart review. Finalizes Payment via QRCode / Test Mock Payment processing.
*   **Billing Dashboard:** `TanStack Table` revealing historical Transaction Logs (Order Code, Date, Current Job Post Limit, Status: Completed/Failed).
### Tech Pipeline:
*   Pings Backend to generate an Order_Id. If executing Mock Payments, simulates an IPN webhook success API hit post 3 seconds.
*   The MongoDB database fires a **Multi-document Transaction API** committing the Job limit quotas purely isolated per employer account to bypass concurrency failures.

## 4. Feature 4: Generation - Mock Interviews AI
**Description:** Employers struggle creating nuanced questions. The AI steps in acting as a Master Mentor.
### UI/UX Components:
*   A magical button (Magic Button) sporting a star icon hovering beside the Online Application UI Modal: "AI Suggestion for Interviewing".
*   Clicking -> Fires a beautiful Loading Skeleton widget.
*   Unspools a List Array arraying 5 Text questions conceived via Spring AI.
### Tech Pipeline:
*   Prompts append entirely raw Extracted Text from the Candidate CV paired with the Job Title.
*   The AI auto-reply relies on the `Marked` markdown parser transforming raw responses into pure, polished React HTML renders live onscreen.

---
*Version: 1.0 - Last Updated: 2026-03*
