import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Clock3, DollarSign, MapPin } from 'lucide-react'
import { useGetMyApplications } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'

export const Route = createFileRoute('/_account/applications')({
  component: ApplicationsPage,
})

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'Applied',      className: 'border border-border bg-secondary text-secondary-foreground' },
  REVIEWING: { label: 'Under Review', className: 'border border-warning/20 bg-warning-soft text-warning' },
  ACCEPTED:  { label: 'Offer',        className: 'border border-success/20 bg-success-soft text-success' },
  REJECTED:  { label: 'Rejected',     className: 'border border-danger/20 bg-danger-soft text-danger' },
  WITHDRAWN: { label: 'Withdrawn',    className: 'border border-border bg-secondary text-secondary-foreground' },
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Negotiable'
  if (min && max) return `${(min / 1_000_000).toFixed(0)}–${(max / 1_000_000).toFixed(0)}M`
  if (min) return `${(min / 1_000_000).toFixed(0)}M+`
  return `Up to ${((max ?? 0) / 1_000_000).toFixed(0)}M`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  } catch {
    return dateStr
  }
}

function ApplicationsPage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { data, isLoading, isError } = useGetMyApplications(undefined, { query: { enabled: isAuthenticated } })
  const applications = data?.data?.items ?? []

  const [selectedChip, setSelectedChip] = React.useState('all')
  const [query, setQuery] = React.useState('')

  React.useEffect(() => {
    document.title = t('page_title_applications')
  }, [t])

  const chips = [
    { key: 'all', label: t('applications_filter_all') },
    { key: 'processing', label: t('applications_filter_processing') },
    { key: 'rejected', label: t('applications_filter_rejected') },
  ]

  const filtered = applications.filter((job) => {
    const q = query.trim().toLowerCase()
    const matchText = q === '' || (job.jobTitle ?? '').toLowerCase().includes(q) || (job.companyName ?? '').toLowerCase().includes(q)

    if (!matchText) return false
    if (selectedChip === 'all') return true
    if (selectedChip === 'processing') return job.status === 'PENDING' || job.status === 'REVIEWING' || job.status === 'ACCEPTED'
    return job.status === 'REJECTED' || job.status === 'WITHDRAWN'
  })

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading applications...</div>
  if (isError) return <div className="p-8 text-center text-destructive">Failed to load applications.</div>

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('applications_page_title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('applications_count', { count: filtered.length })}</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('applications_search_placeholder')} className="h-10 max-w-sm border-input bg-background" />
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setSelectedChip(chip.key)}
              className={selectedChip === chip.key ? 'cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground' : 'cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:bg-muted/50'}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">{t('account_no_results')}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => {
            const statusKey = job.status ?? 'PENDING'
            const statusInfo = statusMap[statusKey] ?? { label: statusKey, className: 'border border-border bg-secondary text-secondary-foreground' }
            const initials = (job.companyLogoInitials ?? (job.companyName ?? '').slice(0, 2).toUpperCase())
            const salary = formatSalary(job.salaryMin, job.salaryMax)
            return (
              <article key={job.id} className="elevate-card card-surface rounded-2xl p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-xs font-bold text-muted-foreground">{initials}</div>
                    <div>
                      <h3 className="text-base font-semibold">{job.jobTitle}</h3>
                      <p className="text-sm text-muted-foreground">{job.companyName}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.className}`}>{statusInfo.label}</span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1"><DollarSign className="h-3.5 w-3.5" />{salary}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{job.jobLocation}</span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {(job.jobSkills ?? []).map((skill) => <Badge key={skill} variant="outline" className="border-border bg-secondary/70 text-xs text-secondary-foreground">{skill}</Badge>)}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDate(job.appliedAt)}</span>
                  <Link to="/jobs/$jobId" params={{ jobId: job.jobId ?? job.id ?? '' }}>
                    <Button size="sm" variant="outline">{t('view_details')}</Button>
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
