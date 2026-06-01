import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@smart-cv/ui'
import { StatusBadge } from '@/components/ui-kit/StatusBadge'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/admin/job-moderation')({ component: JobModerationPage })

function JobModerationPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{t('admin_job_moderation_title')}</h1><select className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>{t('admin_filter_all_status')}</option><option>Pending</option><option>Approved</option><option>Hidden</option></select></div>
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">{t('admin_col_title')}</th><th className="p-3">{t('admin_col_company')}</th><th className="p-3">{t('admin_col_posted_date')}</th><th className="p-3">{t('admin_col_status')}</th><th className="p-3">{t('admin_col_actions')}</th></tr></thead>
          <tbody>
            {[['Senior Java', 'FPT Software', '2026-06-01', 'Pending' as const], ['Frontend React', 'ABC Tech', '2026-05-30', 'Approved' as const]].map((row) => (
              <tr key={row[0]} className="border-t border-border"><td className="p-3">{row[0]}</td><td className="p-3">{row[1]}</td><td className="p-3">{row[2]}</td><td className="p-3"><StatusBadge status={row[3]} /></td><td className="p-3 flex gap-2"><Button size="sm">{t('admin_action_approve')}</Button><Button size="sm" variant="outline">{t('admin_action_reject')}</Button><Button size="sm" variant="outline">{t('admin_action_hide')}</Button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
