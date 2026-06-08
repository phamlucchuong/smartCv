# Web Candidate Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add company list + detail pages, comprehensive i18n pass, and minor UI completions to the web-candidate portal.

**Architecture:** One-pass delivery — shared mock data file feeds two new public routes (`/companies`, `/companies/$companyId`); all new and existing routes get i18n keys added to `packages/i18n/src/locales/{en,vi}/common.json`; TanStack Router auto-regenerates `routeTree.gen.ts` when new route files are saved.

**Tech Stack:** React 19, TanStack Router v1 (file-based routing), Tailwind CSS v4, `@smart-cv/ui` (shadcn/ui components), `@smart-cv/i18n` (i18next + `useTranslation`), Zustand, pnpm monorepo.

---

## File Map

**New files:**
- `src/data/mockCompanies.ts` — shared mock company array + TypeScript types
- `src/routes/companies.tsx` — `/companies` list page
- `src/routes/companies/$companyId.tsx` — `/companies/$companyId` detail page

**Modified files:**
- `packages/i18n/src/locales/en/common.json` — add all new keys
- `packages/i18n/src/locales/vi/common.json` — add all new keys (Vietnamese)
- `src/routes/__root.tsx` — add Companies nav link, fix footer link
- `src/routes/index.tsx` — fix Top Companies card links + page title
- `src/routes/jobs/$jobId.tsx` — fix View Company button link + page title
- `src/routes/about.tsx` — full i18n + layout standardisation + page title
- `src/routes/signin.tsx` — page title
- `src/routes/signup.tsx` — page title
- `src/routes/_account.applications.tsx` — i18n all hardcoded strings + page title
- `src/routes/_account.assessments.tsx` — i18n all hardcoded strings + page title
- `src/routes/_account.wishlists.tsx` — i18n hardcoded chips + page title
- `src/routes/_account.job-suggestions.tsx` — i18n header + chips + page title
- `src/routes/_account.profile.tsx` — page title
- `src/routes/_account.cv.tsx` — page title
- `src/routes/_account.notifications.tsx` — page title
- `src/routes/_account.settings.tsx` — page title

---

## Task 1: i18n Keys (Foundation)

**Files:**
- Modify: `packages/i18n/src/locales/en/common.json`
- Modify: `packages/i18n/src/locales/vi/common.json`

- [ ] **Step 1: Add new keys to EN locale**

Open `packages/i18n/src/locales/en/common.json`. Add the following keys before the closing `}`:

```json
  "nav_companies": "Companies",
  "page_title_home": "Find Developer Jobs — SmartCV",
  "page_title_companies": "Companies — SmartCV",
  "page_title_company_detail": "{{name}} — SmartCV",
  "page_title_job_detail": "{{title}} at {{company}} — SmartCV",
  "page_title_signin": "Sign In — SmartCV",
  "page_title_signup": "Join SmartCV",
  "page_title_about": "About Us — SmartCV",
  "page_title_profile": "My Profile — SmartCV",
  "page_title_cv": "My CV — SmartCV",
  "page_title_assessments": "Assessments — SmartCV",
  "page_title_notifications": "Notifications — SmartCV",
  "page_title_settings": "Settings — SmartCV",
  "page_title_applications": "Applied Jobs — SmartCV",
  "page_title_wishlists": "Wishlists — SmartCV",
  "page_title_job_suggestions": "Job Suggestions — SmartCV",
  "company_list_title": "Companies Hiring Now",
  "company_list_subtitle": "{{count}}+ companies actively hiring",
  "company_list_search_placeholder": "Company name, industry, location...",
  "company_list_filter_all_industries": "All Industries",
  "company_list_filter_all_sizes": "All Sizes",
  "company_list_filter_all_locations": "All Locations",
  "company_list_filter_industry": "Industry",
  "company_list_filter_size": "Size",
  "company_list_filter_location": "Location",
  "company_list_result_count": "Found {{count}} companies",
  "company_list_view_profile": "View Profile",
  "company_list_active_jobs": "{{count}} active jobs",
  "company_detail_tab_overview": "Overview",
  "company_detail_tab_jobs": "Jobs",
  "company_detail_follow": "Follow",
  "company_detail_view_jobs": "View Jobs ({{count}})",
  "company_detail_about": "About",
  "company_detail_why_work_here": "Why Work Here?",
  "company_detail_active_jobs": "Active Jobs",
  "company_detail_view_all_jobs": "View all {{count}} jobs",
  "company_detail_related": "Similar Companies",
  "company_detail_view": "View",
  "company_detail_employees": "employees",
  "application_status_applied": "Applied",
  "application_status_under_review": "Under Review",
  "application_status_interview": "Interview",
  "application_status_rejected": "Not a Fit",
  "application_status_offer": "Offer Received",
  "applications_filter_all": "All",
  "applications_filter_processing": "Processing",
  "applications_filter_interview": "Interview",
  "applications_filter_rejected": "Rejected",
  "applications_page_title": "Applied Jobs",
  "applications_count": "{{count}} applications",
  "applications_search_placeholder": "Search applied jobs...",
  "assessments_page_title": "Assessments",
  "assessments_page_subtitle": "Complete assessments to boost your chances",
  "assessments_filter_all": "All",
  "assessments_filter_not_started": "Not Started",
  "assessments_filter_in_progress": "In Progress",
  "assessments_filter_submitted": "Submitted",
  "assessments_filter_expired": "Expired",
  "assessments_status_not_started": "Not Started",
  "assessments_status_in_progress": "In Progress",
  "assessments_status_submitted": "Submitted",
  "assessments_status_expired": "Expired",
  "assessments_search_placeholder": "Search assessments...",
  "assessments_minutes": "{{count}} min",
  "assessments_score": "Score: {{score}}/100",
  "assessments_expired_label": "Expired",
  "assessments_start": "Start Assessment",
  "assessments_continue": "Continue",
  "wishlists_page_title": "Wishlists",
  "wishlists_filter_all": "All",
  "wishlists_filter_tech": "Technology",
  "wishlists_filter_design": "Design",
  "wishlists_filter_marketing": "Marketing",
  "wishlists_search_placeholder": "Search saved jobs...",
  "wishlists_empty": "No saved jobs match your filter",
  "job_suggestions_page_title": "Job Suggestions",
  "job_suggestions_subtitle": "Based on your profile and skills",
  "job_suggestions_filter_all": "All",
  "job_suggestions_search_placeholder": "Filter suggestions...",
  "about_badge": "About Us",
  "about_title": "SmartCV — Next-Generation Recruitment Platform",
  "about_subtitle": "We deliver fast, transparent, and effective talent-to-company matching through modern technology.",
  "about_feature_apply_title": "Fast Applications",
  "about_feature_apply_desc": "Submit your application online with one click and get instant feedback from recruiters.",
  "about_feature_ai_title": "AI Profile Analysis",
  "about_feature_ai_desc": "Our AI system automatically optimises and benchmarks your skills against specific job requirements.",
  "about_feature_security_title": "Complete Security",
  "about_feature_security_desc": "Your personal data and profile are encrypted securely and only shared with your permission.",
  "about_cta": "Start Your Journey",
  "about_stats_jobs": "Jobs Available",
  "about_stats_companies": "Partner Companies",
  "about_stats_candidates": "Registered Candidates"
```

