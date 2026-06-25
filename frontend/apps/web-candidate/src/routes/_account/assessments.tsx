import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@smart-cv/ui';

import { Clock, ClipboardCheck, ChevronDown, ChevronLeft } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'
import {
  useGetMyAssessments,
  useGetAssessment,
  useGetAttemptState,
  useSaveAnswers,
  useStartAttempt,
  useSubmitAttempt,
  useGetResult,
  ApplicationModels,
  useSubmitAttemptWithFlag,
} from '@smart-cv/api'
import { useAuthStore } from '../../store/useAuthStore'

type AssessmentsSearch = {
  take?: string
}

export const Route = createFileRoute('/_account/assessments')({
  validateSearch: (search: Record<string, unknown>): AssessmentsSearch => ({
    take: typeof search.take === 'string' ? search.take : undefined,
  }),
  component: AssessmentsPage,
})

type AttemptStateResponse = ApplicationModels.AttemptStateResponse
type AssessmentResponse = ApplicationModels.AssessmentResponse
type AttemptAnswer = ApplicationModels.AttemptAnswer
type Question = ApplicationModels.Question
type LocalAnswer = { selectedOptionIndex?: number; textAnswer?: string }

const MCQ = 'MCQ' as const

function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return ''
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split('-')
      return `${day}/${month}/${year}`
    }
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

type AssessmentStatusFilter = 'all' | 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED'

const statusStyle: Record<string, string> = {
  NOT_STARTED: 'bg-muted text-muted-foreground border border-border',
  IN_PROGRESS: 'bg-[var(--ai-soft)] text-[var(--ai)] border border-[var(--ai)]/20',
  SUBMITTED: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  EXPIRED: 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20',
}

function getStatusLabel(t: (k: string) => string, key: string) {
  switch (key) {
    case 'NOT_STARTED': return t('assessments_status_not_started')
    case 'IN_PROGRESS': return t('assessments_status_in_progress')
    case 'SUBMITTED': return t('assessments_status_submitted')
    case 'EXPIRED': return t('assessments_status_expired')
    default: return key
  }
}

function getFilterLabel(t: (k: string) => string, key: AssessmentStatusFilter) {
  switch (key) {
    case 'all': return t('assessments_filter_all')
    case 'NOT_STARTED': return t('assessments_filter_not_started')
    case 'IN_PROGRESS': return t('assessments_filter_in_progress')
    case 'SUBMITTED': return t('assessments_filter_submitted')
    case 'EXPIRED': return t('assessments_filter_expired')
  }
}

function isAnswered(q: Question, answers: Record<string, LocalAnswer>): boolean {
  const ans = answers[q.id ?? '']
  if (!ans) return false
  return q.type === MCQ ? ans.selectedOptionIndex !== undefined : !!(ans.textAnswer?.trim())
}

