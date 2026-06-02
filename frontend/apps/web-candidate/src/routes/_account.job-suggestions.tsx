import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Clock3, DollarSign, MapPin, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useCandidateStore } from '../store/useCandidateStore'

export const Route = createFileRoute('/_account/job-suggestions')({
  component: JobSuggestionsPage,
})

const chips = ['Tất cả', 'React', 'TypeScript', 'Next.js', 'Node.js']

function JobSuggestionsPage() {
  const { t } = useTranslation()
  const [selectedChip, setSelectedChip] = React.useState(chips[0])
  const [query, setQuery] = React.useState('')
  const suggestions = useCandidateStore((s) => s.jobSuggestions)
  const appliedJobIds = useCandidateStore((s) => s.appliedJobIds)
  const applyToJob = useCandidateStore((s) => s.applyToJob)

  const filtered = suggestions.filter((job) => {
    const q = query.trim().toLowerCase()
    const matchText = q === '' || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q)
    const matchChip = selectedChip === 'Tất cả' || job.skills.some((skill) => skill.toLowerCase().includes(selectedChip.toLowerCase()))
    return matchText && matchChip
  })

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gợi ý việc làm</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dựa trên hồ sơ và kỹ năng của bạn</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Lọc gợi ý..." className="h-10 max-w-sm border-input bg-background" />
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
          {filtered.map((job) => {
            const applied = appliedJobIds.includes(job.id)
            return (
              <article key={job.id} className="elevate-card card-surface rounded-2xl p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-xs font-bold text-muted-foreground">{job.initials}</div>
                    <div>
                      <h3 className="text-base font-semibold">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-ai/20 bg-ai-soft px-2.5 py-1 text-xs font-semibold text-ai">{job.matchScore}% phù hợp</span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1"><DollarSign className="h-3.5 w-3.5" />{job.salary}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {job.skills.map((skill) => <Badge key={skill} variant="outline" className="border-border bg-secondary/70 text-xs text-secondary-foreground">{skill}</Badge>)}
                </div>

                <p className="mb-4 inline-flex items-center gap-1 rounded-md border border-ai/20 bg-ai-soft px-2 py-1 text-xs text-ai"><Sparkles className="h-3.5 w-3.5" />{job.matchReason}</p>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{job.postedAt}</span>
                  <Button
                    size="sm"
                    disabled={applied}
                    variant={applied ? 'outline' : 'default'}
                    onClick={() => {
                      applyToJob(job.id)
                      toast.success(t('account_applied_toast'))
                    }}
                  >
                    {applied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