- [ ] **Step 2: Add new keys to VI locale**

Open `packages/i18n/src/locales/vi/common.json`. Add the following keys before the closing `}`:

```json
  "nav_companies": "Doanh nghiệp",
  "page_title_home": "Tìm việc lập trình — SmartCV",
  "page_title_companies": "Doanh nghiệp — SmartCV",
  "page_title_company_detail": "{{name}} — SmartCV",
  "page_title_job_detail": "{{title}} tại {{company}} — SmartCV",
  "page_title_signin": "Đăng nhập — SmartCV",
  "page_title_signup": "Tham gia SmartCV",
  "page_title_about": "Về chúng tôi — SmartCV",
  "page_title_profile": "Hồ sơ của tôi — SmartCV",
  "page_title_cv": "CV của tôi — SmartCV",
  "page_title_assessments": "Bài kiểm tra — SmartCV",
  "page_title_notifications": "Thông báo — SmartCV",
  "page_title_settings": "Cài đặt — SmartCV",
  "page_title_applications": "Việc đã ứng tuyển — SmartCV",
  "page_title_wishlists": "Danh sách yêu thích — SmartCV",
  "page_title_job_suggestions": "Gợi ý việc làm — SmartCV",
  "company_list_title": "Doanh nghiệp đang tuyển dụng",
  "company_list_subtitle": "{{count}}+ doanh nghiệp đang tuyển dụng",
  "company_list_search_placeholder": "Tên công ty, ngành nghề, địa điểm...",
  "company_list_filter_all_industries": "Tất cả ngành",
  "company_list_filter_all_sizes": "Tất cả quy mô",
  "company_list_filter_all_locations": "Tất cả địa điểm",
  "company_list_filter_industry": "Ngành",
  "company_list_filter_size": "Quy mô",
  "company_list_filter_location": "Địa điểm",
  "company_list_result_count": "Tìm thấy {{count}} công ty",
  "company_list_view_profile": "Xem hồ sơ",
  "company_list_active_jobs": "{{count}} việc đang tuyển",
  "company_detail_tab_overview": "Tổng quan",
  "company_detail_tab_jobs": "Công việc",
  "company_detail_follow": "Theo dõi",
  "company_detail_view_jobs": "Xem việc làm ({{count}})",
  "company_detail_about": "Về công ty",
  "company_detail_why_work_here": "Tại sao nên làm việc tại đây?",
  "company_detail_active_jobs": "Việc làm đang tuyển",
  "company_detail_view_all_jobs": "Xem tất cả {{count}} việc",
  "company_detail_related": "Doanh nghiệp tương tự",
  "company_detail_view": "Xem",
  "company_detail_employees": "nhân viên",
  "application_status_applied": "Đã ứng tuyển",
  "application_status_under_review": "Đang xem xét",
  "application_status_interview": "Phỏng vấn",
  "application_status_rejected": "Không phù hợp",
  "application_status_offer": "Nhận offer",
  "applications_filter_all": "Tất cả",
  "applications_filter_processing": "Đang xử lý",
  "applications_filter_interview": "Phỏng vấn",
  "applications_filter_rejected": "Từ chối",
  "applications_page_title": "Việc đã ứng tuyển",
  "applications_count": "{{count}} đơn ứng tuyển",
  "applications_search_placeholder": "Tìm việc đã ứng tuyển...",
  "assessments_page_title": "Bài kiểm tra",
  "assessments_page_subtitle": "Hoàn thành các bài đánh giá để tăng cơ hội trúng tuyển",
  "assessments_filter_all": "Tất cả",
  "assessments_filter_not_started": "Chưa làm",
  "assessments_filter_in_progress": "Đang làm",
  "assessments_filter_submitted": "Đã nộp",
  "assessments_filter_expired": "Hết hạn",
  "assessments_status_not_started": "Chưa làm",
  "assessments_status_in_progress": "Đang làm",
  "assessments_status_submitted": "Đã nộp",
  "assessments_status_expired": "Hết hạn",
  "assessments_search_placeholder": "Tìm bài kiểm tra...",
  "assessments_minutes": "{{count}} phút",
  "assessments_score": "Điểm: {{score}}/100",
  "assessments_expired_label": "Đã hết hạn",
  "assessments_start": "Bắt đầu làm bài",
  "assessments_continue": "Tiếp tục làm bài",
  "wishlists_page_title": "Danh sách yêu thích",
  "wishlists_filter_all": "Tất cả",
  "wishlists_filter_tech": "Công nghệ",
  "wishlists_filter_design": "Thiết kế",
  "wishlists_filter_marketing": "Marketing",
  "wishlists_search_placeholder": "Tìm việc đã lưu...",
  "wishlists_empty": "Không có việc làm phù hợp với bộ lọc",
  "job_suggestions_page_title": "Gợi ý việc làm",
  "job_suggestions_subtitle": "Dựa trên hồ sơ và kỹ năng của bạn",
  "job_suggestions_filter_all": "Tất cả",
  "job_suggestions_search_placeholder": "Lọc gợi ý...",
  "about_badge": "Về Chúng Tôi",
  "about_title": "Smart CV — Nền Tảng Tuyển Dụng Thế Hệ Mới",
  "about_subtitle": "Chúng tôi mang đến giải pháp kết nối nhân tài và doanh nghiệp một cách nhanh chóng, minh bạch và hiệu quả thông qua công nghệ hiện đại.",
  "about_feature_apply_title": "Ứng tuyển nhanh chóng",
  "about_feature_apply_desc": "Nộp hồ sơ trực tuyến chỉ với 1 cú click chuột và nhận phản hồi tức thì từ nhà tuyển dụng.",
  "about_feature_ai_title": "Phân tích hồ sơ AI",
  "about_feature_ai_desc": "Hệ thống AI tự động tối ưu hóa và so sánh năng lực của bạn với yêu cầu công việc cụ thể.",
  "about_feature_security_title": "Bảo mật tuyệt đối",
  "about_feature_security_desc": "Dữ liệu cá nhân và thông tin hồ sơ của bạn được mã hóa an toàn và chỉ hiển thị khi có sự cho phép.",
  "about_cta": "Bắt Đầu Ngay",
  "about_stats_jobs": "Việc Làm",
  "about_stats_companies": "Doanh Nghiệp",
  "about_stats_candidates": "Ứng Viên"
```

