export type ApplicationStatus =
  | "Pending Review"
  | "Qualified"
  | "Under Review"
  | "Not Qualified"
  | "Interview Scheduled"
  | "Interviewed"
  | "Offer Sent"
  | "Accepted"
  | "Rejected";

export type JobStatus = "Draft" | "Pending Approval" | "Active" | "Closed" | "Rejected";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  salary: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  mode: "Onsite" | "Remote" | "Hybrid";
  skills: string[];
  postedDays: number;
  matchScore?: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  assessmentRequired?: boolean;
  experience: string;
  status?: JobStatus;
  applicants?: number;
  qualified?: number;
}

export const COMPANIES = [
  "AIP Technology",
  "FPT Software",
  "VNG Corporation",
  "Tiki",
  "MoMo",
  "Techcombank",
  "VNPay",
];

export const JOBS: Job[] = [
  {
    id: "j1",
    title: "Backend Java Developer",
    company: "FPT Software",
    location: "Ho Chi Minh City",
    salary: "25 – 40M VND",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["Java", "Spring Boot", "REST API", "MySQL", "Docker"],
    postedDays: 2,
    matchScore: 76,
    experience: "3-5 years",
    description:
      "Tham gia phát triển hệ thống backend quy mô lớn phục vụ hàng triệu người dùng. Làm việc trong môi trường Agile cùng đội ngũ senior.",
    responsibilities: [
      "Thiết kế và phát triển REST API với Spring Boot",
      "Tối ưu hóa hiệu năng truy vấn cơ sở dữ liệu MySQL",
      "Triển khai dịch vụ bằng Docker, CI/CD",
      "Review code, mentoring junior developer",
    ],
    requirements: [
      "Ít nhất 3 năm kinh nghiệm Java",
      "Thành thạo Spring Boot, REST API",
      "Hiểu biết về Docker, microservices",
      "Tiếng Anh đọc hiểu tài liệu kỹ thuật",
    ],
    benefits: ["Lương tháng 13-15", "Bảo hiểm cao cấp", "Hybrid 2 ngày/tuần", "Laptop công ty"],
    assessmentRequired: true,
    status: "Active",
    applicants: 48,
    qualified: 12,
  },
  {
    id: "j2",
    title: "Frontend React Developer",
    company: "VNG Corporation",
    location: "Remote",
    salary: "20 – 35M VND",
    type: "Full-time",
    mode: "Remote",
    skills: ["React", "TypeScript", "TailwindCSS", "REST API"],
    postedDays: 1,
    matchScore: 84,
    experience: "2-4 years",
    description: "Xây dựng giao diện sản phẩm SaaS hiện đại với React và TypeScript.",
    responsibilities: [
      "Phát triển UI component tái sử dụng",
      "Tối ưu performance và accessibility",
      "Phối hợp với Designer và Backend",
    ],
    requirements: ["React 18+", "TypeScript", "Tailwind", "Có kinh nghiệm SaaS là lợi thế"],
    benefits: ["100% Remote", "Macbook", "Stock option", "Học bổng kỹ năng"],
    status: "Active",
    applicants: 62,
    qualified: 24,
  },
  {
    id: "j3",
    title: "Data Engineer",
    company: "Tiki",
    location: "Ho Chi Minh City",
    salary: "30 – 50M VND",
    type: "Full-time",
    mode: "Onsite",
    skills: ["Python", "SQL", "Spark", "Airflow", "AWS"],
    postedDays: 5,
    matchScore: 62,
    experience: "3+ years",
    description: "Xây dựng và vận hành data pipeline phục vụ analytics & ML.",
    responsibilities: ["Thiết kế ETL pipeline", "Tối ưu Spark job", "Quản lý Airflow DAG"],
    requirements: ["Python", "Spark", "Airflow", "AWS S3/EMR"],
    benefits: ["13 tháng lương", "Voucher Tiki", "Khám sức khỏe định kỳ"],
    status: "Active",
    applicants: 28,
    qualified: 7,
  },
  {
    id: "j4",
    title: "Business Analyst",
    company: "Techcombank",
    location: "Hanoi",
    salary: "18 – 30M VND",
    type: "Full-time",
    mode: "Onsite",
    skills: ["Requirement Gathering", "SRS", "BPMN", "UAT"],
    postedDays: 3,
    matchScore: 89,
    experience: "2-5 years",
    description: "Phân tích nghiệp vụ ngân hàng số, làm cầu nối giữa Business và IT.",
    responsibilities: ["Thu thập yêu cầu", "Viết SRS, BPMN", "Hỗ trợ UAT"],
    requirements: ["Kinh nghiệm BA banking", "Tư duy phân tích tốt"],
    benefits: ["Bonus theo dự án", "Lộ trình thăng tiến rõ ràng"],
    status: "Active",
    applicants: 34,
    qualified: 18,
  },
  {
    id: "j5",
    title: "QA Automation Engineer",
    company: "MoMo",
    location: "Ho Chi Minh City",
    salary: "22 – 38M VND",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["Selenium", "Cypress", "Java", "CI/CD"],
    postedDays: 4,
    matchScore: 71,
    experience: "2+ years",
    description: "Xây dựng hệ thống automation test cho sản phẩm fintech.",
    responsibilities: ["Viết test case automation", "Maintain test framework"],
    requirements: ["Cypress hoặc Selenium", "Kinh nghiệm CI/CD"],
    benefits: ["MoMo card", "WFH thứ 6", "Team building hàng quý"],
    status: "Active",
    applicants: 19,
    qualified: 8,
  },
  {
    id: "j6",
    title: "DevOps Engineer",
    company: "VNPay",
    location: "Hanoi",
    salary: "28 – 45M VND",
    type: "Full-time",
    mode: "Hybrid",
    skills: ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD"],
    postedDays: 7,
    matchScore: 68,
    experience: "3+ years",
    description: "Vận hành hạ tầng cloud-native cho hệ thống thanh toán.",
    responsibilities: ["Quản lý K8s cluster", "Tự động hoá hạ tầng với Terraform"],
    requirements: ["Kubernetes production", "AWS", "Terraform"],
    benefits: ["Stock option", "Bảo hiểm gia đình"],
    status: "Active",
    applicants: 22,
    qualified: 9,
  },
];

