import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Button, Input } from '@smart-cv/ui'
import { Clock, ClipboardCheck, ChevronDown, ChevronLeft } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/_account/assessments')({
  component: AssessmentsPage,
})

type AssessmentStatus = 'Not started' | 'In progress' | 'Submitted' | 'Expired'

interface Assessment {
  id: string
  title: string
  job: string
  duration: number
  type: string
  status: AssessmentStatus
  score: number | null
}

const ASSESSMENTS: Assessment[] = [
  { id: 'a1', title: 'Backend Technical Test', job: 'Senior Backend Developer — NexusTech', duration: 30, type: 'Kỹ thuật', status: 'Submitted', score: 85 },
  { id: 'a2', title: 'Frontend Coding Challenge', job: 'Frontend Engineer — Nova Studio', duration: 45, type: 'Lập trình', status: 'Not started', score: null },
  { id: 'a3', title: 'System Design Interview', job: 'Lead Engineer — CloudBridge', duration: 60, type: 'Kiến trúc', status: 'In progress', score: null },
  { id: 'a4', title: 'Logical Reasoning', job: 'DevOps Engineer — Skyline Labs', duration: 20, type: 'Logic', status: 'Expired', score: null },
  { id: 'a5', title: 'Data Structures & Algorithms', job: 'Software Engineer — BluePixel', duration: 40, type: 'DSA', status: 'Not started', score: null },
]

const statusStyle: Record<AssessmentStatus, string> = {
  'Not started': 'bg-muted text-muted-foreground border border-border',
  'In progress': 'bg-[var(--ai-soft)] text-[var(--ai)] border border-[var(--ai)]/20',
  'Submitted': 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  'Expired': 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20',
}

