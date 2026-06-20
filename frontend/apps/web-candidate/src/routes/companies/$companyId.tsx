import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import {
  Briefcase,
  Building2,
  Clock3,
  DollarSign,
  Globe,
  Heart,
  MapPin,
} from 'lucide-react'
import { useGetById2, useGetCompanyJobs, useGetRelatedCompanies } from '@smart-cv/api'
import type { UserModels } from '@smart-cv/api'

export const Route = createFileRoute('/companies/$companyId')({
  component: CompanyDetailPage,
})

type TabKey = 'overview' | 'jobs'

function CompanyDetailPage() {
  const { t } = useTranslation()
  const { companyId } = Route.useParams()
  const [activeTab, setActiveTab] = React.useState<TabKey>('overview')
  const [jobQuery, setJobQuery] = React.useState('')

  const { data: companyData, isLoading, isError } = useGetById2(companyId)
  const company = companyData?.data

  const { data: relatedData } = useGetRelatedCompanies(companyId)
  const relatedCompanies = relatedData?.data ?? []

  React.useEffect(() => {
    if (company) {
      document.title = t('page_title_company_detail', { name: company.name ?? '' })
    }
  }, [company, t])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading company...</p>
      </div>
    )
  }

  if (isError || !company) {
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

  return (
    <div className="pb-12">
      {/* Cover + Logo header */}
      <div className="relative">
        <div className="h-[160px] w-full bg-muted overflow-hidden">
          {company.coverImageUrl && (
            <img src={company.coverImageUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        {/* Logo: half on cover, half below */}
        <div className="absolute bottom-0 left-5 flex h-[58px] w-[58px] translate-y-1/2 items-center justify-center rounded-xl border-[3px] border-background bg-primary/10 text-lg font-bold text-primary shadow-md overflow-hidden">
          {company.logoUrl
            ? <img src={company.logoUrl} alt={company.name ?? ''} className="h-full w-full object-cover" />
            : (company.name?.slice(0, 2).toUpperCase() ?? '?')}
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
                {[
                  company.industry,
                  company.size ? `${company.size} ${t('company_detail_employees')}` : null,
                  company.location,
                  company.rating != null
                    ? `★ ${company.rating} (${company.reviewCount ?? 0})`
                    : null,
                ].filter(Boolean).join(' · ')}
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
                {t('company_detail_view_jobs', { count: company.activeJobCount ?? 0 })}
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
                      {company.activeJobCount ?? 0}
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
          <JobsTab companyId={companyId} query={jobQuery} onQueryChange={setJobQuery} />
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
  company: UserModels.CompanyResponse
  relatedCompanies: UserModels.CompanyResponse[]
  onViewAllJobs: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      {/* Info chips */}
      <div className="flex flex-wrap gap-2">
        {company.size && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
            <Building2 className="h-4 w-4 text-muted-foreground" /> {company.size} {t('company_detail_employees')}
          </span>
        )}
        {company.location && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" /> {company.location}
          </span>
        )}
        {company.website && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
            <Globe className="h-4 w-4 text-muted-foreground" /> {company.website}
          </span>
        )}
        {company.industry && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">
            <Briefcase className="h-4 w-4 text-muted-foreground" /> {company.industry}
          </span>
        )}
      </div>

      {/* About */}
      {company.description && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">{t('company_detail_about')}</h2>
          <p className="text-muted-foreground leading-relaxed">{company.description}</p>
        </div>
      )}

      {/* Why work here */}
      {(company.benefits ?? []).length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">{t('company_detail_why_work_here')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(company.benefits ?? []).map((benefit) => (
              <div key={benefit} className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
                ✓ {benefit}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related companies */}
      {relatedCompanies.length > 0 && (
        <div className="border-t border-border pt-8">
          <h2 className="mb-4 text-lg font-semibold">{t('company_detail_related')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedCompanies.map((c) => (
              <Link key={c.id} to="/companies/$companyId" params={{ companyId: c.id ?? '' }}>
                <div className="elevate-card rounded-xl border border-border bg-card p-4 text-center hover:shadow-md transition-shadow">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary overflow-hidden">
                    {c.logoUrl
                      ? <img src={c.logoUrl} alt={c.name ?? ''} className="h-full w-full object-cover" />
                      : (c.name?.slice(0, 2).toUpperCase() ?? '?')}
                  </div>
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.industry} · {c.activeJobCount ?? 0} jobs</p>
                  <p className="mt-2 text-xs font-medium text-primary">{t('company_detail_view')} →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Job preview link */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('company_detail_active_jobs')}</h2>
          <button
            onClick={onViewAllJobs}
            className="text-sm text-primary hover:underline"
          >
            {t('company_detail_view_all_jobs', { count: company.activeJobCount ?? 0 })} →
          </button>
        </div>
      </div>
    </div>
  )
}

function JobPreviewCard({ job }: { job: UserModels.JobSummary }) {
  const salaryDisplay = job.salaryMin != null && job.salaryMax != null
    ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
    : job.salaryMin != null
      ? `From $${job.salaryMin.toLocaleString()}`
      : job.salaryMax != null
        ? `Up to $${job.salaryMax.toLocaleString()}`
        : null

  return (
    <Link to="/jobs/$jobId" params={{ jobId: job.id ?? '' }} className="block">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{job.title}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {salaryDisplay && (
              <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{salaryDisplay}</span>
            )}
            {job.location && (
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
            )}
            {job.jobType && (
              <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{job.jobType}</span>
            )}
          </div>
          {(job.skills ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(job.skills ?? []).map((s) => (
                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
              ))}
            </div>
          )}
        </div>
        <Button size="sm" className="shrink-0">Quick Apply</Button>
      </div>
    </Link>
  )
}

function JobsTab({ companyId, query, onQueryChange }: { companyId: string; query: string; onQueryChange: (v: string) => void }) {
  const { t } = useTranslation()
  const { data: jobsData } = useGetCompanyJobs(companyId)
  const allJobs: UserModels.JobSummary[] = jobsData?.data ?? []

  const filtered = allJobs.filter((j) => {
    const q = query.trim().toLowerCase()
    return q === '' || (j.title ?? '').toLowerCase().includes(q) || (j.location ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t('applications_search_placeholder')}
        className="h-10 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="space-y-3">
        {filtered.map((job) => (
          <JobPreviewCard key={job.id} job={job} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t('account_no_results')}</p>
        )}
      </div>
    </div>
  )
}
