# MINIMUM VIABLE PRODUCT (MVP) - SMARTCV

Given the constraints of a graduation thesis, to prevent unmanageable scope creep, the project will compartmentalize tasks with extremely high priority (P0) "Must-have" features for the MVP system design prior to the thesis defense.

## 1. For Candidates
* **Authentication:** Sign Up / Sign In via Email, Phone, and Password. OTP verification is mandatory.
* **Profile Management:** Upload 1 CV in PDF format under 5MB. Perform simple character parsing using a PDF-to-Text library.
* **Job Search:** Elasticsearch keyword search on Job descriptions and titles.
* **Core Apply (AI Apply):** Utilize Spring AI to call the Llama 3 API for simulating analysis and matching of CV Text with Job Text. Generate a score (%) and a bulleted list of missing skills.
* **View Application History:** History detailing CV status (Pending, Qualified, Rejected).
* **Receive Notifications:** Receive email/real-time messages governed by the Golang Notification Service.

## 2. For Employers
* **Post Jobs:** Allow creation of job postings including Title, Description text, Location, and Salary. Publish and label as public.
* **Minimalist ATS (Candidate Management):** View the list of applicants for each Job. Display the AI-generated Screening scores. Provide the ability to change Candidate Status (minimalist Kanban drag-drop or Status toggle buttons).
* **Basic Package Payment:** Process purchases for VIP packages (integrating fake mock payment or real gateways like VNPAY/PayOS) and store invoices via MongoDB Multi-doc transaction.
* **Interview Question Suggestions:** Integrate an "AI Assist" button on the candidate detail page to auto-generate 3-5 interview questions based on the candidate's CV.

## 3. For System / Backend
* **Architecture:** Implement all designed Microservices (AppService, UserService, JobService, CVReview, Golang Notification, API Gateway).
* **Worker & Queue:** Transmit emails / generate CV evaluations via RabbitMQ (Mandatory).
* **Deployment:** Deployable via Docker-compose with all containers hosted on an AWS EC2 instance.

## 4. Post-MVP Features (Nice-to-have)
The features below yield high grading points but will be trimmed if tight deadlines present a risk:
* Assessment System (Taking multiple-choice evaluation tests prior to interviews).
* Job Alternative Suggester for candidates failing the AI auto-screener.
* OAuth2 Social Login via X/Google/Facebook (Moderately complex due to security microservice segregation).
* Detailed corporate profile configurations (precise birthdays, intricate avatars, etc.).

---
*Version: 1.0 - Date: 2026-03*
