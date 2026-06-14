import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/_account/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  const { t } = useTranslation()

  React.useEffect(() => {
    document.title = t('page_title_notifications')
  }, [t])

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('notifications_page_title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('notifications_no_unread')}</p>
      </header>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
        <p className="text-lg font-semibold text-foreground">No notifications yet</p>
        <p className="mt-2 text-sm text-muted-foreground">You'll see job alerts and application updates here.</p>
      </div>
    </div>
  )
}
