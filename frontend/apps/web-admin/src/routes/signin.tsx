import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@smart-cv/ui'
import { Lock, Mail, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/signin')({
  component: SigninPage,
})

function SigninPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { t } = useTranslation()

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="px-6 lg:px-16 py-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Sparkles className="size-4" /></div>
          <span className="font-bold text-lg">SmartCV Admin</span>
        </Link>

        <div className="max-w-md mx-auto mt-20 space-y-4">
          <h1 className="text-3xl font-bold">{t('admin_signin_title')}</h1>
          <div>
            <label className="text-sm font-medium">{t('email')}</label>
            <div className="relative mt-1.5"><Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" /><input className="h-11 w-full rounded-md border border-input pl-9 pr-3 text-sm" defaultValue="admin@smartcv.vn" /></div>
          </div>
          <div>
            <div className="flex items-center justify-between"><label className="text-sm font-medium">{t('password')}</label><a className="text-xs text-primary">{t('admin_forgot_password')}</a></div>
            <div className="relative mt-1.5"><Lock className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" /><input type="password" className="h-11 w-full rounded-md border border-input pl-9 pr-3 text-sm" defaultValue="admin123" /></div>
          </div>
          <Button
            className="w-full h-11"
            onClick={() => {
              setAuth({ user: { id: '1', name: 'Admin SmartCV', email: 'admin@smartcv.vn' }, token: 'demo-admin-token' })
              navigate({ to: '/admin' })
            }}
          >
            {t('login')}
          </Button>
        </div>
      </div>
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-primary via-blue-600 to-violet-600 text-white p-12">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold">{t('admin_signin_visual_title')}</h2>
          <p className="mt-2 opacity-90">{t('admin_signin_visual_desc')}</p>
        </div>
      </div>
    </div>
  )
}
