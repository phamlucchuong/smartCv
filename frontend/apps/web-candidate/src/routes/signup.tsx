import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label } from '@smart-cv/ui'
import { ArrowRight, Lock, Mail, Phone, Sparkles, UserRound } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { useRegisterCandidate } from '@smart-cv/api'
import type { RegisterRequestPreferredVerification, VerifyRegistrationRequestVerificationType } from '@smart-cv/api'
import { OtpVerifyModal } from '../components/auth/OtpVerifyModal'

export const Route = createFileRoute('/signup')({
  beforeLoad: () => {
    if (Cookies.get('smart_cv_token')) throw redirect({ to: '/' })
  },
  component: SignUpComponent,
})

function SignUpComponent() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [channel, setChannel] = React.useState<RegisterRequestPreferredVerification>('EMAIL')
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [otpOpen, setOtpOpen] = React.useState(false)

  const [fromSignin] = React.useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('auth_prev_route') === '/signin',
  )

  React.useEffect(() => {
    document.title = t('page_title_signup')
    sessionStorage.setItem('auth_prev_route', '/signup')
  }, [t])

  const register = useRegisterCandidate()

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Full name is required'
    if (!email.trim()) e.email = 'Email is required'
    if (!phone.trim()) e.phone = 'Phone number is required'
    if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    try {
      await register.mutateAsync({
        data: {
          fullname: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          preferredVerification: channel,
          role: 'CANDIDATE',
        },
      })
      toast.success('Check your ' + channel.toLowerCase() + ' for the OTP code')
      setOtpOpen(true)
    } catch (err: any) {
      const code = err?.response?.data?.code
      if (code === 1002) {
        setErrors((prev) => ({ ...prev, email: 'Email already registered' }))
      } else {
        toast.error(err?.response?.data?.message ?? 'Registration failed. Please try again.')
      }
    }
  }

  function handleOtpSuccess() {
    setOtpOpen(false)
    toast.success('Account verified! Please log in.')
    navigate({ to: '/signin' })
  }

  const otpContact = channel === 'EMAIL' ? email : phone
  const otpType: VerifyRegistrationRequestVerificationType = channel === 'EMAIL' ? 'EMAIL' : 'SMS'

  return (
    <>
      <OtpVerifyModal
        open={otpOpen}
        contact={otpContact}
        verificationType={otpType}
        onSuccess={handleOtpSuccess}
        onClose={() => setOtpOpen(false)}
      />

      <section className="relative mx-auto grid min-h-[82vh] max-w-6xl items-center gap-6 px-4 md:min-h-[560px] md:grid-cols-2 md:px-6">
        <div className={`flex h-full items-center justify-center ${fromSignin ? 'auth-swap-to-left' : ''}`}>
          <Card className="w-full max-w-md card-surface">
            <CardHeader className="text-left">
              <CardTitle className="text-2xl">{t('signup_title')}</CardTitle>
              <CardDescription>Start applying jobs in minutes with your SmartCV profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('full_name')} className="h-11 border-input bg-background pl-9" />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email')} className="h-11 border-input bg-background pl-9" />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="h-11 border-input bg-background pl-9" />
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} className="h-11 border-input bg-background pl-9" />
                  {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className="h-11 border-input bg-background pl-9" />
                  {errors.confirm && <p className="mt-1 text-xs text-destructive">{errors.confirm}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Receive OTP via</Label>
                  <div className="flex gap-4">
                    {(['EMAIL', 'SMS'] as RegisterRequestPreferredVerification[]).map((v) => (
                      <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="channel"
                          value={v}
                          checked={channel === v}
                          onChange={() => setChannel(v)}
                          className="accent-primary"
                        />
                        {v === 'EMAIL' ? 'Email' : 'SMS'}
                      </label>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="h-11 w-full gap-2" disabled={register.isPending}>
                  {register.isPending ? 'Creating account...' : <>{t('create_account')} <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center border-t border-border text-sm text-muted-foreground">
              {t('already_have_account')} <Link to="/signin" className="ml-1 font-semibold text-primary hover:underline">{t('login')}</Link>
            </CardFooter>
          </Card>
        </div>

        <div className={`hidden h-full rounded-3xl border border-border bg-card p-10 md:block ${fromSignin ? 'auth-swap-to-right' : ''}`}>
          <Badge className="mb-4 border border-ai/20 bg-ai-soft text-ai"><Sparkles className="mr-1 h-3.5 w-3.5" /> Build your profile</Badge>
          <h1 className="hero-title mb-5 text-5xl font-bold leading-tight lg:text-6xl">{t('signup_welcome').replace('SmartCV', '').trim()} <span className="hero-gradient">SmartCV</span></h1>
          <p className="mb-8 max-w-md text-lg leading-8 text-muted-foreground">Create your candidate profile and unlock jobs with transparent salary, growth path, and modern engineering culture.</p>
          <ul className="space-y-3 text-base text-muted-foreground">
            <li>• Build a standout CV in a few minutes</li>
            <li>• Get alerts for matching jobs instantly</li>
            <li>• Apply quickly with one-click workflow</li>
          </ul>
        </div>
      </section>
    </>
  )
}
