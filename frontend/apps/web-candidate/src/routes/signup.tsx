import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@smart-cv/ui'
import { ArrowRight, Lock, Mail, Sparkles, UserRound } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'

export const Route = createFileRoute('/signup')({
  beforeLoad: () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    if (isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: SignUpComponent,
})

function SignUpComponent() {
  const navigate = Route.useNavigate()
  const { t } = useTranslation()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [fromSignin] = React.useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('auth_prev_route') === '/signin',
  )

  React.useEffect(() => {
    sessionStorage.setItem('auth_prev_route', '/signup')
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    localStorage.setItem('isAuthenticated', 'true')
    navigate({ to: '/' })
  }

  return (
    <section className="relative mx-auto grid min-h-[82vh] max-w-6xl items-center gap-6 px-4 md:min-h-[560px] md:grid-cols-2 md:px-6">
      <div className={`flex h-full items-center justify-center ${fromSignin ? 'auth-swap-to-left' : ''}`}>
        <Card className="w-full max-w-md border-white/10 bg-[#1f2833]/90">
          <CardHeader className="text-left">
            <CardTitle className="text-2xl">{t('signup_title')}</CardTitle>
            <CardDescription>Start applying jobs in minutes with your SmartCV profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('full_name')} className="h-11 border-white/10 bg-[#111844]/70 pl-9" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email')} className="h-11 border-white/10 bg-[#111844]/70 pl-9" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} className="h-11 border-white/10 bg-[#111844]/70 pl-9" />
              </div>
              <Button type="submit" className="h-11 w-full gap-2">{t('create_account')} <ArrowRight className="h-4 w-4" /></Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-white/10 text-sm text-muted-foreground">
            {t('already_have_account')} <Link to="/signin" className="ml-1 font-semibold text-secondary hover:underline">{t('login')}</Link>
          </CardFooter>
        </Card>
      </div>

      <div className={`hidden h-full rounded-3xl border border-white/10 bg-white/5 p-10 md:block ${fromSignin ? 'auth-swap-to-right' : ''}`}>
        <Badge className="mb-4 bg-secondary text-secondary-foreground"><Sparkles className="mr-1 h-3.5 w-3.5" /> Build your profile</Badge>
        <h1 className="hero-title mb-5 text-5xl font-bold leading-tight lg:text-6xl">{t('signup_welcome').replace('SmartCV', '').trim()} <span className="hero-gradient">SmartCV</span></h1>
        <p className="mb-8 max-w-md text-lg leading-8 text-muted-foreground">Create your candidate profile and unlock jobs with transparent salary, growth path, and modern engineering culture.</p>
        <ul className="space-y-3 text-base text-muted-foreground">
          <li>• Build a standout CV in a few minutes</li>
          <li>• Get alerts for matching jobs instantly</li>
          <li>• Apply quickly with one-click workflow</li>
        </ul>
      </div>
    </section>
  )
}
