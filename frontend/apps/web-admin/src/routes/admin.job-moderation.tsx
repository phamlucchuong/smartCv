import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@smart-cv/ui'
import { StatusBadge } from '@/components/ui-kit/StatusBadge'
import { useTranslation } from '@smart-cv/i18n'
import {
  useGetAdminJobs,
  useApproveJob,
  useRejectJob,
  getGetAdminJobsQueryKey,
} from '@smart-cv/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/job-moderation')({ component: JobModerationPage })

type ModerationFilter = 'PENDING' | 'PUBLISHED' | 'DRAFT' | ''

type ApiError = { response?: { data?: { message?: string } } }

function RejectModal({
  jobId,
  onClose,
  onSuccess,
}: {
  jobId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [note, setNote] = useState('')
  const rejectMutation = useRejectJob()

  const handleReject = async () => {
    const trimmed = note.trim()
    if (!trimmed) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }
    try {
      await rejectMutation.mutateAsync({ id: jobId, data: { note: trimmed } })
      toast.success('Đã từ chối tin tuyển dụng')
      onSuccess()
    } catch (err: unknown) {
      const e = err as ApiError
      toast.error(e.response?.data?.message ?? 'Từ chối thất bại')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Từ chối tin tuyển dụng</h2>
        <div>
          <label className="text-sm font-medium">Lý do từ chối</label>
          <textarea
            className="mt-1.5 w-full rounded-md border border-input px-3 py-2 text-sm bg-background"
            rows={4}
            placeholder="Nhập lý do từ chối để recruiter biết cần sửa gì..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={rejectMutation.isPending}>
            Huỷ
          </Button>
          <Button onClick={handleReject} disabled={rejectMutation.isPending}>
            {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function JobModerationPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<ModerationFilter>('PENDING')
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useGetAdminJobs({
    moderationStatus: filter || undefined as 'DRAFT' | 'PENDING' | 'PUBLISHED' | undefined,
    page: 1,
    size: 20,
  })
  const jobs = data?.data?.items ?? []

  const approveMutation = useApproveJob()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetAdminJobsQueryKey(), exact: false })

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync({ id })
      toast.success('Đã phê duyệt tin tuyển dụng')
      invalidate()
    } catch (err: unknown) {
      const e = err as ApiError
      toast.error(e.response?.data?.message ?? 'Phê duyệt thất bại')
    }
  }

  function formatDate(date?: string) {
    if (!date) return '—'
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  function formatModerationStatus(status?: string) {
    if (status === 'PENDING') return 'Pending'
    if (status === 'PUBLISHED') return 'Approved'
    if (status === 'DRAFT') return 'Draft'
    return 'Unknown'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin_job_moderation_title')}</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ModerationFilter)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">{t('admin_filter_all_status')}</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="PUBLISHED">Đã duyệt</option>
          <option value="DRAFT">Nháp</option>
        </select>
      </div>

      {isLoading && (
        <div className="card-surface p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/60 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="card-surface p-6 text-sm flex items-center justify-between">
          <span>Không thể tải danh sách tin tuyển dụng.</span>
          <Button variant="outline" onClick={() => refetch()}>
            Tải lại
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="card-surface overflow-x-auto">
          {jobs.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              Không có tin tuyển dụng nào phù hợp với bộ lọc.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3">{t('admin_col_title')}</th>
                  <th className="p-3">{t('admin_col_company')}</th>
                  <th className="p-3">{t('admin_col_posted_date')}</th>
                  <th className="p-3">{t('admin_col_status')}</th>
                  <th className="p-3">{t('admin_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t border-border hover:bg-accent/40">
                    <td className="p-3">
                      <div className="font-medium">{job.title ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{job.location ?? '—'}</div>
                    </td>
                    <td className="p-3">{job.company ?? '—'}</td>
                    <td className="p-3">{formatDate(job.createdAt)}</td>
                    <td className="p-3">
                      <StatusBadge status={formatModerationStatus(job.moderationStatus)} />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {job.moderationStatus === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(job.id!)}
                              disabled={approveMutation.isPending}
                            >
                              {t('admin_action_approve')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectingJobId(job.id!)}
                            >
                              {t('admin_action_reject')}
                            </Button>
                          </>
                        )}
                        {job.moderationStatus !== 'PENDING' && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {rejectingJobId && (
        <RejectModal
          jobId={rejectingJobId}
          onClose={() => setRejectingJobId(null)}
          onSuccess={() => {
            setRejectingJobId(null)
            invalidate()
          }}
        />
      )}
    </div>
  )
}