- [ ] **Step 3: Verify build passes**

```bash
cd /home/lucchuong/Documents/DO_AN_TOT_NGHIEP/frontend
pnpm -F @smart-cv/i18n build 2>/dev/null || pnpm -F web-candidate build
```

Expected: no JSON parse errors. If there are trailing comma errors, fix the JSON.

---

## Task 2: Mock Company Data

**Files:**
- Create: `apps/web-candidate/src/data/mockCompanies.ts`

- [ ] **Step 1: Create the mock data file**

Create `apps/web-candidate/src/data/mockCompanies.ts` with this content:

```typescript
export interface MockJob {
  id: string
  title: string
  salary: string
  location: string
  skills: string[]
  posted: string
}

export interface MockCompany {
  id: string
  name: string
  logoPlaceholder: string
  coverColor: string
  industry: string
  size: string
  location: string
  country: string
  website: string
  rating: number
  reviewCount: number
  activeJobCount: number
  description: string
  benefits: string[]
  jobs: MockJob[]
  relatedIds: string[]
}

export const mockCompanies: MockCompany[] = [
  {
    id: 'innovatehub-vietnam',
    name: 'InnovateHub Vietnam',
    logoPlaceholder: 'IH',
    coverColor: '#e0e7ff',
    industry: 'AI/ML',
    size: '200-500',
    location: 'Hồ Chí Minh',
    country: 'Vietnam',
    website: 'innovatehub.vn',
    rating: 4.5,
    reviewCount: 45,
    activeJobCount: 12,
    description:
      'InnovateHub Vietnam is an AI-first product studio building cloud-native platforms for global markets. With 300+ engineers we focus on speed, quality and transparent engineering culture.',
    benefits: [
      'Remote-friendly 3 days/week',
      'Competitive market salary',
      '$500/year learning budget',
      'Small team, high ownership',
    ],
    jobs: [
      { id: 'senior-nodejs', title: 'Senior Node.js Backend Developer', salary: '$2,500 – $3,500', location: 'HCM (Hybrid)', skills: ['Node.js', 'TypeScript', 'AWS'], posted: '2 hours ago' },
      { id: 'frontend-react', title: 'Frontend Engineer (React)', salary: '$2,000 – $2,800', location: 'Remote', skills: ['React', 'Next.js', 'Tailwind'], posted: '6 hours ago' },
      { id: 'data-engineer', title: 'Data Engineer (Python/Spark)', salary: '$2,300 – $3,200', location: 'HCM (Onsite)', skills: ['Python', 'Spark', 'Airflow'], posted: '1 day ago' },
      { id: 'devops-aws', title: 'DevOps Engineer (AWS/Kubernetes)', salary: '$2,700 – $3,600', location: 'Remote', skills: ['Kubernetes', 'Terraform', 'AWS'], posted: '2 days ago' },
    ],
    relatedIds: ['byteforge', 'cloudbridge-tech', 'scaleone-labs', 'datanova-analytics'],
  },
  {
    id: 'byteforge',
    name: 'ByteForge',
    logoPlaceholder: 'BF',
    coverColor: '#e0f2fe',
    industry: 'Fintech',
    size: '50-200',
    location: 'Hà Nội',
    country: 'Vietnam',
    website: 'byteforge.io',
    rating: 4.3,
    reviewCount: 30,
    activeJobCount: 8,
    description:
      'Engineering-focused environment for high-load fintech products. We ship fast and care deeply about code quality.',
    benefits: [
      'Flexible hours',
      'Performance bonuses',
      'Modern tech stack',
      'Regular team offsites',
    ],
    jobs: [
      { id: 'backend-java', title: 'Backend Java Developer', salary: '$1,800 – $2,600', location: 'Hà Nội (Onsite)', skills: ['Java', 'Spring Boot', 'PostgreSQL'], posted: '1 day ago' },
      { id: 'mobile-android', title: 'Android Engineer', salary: '$1,600 – $2,400', location: 'Hà Nội (Hybrid)', skills: ['Kotlin', 'Jetpack Compose', 'Firebase'], posted: '3 days ago' },
    ],
    relatedIds: ['innovatehub-vietnam', 'scaleone-labs', 'cloudbridge-tech', 'pixelcraft-studio'],
  },
  {
    id: 'cloudbridge-tech',
    name: 'CloudBridge Tech',
    logoPlaceholder: 'CB',
    coverColor: '#dcfce7',
    industry: 'DevOps',
    size: '50-200',
    location: 'Remote',
    country: 'Vietnam',
    website: 'cloudbridge.tech',
    rating: 4.6,
    reviewCount: 52,
    activeJobCount: 16,
    description:
      'Remote-friendly team building data and DevOps tooling. We believe in async communication and documentation-first engineering.',
    benefits: [
      '100% remote',
      'USD salary',
      'Async-first culture',
      'Home office stipend $800',
    ],
    jobs: [
      { id: 'devops-k8s', title: 'DevOps Engineer (Kubernetes)', salary: '$2,700 – $3,600', location: 'Remote', skills: ['Kubernetes', 'Terraform', 'Prometheus'], posted: '2 days ago' },
      { id: 'sre', title: 'Site Reliability Engineer', salary: '$3,000 – $4,000', location: 'Remote', skills: ['Go', 'Prometheus', 'AWS'], posted: '4 days ago' },
    ],
    relatedIds: ['innovatehub-vietnam', 'byteforge', 'scaleone-labs', 'datanova-analytics'],
  },
  {
    id: 'scaleone-labs',
    name: 'ScaleOne Labs',
    logoPlaceholder: 'SO',
    coverColor: '#fef9c3',
    industry: 'SaaS',
    size: '50-200',
    location: 'Hồ Chí Minh',
    country: 'Vietnam',
    website: 'scaleonelabs.com',
    rating: 4.4,
    reviewCount: 38,
    activeJobCount: 10,
    description:
      'Fast-growth SaaS team with strong product engineering culture. We hire engineers who own their features end-to-end.',
    benefits: [
      'Equity options',
      'Unlimited PTO',
      'Conference budget',
      'Fast promotion track',
    ],
    jobs: [
      { id: 'engineering-manager', title: 'Engineering Manager', salary: '$4,000 – $5,500', location: 'Remote (APAC)', skills: ['Leadership', 'System Design', 'Agile'], posted: '4 days ago' },
      { id: 'fullstack-ts', title: 'Fullstack Engineer (TypeScript)', salary: '$2,200 – $3,000', location: 'HCM (Hybrid)', skills: ['TypeScript', 'React', 'Node.js'], posted: '5 days ago' },
    ],
    relatedIds: ['byteforge', 'cloudbridge-tech', 'innovatehub-vietnam', 'pixelcraft-studio'],
  },
  {
    id: 'datanova-analytics',
    name: 'DataNova Analytics',
    logoPlaceholder: 'DN',
    coverColor: '#fee2e2',
    industry: 'Data',
    size: '<50',
    location: 'Đà Nẵng',
    country: 'Vietnam',
    website: 'datanova.vn',
    rating: 4.2,
    reviewCount: 21,
    activeJobCount: 6,
    description:
      'Data-first analytics startup helping Vietnamese enterprises make sense of their data. Small team, big impact.',
    benefits: [
      'Equity for early team',
      'Flexible location',
      'Research-first culture',
      'Hardware budget',
    ],
    jobs: [
      { id: 'data-scientist', title: 'Data Scientist (NLP)', salary: '$1,800 – $2,800', location: 'Đà Nẵng (Hybrid)', skills: ['Python', 'PyTorch', 'Transformers'], posted: '3 days ago' },
    ],
    relatedIds: ['innovatehub-vietnam', 'cloudbridge-tech', 'scaleone-labs', 'byteforge'],
  },
  {
    id: 'pixelcraft-studio',
    name: 'PixelCraft Studio',
    logoPlaceholder: 'PC',
    coverColor: '#fce7f3',
    industry: 'Design',
    size: '<50',
    location: 'Hồ Chí Minh',
    country: 'Vietnam',
    website: 'pixelcraft.studio',
    rating: 4.1,
    reviewCount: 17,
    activeJobCount: 4,
    description:
      'Product design studio crafting digital experiences for startups and scale-ups across Southeast Asia.',
    benefits: [
      'Creative environment',
      'Figma Pro license',
      'Friday showcase',
      'Flexible hours',
    ],
    jobs: [
      { id: 'product-designer', title: 'Product Designer (UX/UI)', salary: '$1,600 – $2,400', location: 'HCM (Onsite)', skills: ['Figma', 'Design System', 'Research'], posted: '5 days ago' },
    ],
    relatedIds: ['scaleone-labs', 'byteforge', 'innovatehub-vietnam', 'cloudbridge-tech'],
  },
]

export function getCompanyById(id: string): MockCompany | undefined {
  return mockCompanies.find((c) => c.id === id)
}

export function getRelatedCompanies(company: MockCompany): MockCompany[] {
  return company.relatedIds
    .map((id) => mockCompanies.find((c) => c.id === id))
    .filter((c): c is MockCompany => c !== undefined)
    .slice(0, 4)
}

export const INDUSTRIES = ['AI/ML', 'Fintech', 'DevOps', 'SaaS', 'Data', 'Design']
export const SIZES = ['<50', '50-200', '200-500', '500+']
export const LOCATIONS = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Remote']
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/lucchuong/Documents/DO_AN_TOT_NGHIEP/frontend
pnpm -F web-candidate build
```

