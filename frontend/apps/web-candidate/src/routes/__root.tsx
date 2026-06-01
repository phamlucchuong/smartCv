import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import * as React from 'react'
import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  Facebook,
  FileText,
  FileUp,
  Globe,
  Heart,
  Linkedin,
  LogOut,
  Mail,
  Moon,
  Settings,
  Sparkles,
  Sun,
  UserRound,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@smart-cv/ui'
import { i18n, useTranslation } from '@smart-cv/i18n'
import { useCandidateStore } from '../store/useCandidateStore'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const hideFooter = pathname === '/signin' || pathname === '/signup'
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('smartcv_theme') as 'dark' | 'light' | null) ?? 'light'
  })
  const [language, setLanguage] = React.useState(i18n.language?.toUpperCase() === 'VI' ? 'VI' : 'EN')
  const [jobMenuOpen, setJobMenuOpen] = React.useState(false)
  const [resourceMenuOpen, setResourceMenuOpen] = React.useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = React.useState(false)
  const [jobFilter, setJobFilter] = React.useState(t('nav_all_jobs'))
  const [resourceFilter, setResourceFilter] = React.useState(t('nav_career_resources'))
  const [jobHighlightIndex, setJobHighlightIndex] = React.useState(0)
  const [resourceHighlightIndex, setResourceHighlightIndex] = React.useState(0)

  const isAuthenticated = useCandidateStore((state) => state.isAuthenticated)
  const user = useCandidateStore((state) => state.user)
  const signOut = useCandidateStore((state) => state.signOut)
  const refreshAuthState = useCandidateStore((state) => state.refreshAuthState)

  const jobMenuRef = React.useRef<HTMLDivElement>(null)
  const resourceMenuRef = React.useRef<HTMLDivElement>(null)
  const accountMenuRef = React.useRef<HTMLDivElement>(null)
  const closeMenuTimerRef = React.useRef<number | null>(null)

  const jobOptions = [t('nav_all_jobs'), t('nav_top_companies'), t('nav_remote_jobs'), t('nav_internships')]
  const resourceOptions = [t('nav_career_resources'), t('nav_cv_templates'), t('nav_interview_guides'), t('nav_salary_report')]

  const navigateToJobOption = (item: string) => {
    if (item === t('nav_top_companies')) {
      window.location.hash = 'companies'
      return
    }
    if (item === t('nav_all_jobs')) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (item === t('nav_remote_jobs')) {
      window.location.hash = 'remote-jobs'
      return
    }
    if (item === t('nav_internships')) {
      window.location.hash = 'internships'
    }
  }

  const navigateToResourceOption = (item: string) => {
    if (item === t('nav_career_resources')) {
      window.location.hash = 'resources'
      return
    }
    if (item === t('nav_cv_templates')) {
      window.location.hash = 'cv-templates'
      return
    }
    if (item === t('nav_interview_guides')) {
      window.location.hash = 'interview-guides'
      return
    }
    if (item === t('nav_salary_report')) {
      window.location.hash = 'salary-insights'
    }
  }

  const clearCloseTimer = () => {
    if (closeMenuTimerRef.current) {
      window.clearTimeout(closeMenuTimerRef.current)
      closeMenuTimerRef.current = null
    }
  }

  const handleAccountMouseEnter = () => {
    clearCloseTimer()
    setAccountMenuOpen(true)
  }

  const handleAccountMouseLeave = () => {
    clearCloseTimer()
    closeMenuTimerRef.current = window.setTimeout(() => setAccountMenuOpen(false), 150)
  }

  const handleSignOut = () => {
    signOut()
    setAccountMenuOpen(false)
    navigate({ to: '/signin' })
  }

  const toggleLanguage = () => {
    const nextLanguage = language === 'EN' ? 'VI' : 'EN'
    setLanguage(nextLanguage)
    localStorage.setItem('smartcv_lang', nextLanguage.toLowerCase())
    i18n.changeLanguage(nextLanguage.toLowerCase())
  }
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('smartcv_theme', next)
      return next
    })
  }

  React.useEffect(() => {
    refreshAuthState()
  }, [pathname, refreshAuthState])

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  React.useEffect(() => {
    const currentLanguage = i18n.language?.toUpperCase() === 'VI' ? 'VI' : 'EN'
    setLanguage(currentLanguage)
    setJobFilter(t('nav_all_jobs'))
    setResourceFilter(t('nav_career_resources'))
    setJobHighlightIndex(0)
    setResourceHighlightIndex(0)
  }, [t])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (jobMenuRef.current && !jobMenuRef.current.contains(target)) {
        setJobMenuOpen(false)
      }
      if (resourceMenuRef.current && !resourceMenuRef.current.contains(target)) {
        setResourceMenuOpen(false)
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      clearCloseTimer()
    }
  }, [])

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="flex h-20 w-full items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 md:gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
                S
              </div>
              <span className="text-xl font-bold text-foreground">Smart<span className="text-primary">CV</span></span>
            </Link>
            <div className="hidden items-center gap-2 md:flex">
              <div className="relative" ref={jobMenuRef}>
                <button
                  onClick={() => {
                    setJobMenuOpen((v) => !v)
                    setResourceMenuOpen(false)
                  }}
                  className="border-border bg-muted/60 text-muted-foreground flex h-10 min-w-44 cursor-pointer items-center justify-between rounded-lg border px-3 text-sm"
                >
                  {jobFilter}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>
                {jobMenuOpen && (
                  <div className="border-border bg-card absolute left-0 top-12 z-50 w-52 rounded-lg border p-1 shadow-xl">
                    {jobOptions.map((item, idx) => (
                      <button
                        key={item}
                        onClick={() => {
                          setJobFilter(item)
                          setJobHighlightIndex(idx)
                          navigateToJobOption(item)
                          setJobMenuOpen(false)
                        }}
                        className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm ${idx === jobHighlightIndex ? 'bg-muted/80' : 'hover:bg-muted/80'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={resourceMenuRef}>
                <button
                  onClick={() => {
                    setResourceMenuOpen((v) => !v)
                    setJobMenuOpen(false)
                  }}
                  className="border-border bg-muted/60 text-muted-foreground flex h-10 min-w-44 cursor-pointer items-center justify-between rounded-lg border px-3 text-sm"
                >
                  {resourceFilter}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>
                {resourceMenuOpen && (
                  <div className="border-border bg-card absolute left-0 top-12 z-50 w-52 rounded-lg border p-1 shadow-xl">
                    {resourceOptions.map((item, idx) => (
                      <button
                        key={item}
                        onClick={() => {
                          setResourceFilter(item)
                          setResourceHighlightIndex(idx)
                          navigateToResourceOption(item)
                          setResourceMenuOpen(false)
                        }}
                        className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm ${idx === resourceHighlightIndex ? 'bg-muted/80' : 'hover:bg-muted/80'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/80">
              <Bell className="h-5 w-5" />
            </Button>
            <button
              onClick={toggleLanguage}
              className="border-border bg-muted/60 relative flex h-10 w-[92px] cursor-pointer items-center rounded-lg border p-1 text-sm"
            >
              <span
                className={`absolute top-1 h-8 w-[42px] rounded-md bg-primary transition-transform duration-200 ${language === 'EN' ? 'translate-x-0' : 'translate-x-[42px]'}`}
              />
              <span className={`relative z-10 w-[42px] text-center transition-colors duration-200 ${language === 'EN' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>EN</span>
              <span className={`relative z-10 w-[42px] text-center transition-colors duration-200 ${language === 'VI' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>VI</span>
            </button>
            <Button
              variant="outline"
              onClick={toggleTheme}
              size="icon"
              className="border-border bg-muted/60 text-muted-foreground transition-transform duration-300 active:scale-95"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-12" /> : <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />}
            </Button>

            {isAuthenticated ? (
              <div
                ref={accountMenuRef}
                className="relative"
                onMouseEnter={handleAccountMouseEnter}
                onMouseLeave={handleAccountMouseLeave}
              >
                <div className="rounded-full bg-primary/20 border border-primary/30 flex items-center gap-2 px-3 py-1.5 cursor-pointer">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {user.initials}
                  </div>
                  <span className="text-sm font-medium text-foreground">{user.firstName}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </div>

                <div
                  className={`absolute right-0 top-full mt-2 min-w-[220px] rounded-xl border border-border bg-card shadow-xl z-50 transition-opacity duration-150 ${accountMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                >
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{user.initials}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <hr className="border-border my-1" />
                  <div className="p-1">
                    <Link to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      {t('account_my_profile')}
                    </Link>
                    <Link to="/cv" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors">
                      <FileUp className="h-4 w-4 text-muted-foreground" />
                      {t('account_my_cv')}
                    </Link>
                    <Link to="/assessments" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors">
                      <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                      {t('account_assessments')}
                    </Link>
                    <Link to="/notifications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      {t('account_notifications')}
                    </Link>
                  </div>
                  <hr className="border-border my-1" />
                  <div className="p-1">
                    <Link to="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      {t('account_settings')}
                    </Link>
                    <Link to="/applications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {t('account_applied_jobs')}
                    </Link>
                    <Link to="/wishlists" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      {t('account_wishlists')}
                    </Link>
                    <Link to="/job-suggestions" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      {t('account_job_suggestions')}
                    </Link>
                  </div>
                  <hr className="border-border my-1" />
                  <div className="p-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('account_sign_out')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/signin"><Button variant="outline" className="border-border bg-muted/60 text-muted-foreground">{t('login')}</Button></Link>
                <Link to="/signup"><Button className="bg-primary hover:bg-primary/90">{t('register')}</Button></Link>
              </>
            )}

            <Button variant="ghost" size="icon" className="md:hidden"><UserRound className="h-5 w-5" /></Button>
          </div>
        </div>
      </header>

      <main className="w-full py-8">
        <Outlet />
      </main>

      {!hideFooter && <footer className="bg-card border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 md:px-10">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                  S
                </div>
                <span className="text-foreground text-lg font-semibold">Smart<span className="text-primary">CV</span></span>
              </div>
              <p className="text-muted-foreground text-sm leading-6">
                A trusted hiring platform connecting developers with transparent, high-quality tech opportunities.
              </p>
              <div className="text-muted-foreground flex items-center gap-2">
                <a href="#" className="border-border rounded-md border p-2 hover:opacity-80"><Facebook className="h-4 w-4" /></a>
                <a href="#" className="border-border rounded-md border p-2 hover:opacity-80"><Linkedin className="h-4 w-4" /></a>
                <a href="#" className="border-border rounded-md border p-2 hover:opacity-80"><Globe className="h-4 w-4" /></a>
              </div>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold uppercase tracking-wide">For Candidates</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li><a href="#" className="hover:opacity-80">Browse Jobs</a></li>
                <li><a href="#" className="hover:opacity-80">Top Companies</a></li>
                <li><a href="#" className="hover:opacity-80">Salary Insights</a></li>
                <li><a href="#" className="hover:opacity-80">Career Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold uppercase tracking-wide">Resources</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li><a href="#" className="hover:opacity-80">CV Templates</a></li>
                <li><a href="#" className="hover:opacity-80">Interview Prep</a></li>
                <li><a href="#" className="hover:opacity-80">Community Stories</a></li>
                <li><a href="#" className="hover:opacity-80">Help Center</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-foreground mb-3 text-sm font-semibold uppercase tracking-wide">Contact</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />support@smartcv.vn</li>
                <li>Mon - Fri, 09:00 - 18:00 (GMT+7)</li>
                <li>Ho Chi Minh City, Vietnam</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-border text-muted-foreground flex flex-col gap-2 border-t px-4 py-4 text-xs md:flex-row md:items-center md:justify-between md:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-2 py-1 md:flex-row md:items-center md:justify-between md:px-4">
            <p>© 2026 SmartCV. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:opacity-80">Privacy Policy</a>
              <a href="#" className="hover:opacity-80">Terms of Service</a>
              <a href="#" className="hover:opacity-80">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>}
    </div>
  )
}

function NotFoundPage() {
  const { t, i18n } = useTranslation()

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('smartcv_theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark
    document.documentElement.classList.toggle('dark', isDark)

    const savedLang = localStorage.getItem('smartcv_lang')
    if (savedLang === 'en' || savedLang === 'vi') {
      i18n.changeLanguage(savedLang)
    }
  }, [i18n])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background px-4 py-10 md:px-6">
      <div className="w-full max-w-2xl text-center">
        <p className="text-8xl font-black leading-none tracking-tight text-foreground md:text-9xl">{t('not_found_title')}</p>
        <h1 className="mt-4 text-xl font-bold text-foreground">{t('not_found_heading')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{t('not_found_desc')}</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wide !text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&>svg]:!text-white"
        >
          <ArrowLeft className="size-4" />
          {t('not_found_back_home')}
        </Link>
      </div>
    </div>
  )
}
