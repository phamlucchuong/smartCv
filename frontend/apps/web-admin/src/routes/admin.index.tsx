import { createFileRoute } from '@tanstack/react-router'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StatusBadge } from '@/components/ui-kit/StatusBadge'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

const USER_GROWTH = [
  { m: 'T1', users: 2200 },
  { m: 'T2', users: 2480 },
  { m: 'T3', users: 2670 },
  { m: 'T4', users: 2890 },
  { m: 'T5', users: 3150 },
  { m: 'T6', users: 3420 },
]
const REVENUE = [
  { m: 'T1', rev: 72 },
  { m: 'T2', rev: 83 },
  { m: 'T3', rev: 78 },
  { m: 'T4', rev: 96 },
  { m: 'T5', rev: 108 },
  { m: 'T6', rev: 124 },
]

function AdminDashboard() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('admin_dashboard_title')}</h1>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          [t('admin_kpi_active_users'), '12,482'],
          [t('admin_kpi_new_candidates'), '328'],
          [t('admin_kpi_new_employers'), '64'],
          [t('admin_kpi_jobs_today'), '187'],
          [t('admin_kpi_monthly_revenue'), '124M₫'],
          [t('admin_kpi_ai_queue'), '42 jobs'],
        ].map(([label, value]) => (
          <div key={label} className="card-surface p-4">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <h2 className="font-semibold mb-4">{t('admin_chart_user_growth')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={USER_GROWTH}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="m" />
              <YAxis />
              <Tooltip />
              <Area dataKey="users" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card-surface p-5">
          <h2 className="font-semibold mb-4">{t('admin_chart_revenue')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={REVENUE}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="m" />
              <YAxis />
              <Tooltip />
              <Line dataKey="rev" stroke="var(--color-ai)" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <h3 className="font-semibold mb-3">{t('admin_pending_employers')}</h3>
          <div className="space-y-3 text-sm">
            {['ABC Tech', 'FPT Software', 'Sun Group'].map((c) => (
              <div key={c} className="flex items-center justify-between"><span>{c}</span><StatusBadge status="Pending" /></div>
            ))}
          </div>
        </div>
        <div className="card-surface p-5">
          <h3 className="font-semibold mb-3">{t('admin_recent_transactions')}</h3>
          <div className="space-y-3 text-sm">
            {[
              ['VNG', '12,000,000₫', 'Paid' as const],
              ['VNPT', '6,500,000₫', 'Pending' as const],
              ['TopCV', '9,000,000₫', 'Paid' as const],
            ].map(([company, amount, status]) => (
              <div key={company} className="flex items-center justify-between"><span>{company} • {amount}</span><StatusBadge status={status} /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
