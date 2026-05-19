import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input } from '@smart-cv/ui'
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react'

export const Route = createFileRoute('/signin')({
  beforeLoad: () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
    if (isAuthenticated) {
      throw redirect({
        to: '/',
      })
    }
  },
  component: SignInComponent,
})

function SignInComponent() {
  const navigate = Route.useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [rememberMe, setRememberMe] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const [emailError, setEmailError] = React.useState('')
  const [passwordError, setPasswordError] = React.useState('')

  const [forgotPasswordOpen, setForgotPasswordOpen] = React.useState(false)
  const [forgotEmail, setForgotEmail] = React.useState('')
  const [forgotSuccess, setForgotSuccess] = React.useState(false)

  const validateInputs = () => {
    let isValid = true

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.')
      isValid = false
    } else {
      setEmailError('')
    }

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.')
      isValid = false
    } else {
      setPasswordError('')
    }

    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateInputs()) {
      localStorage.setItem('isAuthenticated', 'true')
      navigate({ to: '/' })
    }
  }

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (forgotEmail && /\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotSuccess(true)
      setTimeout(() => {
        setForgotPasswordOpen(false)
        setForgotSuccess(false)
        setForgotEmail('')
      }, 3000)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10 w-96 h-96 mx-auto top-1/2 -translate-y-1/2"></div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-3">
          <Link to="/" className="flex items-center gap-3 no-underline group">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg font-bold text-2xl group-hover:scale-105 transition-transform duration-300">
              S
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            Chào mừng trở lại
          </h2>            
          <p className="text-sm text-muted-foreground">
            Đăng nhập để quản lý hồ sơ và ứng tuyển việc làm
          </p>
        </div>

        <Card className="border border-border shadow-xl bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-4 text-left">
            <CardTitle className="text-xl font-bold">Đăng nhập</CardTitle>
            <CardDescription>Nhập tài khoản email của bạn để tiếp tục</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                    className={`pl-10 h-11 ${emailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-destructive font-medium">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    className="text-xs font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (passwordError) setPasswordError('')
                    }}
                    className={`pl-10 h-11 ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-none p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-destructive font-medium">{passwordError}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="remember" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                  Ghi nhớ tài khoản trên thiết bị này
                </label>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-11 font-semibold gap-2 mt-2">
                Đăng nhập <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => alert('Đăng nhập bằng Google')}
                className="w-full gap-2 text-xs font-semibold"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => alert('Đăng nhập bằng Facebook')}
                className="w-full gap-2 text-xs font-semibold"
              >
                <svg className="h-4 w-4 mr-1 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-border pt-4 bg-secondary/5 rounded-b-xl">
            <p className="text-xs text-muted-foreground">
              Bạn chưa có tài khoản?{' '}
              <Link to="/about" className="font-semibold text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Forgot Password Modal Dialog */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <Card className="w-full max-w-sm border border-border shadow-2xl bg-card">
            <CardHeader className="pb-2 text-left">
              <CardTitle className="text-lg font-bold">Khôi phục mật khẩu</CardTitle>
              <CardDescription>
                Nhập địa chỉ email của bạn để nhận liên kết khôi phục mật khẩu.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleForgotPasswordSubmit}>
              <CardContent className="py-2 text-left space-y-3">
                {forgotSuccess ? (
                  <div className="bg-primary/10 border border-primary/20 text-primary text-xs rounded-xl p-3 font-medium">
                    ✓ Đã gửi email khôi phục mật khẩu thành công!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="forgot-email" className="text-xs font-semibold text-foreground">
                      Địa chỉ Email
                    </label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-10"
                      required
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-3 border-t border-border mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotPasswordOpen(false)}
                  disabled={forgotSuccess}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={forgotSuccess}>
                  Xác nhận
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}