import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@smart-cv/ui'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { toast } from 'sonner'
import { useLoginCandidate, useVerifyCandidateRegistration, useResendRegistrationOtp } from '@smart-cv/api'
import { hasCandidateRole, useAuthStore } from '../store/useAuthStore'

interface JwtPayload {
  scope?: string
}

function maskContact(contact: string): string {
  if (contact.includes('@')) {
    const [local, domain] = contact.split('@')
    return `${local.charAt(0)}***@${domain}`
  }
  return `${contact.slice(0, 3)}***${contact.slice(-2)}`
}

export const Route = createFileRoute('/signin')({
  beforeLoad: () => {
    if (Cookies.get('smart_cv_token')) throw redirect({ to: '/' })
  },
  component: SignInComponent,
})

function SignInComponent() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const signIn = useAuthStore((s) => s.signIn)

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState('')
  const [otpOpen, setOtpOpen] = React.useState(false)

  // OTP states
  const [otpDigits, setOtpDigits] = React.useState<string[]>(Array(6).fill(''))
  const [otpCountdown, setOtpCountdown] = React.useState(60)
  const [otpError, setOtpError] = React.useState('')
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const verifyMutation = useVerifyCandidateRegistration()
  const resendMutation = useResendRegistrationOtp()

  const [fromSignup] = React.useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('auth_prev_route') === '/signup',
  )

  React.useEffect(() => {
    document.title = t('page_title_signin')
    sessionStorage.setItem('auth_prev_route', '/signin')
  }, [t])

  function openOtpPanel() {
    setOtpDigits(Array(6).fill(''))
    setOtpError('')
    setOtpCountdown(60)
    setOtpOpen(true)
  }

  React.useEffect(() => {
    if (!otpOpen) return
    const timer = setInterval(() => {
      setOtpCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [otpOpen])

  const login = useLoginCandidate()

  async function attemptLogin(emailVal: string, passwordVal: string) {
    const result = await login.mutateAsync({ data: { email: emailVal, password: passwordVal } })
    const accessToken = result.data?.token
    const refreshToken = result.data?.refreshToken
    if (!accessToken || !refreshToken) throw new Error('Invalid token response')
    const payload = jwtDecode<JwtPayload>(accessToken)
    if (!hasCandidateRole(payload.scope)) {
      throw new Error('This account does not have candidate access.')
    }
    signIn(accessToken, refreshToken)
    navigate({ to: '/' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      const msg = 'Please enter both email and password.'
      setError(msg)
      toast.error(msg)
      return
    }
    setError('')
    try {
      await attemptLogin(email, password)
    } catch (err: unknown) {
      const e = err as any
      if (e?.response?.data?.code === 3003) {
        openOtpPanel()
      } else {
        const errorMsg = e?.response?.data?.message ?? e?.message ?? 'Invalid email or password.'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    }
  }

  async function handleOtpSuccess() {
    setOtpOpen(false)
    toast.success('Account verified!')
    try {
      await attemptLogin(email, password)
    } catch {
      toast.error('Verification succeeded but login failed. Please try signing in again.')
      navigate({ to: '/signin' })
    }
  }

  function handleOtpChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...otpDigits]
    next[index] = char
    setOtpDigits(next)
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''))
      otpInputRefs.current[5]?.focus()
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = otpDigits.join('')
    if (code.length < 6) return
    setOtpError('')
    try {
      await verifyMutation.mutateAsync({
        data: { contact: email, verificationType: 'EMAIL', code },
      })
      await handleOtpSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setOtpError(e?.response?.data?.message ?? 'Invalid OTP. Please try again.')
    }
  }

  async function handleOtpResend() {
    if (otpCountdown > 0) return
    setOtpError('')
    try {
      await resendMutation.mutateAsync({
        data: { contact: email, preferredVerification: 'EMAIL' },
      })
      setOtpCountdown(60)
      const timer = setInterval(() => {
        setOtpCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer)
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch {
      setOtpError('Failed to resend OTP. Please try again.')
    }
  }

  return (
    <>
      <section className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-6 px-4 md:grid-cols-2 md:px-6">
        <div className={`hidden rounded-3xl border border-border bg-card p-10 md:flex md:flex-col md:justify-center ${fromSignup ? 'auth-swap-to-left' : ''}`}>
          <Badge className="mb-4 border border-ai/20 bg-ai-soft text-ai w-fit flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 animate-pulse text-ai" /> Smart matching</Badge>
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
            <CardHeader className="text-left">
              <CardTitle className="text-2xl">{otpOpen ? 'Verify your account' : t('signin_title')}</CardTitle>
              <CardDescription>
                {otpOpen ? 'Confirm your details to activate your account.' : 'Use your account to access candidate features.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {otpOpen ? (
                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="text-sm text-muted-foreground mb-4">
                    Enter the 6-digit code sent to <strong>{maskContact(email)}</strong>
                  </div>
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpInputRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    ))}
                  </div>

                  {otpError && <p className="text-center text-sm text-destructive">{otpError}</p>}

                  <Button
                    type="submit"
                    className="h-11 w-full"
                    disabled={otpDigits.join('').length < 6 || verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground mt-4">
                    {otpCountdown > 0 ? (
                      <span>Resend in {otpCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOtpResend}
                        disabled={resendMutation.isPending}
                        className="text-primary hover:underline disabled:opacity-50"
                      >
                        {resendMutation.isPending ? 'Sending...' : 'Resend OTP'}
                      </button>
                    )}
                  </div>

                  <div className="text-center text-sm mt-4">
                    <button
                      type="button"
                      onClick={() => setOtpOpen(false)}
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 border-input bg-background pl-9" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 border-input bg-background pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button type="submit" className="h-11 w-full gap-2" disabled={login.isPending}>
                    {login.isPending ? 'Signing in...' : <>{t('login')} <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="justify-center border-t border-border text-sm text-muted-foreground">
              {t('new_to_smartcv')} <Link to="/signup" className="ml-1 font-semibold text-primary hover:underline">{t('create_account')}</Link>
            </CardFooter>
          </Card>
        </div>
      </section>
    </>
  )
}