export interface Candidate {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  experience: string;
  skills: string[];
  missingSkills: string[];
  score: number;
  status: ApplicationStatus;
  appliedJob: string;
  appliedDate: string;
  assessmentScore?: number;
  avatar?: string;
}

export const CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "Nguyễn Minh Anh",
    title: "Backend Developer",
    email: "minhanh@example.com",
    phone: "0901 234 567",
    location: "Ho Chi Minh City",
    experience: "3 năm",
    skills: ["Java", "REST API", "MySQL"],
    missingSkills: ["Spring Boot", "Docker"],
    score: 76,
    status: "Under Review",
    appliedJob: "Backend Java Developer",
    appliedDate: "2025-05-25",
    assessmentScore: 82,
  },
  {
    id: "c2",
    name: "Trần Hoàng Nam",
    title: "Frontend Developer",
    email: "hoangnam@example.com",
    phone: "0912 345 678",
    location: "Da Nang",
    experience: "4 năm",
    skills: ["React", "TypeScript", "TailwindCSS"],
    missingSkills: ["Testing", "GraphQL"],
    score: 84,
    status: "Qualified",
    appliedJob: "Frontend React Developer",
    appliedDate: "2025-05-26",
    assessmentScore: 88,
  },
  {
    id: "c3",
    name: "Lê Bảo Châu",
    title: "Data Analyst",
    email: "baochau@example.com",
    phone: "0987 654 321",
    location: "Hanoi",
    experience: "2 năm",
    skills: ["Python", "SQL", "Airflow"],
    missingSkills: ["Spark", "AWS"],
    score: 62,
    status: "Under Review",
    appliedJob: "Data Engineer",
    appliedDate: "2025-05-24",
  },
  {
    id: "c4",
    name: "Phạm Quốc Huy",
    title: "Senior Backend Engineer",
    email: "quochuy@example.com",
    phone: "0934 567 890",
    location: "Ho Chi Minh City",
    experience: "5 năm",
    skills: ["Java", "Spring Boot", "Docker", "AWS"],
    missingSkills: ["Kubernetes"],
    score: 91,
    status: "Qualified",
    appliedJob: "Backend Java Developer",
    appliedDate: "2025-05-23",
    assessmentScore: 94,
  },
  {
    id: "c5",
    name: "Đặng Thuỳ Linh",
    title: "Business Analyst",
    email: "thuylinh@example.com",
    phone: "0978 111 222",
    location: "Hanoi",
    experience: "3 năm",
    skills: ["BPMN", "SRS", "UAT"],
    missingSkills: ["SQL nâng cao"],
    score: 88,
    status: "Interview Scheduled",
    appliedJob: "Business Analyst",
    appliedDate: "2025-05-22",
    assessmentScore: 90,
  },
  {
    id: "c6",
    name: "Vũ Đức Tài",
    title: "DevOps Engineer",
    email: "ductai@example.com",
    phone: "0966 333 444",
    location: "Ho Chi Minh City",
    experience: "4 năm",
    skills: ["Docker", "AWS", "Terraform"],
    missingSkills: ["Kubernetes nâng cao"],
    score: 79,
    status: "Offer Sent",
    appliedJob: "DevOps Engineer",
    appliedDate: "2025-05-20",
    assessmentScore: 85,
  },
];

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  score: number;
  status: ApplicationStatus;
  assessmentStatus: "Not Required" | "Pending" | "Submitted" | "Expired";
  lastUpdate: string;
}

