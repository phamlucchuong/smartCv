import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from '@smart-cv/i18n'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { useCandidateStore } from '../store/useCandidateStore'

export const Route = createFileRoute('/_account/notifications')({
  component: NotificationsPage,
})

const typeColor: Record<'job' | 'application' | 'system', string> = {
  job: 'bg-primary/10 text-primary',
  application: 'bg-ai-soft text-ai',
  system: 'bg-muted text-muted-foreground',
}

function NotificationsPage() {
  const { t } = useTranslation()
  const notifications = useCandidateStore((s) => s.notifications)
  const markRead = useCandidateStore((s) => s.markRead)
  const markAllRead = useCandidateStore((s) => s.markAllRead)
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <div className="space-y-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => {
              markAllRead()
              toast.success(t('account_marked_all_read'))
            }}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center gap-3 py-20 text-center">
          <BellOff className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="font-medium text-muted-foreground">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="card-surface divide-y divide-border overflow-hidden">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`flex w-full cursor-pointer gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 ${n.unread ? 'bg-primary/[0.03]' : ''}`}
            >
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeColor[n.type]}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${n.unread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                  {n.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
              </div>
              {n.unread && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
