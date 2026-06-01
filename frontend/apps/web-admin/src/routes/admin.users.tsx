import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@smart-cv/ui'
import { StatusBadge } from '@/components/ui-kit/StatusBadge'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/admin/users')({ component: UsersPage })

function UsersPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t('admin_users_title')}</h1>
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">{t('admin_col_avatar')}</th><th className="p-3">{t('admin_col_name')}</th><th className="p-3">{t('admin_col_email')}</th><th className="p-3">{t('admin_col_role')}</th><th className="p-3">{t('admin_col_status')}</th><th className="p-3">{t('admin_col_actions')}</th></tr></thead>
          <tbody>
            {[['Lan Anh', 'lan@example.com', t('admin_role_candidate'), 'Active' as const], ['Nguyễn HR', 'hr@company.vn', t('admin_role_employer'), 'Locked' as const]].map((u) => (
              <tr key={u[1]} className="border-t border-border"><td className="p-3"><div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">{u[0][0]}</div></td><td className="p-3">{u[0]}</td><td className="p-3">{u[1]}</td><td className="p-3">{u[2]}</td><td className="p-3"><StatusBadge status={u[3]} /></td><td className="p-3"><Button variant="outline" size="sm">{u[3] === 'Locked' ? t('admin_action_unlock') : t('admin_action_lock')}</Button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
