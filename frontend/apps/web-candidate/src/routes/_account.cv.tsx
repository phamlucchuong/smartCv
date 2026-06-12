import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Button } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Upload, FileText, Star, Trash2, RefreshCw, Eye, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
type CVItem = { id: string; name: string; type: 'PDF' | 'DOC'; uploaded: string; status: 'Parsed' | 'Processing' | 'Active'; isDefault: boolean }

export const Route = createFileRoute('/_account/cv')({
  component: MyCVPage,
})

const cvStatusStyle: Record<CVItem['status'], string> = {
  Parsed: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  Processing: 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20',
  Active: 'bg-muted text-muted-foreground border border-border',
}

const cvStatusLabel: Record<CVItem['status'], string> = {
  Parsed: 'Đã phân tích',
  Processing: 'Đang xử lý',
  Active: 'Hoạt động',
}

function formatToday() {
  const now = new Date()
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
}

function MyCVPage() {
  const { t } = useTranslation()
  const cvList: CVItem[] = []
  const addCV = (_cv: CVItem) => {}
  const setDefaultCV = (_id: string) => {}
  const removeCV = (_id: string) => {}
  const updateCVStatus = (_id: string, _status: CVItem['status']) => {}

  React.useEffect(() => {
    document.title = t('page_title_cv')
  }, [t])

  const [selected, setSelected] = React.useState(cvList[0]?.id ?? '')
  const fileRef = React.useRef<HTMLInputElement>(null)

  const cv = cvList.find((c) => c.id === selected) ?? cvList[0]

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

    const next: CVItem = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC',
      uploaded: formatToday(),
      status: 'Processing',
      isDefault: false,
    }
    addCV(next)
    setSelected(next.id)
    toast.success(t('account_upload_success'))
    window.setTimeout(() => updateCVStatus(next.id, 'Parsed'), 1000)
  }

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
          {cvList.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${selected === c.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs font-bold">{c.type}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.uploaded}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cvStatusStyle[c.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {cvStatusLabel[c.status]}
                    </span>
                    {c.isDefault && <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)]"><Star className="h-3 w-3 fill-[var(--warning)]" /> Mặc định</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {cv && (
          <div className="space-y-4">
            <div className="card-surface p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-foreground">{cv.name}</p>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" title="Xem trước" onClick={() => toast.info(t('account_preview_unavailable'))}><Eye className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" title="Đặt làm mặc định" onClick={() => { setDefaultCV(cv.id); toast.success(t('account_cv_default_set')) }}><Star className={`h-4 w-4 ${cv.isDefault ? 'fill-[var(--warning)] text-[var(--warning)]' : ''}`} /></Button>
                  <Button size="sm" variant="ghost" title="Phân tích lại" onClick={() => { updateCVStatus(cv.id, 'Processing'); toast.info(t('account_cv_reanalyzing')); window.setTimeout(() => { updateCVStatus(cv.id, 'Parsed'); toast.success(t('account_cv_reanalyzed')) }, 1000) }}><RefreshCw className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" title="Xóa" disabled={cv.isDefault} onClick={() => { removeCV(cv.id); toast.success(t('account_cv_deleted')); if (selected === cv.id) setSelected('') }} className="text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-30"><Trash2 className="h-4 w-4" /></Button>
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
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Độ hoàn thiện</span><span className="font-semibold text-foreground">82/100</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
