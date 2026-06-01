import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/admin/settings')({ component: SystemSettingsPage })

function SystemSettingsPage() {
  const { t } = useTranslation()
  return (
    <div className="space-y-5 w-full">
      <h1 className="text-2xl font-bold">{t('admin_system_title')}</h1>
      <div className="card-surface p-6 space-y-4">
        <div className="flex flex-wrap gap-2 text-sm">
          {[t('admin_system_tab_cv'), t('admin_system_tab_redis'), t('admin_system_tab_rabbitmq'), t('admin_system_tab_jwt')].map((tab, i) => (
            <button key={tab} className={`rounded-lg border px-3 py-1.5 ${i === 0 ? 'bg-primary/10 text-primary border-primary/20' : 'border-border hover:bg-accent'}`}>{tab}</button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t('admin_system_cv_size')} value="5" />
          <Field label={t('admin_system_supported_formats')} value="pdf,doc,docx" />
          <Field label={t('admin_system_redis_host')} value="localhost" />
          <Field label={t('admin_system_redis_port')} value="6379" />
          <Field label={t('admin_system_jwt_expiry')} value="120" />
        </div>
        <Button>{t('admin_system_save')}</Button>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input defaultValue={value} className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm bg-background" />
    </div>
  )
}
