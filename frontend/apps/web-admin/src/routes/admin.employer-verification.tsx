import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@smart-cv/ui'
import { StatusBadge } from '@/components/ui-kit/StatusBadge'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/admin/employer-verification')({ component: EmployerVerificationPage })

function EmployerVerificationPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{t('admin_employer_verification_title')}</h1><select className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option>Pending</option><option>Verified</option><option>Rejected</option></select></div>
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">{t('admin_col_company')}</th><th className="p-3">{t('admin_col_representative')}</th><th className="p-3">{t('admin_col_registered_date')}</th><th className="p-3">{t('admin_col_document')}</th><th className="p-3">{t('admin_col_status')}</th><th className="p-3">{t('admin_col_actions')}</th></tr></thead>
          <tbody>
            {[['FPT Software', 'Trần Thị HR', '2026-05-21', 'Giấy phép KD', 'Pending' as const], ['ABC Corp', 'Lê Minh', '2026-05-18', 'Giấy phép KD', 'Rejected' as const]].map((row) => (
              <tr key={row[0]} className="border-t border-border"><td className="p-3">{row[0]}</td><td className="p-3">{row[1]}</td><td className="p-3">{row[2]}</td><td className="p-3">{row[3]}</td><td className="p-3"><StatusBadge status={row[4]} /></td><td className="p-3 flex gap-2"><Button size="sm">{t('admin_action_approve')}</Button><Button size="sm" variant="outline">{t('admin_action_reject')}</Button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