Expected: build succeeds or fails only on unrelated existing errors (not from the new file).

---

## Task 3: Company List Page `/companies`

**Files:**
- Create: `apps/web-candidate/src/routes/companies.tsx`

- [ ] **Step 1: Create the route file**

Create `apps/web-candidate/src/routes/companies.tsx`:

```typescript
import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Building2, ChevronLeft, ChevronRight, MapPin, Search, Star } from 'lucide-react'
import { mockCompanies, INDUSTRIES, SIZES, LOCATIONS, type MockCompany } from '../data/mockCompanies'

export const Route = createFileRoute('/companies')({
  component: CompaniesPage,
})

const COMPANIES_PER_PAGE = 6

function CompaniesPage() {
  const { t } = useTranslation()
  const [query, setQuery] = React.useState('')
  const [industry, setIndustry] = React.useState('')
  const [size, setSize] = React.useState('')
  const [location, setLocation] = React.useState('')
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    document.title = t('page_title_companies')
  }, [t])

  const filtered = mockCompanies.filter((c) => {
    const q = query.trim().toLowerCase()
    const matchQuery = q === '' || c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
    const matchIndustry = industry === '' || c.industry === industry
    const matchSize = size === '' || c.size === size
    const matchLocation = location === '' || c.location === location
    return matchQuery && matchIndustry && matchSize && matchLocation
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / COMPANIES_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * COMPANIES_PER_PAGE, safePage * COMPANIES_PER_PAGE)

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value)
    setPage(1)
  }

  return (
    <div className="space-y-0 pb-12">
      {/* Hero banner */}
      <section className="bg-primary px-4 py-12 md:px-6" aria-label="Companies Hero">
        <div className="mx-auto max-w-6xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
            {t('nav_companies').toUpperCase()}
          </p>
          <h1 className="mb-6 text-3xl font-bold text-primary-foreground md:text-4xl">
            {t('company_list_title')}
            <span className="ml-2 text-2xl font-normal opacity-80 md:text-3xl">
              — {t('company_list_subtitle', { count: 420 })}
            </span>
          </h1>
          <div className="flex max-w-xl items-center gap-2 rounded-xl bg-white/15 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-primary-foreground/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder={t('company_list_search_placeholder')}
              className="flex-1 bg-transparent text-sm text-primary-foreground placeholder:text-primary-foreground/50 outline-none"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">{t('company_list_filter_industry')}:</span>
          <select
            value={industry}
            onChange={handleFilterChange(setIndustry)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="">{t('company_list_filter_all_industries')}</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select
            value={size}
            onChange={handleFilterChange(setSize)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="">{t('company_list_filter_all_sizes')}</option>
            {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={location}
            onChange={handleFilterChange(setLocation)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="">{t('company_list_filter_all_locations')}</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <span className="ml-auto text-sm text-muted-foreground">
            {t('company_list_result_count', { count: filtered.length })}
          </span>
        </div>

        {/* Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-card/50 p-4 text-sm md:flex-row">
            <p className="text-muted-foreground">
              Page {safePage} of {totalPages} · Showing {(safePage - 1) * COMPANIES_PER_PAGE + 1}–{Math.min(safePage * COMPANIES_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx + 1}
                  size="sm"
                  variant={safePage === idx + 1 ? 'default' : 'outline'}
                  onClick={() => setPage(idx + 1)}
                >
                  {idx + 1}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CompanyCard({ company }: { company: MockCompany }) {
  const { t } = useTranslation()
  return (
    <Link to="/companies/$companyId" params={{ companyId: company.id }} className="block">
      <article className="elevate-card overflow-hidden rounded-2xl border border-border bg-card">
        {/* Cover */}
        <div className="h-[52px] bg-muted" />
        <div className="px-4 pb-4 pt-0">
          {/* Logo overlapping cover */}
          <div
            className="-mt-5 mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-background bg-primary/10 text-sm font-bold text-primary shadow-sm"
          >
            {company.logoPlaceholder}
          </div>
          <h3 className="font-semibold text-foreground">{company.name}</h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-current text-yellow-500" />
            {company.rating} ({company.reviewCount})
            <span className="mx-1">·</span>
            <MapPin className="h-3 w-3" />
            {company.location}
          </div>
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">{company.industry}</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="font-medium text-success">● {t('company_list_active_jobs', { count: company.activeJobCount })}</span>
            <span className="font-medium text-primary">{t('company_list_view_profile')} →</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
```