export const APPLICATIONS: Application[] = [
  { id: "a1", jobId: "j1", jobTitle: "Backend Java Developer", company: "FPT Software", appliedDate: "2025-05-25", score: 76, status: "Under Review", assessmentStatus: "Pending", lastUpdate: "1 ngày trước" },
  { id: "a2", jobId: "j2", jobTitle: "Frontend React Developer", company: "VNG Corporation", appliedDate: "2025-05-24", score: 84, status: "Qualified", assessmentStatus: "Submitted", lastUpdate: "2 giờ trước" },
  { id: "a3", jobId: "j4", jobTitle: "Business Analyst", company: "Techcombank", appliedDate: "2025-05-20", score: 89, status: "Interview Scheduled", assessmentStatus: "Submitted", lastUpdate: "Hôm qua" },
  { id: "a4", jobId: "j3", jobTitle: "Data Engineer", company: "Tiki", appliedDate: "2025-05-18", score: 62, status: "Not Qualified", assessmentStatus: "Not Required", lastUpdate: "3 ngày trước" },
  { id: "a5", jobId: "j5", jobTitle: "QA Automation Engineer", company: "MoMo", appliedDate: "2025-05-15", score: 71, status: "Pending Review", assessmentStatus: "Pending", lastUpdate: "5 ngày trước" },
];

export const CVS = [
  { id: "cv1", name: "NguyenMinhAnh_Backend.pdf", uploaded: "2025-05-20", type: "PDF", status: "Parsed" as const, isDefault: true },
  { id: "cv2", name: "NguyenMinhAnh_Fullstack.pdf", uploaded: "2025-05-10", type: "PDF", status: "Parsed" as const, isDefault: false },
  { id: "cv3", name: "CV_English_2025.docx", uploaded: "2025-04-28", type: "DOCX", status: "Parsed" as const, isDefault: false },
];

export const ASSESSMENTS = [
  { id: "as1", title: "Backend Technical Test", job: "Backend Java Developer", type: "Technical" as const, duration: 60, status: "Not started" as const, score: null as number | null },
  { id: "as2", title: "General IQ Test", job: "Frontend React Developer", type: "IQ" as const, duration: 30, status: "Submitted" as const, score: 88 },
  { id: "as3", title: "EQ Assessment", job: "Business Analyst", type: "EQ" as const, duration: 25, status: "Submitted" as const, score: 90 },
];

export const NOTIFICATIONS = [
  { id: "n1", title: "CV của bạn đã được phân tích", time: "2 phút trước", unread: true },
  { id: "n2", title: "Bạn vừa được mời phỏng vấn vị trí BA", time: "1 giờ trước", unread: true },
  { id: "n3", title: "Có 5 việc mới phù hợp với CV", time: "Hôm qua", unread: false },
];

export const SCORE_COLOR = (score: number) =>
  score >= 70 ? "success" : score >= 50 ? "warning" : "danger";
