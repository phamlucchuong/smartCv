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
  Heart,
  Home,
  MapPin,
} from 'lucide-react'
import { useGetJobById, useGetRelatedJobs } from '@smart-cv/api'

export const Route = createFileRoute('/jobs/$jobId')({
  component: JobDetailPage,
})

function JobDetailPage() {
  const { jobId } = Route.useParams()
  const { t } = useTranslation()
  const [applied, setApplied] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [showStickyBar, setShowStickyBar] = React.useState(false)
  const heroRef = React.useRef<HTMLDivElement>(null)

  const { data: jobData, isLoading, isError } = useGetJobById(jobId)
  const job = jobData?.data

  const { data: relatedData } = useGetRelatedJobs(jobId)
  const relatedJobs = relatedData?.data ?? []

  React.useEffect(() => {
    if (job) {
      document.title = t('page_title_job_detail', { title: job.title ?? '', company: job.company ?? '' })
    }
  }, [job, t])

  const [todayMs] = React.useState(() => Date.now())

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl font-black text-foreground">404</p>
          <p className="mt-2 text-muted-foreground">Job not found.</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const deadlineDaysLeft = job.deadline
    ? Math.max(0, Math.ceil((new Date(job.deadline).getTime() - todayMs) / (1000 * 60 * 60 * 24)))
    : null

  const salaryDisplay = job.salaryMin != null && job.salaryMax != null
    ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
    : job.salaryMin != null
      ? `From $${job.salaryMin.toLocaleString()}`
      : job.salaryMax != null
        ? `Up to $${job.salaryMax.toLocaleString()}`
        : null

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
          <span className="text-sm font-semibold text-foreground truncate max-w-[60%]">{job.title}</span>
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
            <li className="font-medium text-foreground truncate max-w-[200px]">{job.title}</li>
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
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                      <a href="#" className="text-base font-medium text-primary hover:underline">{job.company}</a>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {job.location && (
                          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />{job.location}
                          </span>
                        )}
                        {job.createdAt && (
                          <span className="text-xs text-muted-foreground">
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {salaryDisplay && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary inline-flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />{salaryDisplay}
                      </span>
                    )}
                    {deadlineDaysLeft != null && (
                      <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />{t('job_days_left', { days: deadlineDaysLeft })}
                      </span>
                    )}
                    {job.experienceLevel && (
                      <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground inline-flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />{job.experienceLevel}
                      </span>
                    )}
                    {job.jobType && (
                      <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />{job.jobType}
                      </span>
                    )}
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

                  {job.deadline && (
                    <p className="mt-3 text-sm text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t('job_deadline_warning', { date: new Date(job.deadline).toLocaleDateString() })}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Job Description */}
            {job.description && (
              <Card className="border-border bg-card">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">{t('job_description')}</h2>
                  <hr className="border-border" />
                  <div className="text-[15px] text-foreground leading-7 whitespace-pre-line">{job.description}</div>
                </CardContent>
              </Card>
            )}

            {/* Candidate Requirements */}
            {((job.requirements ?? []).length > 0 || (job.skills ?? []).length > 0) && (
              <Card className="border-border bg-card">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">{t('job_requirements')}</h2>
                  <hr className="border-border" />
                  {(job.requirements ?? []).length > 0 && (
                    <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-foreground leading-7">
                      {(job.requirements ?? []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {(job.skills ?? []).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">{t('job_required_skills')}:</p>
                      <div className="flex flex-wrap gap-2">
                        {(job.skills ?? []).map((skill) => (
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
                  )}
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {(job.benefits ?? []).length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">{t('job_benefits')}</h2>
                  <hr className="border-border" />
                  <div className="grid grid-cols-2 gap-2">
                    {(job.benefits ?? []).map((benefit) => (
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
            )}

            {/* Working Location */}
            {job.location && (
              <Card className="border-border bg-card">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">{t('job_location')}</h2>
                  <hr className="border-border" />
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    {job.location}
                  </p>
                  <div className="rounded-xl bg-muted h-48 flex items-center justify-center text-muted-foreground text-sm">
                    {t('job_map_placeholder')}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Job Overview Card */}
            <Card className="border-border bg-card sticky top-20">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold text-foreground mb-2">{t('job_overview')}</h3>
                <hr className="border-border mb-3" />
                <div className="space-y-0">
                  {([
                    job.deadline ? { icon: Calendar, label: t('job_overview_deadline'), value: new Date(job.deadline).toLocaleDateString() } : null,
                    salaryDisplay ? { icon: DollarSign, label: t('job_overview_salary'), value: salaryDisplay } : null,
                    job.experienceLevel ? { icon: Briefcase, label: t('job_overview_experience'), value: job.experienceLevel } : null,
                    job.jobType ? { icon: Briefcase, label: t('job_overview_type'), value: job.jobType } : null,
                  ] as ({ icon: typeof Calendar; label: string; value: string } | null)[])
                    .filter((item): item is { icon: typeof Calendar; label: string; value: string } => item !== null)
                    .map(({ icon: Icon, label, value }) => (
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
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground text-sm">{job.company}</p>
                </div>
                <hr className="border-border" />
                <Link
                  to="/companies/$companyId"
                  params={{ companyId: job.recruiterId ?? job.company?.toLowerCase().replace(/\s+/g, '-') ?? '' }}
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
            {relatedJobs.map((rJob) => (
              <Link key={rJob.id} to="/jobs/$jobId" params={{ jobId: rJob.id ?? '' }} className="block">
                <Card className="border-border bg-card hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{rJob.title}</h3>
                      <p className="text-sm text-muted-foreground">{rJob.company}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {(rJob.salaryMin != null || rJob.salaryMax != null) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary font-medium">
                          <DollarSign className="h-3 w-3" />
                          {rJob.salaryMin != null && rJob.salaryMax != null
                            ? `$${rJob.salaryMin.toLocaleString()} - $${rJob.salaryMax.toLocaleString()}`
                            : rJob.salaryMin != null
                              ? `From $${rJob.salaryMin.toLocaleString()}`
                              : `Up to $${rJob.salaryMax!.toLocaleString()}`}
                        </span>
                      )}
                      {rJob.location && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />{rJob.location}
                        </span>
                      )}
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
          {salaryDisplay && <p className="text-sm font-semibold text-foreground">{salaryDisplay}</p>}
          {deadlineDaysLeft != null && <p className="text-xs text-destructive">{t('job_days_left', { days: deadlineDaysLeft })}</p>}
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