- [ ] **Step 2: Start dev server and verify route auto-generates**

```bash
cd /home/lucchuong/Documents/DO_AN_TOT_NGHIEP/frontend
pnpm -F web-candidate dev
```

Open http://localhost:3000/companies — should render the company grid. `routeTree.gen.ts` will update automatically on save.

- [ ] **Step 3: Build check**

```bash
pnpm -F web-candidate build
```

Expected: build succeeds.

---

## Task 4: Company Detail Page `/companies/$companyId`

**Files:**
- Create: `apps/web-candidate/src/routes/companies/$companyId.tsx`

- [ ] **Step 1: Create the directory and route file**

```bash
mkdir -p apps/web-candidate/src/routes/companies
```

Create `apps/web-candidate/src/routes/companies/$companyId.tsx`:

```typescript
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import {
  Briefcase,
  Building2,
  Clock3,
  DollarSign,
  Globe,
  Heart,
  MapPin,
  Star,
  Users,
} from 'lucide-react'
import { getCompanyById, getRelatedCompanies, type MockCompany, type MockJob } from '../../data/mockCompanies'

export const Route = createFileRoute('/companies/$companyId')({
  component: CompanyDetailPage,
})

type TabKey = 'overview' | 'jobs'

function CompanyDetailPage() {
  const { t } = useTranslation()
  const { companyId } = Route.useParams()
  const company = getCompanyById(companyId)
  const [activeTab, setActiveTab] = React.useState<TabKey>('overview')
  const [jobQuery, setJobQuery] = React.useState('')

  React.useEffect(() => {
    if (company) {
      document.title = t('page_title_company_detail', { name: company.name })
    }
  }, [company, t])

  if (!company) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl font-black text-foreground">404</p>
          <p className="mt-2 text-muted-foreground">Company not found.</p>
          <Link to="/companies" className="mt-4 inline-block text-primary hover:underline">
            ← Back to Companies
          </Link>
        </div>
      </div>
    )
  }

  const relatedCompanies = getRelatedCompanies(company)

  return (
    <div className="pb-12">
      {/* Cover + Logo header */}
      <div className="relative">
        <div className="h-[160px] w-full bg-muted" />
        {/* Logo: half on cover, half below */}
        <div className="absolute bottom-0 left-5 flex h-[58px] w-[58px] translate-y-1/2 items-center justify-center rounded-xl border-[3px] border-background bg-primary/10 text-lg font-bold text-primary shadow-md">
          {company.logoPlaceholder}
        </div>
      </div>

      {/* Info bar */}
      <div className="border-b border-border bg-background pb-0">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {/* Space for logo overlap */}
          <div className="flex items-end justify-between pt-10 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {company.industry} · {company.size} {t('company_detail_employees')} · {company.location} ·{' '}
                <Star className="inline h-3.5 w-3.5 fill-current text-yellow-500" />{' '}
                {company.rating} ({company.reviewCount})
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Heart className="h-4 w-4" /> {t('company_detail_follow')}
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab('jobs')}
              >
                {t('company_detail_view_jobs', { count: company.activeJobCount })}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0">
            {(['overview', 'jobs'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'overview' ? t('company_detail_tab_overview') : (
                  <>
                    {t('company_detail_tab_jobs')}{' '}
                    <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                      {company.activeJobCount}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6">
        {activeTab === 'overview' && (
          <OverviewTab company={company} relatedCompanies={relatedCompanies} onViewAllJobs={() => setActiveTab('jobs')} />
        )}
        {activeTab === 'jobs' && (
          <JobsTab company={company} query={jobQuery} onQueryChange={setJobQuery} />
        )}
      </div>
    </div>
  )
}

function OverviewTab({
  company,
  relatedCompanies,
  onViewAllJobs,
}: {
  company: MockCompany
  relatedCompanies: MockCompany[]
  onViewAllJobs: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      {/* Info chips */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
          <Building2 className="h-4 w-4 text-muted-foreground" /> {company.size} {t('company_detail_employees')}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
          <MapPin className="h-4 w-4 text-muted-foreground" /> {company.location}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
          <Globe className="h-4 w-4 text-muted-foreground" /> {company.website}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
          <Briefcase className="h-4 w-4 text-muted-foreground" /> {company.industry}
        </span>
      </div>

      {/* About */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t('company_detail_about')}</h2>
        <p className="text-muted-foreground leading-relaxed">{company.description}</p>
      </div>

      {/* Why work here */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">{t('company_detail_why_work_here')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {company.benefits.map((benefit) => (
            <div key={benefit} className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
              ✓ {benefit}
            </div>
          ))}
        </div>
      </div>

      {/* Job preview */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('company_detail_active_jobs')}</h2>
          <button
            onClick={onViewAllJobs}
            className="text-sm text-primary hover:underline"
          >
            {t('company_detail_view_all_jobs', { count: company.activeJobCount })} →
          </button>
        </div>
        <div className="space-y-3">
          {company.jobs.slice(0, 3).map((job) => (
            <JobPreviewCard key={job.id} job={job} companyName={company.name} />
          ))}
        </div>
      </div>

      {/* Related companies */}
      <div className="border-t border-border pt-8">
        <h2 className="mb-4 text-lg font-semibold">{t('company_detail_related')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {relatedCompanies.map((c) => (
            <Link key={c.id} to="/companies/$companyId" params={{ companyId: c.id }}>
              <div className="elevate-card rounded-xl border border-border bg-card p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {c.logoPlaceholder}
                </div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.industry} · {c.activeJobCount} jobs</p>
                <p className="mt-2 text-xs font-medium text-primary">{t('company_detail_view')} →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function JobPreviewCard({ job, companyName }: { job: MockJob; companyName: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{job.title}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{job.salary}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{job.posted}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {job.skills.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
          ))}
        </div>
      </div>
      <Button size="sm" className="shrink-0">Quick Apply</Button>
    </div>
  )
}

function JobsTab({ company, query, onQueryChange }: { company: MockCompany; query: string; onQueryChange: (v: string) => void }) {
  const { t } = useTranslation()
  const filtered = company.jobs.filter((j) => {
    const q = query.trim().toLowerCase()
    return q === '' || j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t('applications_search_placeholder')}
        className="h-10 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="space-y-3">
        {filtered.map((job) => (
          <JobPreviewCard key={job.id} job={job} companyName={company.name} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t('account_no_results')}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify route renders**

Open http://localhost:3000/companies/innovatehub-vietnam

Expected: company detail page with cover, logo half-overlapping, tabs, overview sections, and related companies grid.

- [ ] **Step 3: Build check**

```bash
pnpm -F web-candidate build
```

---

## Task 5: Nav, Home, Footer & Job Detail Links

**Files:**
- Modify: `apps/web-candidate/src/routes/__root.tsx`
- Modify: `apps/web-candidate/src/routes/index.tsx`
- Modify: `apps/web-candidate/src/routes/jobs/$jobId.tsx`

- [ ] **Step 1: Add Companies to nav dropdown in `__root.tsx`**

In `__root.tsx`, find the `jobOptions` array:

```tsx
const jobOptions = [t('nav_all_jobs'), t('nav_top_companies'), t('nav_remote_jobs'), t('nav_internships')]
```

Replace with:

```tsx
const jobOptions = [t('nav_all_jobs'), t('nav_companies'), t('nav_top_companies'), t('nav_remote_jobs'), t('nav_internships')]
```

Find the `navigateToJobOption` function. Add a new case for Companies before the closing brace:

```tsx
const navigateToJobOption = (item: string) => {
  if (item === t('nav_companies')) {
    navigate({ to: '/companies' })
    return
  }
  if (item === t('nav_top_companies')) {
    window.location.hash = 'companies'
    return
  }
  if (item === t('nav_all_jobs')) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  if (item === t('nav_remote_jobs')) {
    window.location.hash = 'remote-jobs'
    return
  }
  if (item === t('nav_internships')) {
    window.location.hash = 'internships'
  }
}
```

- [ ] **Step 2: Fix Footer "Top Companies" link in `__root.tsx`**

Find in the footer:
```tsx
<li><a href="#" className="hover:opacity-80">Top Companies</a></li>
```

Replace with:
```tsx
<li><Link to="/companies" className="hover:opacity-80">Top Companies</Link></li>
```

Make sure `Link` is already imported from `@tanstack/react-router` at the top of the file (it is).

- [ ] **Step 3: Fix Top Companies cards in `index.tsx`**

In `index.tsx`, find the "Top Companies Spotlight" section map. Replace the `<a href="#">View Profile</a>` link:

```tsx
// Find this pattern:
<a href="#" className="text-primary hover:underline">View Profile</a>

