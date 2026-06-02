import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Clock3, DollarSign, MapPin } from 'lucide-react'
import { useCandidateStore } from '../store/useCandidateStore'

export const Route = createFileRoute('/_account/applications')({
  component: ApplicationsPage,
})

type ApplicationStatus = 'applied' | 'under_review' | 'interview' | 'rejected' | 'offer'

const chips = ['Tất cả', 'Đang xử lý', 'Phỏng vấn', 'Từ chối']

const statusMap: Record<ApplicationStatus, { label: string; className: string }> = {
  applied: { label: 'Đã ứng tuyển', className: 'border border-border bg-secondary text-secondary-foreground' },
  under_review: { label: 'Đang xem xét', className: 'border border-warning/20 bg-warning-soft text-warning' },
  interview: { label: 'Phỏng vấn', className: 'border border-ai/20 bg-ai-soft text-ai' },
  rejected: { label: 'Không phù hợp', className: 'border border-danger/20 bg-danger-soft text-danger' },
  offer: { label: 'Nhận offer', className: 'border border-success/20 bg-success-soft text-success' },
}

function ApplicationsPage() {
  const { t } = useTranslation()
  const [selectedChip, setSelectedChip] = React.useState(chips[0])
  const [query, setQuery] = React.useState('')
  const applications = useCandidateStore((s) => s.appliedJobs)

  const filtered = applications.filter((job) => {
    const q = query.trim().toLowerCase()
    const matchText = q === '' || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q)

    if (!matchText) return false
    if (selectedChip === 'Tất cả') return true
    if (selectedChip === 'Đang xử lý') return job.status === 'applied' || job.status === 'under_review' || job.status === 'offer'
    if (selectedChip === 'Phỏng vấn') return job.status === 'interview'
    return job.status === 'rejected'
  })

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Việc đã ứng tuyển</h1>
        <p className="mt-1 text-sm text-muted-foreground">{filtered.length} đơn ứng tuyển</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm việc đã ứng tuyển..." className="h-10 max-w-sm border-input bg-background" />
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setSelectedChip(chip)}
              className={selectedChip === chip ? 'cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground' : 'cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:bg-muted/50'}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">{t('account_no_results')}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <article key={job.id} className="elevate-card card-surface rounded-2xl p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-xs font-bold text-muted-foreground">{job.initials}</div>
                  <div>
                    <h3 className="text-base font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMap[job.status].className}`}>{statusMap[job.status].label}</span>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1"><DollarSign className="h-3.5 w-3.5" />{job.salary}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => <Badge key={skill} variant="outline" className="border-border bg-secondary/70 text-xs text-secondary-foreground">{skill}</Badge>)}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{job.appliedAt}</span>
                <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                  <Button size="sm" variant="outline">Xem chi tiết</Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
