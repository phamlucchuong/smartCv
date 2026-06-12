import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import * as React from 'react'
import Cookies from 'js-cookie'
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@smart-cv/ui'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/signin')({
  beforeLoad: () => {
    if (Cookies.get('smart_cv_token')) throw redirect({ to: '/' })
  },
  component: SignInComponent,
})

function SignInComponent() {
  const navigate = Route.useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState('')
  const [fromSignup] = React.useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('auth_prev_route') === '/signup',
  )

  React.useEffect(() => {
    document.title = t('page_title_signin')
    sessionStorage.setItem('auth_prev_route', '/signin')
  }, [t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    navigate({ to: '/' })
  }

  return (
    <section className="relative mx-auto grid min-h-[82vh] max-w-6xl items-center gap-6 px-4 md:min-h-[560px] md:grid-cols-2 md:px-6">
      <div className={`hidden h-full rounded-3xl border border-border bg-card p-10 md:block ${fromSignup ? 'auth-swap-to-left' : ''}`}>
        <Badge className="mb-4 border border-ai/20 bg-ai-soft text-ai"><Sparkles className="mr-1 h-3.5 w-3.5" /> Smart matching</Badge>
        <h1 className="hero-title mb-5 text-5xl font-bold leading-tight lg:text-6xl">{t('signin_welcome').replace('SmartCV', '').trim()} <span className="hero-gradient">SmartCV</span></h1>
        <p className="mb-8 max-w-md text-lg leading-8 text-muted-foreground">Continue your hiring journey with personalized jobs, salary insights, and one-click applications.</p>
        <ul className="space-y-3 text-base text-muted-foreground">
          <li>• Curated jobs from verified companies</li>
          <li>• Track applications in one dashboard</li>
          <li>• Built-in CV and interview resources</li>
        </ul>
      </div>

      <div className={`flex h-full items-center justify-center ${fromSignup ? 'auth-swap-to-right' : ''}`}>
        <Card className="w-full max-w-md card-surface">
          <CardHeader className="space-y-1 text-left">
            <CardTitle className="text-2xl">{t('signin_title')}</CardTitle>
            <CardDescription>Use your account to access candidate features.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-input bg-background pl-9"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-input bg-background pl-9 pr-10"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="h-11 w-full gap-2">{t('login')} <ArrowRight className="h-4 w-4" /></Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-border text-sm text-muted-foreground">
            {t('new_to_smartcv')} <Link to="/signup" className="ml-1 font-semibold text-primary hover:underline">{t('create_account')}</Link>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}