// Replace with:
<Link to="/companies/$companyId" params={{ companyId: company.name.toLowerCase().replace(/\s+/g, '-') }} className="text-primary hover:underline">View Profile</Link>
```

Also add page title effect at the top of `IndexComponent`:
```tsx
function IndexComponent() {
  const { t } = useTranslation()
  // ... existing state ...

  React.useEffect(() => {
    document.title = t('page_title_home')
  }, [t])

  // rest of component
```

- [ ] **Step 4: Fix View Company button in `jobs/$jobId.tsx`**

In `$jobId.tsx`, find the "View Company" / "Xem thông tin công ty" button. It currently renders as a plain `<button>`. Wrap it with a Link or replace:

```tsx
// Find the button that says t('job_view_company') or similar
// Replace the outer wrapper with:
<Link
  to="/companies/$companyId"
  params={{ companyId: mockJob.company.toLowerCase().replace(/\s+/g, '-') }}
  className="inline-flex ..."
>
  <Building2 className="h-4 w-4" />
  {t('job_view_company')}
</Link>
```

Also add page title effect in the `JobDetailPage` component:
```tsx
React.useEffect(() => {
  document.title = t('page_title_job_detail', { title: mockJob.title, company: mockJob.company })
}, [t])
```

- [ ] **Step 5: Build check**

```bash
pnpm -F web-candidate build
```

---

## Task 6: i18n — Account Pages Hardcoded Strings

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.applications.tsx`
- Modify: `apps/web-candidate/src/routes/_account.assessments.tsx`
- Modify: `apps/web-candidate/src/routes/_account.wishlists.tsx`
- Modify: `apps/web-candidate/src/routes/_account.job-suggestions.tsx`

### 6a — applications.tsx

- [ ] **Step 1: Replace hardcoded chips and status labels**

In `_account.applications.tsx`, replace the top of the file (after imports) up through the `chips` and `statusMap` definitions:

```tsx
// REMOVE these hardcoded definitions:
// const chips = ['Tất cả', 'Đang xử lý', 'Phỏng vấn', 'Từ chối']
// const statusMap: Record<ApplicationStatus, { label: string; className: string }> = { ... }

// ADD after the Route definition, inside the component, get t():
//   const { t } = useTranslation() (already present — just update usages below)
```

Replace the `chips` const (hardcoded) and `statusMap` const with values driven by `t()` inside the component. Find `function ApplicationsPage()` and add inside:

```tsx
function ApplicationsPage() {
  const { t } = useTranslation()
  const [selectedChip, setSelectedChip] = React.useState('all')
  const [query, setQuery] = React.useState('')
  const applications = useCandidateStore((s) => s.appliedJobs)

  React.useEffect(() => {
    document.title = t('page_title_applications')
  }, [t])

  const chips = [
    { key: 'all', label: t('applications_filter_all') },
    { key: 'processing', label: t('applications_filter_processing') },
    { key: 'interview', label: t('applications_filter_interview') },
    { key: 'rejected', label: t('applications_filter_rejected') },
  ]

  const statusMap: Record<string, { label: string; className: string }> = {
    applied: { label: t('application_status_applied'), className: 'border border-border bg-secondary text-secondary-foreground' },
    under_review: { label: t('application_status_under_review'), className: 'border border-warning/20 bg-warning-soft text-warning' },
    interview: { label: t('application_status_interview'), className: 'border border-ai/20 bg-ai-soft text-ai' },
    rejected: { label: t('application_status_rejected'), className: 'border border-danger/20 bg-danger-soft text-danger' },
    offer: { label: t('application_status_offer'), className: 'border border-success/20 bg-success-soft text-success' },
  }

  const filtered = applications.filter((job) => {
    const q = query.trim().toLowerCase()
    const matchText = q === '' || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q)
    if (!matchText) return false
    if (selectedChip === 'all') return true
    if (selectedChip === 'processing') return job.status === 'applied' || job.status === 'under_review' || job.status === 'offer'
    if (selectedChip === 'interview') return job.status === 'interview'
    return job.status === 'rejected'
  })
```

Update the page header:
```tsx
<header className="mb-6">
  <h1 className="text-2xl font-bold text-foreground">{t('applications_page_title')}</h1>
  <p className="mt-1 text-sm text-muted-foreground">{t('applications_count', { count: filtered.length })}</p>
</header>
```

Update the search input placeholder:
```tsx
<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('applications_search_placeholder')} className="h-10 max-w-sm border-input bg-background" />
```

Update chip rendering (replace `chips.map((chip) =>` with the new object shape):
```tsx
{chips.map((chip) => (
  <button
    key={chip.key}
    onClick={() => setSelectedChip(chip.key)}
    className={`rounded-full border px-3 py-1 text-sm ${selectedChip === chip.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
  >
    {chip.label}
  </button>
))}
```

Update status badge rendering — replace `statusMap[job.status].label` and `.className` (the keys are the same so no change needed there, just the chip filter logic uses `.key` now).

### 6b — assessments.tsx

- [ ] **Step 2: Replace hardcoded strings in assessments**

In `_account.assessments.tsx`, replace the `statusLabel` and `filterOptions` constants and the header text. The component already doesn't import `useTranslation` — add the import:

```tsx
import { useTranslation } from '@smart-cv/i18n'
```

Inside `AssessmentsPage()`, add after the state declarations:
```tsx
const { t } = useTranslation()

