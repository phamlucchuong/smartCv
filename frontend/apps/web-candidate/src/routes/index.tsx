import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import {
  ArrowRight,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Building2,
  ChartColumn,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  Layers3,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  useGetHotJobs,
  useGetTopCompanies,
  useGetStats,
  useGetCategories,
  useGetTestimonials,
  useGetResources,
  useGetFaqs,
  useGetActiveJobs,
  useGetAll3,
  useSubmit,
  useListCvs,
} from '@smart-cv/api'
import { toast } from 'sonner'
import { hasCandidateRole, useAuthStore } from '../store/useAuthStore'

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  REMOTE: 'Remote',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
}

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return ''
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim()
    // Handle date-only strings like YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split('-')
      return `${day}/${month}/${year}`
    }
    // Handle ISO date-time strings by extracting the date part
    if (cleanStr.includes('T')) {
      const datePart = cleanStr.split('T')[0]
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [year, month, day] = datePart.split('-')
        return `${day}/${month}/${year}`
      }
    }
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function IndexComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = React.useState(1)
  const aiMatchScore = 82

  const { isAuthenticated, role } = useAuthStore()
  const isCandidate = isAuthenticated && hasCandidateRole(role)

  const { data: hotJobsData, isLoading: isHotJobsLoading } = useGetHotJobs()
  const jobs = hotJobsData?.data ?? []

  const { data: allJobsData, isLoading: isAllJobsLoading } = useGetActiveJobs({ page: 0, size: 6 })
  const allJobsPreview = allJobsData?.data?.items ?? []

  const { data: cvsData } = useListCvs({
    query: { enabled: isCandidate },
  })
  const cvList = cvsData?.data ?? []

  const submitMutation = useSubmit()

  function handleQuickApply(e: React.MouseEvent, jobId: string) {
    e.preventDefault()
    e.stopPropagation()

    if (!isCandidate) {
      navigate({ to: '/signin' })
      return
    }

    if (cvList.length === 0) {
      toast.error('Bạn chưa có CV nào. Vui lòng tải lên CV trước khi ứng tuyển.')
      navigate({ to: '/cv' })
      return
    }

    const defaultCv = cvList.find((c) => c.default) ?? cvList[0]
    if (!defaultCv?.url) {
      toast.error('CV của bạn không hợp lệ. Vui lòng kiểm tra lại.')
      navigate({ to: '/cv' })
      return
    }

    submitMutation.mutate(
      { data: { jobId, cvUrl: defaultCv.url } },
      {
        onSuccess: () => {
          toast.success('Ứng tuyển nhanh thành công!')
        },
        onError: () => {
          toast.error('Có lỗi xảy ra khi ứng tuyển. Vui lòng thử lại.')
        }
      }
    )
  }

  const { data: companiesListData, isLoading: isCompaniesListLoading } = useGetAll3({ page: 1, size: 6 })
  const companiesListPreview = companiesListData?.data?.items ?? []

  const { data: companiesData, isLoading: isCompaniesLoading } = useGetTopCompanies()
  const topCompanies = companiesData?.data ?? []

  const { data: statsData, isLoading: isStatsLoading } = useGetStats()
  const stats = statsData?.data

  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCategories()
  const categories = categoriesData?.data ?? []

  const { data: testimonialsData } = useGetTestimonials()
  const testimonials = testimonialsData?.data ?? []

  const { data: resourcesData } = useGetResources()
  const resources = resourcesData?.data ?? []

  const { data: faqsData } = useGetFaqs()
  const faqs = faqsData?.data ?? []

  const jobsPerPage = 6
  const totalPages = Math.max(1, Math.ceil(jobs.length / jobsPerPage))
  const paginatedJobs = jobs.slice((page - 1) * jobsPerPage, page * jobsPerPage)

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const q = (fd.get('q') as string) || undefined
    const location = (fd.get('location') as string) || undefined
    navigate({ to: '/jobs', search: { q, location, page: 1 } })
  }

  React.useEffect(() => {
    document.title = t('page_title_home')
  }, [t])

  return (
    <div className="space-y-12 pb-12">
      <section className="relative overflow-hidden border-y border-border" aria-label="Hero Banner">
        <div className="absolute inset-0 ai-gradient opacity-60 pointer-events-none" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ai/20 bg-ai-soft px-3 py-1 text-xs font-medium text-ai">
              <Sparkles className="h-3.5 w-3.5" /> Powered by AI Matching Engine
            </div>
            <h1 className="hero-title text-4xl font-bold leading-tight md:text-5xl">
              {t('hero_title_before')} <span className="hero-gradient">{t('hero_title_highlight')}</span>
            </h1>
            <p className="mt-5 text-base text-muted-foreground md:text-lg">{t('hero_subtitle')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" className="gap-2">{t('search_jobs')} <ArrowRight className="h-4 w-4" /></Button>
              <Button size="lg" variant="outline">Đăng tuyển dụng</Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {isStatsLoading ? '...' : `${(stats?.activeJobs ?? 0).toLocaleString()}+ việc làm`}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {isStatsLoading ? '...' : `${(stats?.activeCompanies ?? 0).toLocaleString()}+ doanh nghiệp`}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="card-surface relative z-10 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">AI Match Result</div>
                  <div className="text-lg font-semibold">Backend Java Developer</div>
                  <div className="text-sm text-muted-foreground">FPT Software</div>
                </div>
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold text-success"
                  style={{
                    background: `conic-gradient(from 180deg, var(--success) 0deg ${aiMatchScore * 3.6}deg, color-mix(in oklch, var(--success) 14%, white) ${aiMatchScore * 3.6}deg 360deg)`,
                  }}
                >
                  <div className="flex h-[calc(100%-12px)] w-[calc(100%-12px)] items-center justify-center rounded-full bg-card">
                    {aiMatchScore}%
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 text-xs text-muted-foreground">Kỹ năng phù hợp</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Java', 'REST API', 'MySQL'].map((s) => (
                      <span key={s} className="rounded-md border border-success/20 bg-success-soft px-2 py-0.5 text-xs text-success">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs text-muted-foreground">Kỹ năng còn thiếu</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Spring Boot', 'Docker'].map((s) => (
                      <span key={s} className="rounded-md border border-danger/20 bg-danger-soft px-2 py-0.5 text-xs text-danger">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-ai/20 bg-ai-soft p-3 text-xs text-foreground/80">
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-ai">
                    <Sparkles className="h-3.5 w-3.5" /> 5 việc khác phù hợp hơn được gợi ý
                  </div>
                  Hãy cải thiện Spring Boot và Docker để tăng cơ hội.
                </div>
              </div>
            </div>
            <div className="absolute -right-8 -top-10 z-20 hidden items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai text-ai-foreground"><Brain className="h-4 w-4" /></div>
              <div className="text-xs"><div className="font-semibold">AI Analysis</div><div className="text-muted-foreground">Live</div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 md:px-6">
        <section className="relative -mt-4" aria-label="Job Search Engine">
          <form onSubmit={handleSearch} className="grid gap-3 rounded-2xl card-surface p-3 md:grid-cols-[1fr_220px_150px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" placeholder={t('search_placeholder')} className="h-11 border-input bg-background pl-9" />
            </div>
            <Input name="location" placeholder={t('search_location')} className="h-11 border-input bg-background" />
            <Button type="submit" className="h-11">{t('search_jobs')}</Button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('hot_tech')}</span>
            {['React', 'Node.js', 'Python', 'Docker', 'Go', 'Kubernetes'].map((item) => (
              <Badge key={item} variant="secondary" className="bg-secondary/90 text-secondary-foreground">{item}</Badge>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Platform Stats">
          <Card className="card-surface">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Open jobs</p>
              {isStatsLoading ? <div className="mt-2 h-9 w-20 animate-pulse rounded bg-muted/40" /> : <p className="mt-2 text-3xl font-bold">{(stats?.activeJobs ?? 0).toLocaleString()}</p>}
            </CardContent>
          </Card>
          <Card className="card-surface">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Hiring companies</p>
              {isStatsLoading ? <div className="mt-2 h-9 w-16 animate-pulse rounded bg-muted/40" /> : <p className="mt-2 text-3xl font-bold">{(stats?.activeCompanies ?? 0).toLocaleString()}</p>}
            </CardContent>
          </Card>
          <Card className="card-surface">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg response time</p>
              <p className="mt-2 text-3xl font-bold">36h</p>
            </CardContent>
          </Card>
          <Card className="card-surface">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Remote roles</p>
              {isStatsLoading ? <div className="mt-2 h-9 w-16 animate-pulse rounded bg-muted/40" /> : <p className="mt-2 text-3xl font-bold">{(stats?.remoteJobs ?? 0).toLocaleString()}</p>}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4" aria-label="Popular Categories">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Popular Categories</h2>
            <a href="#" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">View all categories <ChevronRight className="h-4 w-4" /></a>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isCategoriesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border p-5 h-32 bg-muted/30" />
              ))
            ) : categories.length === 0 ? (
              [
                { name: 'Frontend Engineering', icon: Layers3 },
                { name: 'Backend Engineering', icon: BriefcaseBusiness },
                { name: 'Data & AI', icon: ChartColumn },
                { name: 'DevOps / Cloud', icon: TrendingUp },
              ].map((category) => {
                const Icon = category.icon
                return (
                  <Card key={category.name} className="elevate-card card-surface">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary"><Icon className="h-5 w-5" /></div>
                      <h3 className="text-base font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">— open positions</p>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              categories.map((category) => (
                <Card key={category.name} className="elevate-card card-surface">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary"><Layers3 className="h-5 w-5" /></div>
                    <h3 className="text-base font-semibold">{JOB_TYPE_LABELS[category.name ?? ''] ?? category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.jobCount ?? 0} open positions this week</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <section id="remote-jobs" className="space-y-4" aria-label="Featured and Hot Jobs">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Việc làm nổi bật</h2>
            <Link to="/jobs" search={{ q: undefined, location: undefined, page: 1 }} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isHotJobsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border p-5 h-48 bg-muted/30" />
              ))
            ) : paginatedJobs.length === 0 ? (
              <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">No featured jobs available right now.</p>
            ) : paginatedJobs.map((job) => (
              <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id ?? '' }} className="block">
                <article className="elevate-card rounded-2xl card-surface p-5 h-full flex flex-col">
                  <div className="flex-1">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border" onClick={(e) => e.preventDefault()}>☆</Button>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2 text-xs">
                      {(job.salaryMin != null || job.salaryMax != null) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {job.salaryMin != null && job.salaryMax != null
                            ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                            : job.salaryMin != null
                              ? `From $${job.salaryMin.toLocaleString()}`
                              : `Up to $${job.salaryMax!.toLocaleString()}`}
                        </span>
                      )}
                      {job.location && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                      )}
                      {job.openings != null && job.openings > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1"><Users className="h-3.5 w-3.5" />{job.openings} vị trí</span>
                      )}
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {(job.skills ?? []).map((skill) => <Badge key={skill} variant="outline" className="border-border text-xs">{skill}</Badge>)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground mt-4">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {job.createdAt ? `Posted ${formatDate(job.createdAt)}` : 'Recently posted'}
                    </span>
                    <Button size="sm" onClick={(e) => handleQuickApply(e, job.id ?? '')} disabled={submitMutation.isPending}>Quick Apply</Button>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {!isHotJobsLoading && jobs.length > 0 && <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-white/5 p-4 text-sm md:flex-row">
            <p className="text-muted-foreground">Page {page} of {totalPages} • Showing {(page - 1) * jobsPerPage + 1}–{Math.min(page * jobsPerPage, jobs.length)} of {jobs.length} jobs</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border-border bg-white/5">
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx + 1}
                  size="sm"
                  variant={page === idx + 1 ? 'default' : 'outline'}
                  onClick={() => setPage(idx + 1)}
                  className={page === idx + 1 ? '' : 'border-border bg-white/5'}
                >
                  {idx + 1}
                </Button>
              ))}
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="border-border bg-white/5">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>}
        </section>

        {/* <section id="companies" className="space-y-4" aria-label="Top Companies Spotlight">
        <h2 className="text-2xl font-semibold">Top Companies Spotlight</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isCompaniesLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border h-52 bg-muted/30" />
            ))
          ) : topCompanies.length === 0 ? (
            <p className="col-span-4 py-8 text-center text-sm text-muted-foreground">No companies to show right now.</p>
          ) : topCompanies.map((company) => (
            <HomeCompanyCard key={company.recruiterId ?? company.name} company={company} />
          ))}
        </div>
      </section> */}

        <section className="space-y-4" aria-label="Top Companies Spotlight">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Top Companies Spotlight</h2>
            <Link to="/companies" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isCompaniesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border h-40 bg-muted/30" />
              ))
            ) : topCompanies.length === 0 ? (
              <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">No companies to show right now.</p>
            ) : topCompanies.map((company) => (
              <HomeCompanyCard key={company.companyId ?? company.recruiterId} company={company} />
            ))}
          </div>
        </section>

        <section className="space-y-4" aria-label="All Jobs Preview">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Tất cả việc làm</h2>
            <Link to="/jobs" search={{ q: undefined, location: undefined, page: 1 }} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isAllJobsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border p-5 h-48 bg-muted/30" />
              ))
            ) : allJobsPreview.length === 0 ? (
              <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">No jobs available right now.</p>
            ) : allJobsPreview.map((job) => (
              <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id ?? '' }} className="block">
                <article className="elevate-card rounded-2xl card-surface p-5 h-full flex flex-col">
                  <div className="flex-1">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                      </div>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2 text-xs">
                      {(job.salaryMin != null || job.salaryMax != null) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {job.salaryMin != null && job.salaryMax != null
                            ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                            : job.salaryMin != null
                              ? `From $${job.salaryMin.toLocaleString()}`
                              : `Up to $${job.salaryMax!.toLocaleString()}`}
                        </span>
                      )}
                      {job.location && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                      )}
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {(job.skills ?? []).map((skill) => <Badge key={skill} variant="outline" className="border-border text-xs">{skill}</Badge>)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground mt-4">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {job.createdAt ? `Posted ${formatDate(job.createdAt)}` : 'Recently posted'}
                    </span>
                    <Button size="sm" onClick={(e) => handleQuickApply(e, job.id ?? '')} disabled={submitMutation.isPending}>Quick Apply</Button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4" aria-label="Company List Preview">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Danh sách công ty</h2>
            <Link to="/companies" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isCompaniesListLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border h-40 bg-muted/30" />
              ))
            ) : companiesListPreview.length === 0 ? (
              <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">No companies to show right now.</p>
            ) : companiesListPreview.map((company) => (
              <HomeCompanyCard key={company.id} company={company} />
            ))}
          </div>
        </section>

        <section id="salary-insights" className="grid gap-4 lg:grid-cols-[1.2fr_1fr]" aria-label="Salary and Career Insights">
          <Card className="border border-border bg-card/95">
            <CardContent className="space-y-4 p-6">
              <p className="inline-flex items-center gap-2 text-sm text-primary"><Sparkles className="h-4 w-4" /> Salary Insights</p>
              <h3 className="text-xl font-semibold">2026 Vietnam Tech Salary Snapshot</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2"><span>Frontend Engineer (Mid)</span><strong className="text-foreground">$1,500 - $2,300</strong></p>
                <p className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2"><span>Backend Engineer (Senior)</span><strong className="text-foreground">$2,500 - $3,800</strong></p>
                <p className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2"><span>DevOps Engineer</span><strong className="text-foreground">$2,200 - $3,500</strong></p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card/95">
            <CardContent className="space-y-4 p-6">
              <p className="inline-flex items-center gap-2 text-sm text-primary"><TrendingUp className="h-4 w-4" /> Career Momentum</p>
              <h3 className="text-xl font-semibold">Most Requested Skills by Employers</h3>
              <div className="flex flex-wrap gap-2">
                {['TypeScript', 'System Design', 'AWS', 'Kubernetes', 'GraphQL', 'Data Modeling', 'Prompt Engineering'].map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border">{tag}</Badge>
                ))}
              </div>
              <Button variant="outline" className="w-full border-border bg-white/5">Download Salary Report</Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4" aria-label="Candidate Success Stories">
          <h2 className="text-2xl font-semibold">Candidate Success Stories</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.id ?? item.name} className="card-surface">
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm leading-6 text-muted-foreground">"{item.quote}"</p>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="internships" className="space-y-4" aria-label="How It Works">
          <h2 className="text-2xl font-semibold">How SmartCV Works</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { step: '1', title: 'Create your profile', desc: 'Add your skills, projects, and preferred role in under 10 minutes.' },
              { step: '2', title: 'Get curated matches', desc: 'Receive job recommendations based on stack, level, and salary expectations.' },
              { step: '3', title: 'Apply and track', desc: 'Submit applications quickly and track interview status in one dashboard.' },
            ].map((item) => (
              <Card key={item.step} className="card-surface">
                <CardContent className="space-y-3 p-5">
                  <Badge className="bg-primary/20 text-primary">Step {item.step}</Badge>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="resources" className="space-y-4" aria-label="Career Resources">
          <h2 className="text-2xl font-semibold">Career Resources & Blog Hub</h2>
          <div id="cv-templates" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.id ?? resource.title} className="card-surface">
                <CardContent className="p-5">
                  <p className="mb-3 inline-flex items-center gap-1 text-xs text-primary"><BookOpen className="h-3.5 w-3.5" />{resource.category ?? 'Career Guide'}</p>
                  <h3 className="text-base font-semibold">{resource.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="interview-guides" className="space-y-4" aria-label="FAQ">
          <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((item) => (
              <Card key={item.id ?? item.question} className="card-surface">
                <CardContent className="space-y-2 p-5">
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

interface HomeCompanyCardProps {
  company: {
    id?: string;
    companyId?: string;
    recruiterId?: string;
    name?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    industry?: string;
    location?: string;
  };
}

function HomeCompanyCard({ company }: HomeCompanyCardProps) {
  const companyId = company.id ?? company.companyId ?? '';
  return (
    <Link to="/companies/$companyId" params={{ companyId }} className="block">
      <Card className="elevate-card overflow-hidden border border-border bg-card h-full flex flex-col">
        <div className="h-20 bg-muted overflow-hidden relative shrink-0">
          {company.coverImageUrl ? (
            <img src={company.coverImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/70 to-brand-blue/70" />
          )}
        </div>
        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="relative z-10 -mt-9 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name ?? ''} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="h-4 w-4 text-primary" />
              )}
            </div>
            <h3 className="text-base font-semibold">{company.name}</h3>
            {company.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {company.location}
              </p>
            )}
            {company.industry && (
              <Badge variant="outline" className="text-xs">{company.industry}</Badge>
            )}
          </div>
          <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
            Xem thông tin
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}
