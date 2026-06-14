import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Button } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Upload, FileText, Star, Trash2, RefreshCw, Eye, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  useListCvs, useSetDefaultCv, useDeleteCv, useReanalyzeCv,
  getListCvsQueryKey, AXIOS_INSTANCE,
} from '@smart-cv/api'
import type { UserModels } from '@smart-cv/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'

export const Route = createFileRoute('/_account/cv')({
  component: MyCVPage,
})

// Step 1: DONE is the correct enum value (not COMPLETED)
const cvStatusStyle: Record<string, string> = {
  DONE: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  PROCESSING: 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20',
  PENDING: 'bg-muted text-muted-foreground border border-border',
  FAILED: 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20',
}

const cvStatusLabel: Record<string, string> = {
  DONE: 'Đã phân tích',
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
  const queryClient = useQueryClient()

  // Step 2: sort default CV to top
  const cvList = React.useMemo(() => {
    const raw = data?.data ?? []
    return [...raw].sort((a, b) => (b.default ? 1 : 0) - (a.default ? 1 : 0))
  }, [data])

  React.useEffect(() => {
    document.title = t('page_title_cv')
  }, [t])

  const [userSelected, setUserSelected] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const defaultSelected = (cvList.find((c) => c.default) ?? cvList[0])?.id ?? ''
  const selected = userSelected ?? defaultSelected
  const cv = cvList.find((c) => c.id === selected) ?? cvList[0]

  // Step 4: upload mutation via AXIOS_INSTANCE (multipart/form-data)
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return AXIOS_INSTANCE.post('/api/candidates/cv/upload', form)
    },
    onSuccess: () => {
      toast.success(t('account_upload_success'))
      queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
    },
    onError: () => toast.error('Upload failed. Please try again.'),
  })

  // Step 5: set default
  const setDefaultMutation = useSetDefaultCv({
    mutation: {
      onSuccess: () => {
        toast.success(t('account_cv_default_set'))
        queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
      },
      onError: () => toast.error('Failed to set default CV'),
    },
  })

  // Step 6: re-analyze
  const reanalyzeMutation = useReanalyzeCv({
    mutation: {
      onSuccess: () => {
        toast.success(t('account_cv_reanalyzing'))
        queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
      },
      onError: () => toast.error('Failed to start reanalysis'),
    },
  })

  // Step 7: delete
  const deleteMutation = useDeleteCv({
    mutation: {
      onSuccess: (_data, variables) => {
        toast.success(t('account_cv_deleted'))
        if (userSelected === variables.cvId) setUserSelected(null)
        queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
      },
      onError: () => toast.error('Failed to delete CV'),
    },
  })

  // Step 3: enforce PDF-only + 10-CV limit guard
  const uploadDisabled = uploadMutation.isPending || cvList.length >= 10

  const handleUpload = (file: File | null) => {
    if (!file) return
    if (cvList.length >= 10) {
      toast.error('You have reached the 10 CV limit. Delete a CV before uploading a new one.')
      return
    }
    if (file.type !== 'application/pdf') {
      toast.error(t('account_upload_invalid_type'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('account_upload_too_large'))
      return
    }
    uploadMutation.mutate(file)
  }

  const reanalyzeDisabled =
    reanalyzeMutation.isPending ||
    cv?.analysisStatus === ('PROCESSING' as UserModels.CvItemAnalysisStatus) ||
    cv?.analysisStatus === ('PENDING' as UserModels.CvItemAnalysisStatus)

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading CVs...</div>
  if (isError) return <div className="p-8 text-center text-destructive">Failed to load CVs.</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">CV của tôi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tối đa 10 CV • Chỉ hỗ trợ PDF</p>
      </header>

      <div
        className={`card-surface flex flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/20 bg-primary/[0.02] px-6 py-10 text-center ${uploadDisabled ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (!uploadDisabled) handleUpload(e.dataTransfer.files[0] ?? null)
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Kéo thả CV vào đây hoặc bấm để chọn</p>
          <p className="mt-1 text-sm text-muted-foreground">PDF • Tối đa 5MB • {cvList.length}/10 CV</p>
        </div>
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0] ?? null)} />
        <Button variant="outline" className="mt-1" disabled={uploadDisabled} onClick={() => fileRef.current?.click()}>
          {uploadMutation.isPending ? 'Đang tải...' : 'Chọn file'}
        </Button>
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
                onClick={() => setUserSelected(c.id ?? '')}
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
                  <Button size="sm" variant="ghost" title="Xem trước" onClick={() => toast.info(t('account_preview_unavailable'))}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Đặt làm mặc định"
                    disabled={cv.default || setDefaultMutation.isPending}
                    onClick={() => cv.id && setDefaultMutation.mutate({ cvId: cv.id })}
                  >
                    <Star className={`h-4 w-4 ${cv.default ? 'fill-[var(--warning)] text-[var(--warning)]' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Phân tích lại"
                    disabled={reanalyzeDisabled}
                    onClick={() => cv.id && reanalyzeMutation.mutate({ cvId: cv.id })}
                  >
                    <RefreshCw className={`h-4 w-4 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Xóa"
                    disabled={cv.default || deleteMutation.isPending}
                    onClick={() => cv.id && deleteMutation.mutate({ cvId: cv.id })}
                    className="text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