React.useEffect(() => {
  document.title = t('page_title_assessments')
}, [t])

const statusLabel: Record<AssessmentStatus, string> = {
  'Not started': t('assessments_status_not_started'),
  'In progress': t('assessments_status_in_progress'),
  'Submitted': t('assessments_status_submitted'),
  'Expired': t('assessments_status_expired'),
}

const filterOptions: Array<{ key: 'all' | AssessmentStatus; label: string }> = [
  { key: 'all', label: t('assessments_filter_all') },
  { key: 'Not started', label: t('assessments_filter_not_started') },
  { key: 'In progress', label: t('assessments_filter_in_progress') },
  { key: 'Submitted', label: t('assessments_filter_submitted') },
  { key: 'Expired', label: t('assessments_filter_expired') },
]
```

Replace the page header:
```tsx
<header className="mb-6">
  <h1 className="text-2xl font-bold text-foreground">{t('assessments_page_title')}</h1>
  <p className="mt-1 text-sm text-muted-foreground">{t('assessments_page_subtitle')}</p>
</header>
```

Replace the search input placeholder:
```tsx
<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('assessments_search_placeholder')} className="h-10 max-w-sm" />
```

Replace duration display:
```tsx
// Find: {a.duration} phút
// Replace with:
{t('assessments_minutes', { count: a.duration })}
```

Replace score display:
```tsx
// Find: Điểm: {a.score}/100
// Replace with:
{t('assessments_score', { score: a.score })}
```

Replace expired label:
```tsx
// Find: Đã hết hạn
// Replace with:
{t('assessments_expired_label')}
```

Replace action button labels in the card:
```tsx
// Find: a.status === 'In progress' ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'
// Replace with:
a.status === 'In progress' ? t('assessments_continue') : t('assessments_start')
```

### 6c — wishlists.tsx

- [ ] **Step 3: Replace hardcoded chips in wishlists**

In `_account.wishlists.tsx`, replace the hardcoded `chips` array and add page title. Inside `WishlistsPage()`:

```tsx
React.useEffect(() => {
  document.title = t('page_title_wishlists')
}, [t])

