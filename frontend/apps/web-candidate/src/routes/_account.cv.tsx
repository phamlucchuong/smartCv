import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Upload, FileText, Star, Trash2, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  useListCvs, useSetDefaultCv, useDeleteCv, useReanalyzeCv, useAnalyzeCv,
  getListCvsQueryKey, AXIOS_INSTANCE,
} from '@smart-cv/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { onMessage } from 'firebase/messaging'
import { useAuthStore } from '../store/useAuthStore'
import { usePreferencesStore } from '../store/usePreferencesStore'
import { CvAnalysisPanel } from '../components/cv/CvAnalysisPanel'
import { messaging } from '../lib/firebase'

export const Route = createFileRoute('/_account/cv')({
  component: MyCVPage,
})

const cvStatusStyle: Record<string, string> = {
  DONE: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
  PROCESSING: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
  PENDING: 'bg-slate-50 dark:bg-slate-900/20 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800/30',
  FAILED: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30',
}

const cvStatusLabelVI: Record<string, string> = {
  DONE: 'Đã phân tích',
  PROCESSING: 'Đang xử lý',
  PENDING: 'Chờ xử lý',
  FAILED: 'Thất bại',
}

const cvStatusLabelEN: Record<string, string> = {
  DONE: 'Analyzed',
  PROCESSING: 'Processing',
  PENDING: 'Pending',
  FAILED: 'Failed',
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
  const lang = usePreferencesStore((s) => s.language)
  const { isAuthenticated } = useAuthStore()
  const { data, isLoading, isError } = useListCvs({
    query: {
      enabled: isAuthenticated,
      staleTime: 30 * 60 * 1000,     // refetch before the 60-min S3 pre-signed URL TTL expires
      refetchOnWindowFocus: true,
    },
  })
  const queryClient = useQueryClient()

  // When the tab is open, Firebase suppresses background push — listen for foreground messages instead.
  React.useEffect(() => {
    if (!messaging) return
    const unsubscribe = onMessage(messaging, (payload) => {
      if (payload.data?.type === 'CV_ANALYSIS_DONE') {
        const filename = payload.data.filename ?? ''
        toast.success(
          lang === 'VI'
            ? `CV "${filename}" đã được phân tích xong!`
            : `CV "${filename}" analysis is complete!`
        )
        queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
      }
    })
    return unsubscribe
  }, [lang, queryClient])

  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [userSelected, setUserSelected] = React.useState<string | null>(null)
  const [cvToDelete, setCvToDelete] = React.useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = React.useState<string>('Fit')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const getIframeSrc = React.useCallback(
    (url: string) => {
      let params = 'toolbar=0&navpanes=0&scrollbar=0'
      if (zoomLevel === 'Fit' || zoomLevel === 'FitH') {
        params += `&view=${zoomLevel}`
      } else {
        params += `&zoom=${zoomLevel}`
      }
      return `${url}#${params}`
    },
    [zoomLevel]
  )

  const cvList = React.useMemo(() => {
    const raw = data?.data ?? []
    return [...raw].sort((a, b) => (b.default ? 1 : 0) - (a.default ? 1 : 0))
  }, [data])

  React.useEffect(() => {
    document.title = t('page_title_cv')
  }, [t])

  const defaultSelected = (cvList.find((c) => c.default) ?? cvList[0])?.id ?? ''
  const selected = userSelected ?? defaultSelected
  const cv = cvList.find((c) => c.id === selected) ?? cvList[0]

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return AXIOS_INSTANCE.post('/api/candidates/cv/upload', form, {
        transformRequest: [
          (data, headers) => {
            if (headers) delete (headers as Record<string, unknown>)['Content-Type']
            return data
          },
        ],
      })
    },
    onSuccess: () => {
      toast.success(t('account_upload_success'))
      setIsUploadOpen(false)
      queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
    },
    onError: () => toast.error(lang === 'VI' ? 'Tải lên thất bại. Vui lòng thử lại.' : 'Upload failed. Please try again.'),
  })

  const setDefaultMutation = useSetDefaultCv({
    mutation: {
      onSuccess: () => {
        toast.success(t('account_cv_default_set'))
        queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
      },
      onError: () => toast.error(lang === 'VI' ? 'Đặt mặc định thất bại' : 'Failed to set default CV'),
    },
  })

  const reanalyzeMutation = useReanalyzeCv({
    mutation: {
      onSuccess: () => {
        toast.success(t('account_cv_reanalyzing'))
        queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
      },
      onError: () => toast.error(lang === 'VI' ? 'Khởi chạy phân tích thất bại' : 'Failed to start reanalysis'),
    },
  })

  const deleteMutation = useDeleteCv({
    mutation: {
      onSuccess: (_data, variables) => {
        toast.success(t('account_cv_deleted'))
        if (userSelected === variables.cvId) setUserSelected(null)
        queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
      },
      onError: () => toast.error(lang === 'VI' ? 'Xóa thất bại' : 'Failed to delete CV'),
    },
  })

  const [analyzingCvIds, setAnalyzingCvIds] = React.useState<Set<string>>(new Set())

  const analyzeCvMutation = useAnalyzeCv({
    mutation: {
      onMutate: (variables) => {
        setAnalyzingCvIds((prev) => new Set(prev).add(variables.data.cvId))
      },
      onSuccess: (_data, variables) => {
        toast.success(lang === 'VI' ? 'Phân tích CV hoàn thành!' : 'CV analysis complete!')
        setAnalyzingCvIds((prev) => {
          const next = new Set(prev)
          next.delete(variables.data.cvId)
          return next
        })
        queryClient.invalidateQueries({ queryKey: getListCvsQueryKey() })
      },
      onError: (_err, variables) => {
        toast.error(lang === 'VI' ? 'Phân tích CV thất bại. Vui lòng thử lại.' : 'CV analysis failed. Please try again.')
        setAnalyzingCvIds((prev) => {
          const next = new Set(prev)
          next.delete(variables.data.cvId)
          return next
        })
      },
    },
  })

  const uploadDisabled = uploadMutation.isPending || cvList.length >= 10

  const handleUpload = (file: File | null) => {
    if (!file) return
    if (cvList.length >= 10) {
      toast.error(
        lang === 'VI'
          ? 'Bạn đã đạt giới hạn 10 CV. Hãy xóa bớt CV trước khi tải lên cái mới.'
          : 'You have reached the 10 CV limit. Delete a CV before uploading a new one.'
      )
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

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">{lang === 'VI' ? 'Đang tải CV...' : 'Loading CVs...'}</div>
  }
  if (isError) {
    return <div className="p-8 text-center text-destructive">{lang === 'VI' ? 'Không thể tải danh sách CV.' : 'Failed to load CVs.'}</div>
  }

  const uploadDialog = (
    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lang === 'VI' ? 'Tải lên CV mới' : 'Upload New CV'}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          {lang === 'VI' ? 'Tải lên file PDF (tối đa 5MB)' : 'Upload a PDF file (max 5MB)'}
        </DialogDescription>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          disabled={uploadDisabled}
          onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <div
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/20 bg-primary/[0.02] p-8 text-center rounded-xl transition-all ${uploadDisabled ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-primary/45 hover:bg-primary/[0.04]'}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (!uploadDisabled) handleUpload(e.dataTransfer.files[0] ?? null)
          }}
          onClick={() => !uploadDisabled && fileInputRef.current?.click()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {lang === 'VI' ? 'Kéo thả CV vào đây hoặc bấm để chọn' : 'Drag & drop CV here or click to choose'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === 'VI' ? `Định dạng PDF • Tối đa 5MB • Hiện có ${cvList.length}/10 CV` : `PDF format • Max 5MB • Current: ${cvList.length}/10 CVs`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-2 pointer-events-none"
            disabled={uploadDisabled}
          >
            {uploadMutation.isPending ? (lang === 'VI' ? 'Đang tải...' : 'Uploading...') : (lang === 'VI' ? 'Chọn file PDF' : 'Choose PDF file')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  const deleteDialog = (
    <Dialog open={cvToDelete !== null} onOpenChange={(open) => !open && setCvToDelete(null)}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{lang === 'VI' ? 'Xác nhận xóa CV' : 'Confirm Delete CV'}</DialogTitle>
          <DialogDescription>
            {lang === 'VI' ? 'Bạn có chắc chắn muốn xóa CV này không? Hành động này không thể hoàn tác.' : 'Are you sure you want to delete this CV? This action cannot be undone.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setCvToDelete(null)}>
            {lang === 'VI' ? 'Hủy' : 'Cancel'}
          </Button>
          <Button variant="destructive" onClick={() => {
            if (cvToDelete) {
              deleteMutation.mutate({ cvId: cvToDelete })
              setCvToDelete(null)
            }
          }}>
            {lang === 'VI' ? 'Xóa' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-6">
      {uploadDialog}
      {deleteDialog}

      {cvList.length === 0 ? (
        <>
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{lang === 'VI' ? 'CV của tôi' : 'My CVs'}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === 'VI' ? 'Tối đa 10 CV • Chỉ hỗ trợ PDF' : 'Max 10 CVs • PDF only'}
              </p>
            </div>
          </header>
          <div className="card-surface flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border bg-muted/10 rounded-2xl max-w-xl mx-auto mt-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {lang === 'VI' ? 'Chưa có CV nào được tải lên' : 'No CVs uploaded yet'}
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              {lang === 'VI'
                ? 'Tải lên CV đầu tiên của bạn để AI tiến hành phân tích và bắt đầu ứng tuyển các công việc phù hợp.'
                : 'Upload your first CV so that AI can analyze it and you can start applying to matching jobs.'}
            </p>
            <Button type="button" onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {lang === 'VI' ? 'Tải lên CV đầu tiên' : 'Upload your first CV'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{lang === 'VI' ? 'CV của tôi' : 'My CVs'}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === 'VI'
                  ? `Tối đa 10 CV • Chỉ hỗ trợ PDF • Đã dùng ${cvList.length}/10`
                  : `Max 10 CVs • PDF only • Used ${cvList.length}/10`}
              </p>
            </div>
            <Button type="button" onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {lang === 'VI' ? 'Tải lên CV mới' : 'Upload new CV'}
            </Button>
          </header>

          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Left: CV List */}
            <div className="card-surface h-fit space-y-1 p-3">
              <p className="px-2 py-1 text-sm font-semibold text-foreground">
                {lang === 'VI' ? `Danh sách CV (${cvList.length})` : `CV List (${cvList.length})`}
              </p>
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {cvList.map((c) => {
                  const fileType = getFileType(c.filename)
                  const statusStr = String(c.analysisStatus ?? 'PENDING')
                  const isSelected = selected === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => setUserSelected(c.id ?? '')}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:bg-muted/50'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 dark:bg-red-950/40 text-white dark:text-red-400 text-xs font-bold border border-red-600 dark:border-red-900/30 shadow-sm">
                          {fileType}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{c.filename}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(c.uploadedAt)}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${cvStatusStyle[statusStr] ?? cvStatusStyle['PENDING']}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                              {lang === 'VI' ? cvStatusLabelVI[statusStr] ?? statusStr : cvStatusLabelEN[statusStr] ?? statusStr}
                            </span>
                            {c.default && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-full px-2 py-0.5">
                                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                {lang === 'VI' ? 'Mặc định' : 'Default'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: Selected CV Details & Preview */}
            {cv && (() => {
              const statusStr = String(cv.analysisStatus ?? 'PENDING')
              const isAnalyzingCurrentCv = Boolean(cv.id && analyzingCvIds.has(cv.id))
              return (
                <div className="space-y-6">
                  <div className="card-surface p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-bold text-lg text-foreground flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary shrink-0" />
                          {cv.filename}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lang === 'VI' ? `Đã tải lên: ${formatDate(cv.uploadedAt)}` : `Uploaded: ${formatDate(cv.uploadedAt)}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant={cv.default ? 'secondary' : 'outline'}
                          disabled={cv.default || setDefaultMutation.isPending}
                          onClick={() => cv.id && setDefaultMutation.mutate({ cvId: cv.id })}
                          className="flex items-center gap-1.5 text-xs h-9"
                        >
                          <Star className={`h-3.5 w-3.5 ${cv.default ? 'fill-amber-500 text-amber-500' : ''}`} />
                          {lang === 'VI' ? 'Đặt mặc định' : 'Set default'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!cv.id || analyzingCvIds.has(cv.id) || reanalyzeMutation.isPending || cv.analysisStatus === 'PROCESSING'}
                          onClick={() => {
                            if (!cv.id) return
                            if (cv.analysisStatus === 'DONE') {
                              reanalyzeMutation.mutate({ cvId: cv.id })
                            } else {
                              analyzeCvMutation.mutate({ data: { cvId: cv.id } })
                            }
                          }}
                          className={`flex items-center gap-1.5 text-xs h-9 ${cv.analysisStatus !== 'DONE' ? 'text-[var(--ai)] border-[var(--ai)]/30 hover:bg-[var(--ai)]/5' : ''}`}
                        >
                          {cv.analysisStatus !== 'DONE' ? (
                            <Sparkles className={`h-3.5 w-3.5 ${isAnalyzingCurrentCv || cv.analysisStatus === 'PROCESSING' ? 'animate-pulse' : ''}`} />
                          ) : (
                            <RefreshCw className={`h-3.5 w-3.5 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
                          )}
                          {isAnalyzingCurrentCv || cv.analysisStatus === 'PROCESSING'
                            ? (lang === 'VI' ? 'Đang phân tích...' : 'Analyzing...')
                            : cv.analysisStatus === 'DONE'
                              ? (lang === 'VI' ? 'Phân tích lại' : 'Re-analyze')
                              : (lang === 'VI' ? 'Phân tích AI' : 'AI Analyze')
                          }
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={cv.default || deleteMutation.isPending}
                          onClick={() => cv.id && setCvToDelete(cv.id)}
                          className="flex items-center gap-1.5 text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {lang === 'VI' ? 'Xóa' : 'Delete'}
                        </Button>
                      </div>
                    </div>

                    {cv.url ? (
                      <div className="mt-5 flex flex-col h-[calc(100vh-280px)] min-h-[550px] max-h-[780px] w-full overflow-hidden rounded-xl border border-border/80 bg-background shadow-sm">
                        {/* Mock Browser/Viewer Toolbar */}
                        <div className="flex items-center justify-between h-11 px-4 bg-muted/40 border-b border-border select-none shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-400/90" />
                            <span className="w-3 h-3 rounded-full bg-yellow-400/90" />
                            <span className="w-3 h-3 rounded-full bg-green-400/90" />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px] sm:max-w-xs bg-muted/80 px-4 py-1 rounded-md border border-border/40">
                            {cv.filename}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">Zoom:</span>
                            <select
                              value={zoomLevel}
                              onChange={(e) => setZoomLevel(e.target.value)}
                              className="bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-7 font-medium"
                            >
                              <option value="Fit">{lang === 'VI' ? 'Tự động' : 'Auto'}</option>
                              <option value="FitH">{lang === 'VI' ? 'Vừa ngang' : 'Fit Width'}</option>
                              <option value="100">100%</option>
                              <option value="125">125%</option>
                              <option value="150">150%</option>
                            </select>
                          </div>
                        </div>

                        {/* Iframe container */}
                        <div className="flex-1 bg-muted/10 relative overflow-hidden">
                          <iframe
                            key={`${cv.id}-${zoomLevel}`}
                            src={getIframeSrc(cv.url)}
                            className="absolute inset-0 w-full h-full border-0"
                            scrolling="no"
                            title={cv.filename}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 flex h-96 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 text-muted-foreground">
                        <div className="text-center">
                          <FileText className="mx-auto mb-2.5 h-12 w-12 opacity-30 text-primary" />
                          <p className="font-medium text-sm">{lang === 'VI' ? 'Xem trước CV' : 'CV Preview'}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lang === 'VI' ? 'Tài liệu không khả dụng hoặc chưa có URL' : 'Document unavailable or URL missing'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Review Card */}
                  <div className="card-surface space-y-4 border-purple-100 dark:border-purple-900/30 bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/30 dark:from-purple-950/10 dark:via-slate-900/50 dark:to-indigo-950/10 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--ai)]">
                      <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                      {lang === 'VI' ? 'AI đánh giá chất lượng CV' : 'AI Resume Insights'}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between rounded-lg border border-slate-300/70 dark:border-border/40 bg-white/85 dark:bg-background/50 p-3 text-sm shadow-sm">
                        <span className="text-muted-foreground">{lang === 'VI' ? 'Trạng thái phân tích' : 'Analysis Status'}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${cvStatusStyle[statusStr] ?? cvStatusStyle['PENDING']}`}>
                          {lang === 'VI' ? cvStatusLabelVI[statusStr] ?? statusStr : cvStatusLabelEN[statusStr] ?? statusStr}
                        </span>
                      </div>

                      <CvAnalysisPanel
                        analysisResultJson={cv.analysisResult}
                        analysisStatus={cv.analysisStatus}
                        onRetry={() => cv.id && analyzeCvMutation.mutate({ data: { cvId: cv.id } })}
                      />
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}
