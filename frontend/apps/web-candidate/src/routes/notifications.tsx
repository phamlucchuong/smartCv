import { createFileRoute, redirect } from '@tanstack/react-router'
import { Bell, BellOff } from 'lucide-react'

export const Route = createFileRoute('/notifications')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: NotificationsPage,
})

interface Notification {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
  type: 'job' | 'application' | 'system'
}

const NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Nhà tuyển dụng đã xem CV của bạn', message: 'NexusTech Solutions vừa xem CV của bạn cho vị trí Senior Backend Developer.', time: '5 phút trước', unread: true, type: 'job' },
  { id: 'n2', title: 'Lịch phỏng vấn được xác nhận', message: 'Nova Product Studio xác nhận phỏng vấn vòng 2 vào lúc 14:00 thứ Tư.', time: '2 giờ trước', unread: true, type: 'application' },
  { id: 'n3', title: 'Bài kiểm tra sắp hết hạn', message: 'Bài kiểm tra "Frontend Coding Challenge" của CloudBridge sẽ hết hạn sau 24 giờ.', time: '3 giờ trước', unread: true, type: 'application' },
  { id: 'n4', title: 'Có 5 việc làm mới phù hợp với bạn', message: 'Dựa trên hồ sơ của bạn, chúng tôi tìm thấy 5 cơ hội mới trong lĩnh vực Backend.', time: '1 ngày trước', unread: false, type: 'job' },
  { id: 'n5', title: 'Đơn ứng tuyển bị từ chối', message: 'Skyline Labs đã thông báo đơn ứng tuyển vị trí Fullstack Developer không phù hợp lần này.', time: '2 ngày trước', unread: false, type: 'application' },
  { id: 'n6', title: 'CV của bạn đã được phân tích xong', message: 'AI đã hoàn tất phân tích CV. Độ hoàn thiện: 82/100. Xem đề xuất cải thiện.', time: '3 ngày trước', unread: false, type: 'system' },
  { id: 'n7', title: 'Gói dịch vụ sắp hết hạn', message: 'Gói Pro của bạn sẽ hết hạn sau 7 ngày. Gia hạn để tiếp tục sử dụng tính năng nâng cao.', time: '4 ngày trước', unread: false, type: 'system' },
]

const typeColor: Record<Notification['type'], string> = {
  job: 'bg-primary/10 text-primary',
  application: 'bg-ai-soft text-ai',
  system: 'bg-muted text-muted-foreground',
}

function NotificationsPage() {
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="text-sm text-primary hover:underline">Đánh dấu tất cả đã đọc</button>
        )}
      </header>

      {NOTIFICATIONS.length === 0 ? (
        <div className="card-surface flex flex-col items-center justify-center gap-3 py-20 text-center">
          <BellOff className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="font-medium text-muted-foreground">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="card-surface divide-y divide-border overflow-hidden">
          {NOTIFICATIONS.map((n) => (
            <div
              key={n.id}
              className={`flex gap-4 px-5 py-4 transition-colors hover:bg-muted/40 ${n.unread ? 'bg-primary/[0.03]' : ''}`}
            >
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeColor[n.type]}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.unread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                  {n.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
              </div>
              {n.unread && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
