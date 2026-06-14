import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/admin/ai-config')({ component: AIConfigPage })

function AIConfigPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5 w-full">
      <h1 className="text-2xl font-bold">{t('admin_ai_title')}</h1>
      <div className="card-surface p-6 space-y-5">
        <div>
          <label className="text-sm font-medium">{t('admin_ai_matching_threshold')}</label>
          <input type="range" min={0} max={100} defaultValue={78} className="w-full mt-2" />
        </div>
        <div>
          <label className="text-sm font-medium">{t('admin_ai_timeout')}</label>
          <input defaultValue={3500} className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm bg-background" />
        </div>
        <div>
          <label className="text-sm font-medium">{t('admin_ai_model')}</label>
          <select className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm bg-background"><option>gpt-4.1-mini</option><option>gpt-4.1</option><option>gpt-4o-mini</option></select>
        </div>
        <Button>{t('admin_ai_save')}</Button>
      </div>
      <div className="card-surface p-6">
        <h2 className="font-semibold mb-3">{t('admin_ai_queue_stats')}</h2>
        <div className="grid grid-cols-3 gap-3 text-sm"><div>{t('admin_ai_queue_waiting')}: <strong>42</strong></div><div>{t('admin_ai_queue_processing')}: <strong>8</strong></div><div>{t('admin_ai_queue_failed')}: <strong>2</strong></div></div>
      </div>
    </div>
  )
}
