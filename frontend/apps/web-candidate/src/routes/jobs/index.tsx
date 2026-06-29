import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Input, JOB_CATEGORY_OPTIONS, cn } from '@smart-cv/ui'
import { Search, MapPin, DollarSign, Clock3, Users } from 'lucide-react'
import { useSearchJobs, useGetHotJobs } from '@smart-cv/api'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/jobs/')({
  validateSearch: (search: Record<string, unknown>): {
    q?: string
    location?: string
    page?: number
    category?: string
    filterType?: string
  } => ({
    q: typeof search.q === 'string' ? search.q || undefined : undefined,
    location: typeof search.location === 'string' ? search.location || undefined : undefined,
    page: typeof search.page === 'number' ? search.page : 1,
    category: typeof search.category === 'string' ? search.category || undefined : undefined,
    filterType: typeof search.filterType === 'string' ? search.filterType || undefined : undefined,
  }),
  component: JobsPage,
})

function formatDate(dateInput?: string | Date | number): string {
  if (!dateInput) return ''
  
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return ''
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }

  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim()
    
    if (/^\d+$/.test(cleanStr)) {
      const d = new Date(parseInt(cleanStr, 10))
      if (isNaN(d.getTime())) return ''
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split('-')
      return `${day}/${month}/${year}`
    }
    
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split('/')
      return `${day}/${month}/${year}`
    }

    if (cleanStr.includes('T') || cleanStr.includes(' ')) {
      const separator = cleanStr.includes('T') ? 'T' : ' '
      const datePart = cleanStr.split(separator)[0]
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [year, month, day] = datePart.split('-')
        return `${day}/${month}/${year}`
      }
      if (/^\d{4}\/\d{2}\/\d{2}$/.test(datePart)) {
        const [year, month, day] = datePart.split('/')
        return `${day}/${month}/${year}`
      }
    }
  }

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return ''
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  } catch {
    return ''
  }
}

