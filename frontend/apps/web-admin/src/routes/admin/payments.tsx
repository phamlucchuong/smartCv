import { createFileRoute } from '@tanstack/react-router'
import { StatusBadge } from '@/components/ui-kit/StatusBadge'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/admin/payments')({ component: PaymentsPage })

function PaymentsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">{t('admin_payments_title')}</h1><input type="month" className="h-9 rounded-md border border-input bg-background px-3 text-sm" defaultValue="2026-06" /></div>
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">{t('admin_col_company')}</th><th className="p-3">{t('admin_col_package')}</th><th className="p-3">{t('admin_col_amount')}</th><th className="p-3">{t('admin_col_transaction_date')}</th><th className="p-3">{t('admin_col_status')}</th></tr></thead>
          <tbody>
            {[['FPT Software', 'Pro', '3.500.000₫', '2026-06-01', 'Paid' as const], ['ABC Corp', 'Basic', '1.200.000₫', '2026-06-01', 'Pending' as const], ['XYZ Ltd', 'Premium', '8.000.000₫', '2026-05-30', 'Failed' as const], ['Mega Co', 'Pro', '3.500.000₫', '2026-05-28', 'Refunded' as const]].map((r) => (
              <tr key={`${r[0]}-${r[3]}`} className="border-t border-border"><td className="p-3">{r[0]}</td><td className="p-3">{r[1]}</td><td className="p-3">{r[2]}</td><td className="p-3">{r[3]}</td><td className="p-3"><StatusBadge status={r[4]} /></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
