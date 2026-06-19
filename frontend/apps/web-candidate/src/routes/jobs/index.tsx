import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Input } from '@smart-cv/ui'
import { Search, MapPin, DollarSign, Clock3, Users } from 'lucide-react'
import { useGetActiveJobs, type JobModels } from '@smart-cv/api'

export const Route = createFileRoute('/jobs/')({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === 'string' ? search.q || undefined : undefined,
    location: typeof search.location === 'string' ? search.location || undefined : undefined,
    page: typeof search.page === 'number' ? search.page : 1,
  }),
  component: JobsPage,
})

type JobItem = JobModels.JobResponse

function JobsPage() {
  const { q, location, page = 1 } = Route.useSearch()
  const navigate = Route.useNavigate()

  // /job/api/jobs supports page+size only; q/location shown as display context
  const { data, isLoading } = useGetActiveJobs({ page: page - 1, size: 12 })

  const jobs: JobItem[] = data?.data?.items ?? []
  const totalPages = data?.data?.totalPages ?? 1
  const total = data?.data?.total ?? 0

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    navigate({
      search: {
        q: (fd.get('q') as string) || undefined,
        location: (fd.get('location') as string) || undefined,
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

      <form onSubmit={handleSearch} className="grid gap-3 rounded-2xl border border-border bg-card p-3 md:grid-cols-[1fr_220px_120px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q ?? ''} placeholder="Job title, skill, keyword" className="h-11 border-input bg-background pl-9" />
        </div>
        <Input name="location" defaultValue={location ?? ''} placeholder="Location" className="h-11 border-input bg-background" />
        <Button type="submit" className="h-11">Search</Button>
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
                <article className="elevate-card rounded-2xl border border-border bg-card p-5 h-full">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1">
                        <MapPin className="h-3.5 w-3.5" />{job.location}
                      </span>
                    )}
                    {job.openings != null && job.openings > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1">
                        <Users className="h-3.5 w-3.5" />{job.openings} vị trí
                      </span>
                    )}
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {(job.skills ?? []).map((skill) => (
                      <Badge key={skill} variant="outline" className="border-border text-xs">{skill}</Badge>
                    ))}
                  </div>

                  <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {job.createdAt ? `Posted ${new Date(job.createdAt).toLocaleDateString()}` : 'Recently posted'}
                    </span>
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
