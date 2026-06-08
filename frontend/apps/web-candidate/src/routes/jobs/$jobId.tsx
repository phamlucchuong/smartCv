import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent, cn } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Globe,
  Heart,
  Home,
  MapPin,
  Users,
} from 'lucide-react'

export const Route = createFileRoute('/jobs/$jobId')({
  component: JobDetailPage,
})

interface JobDetailMock {
  id: string
  title: string
  company: string
  logoPlaceholder: string
  location: string
  postedAt: string
  salary: string
  deadline: string
  deadlineDaysLeft: number
  experience: string
  level: string
  headcount: number
  jobType: string
  probation: string
  schedule: string
  gender: string
  description: string[]
  requirements: string[]
  skills: string[]
  benefits: string[]
  address: string
  industry: string
  companySize: string
  country: string
}

const mockJob: JobDetailMock = {
  id: 'ke-toan-kho-san-xuat',
  title: 'Kế Toán Kho Sản Xuất Dưới 1 Năm Kinh Nghiệm',
  company: 'Công ty TNHH ABC Manufacturing',
  logoPlaceholder: 'ABC',
  location: 'Đức Hòa, Long An',
  postedAt: 'Đăng 2 ngày trước',
  salary: '8 - 10 triệu',
  deadline: '30/06/2026',
  deadlineDaysLeft: 28,
  experience: 'Dưới 1 năm',
  level: 'Nhân viên',
  headcount: 2,
  jobType: 'Toàn thời gian',
  probation: '2 tháng',
  schedule: 'Hành chính',
  gender: 'Nữ',
  description: [
    'Quản lý kho nguyên vật liệu, thành phẩm',
    'Kiểm kê định kỳ, lập báo cáo tồn kho',
    'Phối hợp với bộ phận sản xuất, kế toán tổng hợp',
    'Sử dụng phần mềm kế toán (MISA, FAST, v.v.)',
    'Theo dõi công nợ nhà cung cấp liên quan đến kho',
  ],
  requirements: [
    'Tốt nghiệp Cao đẳng / Đại học chuyên ngành Kế toán',
    'Kinh nghiệm dưới 1 năm (chấp nhận mới ra trường)',
    'Nữ, ưu tiên cư trú tại Long An',
    'Thành thạo Excel, biết sử dụng phần mềm kế toán',
    'Cẩn thận, trung thực, chịu khó học hỏi',
  ],
  skills: ['Excel', 'MISA', 'Kỹ năng giao tiếp', 'Quản lý kho'],
  benefits: ['BHXH đầy đủ', 'Thưởng lễ Tết', 'Đào tạo nghề', 'Cơm trưa công ty'],
  address: 'Đức Hòa, tỉnh Long An',
  industry: 'Sản xuất / Kho vận',
  companySize: '100 - 500 nhân viên',
  country: 'Việt Nam',
}

const relatedJobs = [
  {
    id: 'ke-toan-tong-hop',
    title: 'Kế Toán Tổng Hợp',
    company: 'Công ty TNHH XYZ',
    salary: '10 - 15 triệu',
    location: 'TP. Hồ Chí Minh',
  },
  {
    id: 'thu-quy',
    title: 'Thủ Quỹ / Kế Toán Quỹ',
    company: 'Công ty CP DEF',
    salary: '8 - 12 triệu',
    location: 'Bình Dương',
  },
  {
    id: 'ke-toan-cong-no',
    title: 'Kế Toán Công Nợ',
    company: 'Tập đoàn GHI',
    salary: '9 - 13 triệu',
    location: 'Long An',
  },
]