const chips = [
  { key: 'all', label: t('wishlists_filter_all') },
  { key: 'Công nghệ', label: t('wishlists_filter_tech') },
  { key: 'Thiết kế', label: t('wishlists_filter_design') },
  { key: 'Marketing', label: t('wishlists_filter_marketing') },
]
```

Replace `const [selectedChip, setSelectedChip] = React.useState(chips[0])` with:
```tsx
const [selectedChip, setSelectedChip] = React.useState('all')
```

Update chip rendering to use `chip.key` for state and `chip.label` for display:
```tsx
{chips.map((chip) => (
  <button
    key={chip.key}
    onClick={() => setSelectedChip(chip.key)}
    className={`rounded-full border px-3 py-1 text-sm ${selectedChip === chip.key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
  >
    {chip.label}
  </button>
))}
```

Update filter logic to compare against `chip.key` (which is the original Vietnamese category value, matching `job.category`):
```tsx
const matchChip = selectedChip === 'all' || job.category === selectedChip
```

Replace search placeholder:
```tsx
placeholder={t('wishlists_search_placeholder')}
```

### 6d — job-suggestions.tsx

- [ ] **Step 4: Replace hardcoded strings in job-suggestions**

In `_account.job-suggestions.tsx`, add page title effect and update the header. Inside `JobSuggestionsPage()`:

```tsx
React.useEffect(() => {
  document.title = t('page_title_job_suggestions')
}, [t])
```

Replace the page header:
```tsx
<header className="mb-6">
  <h1 className="text-2xl font-bold text-foreground">{t('job_suggestions_page_title')}</h1>
  <p className="mt-1 text-sm text-muted-foreground">{t('job_suggestions_subtitle')}</p>
</header>
```

Replace search placeholder:
```tsx
placeholder={t('job_suggestions_search_placeholder')}
```

The skill chips (`React`, `TypeScript`, etc.) are tech names — leave those as-is since they are proper nouns.

- [ ] **Step 5: Build check**

```bash
pnpm -F web-candidate build
```

Expected: build succeeds with no TypeScript errors.

---

## Task 7: Page Titles — Remaining Routes + About Page i18n

**Files:**
- Modify: `apps/web-candidate/src/routes/about.tsx`
- Modify: `apps/web-candidate/src/routes/signin.tsx`
- Modify: `apps/web-candidate/src/routes/signup.tsx`
- Modify: `apps/web-candidate/src/routes/_account.profile.tsx`
- Modify: `apps/web-candidate/src/routes/_account.cv.tsx`
- Modify: `apps/web-candidate/src/routes/_account.notifications.tsx`
- Modify: `apps/web-candidate/src/routes/_account.settings.tsx`

### 7a — signin.tsx and signup.tsx

- [ ] **Step 1: Add page titles to signin and signup**

In `signin.tsx`, inside `SignInComponent()`, add after the `useTranslation` call:
```tsx
React.useEffect(() => {
  document.title = t('page_title_signin')
}, [t])
```

In `signup.tsx`, inside the signup component function, add:
```tsx
React.useEffect(() => {
  document.title = t('page_title_signup')
}, [t])
```

### 7b — Account pages page titles

- [ ] **Step 2: Add page titles to profile, cv, notifications, settings**

In each of the following files, find the component function and add a `useEffect` for `document.title`. Each file already imports `useTranslation`.

`_account.profile.tsx` — inside `ProfilePage()`:
```tsx
React.useEffect(() => {
  document.title = t('page_title_profile')
}, [t])
```

`_account.cv.tsx` — inside `MyCVPage()`:
```tsx
React.useEffect(() => {
  document.title = t('page_title_cv')
}, [t])
```

`_account.notifications.tsx` — inside `NotificationsPage()`:
```tsx
React.useEffect(() => {
  document.title = t('page_title_notifications')
}, [t])
```

`_account.settings.tsx` — inside `SettingsPage()`:
```tsx
React.useEffect(() => {
  document.title = t('page_title_settings')
}, [t])
```

### 7c — about.tsx full i18n

- [ ] **Step 3: Replace about.tsx with i18n version**

Replace the full content of `apps/web-candidate/src/routes/about.tsx`:

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Award, ShieldCheck, Sparkles, Zap } from 'lucide-react'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  const { t } = useTranslation()

  React.useEffect(() => {
    document.title = t('page_title_about')
  }, [t])

  const features = [
    { icon: <Zap className="h-6 w-6 text-primary" />, title: t('about_feature_apply_title'), desc: t('about_feature_apply_desc') },
    { icon: <Award className="h-6 w-6 text-primary" />, title: t('about_feature_ai_title'), desc: t('about_feature_ai_desc') },
    { icon: <ShieldCheck className="h-6 w-6 text-primary" />, title: t('about_feature_security_title'), desc: t('about_feature_security_desc') },
  ]

  const stats = [
    { value: '50,000+', label: t('about_stats_jobs') },
    { value: '200+', label: t('about_stats_companies') },
    { value: '100,000+', label: t('about_stats_candidates') },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 md:px-6">
      <div className="max-w-3xl space-y-4">
        <Badge variant="secondary" className="gap-1 border-primary/20 bg-primary/10 px-3 py-1 text-primary">
          <Sparkles className="h-3 w-3" />
          {t('about_badge')}
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">{t('about_title')}</h1>
        <p className="text-lg text-muted-foreground">{t('about_subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="card-surface">
            <CardContent className="space-y-3 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">{f.icon}</div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 rounded-2xl border border-border bg-card p-8 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-bold text-primary">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Link to="/signup">
          <Button size="lg">{t('about_cta')}</Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Final build check**

```bash
cd /home/lucchuong/Documents/DO_AN_TOT_NGHIEP/frontend
pnpm -F web-candidate build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 5: Smoke test all routes in browser**

With `pnpm -F web-candidate dev` running, visit:
- http://localhost:3000 — page title shows "Tìm việc lập trình — SmartCV" (VI) or "Find Developer Jobs — SmartCV" (EN)
- http://localhost:3000/companies — grid loads, filters work, pagination works
- http://localhost:3000/companies/innovatehub-vietnam — detail page, tabs switch, related companies link
- http://localhost:3000/companies/unknown-id — 404 message shown
- http://localhost:3000/about — i18n text, language toggle switches EN/VI
- Nav dropdown "Jobs" → "Doanh nghiệp" / "Companies" option navigates to `/companies`
- Footer "Top Companies" → navigates to `/companies`
