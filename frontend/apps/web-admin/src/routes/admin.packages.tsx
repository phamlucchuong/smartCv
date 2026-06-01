import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/admin/packages')({ component: PackagesPage })

function PackagesPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t('admin_packages_title')}</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: 'Basic', price: '1.200.000₫/tháng', features: [t('admin_pkg_basic_feature_1'), t('admin_pkg_basic_feature_2')], featured: false },
          { name: 'Pro', price: '3.500.000₫/tháng', features: [t('admin_pkg_pro_feature_1'), t('admin_pkg_pro_feature_2'), t('admin_pkg_pro_feature_3')], featured: true },
          { name: 'Premium', price: '8.000.000₫/tháng', features: [t('admin_pkg_premium_feature_1'), t('admin_pkg_premium_feature_2')], featured: false },
        ].map((pkg) => (
          <div key={pkg.name} className="card-surface p-5">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{pkg.name}</h2>{pkg.featured && <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-1">{t('admin_most_popular')}</span>}</div>
            <div className="mt-3 text-2xl font-bold">{pkg.price}</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{pkg.features.map((f) => <li key={f}>• {f}</li>)}</ul>
            <Button className="mt-5" variant="outline">{t('admin_edit_price')}</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