function AssessmentsPage() {
  const { t } = useTranslation()
  const [taking, setTaking] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')
  const [status, setStatus] = React.useState<'all' | AssessmentStatus>('all')
  const [statusMenuOpen, setStatusMenuOpen] = React.useState(false)
  const statusMenuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    document.title = t('page_title_assessments')
  }, [t])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (statusMenuRef.current && !statusMenuRef.current.contains(target)) {
        setStatusMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [t])

  if (taking) {
    return <TakeAssessment onClose={() => setTaking(null)} />
  }

  const getFilterLabel = (key: 'all' | AssessmentStatus) => {
    switch (key) {
      case 'all': return t('assessments_filter_all')
      case 'Not started': return t('assessments_filter_not_started')
      case 'In progress': return t('assessments_filter_in_progress')
      case 'Submitted': return t('assessments_filter_submitted')
      case 'Expired': return t('assessments_filter_expired')
    }
  }

  const getStatusLabel = (key: AssessmentStatus) => {
    switch (key) {
      case 'Not started': return t('assessments_status_not_started')
      case 'In progress': return t('assessments_status_in_progress')
      case 'Submitted': return t('assessments_status_submitted')
      case 'Expired': return t('assessments_status_expired')
    }
  }

  const filterOptions: Array<{ key: 'all' | AssessmentStatus }> = [
    { key: 'all' },
    { key: 'Not started' },
    { key: 'In progress' },
    { key: 'Submitted' },
    { key: 'Expired' },
  ]

  const filtered = ASSESSMENTS.filter((item) => {
    const byStatus = status === 'all' ? true : item.status === status
    const q = query.trim().toLowerCase()
    const byQuery = q === '' ? true : item.title.toLowerCase().includes(q)
    return byStatus && byQuery
  })

  const selectedStatusLabel = getFilterLabel(status)

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('assessments_page_title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('assessments_page_subtitle')}</p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('assessments_search_placeholder')} className="h-10 max-w-sm" />
        <div className="relative" ref={statusMenuRef}>
          <button
            type="button"
            onClick={() => setStatusMenuOpen((v) => !v)}
            className="border-border bg-card/80 text-foreground flex h-10 min-w-44 items-center justify-between rounded-lg border px-3 text-sm shadow-sm"
          >
            {selectedStatusLabel}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusMenuOpen && (
            <div className="border-border bg-card absolute left-0 top-11 z-20 w-full rounded-lg border p-1 shadow-lg">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setStatus(option.key)
                    setStatusMenuOpen(false)
                  }}
                  className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm ${status === option.key ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
                >
                  {getFilterLabel(option.key)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <div key={a.id} className="card-surface p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ai-soft)] text-[var(--ai)]">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[a.status]}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {getStatusLabel(a.status)}
              </span>
            </div>

            <div>
              <p className="font-semibold text-foreground">{a.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.job}</p>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t('assessments_minutes', { count: a.duration })}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5">{a.type}</span>
            </div>

            {a.score !== null ? (
              <div className="rounded-lg border border-[var(--success)]/20 bg-[var(--success-soft)] px-3 py-2 text-center text-sm font-semibold text-[var(--success)]">
                {t('assessments_score', { score: a.score })}
              </div>
            ) : a.status === 'Expired' ? (
              <div className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-3 py-2 text-center text-sm text-[var(--danger)]">
                {t('assessments_expired_label')}
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={a.status === 'In progress' ? false : a.status !== 'Not started'}
                onClick={() => setTaking(a.id)}
              >
                {a.status === 'In progress' ? t('assessments_continue') : t('assessments_start')}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const QUESTIONS = [
  {
    q: 'Trong Java, đặc điểm nào sau đây KHÔNG đúng về interface?',
    options: ['Có thể chứa abstract methods', 'Có thể chứa default methods', 'Cho phép đa kế thừa', 'Không thể chứa biến hằng số (final)'],
    answer: 3,
  },
  {
    q: 'REST API sử dụng phương thức HTTP nào để cập nhật một phần tài nguyên?',
    options: ['PUT', 'POST', 'PATCH', 'DELETE'],
    answer: 2,
  },
  {
    q: 'Độ phức tạp thời gian của thuật toán tìm kiếm nhị phân là:',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    answer: 1,
  },
]

function TakeAssessment({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [currentQ, setCurrentQ] = React.useState(0)
  const [selected, setSelected] = React.useState<number | null>(null)
  const [done, setDone] = React.useState(false)
  const [timeLeft, setTimeLeft] = React.useState(30 * 60)

  React.useEffect(() => {
    if (done) return
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timer)
  }, [done])

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card-surface p-10 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
            <ClipboardCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">{t('assessment_completed')}</h2>
          <p className="text-5xl font-bold text-[var(--success)]">85/100</p>
          <p className="text-sm text-muted-foreground">{t('assessment_passed_desc')}</p>
          <Button onClick={onClose}>{t('btn_back_to_list')}</Button>
        </div>
      </div>
    )
  }

  const q = QUESTIONS[currentQ % QUESTIONS.length]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div className="card-surface flex items-center justify-between p-4">
        <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          {t('btn_exit')}
        </button>
        <div className="text-sm text-muted-foreground">Backend Technical Test</div>
        <div className={`inline-flex items-center gap-2 font-mono text-lg font-bold ${timeLeft < 120 ? 'text-[var(--danger)]' : 'text-foreground'}`}>
          <Clock className="h-4 w-4" />
          {mm}:{ss}
        </div>
      </div>

      <div className="card-surface p-6 space-y-5">
        <div className="text-sm text-muted-foreground">{t('assessment_question_count', { current: currentQ + 1, total: QUESTIONS.length })}</div>
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-all"
            style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <h2 className="text-base font-semibold leading-relaxed">{q.q}</h2>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                selected === i
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="question"
                checked={selected === i}
                onChange={() => setSelected(i)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            variant="outline"
            disabled={currentQ === 0}
            onClick={() => { setCurrentQ((c) => c - 1); setSelected(null) }}
          >
            {t('btn_prev_question')}
          </Button>
          {currentQ < QUESTIONS.length - 1 ? (
            <Button
              disabled={selected === null}
              onClick={() => { setCurrentQ((c) => c + 1); setSelected(null) }}
            >
              {t('btn_next_question')}
            </Button>
          ) : (
            <Button
              disabled={selected === null}
              onClick={() => setDone(true)}
            >
              {t('btn_submit_assessment')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
