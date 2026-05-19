import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Globe } from 'lucide-react'
import { Button } from '@smart-cv/ui'
import { useTranslation, i18n } from '@smart-cv/i18n'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { t } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const isAuthenticated = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') === 'true' : false

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-secondary/30 text-foreground transition-colors duration-300">
      {/* Persisted Top Navigation */}
      <header className="max-w-5xl mx-auto flex items-center justify-between py-6 px-4 border-b border-border">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md font-bold text-xl">
              S
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Smart CV
            </span>
          </Link>
          
          <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
            <Link 
              to="/" 
              activeProps={{ className: 'text-primary font-bold' }}
              inactiveProps={{ className: 'text-muted-foreground hover:text-foreground' }}
              className="transition-colors"
            >
              Việc làm
            </Link>
            <Link 
              to="/about" 
              activeProps={{ className: 'text-primary font-bold' }}
              inactiveProps={{ className: 'text-muted-foreground hover:text-foreground' }}
              className="transition-colors"
            >
              Giới thiệu
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile routing link */}
          <Link to="/about" className="sm:hidden text-xs text-muted-foreground hover:text-foreground font-medium">
            Giới thiệu
          </Link>

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground mr-1" />
            <Button
              variant={i18n.language === 'vi' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeLanguage('vi')}
              className="h-8 px-2.5 text-xs"
            >
              VI
            </Button>
            <Button
              variant={i18n.language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeLanguage('en')}
              className="h-8 px-2.5 text-xs"
            >
              EN
            </Button>
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold border-destructive/20 ml-2"
              >
                Đăng xuất
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Outlet for active route views */}
      <main className="max-w-5xl mx-auto py-10 px-4">
        <Outlet />
      </main>

      {/* Persisted Footer */}
      <footer className="max-w-5xl mx-auto border-t border-border mt-16 py-8 px-4 text-center text-xs text-muted-foreground">
        <p>© 2026 SmartCV Tech Platform. All rights reserved.</p>
        <p className="mt-1">Built with React 19, TanStack Router, Zustand, and @smart-cv/ui.</p>
      </footer>
    </div>
  )
}
