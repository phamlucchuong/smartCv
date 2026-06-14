import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Button } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Upload, FileText, Star, Trash2, RefreshCw, Eye, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useListCvs } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'

export const Route = createFileRoute('/_account/cv')({
  component: MyCVPage,
})

const cvStatusStyle: Record<string, string> = {
  COMPLETED: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  PROCESSING: 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20',
  PENDING: 'bg-muted text-muted-foreground border border-border',
  FAILED: 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20',
}

const cvStatusLabel: Record<string, string> = {
  COMPLETED: 'Đã phân tích',
  PROCESSING: 'Đang xử lý',
  PENDING: 'Chờ xử lý',
  FAILED: 'Thất bại',
}

function getFileType(filename?: string): 'PDF' | 'DOC' {
  if (!filename) return 'PDF'
  return filename.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'
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

function MyCVPage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { data, isLoading, isError } = useListCvs({ query: { enabled: isAuthenticated } })
  const cvList = data?.data ?? []

  React.useEffect(() => {
    document.title = t('page_title_cv')
  }, [t])

  const [selected, setSelected] = React.useState('')
  const fileRef = React.useRef<HTMLInputElement>(null)

  const cv = cvList.find((c) => c.id === selected) ?? cvList[0]

  React.useEffect(() => {
    if (cvList.length > 0 && !selected) {
      const defaultCv = cvList.find((c) => c.default) ?? cvList[0]
      setSelected(defaultCv?.id ?? '')
    }
  }, [cvList, selected])

  const handleUpload = (file: File | null) => {
    if (!file) return
    const validType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
    if (!validType) {
      toast.error(t('account_upload_invalid_type'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('account_upload_too_large'))
      return
    }
    // CV upload coming soon
    toast.info('CV upload coming soon')
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading CVs...</div>
  if (isError) return <div className="p-8 text-center text-destructive">Failed to load CVs.</div>
// No statusKey needed

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">CV của tôi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tối đa 10 CV • Hỗ trợ PDF, DOCX</p>
      </header>

      <div
        className="card-surface flex flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/20 bg-primary/[0.02] px-6 py-10 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleUpload(e.dataTransfer.files[0] ?? null)
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Kéo thả CV vào đây hoặc bấm để chọn</p>
          <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX • Tối đa 5MB • {cvList.length}/10 CV</p>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0] ?? null)} />
        <Button variant="outline" className="mt-1" onClick={() => fileRef.current?.click()}>Chọn file</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="card-surface h-fit space-y-1 p-3">
          <p className="px-2 py-1 text-sm font-semibold text-foreground">Danh sách CV ({cvList.length})</p>
          {cvList.map((c) => {
            const fileType = getFileType(c.filename)
            const statusStr = String(c.analysisStatus ?? 'PENDING')
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id ?? '')}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${selected === c.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs font-bold">{fileType}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{c.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.uploadedAt)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cvStatusStyle[statusStr] ?? cvStatusStyle['PENDING']}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {cvStatusLabel[statusStr] ?? statusStr}
                      </span>
                      {c.default && <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)]"><Star className="h-3 w-3 fill-[var(--warning)]" /> Mặc định</span>}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {cv && (
          <div className="space-y-4">
            <div className="card-surface p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-foreground">{cv.filename}</p>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" title="Xem trước" onClick={() => toast.info(t('account_preview_unavailable'))}><Eye className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" title="Đặt làm mặc định" onClick={() => toast.info('Set default coming soon')}><Star className={`h-4 w-4 ${cv.default ? 'fill-[var(--warning)] text-[var(--warning)]' : ''}`} /></Button>
                  <Button size="sm" variant="ghost" title="Phân tích lại" onClick={() => toast.info('Re-analyze coming soon')}><RefreshCw className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" title="Xóa" disabled={cv.default} onClick={() => toast.info('Delete CV coming soon')} className="text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-30"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-4 flex aspect-[3/4] max-h-72 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground">
                <div className="text-center">
                  <FileText className="mx-auto mb-2 h-10 w-10 opacity-30" />
                  <p className="text-sm">Xem trước CV</p>
                </div>
              </div>
            </div>

            <div className="card-surface ai-gradient space-y-3 border-[var(--ai)]/20 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ai)]"><Sparkles className="h-4 w-4" />AI đánh giá chất lượng CV</div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Trạng thái phân tích</span><span className="font-semibold text-foreground">{cvStatusLabel[String(cv.analysisStatus ?? 'PENDING')] ?? String(cv.analysisStatus ?? 'PENDING')}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