// Fetches assessment title for a single attempt card
function AssessmentCard({
  a,
  onTake,
  onTitleLoaded,
  onRetake,
  isRetaking,
  hasActiveAttempt,
}: {
  a: AttemptStateResponse
  onTake: (assessmentId: string, attemptId: string) => void
  onTitleLoaded: (assessmentId: string, title: string) => void
  onRetake?: (assessmentId: string) => void
  isRetaking?: boolean
  hasActiveAttempt?: boolean
}) {
  const { t } = useTranslation()
  const { data: assessmentData } = useGetAssessment(a.assessmentId ?? '', {
    query: { enabled: !!a.assessmentId },
  })
  const title = assessmentData?.data?.title ?? a.assessmentId ?? ''
  const itemStatus = String(a.status ?? 'NOT_STARTED')

  // Report the loaded title to the parent for search filtering
  React.useEffect(() => {
    if (assessmentData?.data?.title && a.assessmentId) {
      onTitleLoaded(a.assessmentId, assessmentData.data.title)
    }
  }, [assessmentData?.data?.title, a.assessmentId, onTitleLoaded])

  return (
    <div className="card-surface p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ai-soft)] text-[var(--ai)]">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2">
          {itemStatus === 'SUBMITTED' && (
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
              a.result === 'PENDING'
                ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                : a.result === 'PASS'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-600 border border-red-500/20'
            }`}>
              {a.result === 'PENDING' ? 'Chờ chấm' : a.score != null ? `${a.score.toFixed(0)}%` : '—'}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[itemStatus] ?? statusStyle['NOT_STARTED']}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {getStatusLabel(t, itemStatus)}
          </span>
        </div>
      </div>

      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{a.startedAt ? formatDate(a.startedAt) : ''}</p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {a.startedAt ? new Date(a.startedAt).toLocaleTimeString() : '—'}
        </span>
      </div>

      {itemStatus === 'SUBMITTED' ? (
        !hasActiveAttempt ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetake?.(a.assessmentId ?? '')}
            disabled={isRetaking}
            className="w-full cursor-pointer"
          >
            Làm lại
          </Button>
        ) : null
      ) : itemStatus === 'EXPIRED' ? (
        !hasActiveAttempt ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetake?.(a.assessmentId ?? '')}
            disabled={isRetaking}
            className="w-full cursor-pointer"
          >
            Làm lại
          </Button>
        ) : null
      ) : (
        <Button
          className="w-full"
          disabled={itemStatus !== 'NOT_STARTED' && itemStatus !== 'IN_PROGRESS'}
          onClick={() => onTake(a.assessmentId ?? '', a.attemptId ?? '')}
        >
          {itemStatus === 'IN_PROGRESS' ? t('assessments_continue') : t('assessments_start')}
        </Button>
      )}
    </div>
  )
}

function AssessmentsPage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { take: takeAssessmentId } = Route.useSearch()
  const { data, isLoading, isError } = useGetMyAssessments({ query: { enabled: isAuthenticated } })
  const assessments = data?.data ?? []

  const queryClient = useQueryClient()
  const [taking, setTaking] = React.useState<{ assessmentId: string; attemptId: string } | null>(null)

  const startAttemptMutation = useStartAttempt()
  const hasAutoStarted = React.useRef(false)

  const handleRetake = (assessmentId: string) => {
    startAttemptMutation.mutate(
      { id: assessmentId },
      {
        onSuccess: (res: { data?: { attemptId?: string } }) => {
          const attemptId = res?.data?.attemptId ?? ''
          if (attemptId) {
            setTaking({ assessmentId, attemptId })
            queryClient.invalidateQueries({ queryKey: ['/api/assessments/my'] })
          }
        },
      },
    )
  }

  React.useEffect(() => {
    if (!takeAssessmentId || hasAutoStarted.current || isLoading) return
    const existing = assessments.find(
      (a) => a.assessmentId === takeAssessmentId && a.status === 'IN_PROGRESS',
    )
    if (existing) {
      hasAutoStarted.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTaking({ assessmentId: existing.assessmentId ?? '', attemptId: existing.attemptId ?? '' })
      return
    }
    hasAutoStarted.current = true
    startAttemptMutation.mutate(
      { id: takeAssessmentId },
      {
        onSuccess: (res: { data?: { attemptId?: string } }) => {
          const attemptId = res?.data?.attemptId ?? ''
          if (attemptId) setTaking({ assessmentId: takeAssessmentId, attemptId })
        },
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takeAssessmentId, assessments, isLoading])
  const [query, setQuery] = React.useState('')
  const [status, setStatus] = React.useState<AssessmentStatusFilter>('all')
  const [statusMenuOpen, setStatusMenuOpen] = React.useState(false)
  // Populated by AssessmentCard children once their title queries resolve
  const [titleMap, setTitleMap] = React.useState<Record<string, string>>({})
  const statusMenuRef = React.useRef<HTMLDivElement>(null)

  const registerTitle = React.useCallback((assessmentId: string, title: string) => {
    setTitleMap(prev => (prev[assessmentId] === title ? prev : { ...prev, [assessmentId]: title }))
  }, [])

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
  }, [])

  if (taking) {
    return (
      <TakeAssessment
        assessmentId={taking.assessmentId}
        attemptId={taking.attemptId}
        onClose={() => setTaking(null)}
      />
    )
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading assessments...</div>
  if (isError) return <div className="p-8 text-center text-destructive">Failed to load assessments.</div>

  const filterOptions: Array<{ key: AssessmentStatusFilter }> = [
    { key: 'all' },
    { key: 'NOT_STARTED' },
    { key: 'IN_PROGRESS' },
    { key: 'SUBMITTED' },
    { key: 'EXPIRED' },
  ]

  const filtered = assessments.filter((item) => {
    const itemStatus = String(item.status ?? 'NOT_STARTED')
    const byStatus = status === 'all' ? true : itemStatus === status
    const q = query.trim().toLowerCase()
    // Search by loaded title; fall back to assessmentId while title is still loading
    const resolvedTitle = titleMap[item.assessmentId ?? ''] ?? item.assessmentId ?? ''
    const byQuery = q === '' ? true : resolvedTitle.toLowerCase().includes(q)
    return byStatus && byQuery
  })

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('assessments_page_title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('assessments_page_subtitle')}</p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('assessments_search_placeholder')}
          className="h-10 max-w-sm"
        />
        <div className="relative" ref={statusMenuRef}>
          <button
            type="button"
            onClick={() => setStatusMenuOpen((v) => !v)}
            className="border-border bg-card/80 text-foreground flex h-10 min-w-44 items-center justify-between rounded-lg border px-3 text-sm shadow-sm"
          >
            {getFilterLabel(t, status)}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusMenuOpen && (
            <div className="border-border bg-card absolute left-0 top-11 z-20 w-full rounded-lg border p-1 shadow-lg">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => { setStatus(option.key); setStatusMenuOpen(false) }}
                  className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm ${status === option.key ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
                >
                  {getFilterLabel(t, option.key)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">{t('account_no_results')}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const hasActiveAttempt = assessments.some(
              (item) => item.assessmentId === a.assessmentId && item.status === 'IN_PROGRESS'
            )
            return (
              <AssessmentCard
                key={a.attemptId}
                a={a}
                onTake={(assessmentId, attemptId) => setTaking({ assessmentId, attemptId })}
                onTitleLoaded={registerTitle}
                onRetake={handleRetake}
                isRetaking={startAttemptMutation.isPending}
                hasActiveAttempt={hasActiveAttempt}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// Outer shell: waits for assessment + attempt data before mounting TakeAssessmentContent.
// This lets the inner component initialize all state from props without useEffect.
function TakeAssessment({
  assessmentId,
  attemptId,
  onClose,
}: {
  assessmentId: string
  attemptId: string
  onClose: () => void
}) {
  const { data: assessmentData, isLoading: loadingAssessment } = useGetAssessment(assessmentId)
  const { data: attemptData, isLoading: loadingAttempt } = useGetAttemptState(attemptId)

  if (loadingAssessment || loadingAttempt || !assessmentData?.data) {
    return <div className="p-8 text-center text-muted-foreground">Loading assessment...</div>
  }

  return (
    <TakeAssessmentContent
      assessment={assessmentData.data}
      attemptId={attemptId}
      savedAnswers={attemptData?.data?.answers ?? []}
      onClose={onClose}
    />
  )
}

// Inner content: all data available at mount — state is initialized from props.
function TakeAssessmentContent({
  assessment,
  attemptId,
  savedAnswers,
  onClose,
}: {
  assessment: AssessmentResponse
  attemptId: string
  savedAnswers: AttemptAnswer[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const questions: Question[] = assessment.questions ?? []

  const saveAnswersMutation = useSaveAnswers()
  const submitMutation = useSubmitAttempt()
  const submitWithFlagMutation = useSubmitAttemptWithFlag()
  const { data: resultData, refetch: fetchResult } = useGetResult(attemptId, {
    query: { enabled: false },
  })

  // Initialize from saved answers using lazy useState
  const [answers, setAnswers] = React.useState<Record<string, LocalAnswer>>(() => {
    const init: Record<string, LocalAnswer> = {}
    savedAnswers.forEach((a) => {
      if (a.questionId) {
        init[a.questionId] = {
          selectedOptionIndex: a.selectedOptionIndex,
          textAnswer: a.textAnswer,
        }
      }
    })
    return init
  })

  const [currentQIndex, setCurrentQIndex] = React.useState(0)
  const [showResult, setShowResult] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  // Initialize timer from assessment data directly (no useEffect needed)
  const [timeLeft, setTimeLeft] = React.useState((assessment.timeLimitMinutes ?? 30) * 60)

  // Update ref in useLayoutEffect so the timer callback always reads current state
  const handleSubmitRef = React.useRef<(overtime?: boolean) => void>(() => {})
  React.useLayoutEffect(() => {
    handleSubmitRef.current = (overtime = false) => {
      if (isSubmitting) return
      setIsSubmitting(true)
      const callbacks = {
        onSuccess: () => { setShowResult(true); fetchResult() },
        onError: () => setIsSubmitting(false),
      }
      if (overtime) {
        submitWithFlagMutation.mutate({ attemptId, overtime: true }, callbacks)
      } else {
        submitMutation.mutate({ attemptId }, callbacks)
      }
    }
  })

  // Countdown — only depends on timeLeft and showResult (no stale-closure issue via ref)
  React.useEffect(() => {
    if (showResult) return
    if (timeLeft <= 0) { handleSubmitRef.current(true); return }
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [timeLeft, showResult])

  const handleAnswerChange = (questionId: string, value: LocalAnswer) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)
    saveAnswersMutation.mutate({
      attemptId,
      data: {
        answers: Object.entries(newAnswers).map(([qId, ans]) => ({ questionId: qId, ...ans })),
      },
    })
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card-surface p-10 space-y-4">
          <h2 className="text-xl font-bold">Bài kiểm tra không có câu hỏi</h2>
          <Button onClick={onClose}>{t('btn_back_to_list')}</Button>
        </div>
      </div>
    )
  }

  if (showResult) {
    const result = resultData?.data
    const isPending = result?.result === 'PENDING'
    const isPassed = result?.result === 'PASS'

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card-surface p-10 space-y-4">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            isPending
              ? 'bg-yellow-100 text-yellow-600'
              : isPassed
                ? 'bg-[var(--success-soft)] text-[var(--success)]'
                : 'bg-[var(--danger-soft)] text-[var(--danger)]'
          }`}>
            <ClipboardCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">{t('assessment_completed')}</h2>
          {isPending ? (
            <>
              <p className="text-lg font-semibold text-yellow-600">Đang chờ chấm điểm</p>
              <p className="text-sm text-muted-foreground">{t('assessment_result_pending_desc')}</p>
            </>
          ) : (
            <>
              <p className={`text-5xl font-bold ${isPassed ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {result?.score ?? '—'}/100
              </p>
              <p className="text-sm text-muted-foreground">
                {isPassed ? t('assessment_passed_desc') : t('assessment_failed_desc')}
              </p>
            </>
          )}
          <Button onClick={onClose}>{t('btn_back_to_list')}</Button>
        </div>
      </div>
    )
  }

  const totalQuestions = questions.length
  const currentQuestion = questions[currentQIndex]
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="card-surface flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('btn_exit')}
        </button>
        <div className="text-sm font-medium text-foreground">{assessment.title}</div>
        <div className={`inline-flex items-center gap-2 font-mono text-lg font-bold px-4 py-1.5 rounded-full border ${
          timeLeft < 120
            ? 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/20 animate-pulse'
            : 'bg-primary/10 text-primary border-primary/20'
        }`}>
          <Clock className="h-4 w-4" />
          {mm}:{ss}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Question map */}
        <div className="card-surface p-5 space-y-4 lg:col-span-1 h-fit">
          <h3 className="font-bold text-sm text-foreground">Bản đồ câu hỏi</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const answered = isAnswered(q, answers)
              const active = currentQIndex === idx
              let btnClass = 'border-border text-foreground hover:bg-muted/60'
              if (active) {
                btnClass = 'bg-primary text-white border-primary shadow-sm shadow-primary/25'
              } else if (answered) {
                btnClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold'
              }
              return (
                <button
                  key={q.id ?? idx}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`h-10 rounded-lg border flex items-center justify-center text-sm transition-all font-medium ${btnClass}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
          <div className="pt-2 border-t border-border space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-primary border border-primary" />
              <span>Đang chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/20" />
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-transparent border border-border" />
              <span>Chưa trả lời</span>
            </div>
          </div>
          <Button
            className="w-full"
            disabled={isSubmitting}
            onClick={() => handleSubmitRef.current()}
          >
            {isSubmitting ? 'Đang nộp...' : t('btn_submit_assessment')}
          </Button>
        </div>

        {/* Main question panel */}
        <div className="lg:col-span-3 card-surface p-6 space-y-5 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
            <span>{t('assessment_question_count', { current: currentQIndex + 1, total: totalQuestions })}</span>
            <span className="bg-secondary px-2.5 py-0.5 rounded-md border border-border">
              {currentQuestion.type === MCQ ? 'Trắc nghiệm' : 'Tự luận'}
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          <h2 className="text-base font-semibold leading-relaxed">{currentQuestion.text}</h2>

          {currentQuestion.type === MCQ && currentQuestion.options && (
            <div className="space-y-2 flex-1">
              {currentQuestion.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    answers[currentQuestion.id ?? '']?.selectedOptionIndex === i
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={answers[currentQuestion.id ?? '']?.selectedOptionIndex === i}
                    onChange={() => handleAnswerChange(currentQuestion.id ?? '', { selectedOptionIndex: i })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type !== MCQ && (
            <textarea
              className="w-full flex-1 min-h-[180px] rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Nhập câu trả lời của bạn..."
              value={answers[currentQuestion.id ?? '']?.textAnswer ?? ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id ?? '', { textAnswer: e.target.value })}
            />
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((c) => c - 1)}
            >
              {t('btn_prev_question')}
            </Button>
            <Button
              variant="outline"
              disabled={currentQIndex === totalQuestions - 1}
              onClick={() => setCurrentQIndex((c) => c + 1)}
            >
              {t('btn_next_question')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
