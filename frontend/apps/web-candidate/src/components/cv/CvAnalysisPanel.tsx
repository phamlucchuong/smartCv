import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, cn } from '@smart-cv/ui'
import type { CvItemAnalysisStatus } from '@smart-cv/api'

interface StrengthItem {
  area: string
  detail: string
}

interface WeaknessItem {
  area: string
  detail: string
}

interface ImprovementTip {
  area: string
  suggestion: string
  priority: 'High' | 'Medium' | 'Low'
}

interface CvFullAnalysisResult {
  overallScore: number
  scoreLabel: string
  targetPosition: string
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  extraSkills: string[]
  summary: string
  strengths: StrengthItem[]
  weaknesses: WeaknessItem[]
  tips: ImprovementTip[]
  extractedSkills: string[]
}

interface CvAnalysisPanelProps {
  analysisResultJson: string | null | undefined
  analysisStatus: CvItemAnalysisStatus | undefined
  onRetry: () => void
}

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 70) return 'text-blue-600 dark:text-blue-400'
  if (score >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

function priorityBadgeClass(priority: string): string {
  if (priority === 'High') return 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200'
  if (priority === 'Medium') return 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200'
  return 'bg-slate-50 dark:bg-slate-900/20 text-slate-500 border-slate-200'
}

interface CollapsibleSectionProps {
  title: string
  count: number
  children: React.ReactNode
}

function CollapsibleSection({ title, count, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title} ({count})</span>
        <span className="text-muted-foreground text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  )
}

export function CvAnalysisPanel({ analysisResultJson, analysisStatus, onRetry }: CvAnalysisPanelProps) {
  const { t } = useTranslation()

  let analysis: CvFullAnalysisResult | null = null
  let parseError = false
  if (analysisResultJson) {
    try {
      analysis = JSON.parse(analysisResultJson) as CvFullAnalysisResult
    } catch {
      parseError = true
    }
  }

  if (analysisStatus === 'FAILED' || parseError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/10 p-6 text-center">
        <p className="text-sm text-rose-600 dark:text-rose-400">{t('cv_analysis_failed')}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          {t('cv_analysis_retry')}
        </Button>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      {/* Score header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-baseline gap-1">
          <span className={cn('text-4xl font-bold tabular-nums', scoreColor(analysis.overallScore ?? 0))}>
            {analysis.overallScore ?? 0}
          </span>
          <span className="text-sm text-muted-foreground">/ 100</span>
          <span className={cn('ml-2 text-sm font-medium', scoreColor(analysis.overallScore ?? 0))}>
            · {analysis.scoreLabel ?? ''}
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {t('cv_analysis_target_position')}: {analysis.targetPosition ?? ''}
        </Badge>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
      )}

      {/* Skills */}
      <div className="space-y-2">
        {analysis.matchedSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {analysis.matchedSkills.map((s) => (
              <Badge key={s} className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-xs">
                ✓ {s}
              </Badge>
            ))}
          </div>
        )}
        {analysis.missingSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {analysis.missingSkills.map((s) => (
              <Badge key={s} className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-200 text-xs">
                ✗ {s}
              </Badge>
            ))}
          </div>
        )}
        {analysis.extraSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {analysis.extraSkills.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible sections */}
      <div className="rounded-lg border border-slate-100 dark:border-slate-800 px-1">
        {analysis.strengths?.length > 0 && (
          <CollapsibleSection title={t('cv_analysis_strengths')} count={analysis.strengths.length}>
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={`${s.area}-${i}`} className="text-sm">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{s.area}:</span>{' '}
                  <span className="text-muted-foreground">{s.detail}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {analysis.weaknesses?.length > 0 && (
          <CollapsibleSection title={t('cv_analysis_weaknesses')} count={analysis.weaknesses.length}>
            <ul className="space-y-2">
              {analysis.weaknesses.map((w, i) => (
                <li key={`${w.area}-${i}`} className="text-sm">
                  <span className="font-medium text-amber-600 dark:text-amber-400">{w.area}:</span>{' '}
                  <span className="text-muted-foreground">{w.detail}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {analysis.tips?.length > 0 && (
          <CollapsibleSection title={t('cv_analysis_tips')} count={analysis.tips.length}>
            <ul className="space-y-3">
              {analysis.tips.map((tip, i) => (
                <li key={`${tip.area}-${i}`} className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tip.area}</span>
                    <span className={cn('px-1.5 py-0.5 rounded text-xs border', priorityBadgeClass(tip.priority))}>
                      {tip.priority}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{tip.suggestion}</p>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}