function JobDetailPage() {
  // jobId param available for future API integration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { jobId: _jobId } = Route.useParams()
  const { t } = useTranslation()
  const [applied, setApplied] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [showStickyBar, setShowStickyBar] = React.useState(false)
  const heroRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    document.title = t('page_title_job_detail', { title: mockJob.title, company: mockJob.company })
  }, [t])

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative pb-20 lg:pb-0">
      {/* Sticky mini bar — appears when hero card scrolls out of view */}
      <div
        className={cn(
          'fixed top-20 left-0 right-0 z-30 bg-card border-b border-border shadow-sm px-4 py-3 transition-transform duration-200',
          showStickyBar ? 'translate-y-0' : '-translate-y-[200%] pointer-events-none'
        )}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-foreground truncate max-w-[60%]">{mockJob.title}</span>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className={cn('border-primary text-primary', saved && 'bg-primary/5')}
              onClick={() => setSaved((v) => !v)}
            >
              <Heart className={cn('h-3.5 w-3.5 mr-1.5', saved && 'fill-current')} />
              {saved ? t('job_saved') : t('job_save')}
            </Button>
            <Button
              size="sm"
              className={cn(
                applied ? 'bg-muted text-muted-foreground border border-border hover:bg-muted' : 'bg-primary text-primary-foreground'
              )}
              onClick={() => setApplied((v) => !v)}
            >
              {applied
                ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />{t('job_applied')}</>
                : t('job_apply_now')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Breadcrumb */}
        <nav className="py-3 border-b border-border bg-muted/30 -mx-4 px-4 md:-mx-6 md:px-6 mb-6">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
            <li>
              <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
                Home
              </Link>
            </li>
            <li><ChevronRight className="h-3.5 w-3.5" /></li>
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">{t('job_find_jobs')}</Link>
            </li>
            <li><ChevronRight className="h-3.5 w-3.5" /></li>
            <li className="font-medium text-foreground truncate max-w-[200px]">{mockJob.title}</li>
          </ol>
        </nav>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main content */}
          <div className="space-y-6">
            {/* Hero Card */}
            <div ref={heroRef}>
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl border border-border bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                      {mockJob.logoPlaceholder}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold text-foreground">{mockJob.title}</h1>
                      <a href="#" className="text-base font-medium text-primary hover:underline">{mockJob.company}</a>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />{mockJob.location}
                        </span>
                        <span className="text-xs text-muted-foreground">{mockJob.postedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary inline-flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />{mockJob.salary}
                    </span>
                    <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />{t('job_days_left', { days: mockJob.deadlineDaysLeft })}
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />{mockJob.experience}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-5">
                    <Button
                      className={cn(
                        'h-11 px-8 rounded-xl',
                        applied
                          ? 'bg-muted text-muted-foreground border border-border hover:bg-muted'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                      onClick={() => setApplied((v) => !v)}
                    >
                      {applied
                        ? <><CheckCircle2 className="h-4 w-4 mr-2" />{t('job_applied')}</>
                        : t('job_apply_now')}
                    </Button>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-11 px-6 rounded-xl border-primary text-primary',
                        saved && 'bg-primary/5'
                      )}
                      onClick={() => setSaved((v) => !v)}
                    >
                      <Heart className={cn('h-4 w-4 mr-2', saved && 'fill-current')} />
                      {saved ? t('job_saved') : t('job_save')}
                    </Button>
                  </div>

                  <p className="mt-3 text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('job_deadline_warning', { date: mockJob.deadline })}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Job Description */}
            <Card className="border-border bg-card">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">{t('job_description')}</h2>
                <hr className="border-border" />
                <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-foreground leading-7">
                  {mockJob.description.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Candidate Requirements */}
            <Card className="border-border bg-card">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">{t('job_requirements')}</h2>
                <hr className="border-border" />
                <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-foreground leading-7">
                  {mockJob.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{t('job_required_skills')}:</p>
                  <div className="flex flex-wrap gap-2">
                    {mockJob.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="border-border bg-card">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">{t('job_benefits')}</h2>
                <hr className="border-border" />
                <div className="grid grid-cols-2 gap-2">
                  {mockJob.benefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
                    >
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Working Location */}
            <Card className="border-border bg-card">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">{t('job_location')}</h2>
                <hr className="border-border" />
                <p className="text-sm text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  {mockJob.address}
                </p>
                <div className="rounded-xl bg-muted h-48 flex items-center justify-center text-muted-foreground text-sm">
                  {t('job_map_placeholder')}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Job Overview Card */}
            <Card className="border-border bg-card sticky top-20">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold text-foreground mb-2">{t('job_overview')}</h3>
                <hr className="border-border mb-3" />
                <div className="space-y-0">
                  {[
                    { icon: Calendar, label: t('job_overview_deadline'), value: mockJob.deadline },
                    { icon: DollarSign, label: t('job_overview_salary'), value: mockJob.salary },
                    { icon: Briefcase, label: t('job_overview_experience'), value: mockJob.experience },
                    { icon: Users, label: t('job_overview_level'), value: mockJob.level },
                    { icon: Users, label: t('job_overview_headcount'), value: `${mockJob.headcount} người` },
                    { icon: Briefcase, label: t('job_overview_type'), value: mockJob.jobType },
                    { icon: Clock, label: t('job_overview_probation'), value: mockJob.probation },
                    { icon: Clock, label: t('job_overview_schedule'), value: mockJob.schedule },
                    { icon: Users, label: t('job_overview_gender'), value: mockJob.gender },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start justify-between text-sm py-2 border-b border-border last:border-0">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        {label}
                      </span>
                      <span className="font-medium text-foreground text-right max-w-[55%]">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Company Info Card */}
            <Card className="border-border bg-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border border-border bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                    {mockJob.logoPlaceholder}
                  </div>
                  <p className="font-semibold text-foreground text-sm">{mockJob.company}</p>
                </div>
                <hr className="border-border" />
                {[
                  { icon: Building2, label: t('job_company_industry'), value: mockJob.industry },
                  { icon: Users, label: t('job_company_size'), value: mockJob.companySize },
                  { icon: Globe, label: t('job_company_country'), value: mockJob.country },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      {label}
                    </span>
                    <span className="font-medium text-foreground text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
                <Link
                  to="/companies/$companyId"
                  params={{ companyId: mockJob.company.toLowerCase().replace(/\s+/g, '-') }}
                  className="block w-full mt-1"
                >
                  <Button variant="outline" className="w-full border-primary text-primary">
                    {t('job_view_company')} →
                  </Button>
                </Link>
                <a href="#" className="block text-center text-xs text-muted-foreground hover:text-foreground">
                  {t('job_report')}
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Jobs — full-width below two-column layout */}
        <div className="mt-10 mb-6 space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">{t('job_related')}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedJobs.map((job) => (
              <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id }} className="block">
                <Card className="border-border bg-card hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary font-medium">
                        <DollarSign className="h-3 w-3" />{job.salary}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />{job.location}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky apply bar — hidden on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-3 flex items-center justify-between lg:hidden">
        <div>
          <p className="text-sm font-semibold text-foreground">{mockJob.salary}</p>
          <p className="text-xs text-destructive">{t('job_days_left', { days: mockJob.deadlineDaysLeft })}</p>
        </div>
        <Button
          className={cn(
            'h-10 px-6 rounded-xl',
            applied
              ? 'bg-muted text-muted-foreground border border-border hover:bg-muted'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          onClick={() => setApplied((v) => !v)}
        >
          {applied
            ? <><CheckCircle2 className="h-4 w-4 mr-1.5" />{t('job_applied')}</>
            : t('job_apply_now')}
        </Button>
      </div>
    </div>
  )
}