function getDeadlineDaysLeft(deadline?: string): number | null {
  if (!deadline) return null
  try {
    const parts = deadline.split('-')
    if (parts.length !== 3) {
      const deadlineDate = new Date(deadline)
      if (isNaN(deadlineDate.getTime())) return null
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dDate = new Date(deadlineDate)
      dDate.setHours(23, 59, 59, 999)
      return Math.max(0, Math.floor((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    }
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    const deadlineDate = new Date(year, month, day, 23, 59, 59, 999)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.max(0, Math.floor((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  } catch {
    return null
  }
}



function JobsPage() {
  const { t } = useTranslation()
  const { q, location, page = 1, category, filterType = 'all' } = Route.useSearch()
  const navigate = Route.useNavigate()

  const isFeatured = filterType === 'featured'

  const { data: activeSearchData, isLoading: isSearchLoading } = useSearchJobs({
    request: {
      keyword: q || undefined,
      location: location || undefined,
      category: (category || undefined) as import('@smart-cv/api').JobModels.JobSearchRequestCategory | undefined,
      page: page - 1,
      size: 100,
    },
  }, { query: { enabled: !isFeatured } })

  const { data: hotJobsData, isLoading: isHotLoading } = useGetHotJobs({
    query: { enabled: isFeatured }
  })

  const isLoading = isFeatured ? isHotLoading : isSearchLoading

  const rawJobs = isFeatured 
    ? (hotJobsData?.data ?? []) 
    : (activeSearchData?.data?.items ?? [])

  const filteredJobs = rawJobs

  const jobsPerPage = 12
  const total = filteredJobs.length
  const totalPages = Math.max(1, Math.ceil(total / jobsPerPage))
  const safePage = Math.min(page, totalPages)
  const jobs = React.useMemo(() => {
    return filteredJobs.slice((safePage - 1) * jobsPerPage, safePage * jobsPerPage)
  }, [filteredJobs, safePage])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    navigate({
      search: {
        q: (fd.get('q') as string) || undefined,
        location: (fd.get('location') as string) || undefined,
        category: (fd.get('category') as string) || undefined,
        filterType: (fd.get('filterType') as string) || undefined,
        page: 1,
      },
    })
  }

  React.useEffect(() => {
    document.title = q ? `Jobs: ${q} — SmartCV` : 'Browse Jobs — SmartCV'
  }, [q])

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-3xl font-bold">Browse Jobs</h1>
        {q && <p className="mt-1 text-muted-foreground">Showing results for "{q}"</p>}
      </div>

      <form onSubmit={handleSearch} className="grid gap-3 rounded-2xl border border-border bg-card p-3 md:grid-cols-[1.5fr_1fr_1fr_1.2fr_100px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q ?? ''} placeholder="Tìm kiếm công việc..." className="h-11 border-border rounded-xl bg-background pl-9 outline-none focus:ring-1 focus:ring-primary w-full" />
        </div>
        
        <select
          name="location"
          defaultValue={location ?? ''}
          className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary outline-none w-full"
        >
          <option value="">Tất cả địa điểm</option>
          <option value="Hà Nội">Hà Nội</option>
          <option value="Hồ Chí Minh">Hồ Chí Minh</option>
          <option value="Đà Nẵng">Đà Nẵng</option>
          <option value="Ho Chi Minh City">Ho Chi Minh City</option>
          <option value="Ha Noi">Ha Noi</option>
          <option value="Da Nang">Da Nang</option>
        </select>

        <select
          name="category"
          defaultValue={category ?? ''}
          className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary outline-none w-full"
        >
          <option value="">Tất cả ngành nghề</option>
          {JOB_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          name="filterType"
          defaultValue={filterType}
          className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary outline-none w-full"
        >
          <option value="all">Tất cả việc làm</option>
          <option value="featured">Việc làm nổi bật</option>
          <option value="recent">Việc làm mới đăng</option>
        </select>

        <Button type="submit" className="h-11 rounded-xl w-full">Tìm kiếm</Button>
      </form>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border p-5 h-48 bg-muted/30" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold">No jobs found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try again later or check back soon.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{total.toLocaleString()} jobs available</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id ?? '' }} className="block">
                <article className="elevate-card rounded-2xl border border-border bg-card p-5 h-64 flex flex-col justify-between">
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="mb-2">
                        <h3 className="text-base font-semibold line-clamp-2 h-12 overflow-hidden" title={job.title}>{job.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 h-5 overflow-hidden mt-0.5" title={job.company}>{job.company}</p>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2 text-xs h-7 overflow-hidden items-center">
                        {(job.salaryMin != null || job.salaryMax != null) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-primary">
                            <DollarSign className="h-3 w-3" />
                            {job.salaryMin != null && job.salaryMax != null
                              ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                              : job.salaryMin != null
                                ? `From $${job.salaryMin.toLocaleString()}`
                                : `Up to $${job.salaryMax!.toLocaleString()}`}
                          </span>
                        )}
                        {job.location && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-muted-foreground">
                            <MapPin className="h-3 w-3" />{job.location}
                          </span>
                        )}
                        {job.openings != null && job.openings > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-muted-foreground">
                            <Users className="h-3 w-3" />{job.openings} vị trí
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1.5 h-6 overflow-hidden items-center">
                        {(job.skills ?? []).slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="border-border text-[11px] px-2 py-0.5 truncate max-w-[100px]">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 text-xs text-muted-foreground mt-auto shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Clock3 className="h-3.5 w-3.5" />
                        {job.createdAt ? formatDate(job.createdAt) : 'Vừa mới đăng'}
                      </span>
                      {job.deadline && (() => {
                        const daysLeft = getDeadlineDaysLeft(job.deadline)
                        return daysLeft !== null ? (
                          <span className={cn(
                            "font-medium whitespace-nowrap",
                            daysLeft < 30 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {t('job_days_left', { days: daysLeft })}
                          </span>
                        ) : null
                      })()}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => navigate({ search: (s) => ({ ...s, page: page - 1 }) })}
              >
                Prev
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => navigate({ search: (s) => ({ ...s, page: page + 1 }) })}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
