import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@smart-cv/ui'
import { StatusBadge } from '@/components/ui-kit/StatusBadge'
import { useTranslation } from '@smart-cv/i18n'
import { RecruiterApi } from '@smart-cv/api'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED'

export const Route = createFileRoute('/admin/employer-verification')({ component: EmployerVerificationPage })

function EmployerVerificationPage() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectionNote, setRejectionNote] = useState('')

  const { data, isLoading, refetch } = RecruiterApi.useGetAll({ status: statusFilter, size: 50 })
  const recruiters = data?.data?.items ?? []

  const updateStatusMutation = RecruiterApi.useUpdateStatus({
    mutation: {
      onSuccess: () => {
        toast.success('Đã cập nhật trạng thái')
        refetch()
        setRejectTarget(null)
        setRejectionNote('')
      },
      onError: () => {
        toast.error('Cập nhật trạng thái thất bại. Vui lòng thử lại.')
      },
    },
  })

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, data: { status: 'APPROVED' } })
  }

  const handleRejectConfirm = () => {
    if (!rejectTarget) return
    updateStatusMutation.mutate({
      id: rejectTarget,
      data: { status: 'REJECTED', rejectionNote },
    })
  }

  const STATUS_TABS: StatusFilter[] = ['PENDING', 'APPROVED', 'REJECTED']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('admin_employer_verification_title')}</h1>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card-surface overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : recruiters.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Không có hồ sơ nào.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">{t('admin_col_company')}</th>
                <th className="p-3">{t('admin_col_representative')}</th>
                <th className="p-3">{t('admin_col_registered_date')}</th>
                <th className="p-3">{t('admin_col_document')}</th>
                <th className="p-3">{t('admin_col_status')}</th>
                <th className="p-3">{t('admin_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {recruiters.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-medium">{r.companyName ?? '—'}</td>
                  <td className="p-3">{r.contactName ?? r.fullName ?? '—'}</td>
                  <td className="p-3 text-muted-foreground">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="p-3">
                    {r.businessLicenseUrl ? (
                      <a
                        href={r.businessLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline text-xs"
                      >
                        Xem <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">Chưa tải lên</span>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={r.status ?? 'PENDING'} />
                  </td>
                  <td className="p-3">
                    {r.status === 'PENDING' && r.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(r.id!)}
                          disabled={updateStatusMutation.isPending}
                        >
                          {t('admin_action_approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectTarget(r.id!)
                            setRejectionNote('')
                          }}
                          disabled={updateStatusMutation.isPending}
                        >
                          {t('admin_action_reject')}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối hồ sơ</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Lý do từ chối</label>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={4}
              placeholder="Nhập lý do để nhà tuyển dụng biết cần chỉnh sửa gì..."
              className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionNote.trim() || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
