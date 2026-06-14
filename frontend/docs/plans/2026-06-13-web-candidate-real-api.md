# Web Candidate — Real API Integration & Auth/OTP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all stub/mock code in web-candidate with real orval-generated API hooks, implement full auth flow (signup + OTP modal + signin + cookie-based tokens + refresh).

**Architecture:** Auth state lives in a new `useAuthStore` (cookies for tokens, decoded JWT for user identity). All data is fetched via TanStack Query hooks from `@smart-cv/api`. `useCandidateStore` is stripped to `usePreferencesStore` (theme + language only). The OTP flow is a modal, not a route.

**Tech Stack:** React 19, TanStack Router, TanStack Query v5, Zustand, Orval-generated hooks, js-cookie, jwt-decode, sonner (already installed), shadcn Dialog (already in @smart-cv/ui)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/api/src/index.ts` | Modify | Export all new generated controller hooks |
| `packages/api/src/axios-instance.ts` | Modify | Cookie-based token, refresh interceptor, signout callback |
| `apps/web-candidate/package.json` | Modify | Add js-cookie, @types/js-cookie, jwt-decode |
| `apps/web-candidate/src/store/useAuthStore.ts` | Create | Token cookies + decoded user identity |
| `apps/web-candidate/src/store/usePreferencesStore.ts` | Create (rename from useCandidateStore) | Theme + language only |
| `apps/web-candidate/src/routes/_account.tsx` | Modify | Guard checks cookie instead of localStorage |
| `apps/web-candidate/src/routes/signin.tsx` | Modify | useLoginCandidate + 3003 → modal |
| `apps/web-candidate/src/routes/signup.tsx` | Modify | useRegisterCandidate + new fields + modal |
| `apps/web-candidate/src/components/auth/OtpVerifyModal.tsx` | Create | 6-digit OTP dialog, resend, countdown |
| `apps/web-candidate/src/components/layouts/CandidateDashboardLayout.tsx` | Modify | signOut from useAuthStore, user from useGetMe2 |
| `apps/web-candidate/src/routes/_account.profile.tsx` | Modify | useGetMe2 |
| `apps/web-candidate/src/routes/_account.cv.tsx` | Modify | useListCvs |
| `apps/web-candidate/src/routes/_account.applications.tsx` | Modify | useGetMyApplications |
| `apps/web-candidate/src/routes/_account.assessments.tsx` | Modify | useGetMyAssessments |
| `apps/web-candidate/src/routes/_account.job-suggestions.tsx` | Modify | useGetJobSuggestions |
| `apps/web-candidate/src/routes/_account.wishlists.tsx` | Modify | useGetMyWishlists |
| `apps/web-candidate/src/routes/_account.notifications.tsx` | Modify | Empty state (no backend hook yet) |
| `apps/web-candidate/src/routes/_account.settings.tsx` | Modify | useGetSettings |
| `apps/web-candidate/src/routes/index.tsx` | Modify | useGetFeaturedJobs, useGetTopCompanies, useGetStats |
| `apps/web-candidate/src/routes/jobs/` | Modify | useGetActiveJobs, useSearchJobs, useGetJobById |
| `apps/web-candidate/src/routes/companies/` | Modify | useGetAll2, useGetById2, useGetCompanyJobs |
| `apps/web-candidate/src/routes/about.tsx` | Modify | Remove useCandidateStore import |

---

## Task 0: Export All Generated Hooks from @smart-cv/api

**Files:**
- Modify: `packages/api/src/index.ts`

- [ ] **Step 1: Update index.ts to export all new controller hooks**

Replace the contents of `packages/api/src/index.ts`:

```typescript
export * from './axios-instance';

// Auth (web-candidate static spec — well-named hooks)
export * from './generated/auth/auth';
export * from './generated/users/users';

// User service — candidate, wishlist, company controllers
export * from './generated/user/candidate-controller/candidate-controller';
export * from './generated/user/wishlist-controller/wishlist-controller';
export * from './generated/user/company-controller/company-controller';

// Job service
export * from './generated/job/job-controller/job-controller';
export * from './generated/job/home-controller/home-controller';

// Application service
export * from './generated/application/application-controller/application-controller';
export * from './generated/application/assessment-controller/assessment-controller';

// AI service
export * from './generated/ai/analysis/analysis';
export * from './generated/ai/ai-admin/ai-admin';

// Models
export * from './generated/model';
```

- [ ] **Step 2: Verify no duplicate export errors**

```bash
cd /path/to/frontend && pnpm -F @smart-cv/api build 2>&1 | head -30
```

Expected: build succeeds. If you see "Duplicate export" errors, remove the conflicting old lines (`./generated/candidates/candidates`, `./generated/applications/applications`, `./generated/jobs/jobs`) — they have been superseded by the new controller exports.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/index.ts
git commit -m "feat(api): export all generated controller hooks from package index"
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/web-candidate/package.json`

- [ ] **Step 1: Add js-cookie and jwt-decode to web-candidate**

```bash
cd apps/web-candidate && pnpm add js-cookie jwt-decode && pnpm add -D @types/js-cookie
```

- [ ] **Step 2: Verify install**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | head -20
```

Expected: no "Cannot find module 'js-cookie'" errors (there may be other errors that will be fixed in later tasks — that is fine).

- [ ] **Step 3: Commit**

```bash
git add apps/web-candidate/package.json pnpm-lock.yaml
git commit -m "feat(web-candidate): add js-cookie and jwt-decode dependencies"
```

---

## Task 2: Update Axios Instance (Cookie Auth + Refresh Interceptor)

**Files:**
- Modify: `packages/api/src/axios-instance.ts`

The interceptor cannot import `useAuthStore` (different package — circular dep). Instead it exposes a `registerSignOutHandler` callback that the app registers at startup.

- [ ] **Step 1: Rewrite axios-instance.ts**

```typescript
import axios, { AxiosRequestConfig } from 'axios';

const ACCESS_COOKIE = 'smart_cv_token';
const REFRESH_COOKIE = 'smart_cv_refresh';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? match.split('=').slice(1).join('=') : null;
}

function setCookieRaw(name: string, value: string, days: number) {
  document.cookie = `${name}=${value}; Max-Age=${days * 86400}; path=/; SameSite=Lax`;
}

function removeCookieRaw(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

// App registers this at startup so the interceptor can sign the user out
type SignOutHandler = () => void;
let _signOutHandler: SignOutHandler | null = null;
export function registerSignOutHandler(fn: SignOutHandler) {
  _signOutHandler = fn;
}

export const AXIOS_INSTANCE = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// --- Request: attach access token ---
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = getCookie(ACCESS_COOKIE);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Response: refresh on 401 ---
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

AXIOS_INSTANCE.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getCookie(REFRESH_COOKIE);
    if (!refreshToken) {
      _signOutHandler?.();
      if (typeof window !== 'undefined') window.location.href = '/signin';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(AXIOS_INSTANCE(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await AXIOS_INSTANCE.post('/user/api/auth/refresh', { refreshToken });
      // NOTE: verify field name matches backend — spec says "token", backend may say "accessToken"
      const newToken: string = res.data?.data?.token ?? res.data?.data?.accessToken;
      if (!newToken) throw new Error('No token in refresh response');
      setCookieRaw(ACCESS_COOKIE, newToken, 1);
      processQueue(null, newToken);
      original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
      return AXIOS_INSTANCE(original);
    } catch (err) {
      processQueue(err, null);
      removeCookieRaw(ACCESS_COOKIE);
      removeCookieRaw(REFRESH_COOKIE);
      _signOutHandler?.();
      if (typeof window !== 'undefined') window.location.href = '/signin';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);
  // @ts-ignore
  promise.cancel = () => source.cancel('Query was cancelled');
  return promise;
};

export default AXIOS_INSTANCE;
```

- [ ] **Step 2: Type-check**

```bash
pnpm -F @smart-cv/api build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/axios-instance.ts
git commit -m "feat(api): cookie-based auth token and refresh token interceptor"
```

---

## Task 3: Create useAuthStore

**Files:**
- Create: `apps/web-candidate/src/store/useAuthStore.ts`

- [ ] **Step 1: Create the store**

```typescript
// apps/web-candidate/src/store/useAuthStore.ts
import { create } from 'zustand'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

const ACCESS_COOKIE = 'smart_cv_token'
const REFRESH_COOKIE = 'smart_cv_refresh'

interface JwtPayload {
  sub?: string       // userId
  email?: string
  scope?: string     // e.g. "ROLE_CANDIDATE" — verify against actual backend JWT
  [key: string]: unknown
}

interface AuthState {
  userId: string | null
  email: string | null
  role: string | null
  isAuthenticated: boolean
  signIn: (accessToken: string, refreshToken: string) => void
  signOut: () => void
}

function decodeJwt(token: string): Pick<AuthState, 'userId' | 'email' | 'role'> {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    return {
      userId: payload.sub ?? null,
      email: payload.email ?? null,
      role: payload.scope?.split(' ')[0] ?? null,
    }
  } catch {
    return { userId: null, email: null, role: null }
  }
}

function initFromCookie(): Pick<AuthState, 'userId' | 'email' | 'role' | 'isAuthenticated'> {
  const token = Cookies.get(ACCESS_COOKIE)
  if (!token) return { userId: null, email: null, role: null, isAuthenticated: false }
  return { ...decodeJwt(token), isAuthenticated: true }
}

export const useAuthStore = create<AuthState>()((set) => ({
  ...initFromCookie(),

  signIn: (accessToken, refreshToken) => {
    Cookies.set(ACCESS_COOKIE, accessToken, { expires: 1, path: '/', sameSite: 'Lax' })
    Cookies.set(REFRESH_COOKIE, refreshToken, { expires: 7, path: '/', sameSite: 'Lax' })
    set({ ...decodeJwt(accessToken), isAuthenticated: true })
  },

  signOut: () => {
    Cookies.remove(ACCESS_COOKIE, { path: '/' })
    Cookies.remove(REFRESH_COOKIE, { path: '/' })
    set({ userId: null, email: null, role: null, isAuthenticated: false })
  },
}))
```

- [ ] **Step 2: Register the signOut handler in the app root**

Open `apps/web-candidate/src/routes/__root.tsx`. Add these two lines near the top of the component (before the return):

```typescript
import { registerSignOutHandler } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'

// Inside the root component function, before the return statement:
React.useEffect(() => {
  registerSignOutHandler(() => useAuthStore.getState().signOut())
}, [])
```

- [ ] **Step 3: Type-check**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep -v "useCandidateStore\|MockUser\|CVItem" | head -20
```

Expected: no errors related to useAuthStore or registerSignOutHandler.

- [ ] **Step 4: Commit**

```bash
git add apps/web-candidate/src/store/useAuthStore.ts apps/web-candidate/src/routes/__root.tsx
git commit -m "feat(web-candidate): add useAuthStore with cookie-based JWT auth"
```

---

## Task 4: Strip useCandidateStore → usePreferencesStore

**Files:**
- Modify: `apps/web-candidate/src/store/useCandidateStore.ts` (content replaced)
- Modify: all files that imported from it

This task replaces the large mock-data store with a minimal preferences store. All importing files will break until they're updated — fix all imports in this same task before committing.

- [ ] **Step 1: Replace useCandidateStore.ts content**

Overwrite `apps/web-candidate/src/store/useCandidateStore.ts` with:

```typescript
// Re-export from the new store for backwards compatibility during migration.
// Once all pages are updated, delete this file.
export { usePreferencesStore, type PreferencesState } from './usePreferencesStore'
```

- [ ] **Step 2: Create usePreferencesStore.ts**

Create `apps/web-candidate/src/store/usePreferencesStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'
type Language = 'EN' | 'VI'

export interface PreferencesState {
  theme: Theme
  language: Language
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleLanguage: () => void
  syncLanguageFromI18n: (language: string | undefined) => void
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return (localStorage.getItem('smartcv_theme') as Theme | null) ?? 'light'
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'EN'
  return localStorage.getItem('smartcv_lang') === 'vi' ? 'VI' : 'EN'
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      language: getInitialLanguage(),

      setTheme: (theme) => {
        localStorage.setItem('smartcv_theme', theme)
        set({ theme })
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        localStorage.setItem('smartcv_theme', next)
        set({ theme: next })
      },

      toggleLanguage: () => {
        const next = get().language === 'EN' ? 'VI' : 'EN'
        localStorage.setItem('smartcv_lang', next.toLowerCase())
        set({ language: next })
      },

      syncLanguageFromI18n: (language) =>
        set({ language: language?.toUpperCase() === 'VI' ? 'VI' : 'EN' }),
    }),
    {
      name: 'smartcv_preferences',
      partialize: (state) => ({ theme: state.theme, language: state.language }),
    }
  )
)
```

- [ ] **Step 3: Update CandidateDashboardLayout.tsx**

Open `apps/web-candidate/src/components/layouts/CandidateDashboardLayout.tsx`.

Replace:
```typescript
import { useCandidateStore } from '../../store/useCandidateStore'
// ...
const user = useCandidateStore((s) => s.user)
const theme = useCandidateStore((s) => s.theme)
const language = useCandidateStore((s) => s.language)
const toggleTheme = useCandidateStore((s) => s.toggleTheme)
const toggleLanguage = useCandidateStore((s) => s.toggleLanguage)
const signOut = useCandidateStore((s) => s.signOut)
```

With:
```typescript
import { usePreferencesStore } from '../../store/usePreferencesStore'
import { useAuthStore } from '../../store/useAuthStore'
// ...
const theme = usePreferencesStore((s) => s.theme)
const language = usePreferencesStore((s) => s.language)
const toggleTheme = usePreferencesStore((s) => s.toggleTheme)
const toggleLanguage = usePreferencesStore((s) => s.toggleLanguage)
const { email, signOut } = useAuthStore()
```

Replace all usages of `user.name`, `user.email`, `user.initials` etc. with:
- Name: use `email?.split('@')[0] ?? 'Account'` as a placeholder until profile page loads
- Initials: use `email?.charAt(0).toUpperCase() ?? '?'`
- Remove `user` variable entirely from this component

- [ ] **Step 4: Update about.tsx**

Remove the `count` usage — it's gone. Open `apps/web-candidate/src/routes/about.tsx` and delete:
```typescript
import { useCandidateStore } from '../store/useCandidateStore'
// ...
const { count } = useCandidateStore()
```
And any JSX that renders `count`.

- [ ] **Step 5: Stub remaining pages temporarily**

Pages `_account.profile`, `_account.cv`, `_account.applications`, `_account.assessments`, `_account.job-suggestions`, `_account.wishlists`, `_account.settings` still import from `useCandidateStore`. In each file, replace:

```typescript
import { useCandidateStore } from '../store/useCandidateStore'
```
With:
```typescript
// TODO: wire real hook — see plan tasks 9–16
```

And replace all `useCandidateStore(...)` calls with empty/null values so the file compiles:
```typescript
const applications: never[] = []
```
(Adjust variable names and types per file — the goal is TypeScript compiles, UI shows empty state temporarily.)

- [ ] **Step 6: Type-check**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web-candidate/src/store/ apps/web-candidate/src/components/ apps/web-candidate/src/routes/
git commit -m "refactor(web-candidate): strip mock data store, create usePreferencesStore"
```

---

## Task 5: Update Route Guard

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.tsx`

- [ ] **Step 1: Update beforeLoad to check cookie**

Replace the entire `_account.tsx`:

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import Cookies from 'js-cookie'
import { CandidateDashboardLayout } from '../components/layouts/CandidateDashboardLayout'

export const Route = createFileRoute('/_account')({
  beforeLoad: () => {
    if (!Cookies.get('smart_cv_token')) {
      throw redirect({ to: '/signin' })
    }
  },
  component: CandidateDashboardLayout,
})
```

- [ ] **Step 2: Update signin/signup guards similarly**

In `apps/web-candidate/src/routes/signin.tsx`, replace:
```typescript
const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
if (isAuthenticated) { throw redirect({ to: '/' }) }
```
With:
```typescript
import Cookies from 'js-cookie'
// ...
if (Cookies.get('smart_cv_token')) { throw redirect({ to: '/' }) }
```

Do the same in `apps/web-candidate/src/routes/signup.tsx`.

- [ ] **Step 3: Type-check**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | head -10
```

- [ ] **Step 4: Commit**

```bash
git add apps/web-candidate/src/routes/_account.tsx apps/web-candidate/src/routes/signin.tsx apps/web-candidate/src/routes/signup.tsx
git commit -m "feat(web-candidate): update route guards to use cookie-based auth"
```

---

## Task 6: Create OtpVerifyModal Component

**Files:**
- Create: `apps/web-candidate/src/components/auth/OtpVerifyModal.tsx`

- [ ] **Step 1: Create the component**

```typescript
// apps/web-candidate/src/components/auth/OtpVerifyModal.tsx
import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@smart-cv/ui'
import { useVerifyCandidateRegistration, useResendRegistrationOtp } from '@smart-cv/api'
import type { VerifyRegistrationRequestVerificationType } from '@smart-cv/api'

interface Props {
  open: boolean
  contact: string                            // email or phone
  verificationType: VerifyRegistrationRequestVerificationType
  onSuccess: () => void
  onClose: () => void
}

function maskContact(contact: string): string {
  if (contact.includes('@')) {
    const [local, domain] = contact.split('@')
    return `${local.charAt(0)}***@${domain}`
  }
  return `${contact.slice(0, 3)}***${contact.slice(-2)}`
}

export function OtpVerifyModal({ open, contact, verificationType, onSuccess, onClose }: Props) {
  const [digits, setDigits] = React.useState<string[]>(Array(6).fill(''))
  const [countdown, setCountdown] = React.useState(60)
  const [error, setError] = React.useState('')
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const verify = useVerifyCandidateRegistration()
  const resend = useResendRegistrationOtp()

  // Start countdown when modal opens
  React.useEffect(() => {
    if (!open) return
    setDigits(Array(6).fill(''))
    setError('')
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [open])

  function handleChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < 6) return
    setError('')
    try {
      await verify.mutateAsync({ data: { contact, verificationType, code } })
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid OTP. Please try again.')
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    setError('')
    try {
      await resend.mutateAsync({ data: { contact, verificationType } })
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0 }
          return c - 1
        })
      }, 1000)
    } catch {
      setError('Failed to resend OTP. Please try again.')
    }
  }

  const code = digits.join('')

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Verify your account</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code sent to <strong>{maskContact(contact)}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ))}
          </div>

          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={code.length < 6 || verify.isPending}
          >
            {verify.isPending ? 'Verifying...' : 'Verify'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {countdown > 0 ? (
            <span>Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resend.isPending}
              className="text-primary hover:underline disabled:opacity-50"
            >
              {resend.isPending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "OtpVerify" | head -10
```

Expected: no errors for OtpVerifyModal.

- [ ] **Step 3: Commit**

```bash
git add apps/web-candidate/src/components/auth/OtpVerifyModal.tsx
git commit -m "feat(web-candidate): add OtpVerifyModal dialog component"
```

---

## Task 7: Wire signup.tsx

**Files:**
- Modify: `apps/web-candidate/src/routes/signup.tsx`

- [ ] **Step 1: Rewrite signup.tsx**

```typescript
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
                {/* Full name */}
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('full_name')} className="h-11 border-input bg-background pl-9" />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('email')} className="h-11 border-input bg-background pl-9" />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
                {/* Phone */}
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="h-11 border-input bg-background pl-9" />
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                </div>
                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password')} className="h-11 border-input bg-background pl-9" />
                  {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
                </div>
                {/* Confirm password */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" className="h-11 border-input bg-background pl-9" />
                  {errors.confirm && <p className="mt-1 text-xs text-destructive">{errors.confirm}</p>}
                </div>
                {/* OTP channel radio */}
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
```

- [ ] **Step 2: Verify RegisterRequestPreferredVerification enum values**

Open `packages/api/src/generated/model/registerRequestPreferredVerification.ts` and confirm the enum values are `'EMAIL'` and `'SMS'`. If they differ, update the `channel` state type and radio values accordingly.

- [ ] **Step 3: Type-check**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "signup" | head -10
```

- [ ] **Step 4: Commit**

```bash
git add apps/web-candidate/src/routes/signup.tsx
git commit -m "feat(web-candidate): wire signup with real API, OTP modal, confirm password"
```

---

## Task 8: Wire signin.tsx

**Files:**
- Modify: `apps/web-candidate/src/routes/signin.tsx`

- [ ] **Step 1: Rewrite signin.tsx**

```typescript
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@smart-cv/ui'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { useLoginCandidate } from '@smart-cv/api'
import type { VerifyRegistrationRequestVerificationType } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'
import { OtpVerifyModal } from '../components/auth/OtpVerifyModal'

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

  const [fromSignup] = React.useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('auth_prev_route') === '/signup',
  )

  React.useEffect(() => {
    document.title = t('page_title_signin')
    sessionStorage.setItem('auth_prev_route', '/signin')
  }, [t])

  const login = useLoginCandidate()

  async function attemptLogin(emailVal: string, passwordVal: string) {
    const result = await login.mutateAsync({ data: { email: emailVal, password: passwordVal } })
    // NOTE: verify token field name — spec says "token", backend may say "accessToken"
    const accessToken = result.data?.token ?? (result.data as any)?.accessToken
    const refreshToken = result.data?.refreshToken
    if (!accessToken || !refreshToken) throw new Error('Invalid token response')
    signIn(accessToken, refreshToken)
    navigate({ to: '/' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    setError('')
    try {
      await attemptLogin(email, password)
    } catch (err: any) {
      const code = err?.response?.data?.code
      if (code === 3003) {
        // User exists but not verified — open OTP modal
        setOtpOpen(true)
      } else {
        setError(err?.response?.data?.message ?? 'Invalid email or password.')
      }
    }
  }

  async function handleOtpSuccess() {
    setOtpOpen(false)
    toast.success('Account verified!')
    // Re-attempt login with the same credentials
    try {
      await attemptLogin(email, password)
    } catch {
      toast.error('Verification succeeded but login failed. Please try signing in again.')
      navigate({ to: '/signin' })
    }
  }

  return (
    <>
      <OtpVerifyModal
        open={otpOpen}
        contact={email}
        verificationType={'EMAIL' as VerifyRegistrationRequestVerificationType}
        onSuccess={handleOtpSuccess}
        onClose={() => setOtpOpen(false)}
      />

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
```

- [ ] **Step 2: Type-check**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "signin" | head -10
```

- [ ] **Step 3: Manual smoke test**
  - Start backend services and `pnpm -F web-candidate dev`
  - Register a new account → OTP modal should appear
  - Enter correct OTP → redirected to /signin with toast
  - Sign in with verified account → cookie `smart_cv_token` set → redirected to /
  - Sign in with unverified account → OTP modal should appear

- [ ] **Step 4: Commit**

```bash
git add apps/web-candidate/src/routes/signin.tsx
git commit -m "feat(web-candidate): wire signin with real API, cookie auth, OTP on 3003"
```

---

## Task 9: Wire _account.profile.tsx

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.profile.tsx`

- [ ] **Step 1: Replace mock data with useGetMe2**

At the top of `_account.profile.tsx`, replace the store imports with:

```typescript
import { useGetMe2 } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'
```

Inside the component, replace all `useCandidateStore(...)` calls with:

```typescript
const { isAuthenticated } = useAuthStore()
const { data, isLoading, isError } = useGetMe2({ query: { enabled: isAuthenticated } })
const profile = data?.data  // CandidateResponse
```

Add loading and error states before the main JSX:

```typescript
if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>
if (isError) return <div className="p-8 text-center text-destructive">Failed to load profile.</div>
```

Replace each `user.X` reference with the equivalent from `profile`:
- `user.name` → `profile?.fullName ?? ''`
- `user.email` → `profile?.email ?? ''`
- `user.phone` → `profile?.phone ?? ''`
- `user.bio` → `profile?.bio ?? ''`
- `user.title` → `profile?.title ?? ''`
- `experiences` → `profile?.experiences ?? []`
- `educations` → `profile?.educations ?? []`
- `skills` → `profile?.skills ?? []`

For mutations (updateUser, addExperience, etc.): these need a `useUpdateCandidateProfile` mutation — check if one exists in `candidate-controller.ts` with `grep "updateProfile\|updateCandidate\|update.*candidate" packages/api/src/generated/user/candidate-controller/candidate-controller.ts`. If found, wire it. If not found, leave the save buttons as no-ops with `toast.info('Save not yet supported')` and note in a TODO comment.

- [ ] **Step 2: Type-check**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "profile" | head -10
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-candidate/src/routes/_account.profile.tsx
git commit -m "feat(web-candidate): wire profile page to useGetMe2"
```

---

## Task 10: Wire _account.cv.tsx

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.cv.tsx`

- [ ] **Step 1: Replace mock data with useListCvs**

```typescript
import { useListCvs } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'
```

Inside the component:

```typescript
const { isAuthenticated } = useAuthStore()
const { data, isLoading, isError } = useListCvs({ query: { enabled: isAuthenticated } })
const cvList = data?.data ?? []
```

Add loading and error states:

```typescript
if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading CVs...</div>
if (isError) return <div className="p-8 text-center text-destructive">Failed to load CVs.</div>
```

The `CvUploadResponse` only has `cvUrl`. The CV list items from the API have different shape than the mock `CVItem`. Map `data` to display: use `cvUrl` as the identifier, show the filename portion of the URL.

For upload mutation: check if `candidate-controller` has a CV upload endpoint with `grep "uploadCv\|uploadCV\|upload.*cv" packages/api/src/generated/user/candidate-controller/candidate-controller.ts`. Wire if found, otherwise show `toast.info('CV upload coming soon')`.

- [ ] **Step 2: Remove CVItem type import** (it came from useCandidateStore which no longer exports it)

- [ ] **Step 3: Type-check and commit**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "_account.cv" | head -5
git add apps/web-candidate/src/routes/_account.cv.tsx
git commit -m "feat(web-candidate): wire CV page to useListCvs"
```

---

## Task 11: Wire _account.applications.tsx

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.applications.tsx`

- [ ] **Step 1: Replace mock data with useGetMyApplications**

```typescript
import { useGetMyApplications } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'
```

Inside the component:

```typescript
const { isAuthenticated } = useAuthStore()
const { data, isLoading, isError } = useGetMyApplications({ query: { enabled: isAuthenticated } })
// ApplicationPageResponse wraps items in .data (not .content)
const applications = data?.data?.data ?? []
```

Add loading/error states:

```typescript
if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading applications...</div>
if (isError) return <div className="p-8 text-center text-destructive">Failed to load applications.</div>
```

Map `ApplicationResponse` fields to the existing card UI:
- `job.id` → `application.jobId` (use as link target)
- `job.status` → `application.status`
- `job.appliedAt` → `application.appliedAt`

**Update `statusMap` keys** — the real enum values differ from the mock:

```typescript
import { ApplicationStatus } from '@smart-cv/api'

const statusMap: Record<string, { labelKey: string; className: string }> = {
  [ApplicationStatus.PENDING]:   { labelKey: 'application_status_applied',      className: 'border border-border bg-secondary text-secondary-foreground' },
  [ApplicationStatus.REVIEWING]: { labelKey: 'application_status_under_review', className: 'border border-warning/20 bg-warning-soft text-warning' },
  [ApplicationStatus.ACCEPTED]:  { labelKey: 'application_status_offer',        className: 'border border-success/20 bg-success-soft text-success' },
  [ApplicationStatus.REJECTED]:  { labelKey: 'application_status_rejected',     className: 'border border-danger/20 bg-danger-soft text-danger' },
  [ApplicationStatus.WITHDRAWN]: { labelKey: 'application_status_applied',      className: 'border border-border bg-secondary text-secondary-foreground' },
}
```

- [ ] **Step 2: Type-check and commit**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "applications" | head -5
git add apps/web-candidate/src/routes/_account.applications.tsx
git commit -m "feat(web-candidate): wire applications page to useGetMyApplications"
```

---

## Task 12: Wire _account.assessments.tsx

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.assessments.tsx`

- [ ] **Step 1: Replace mock data with useGetMyAssessments**

```typescript
import { useGetMyAssessments } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'
```

Inside component:

```typescript
const { isAuthenticated } = useAuthStore()
const { data, isLoading, isError } = useGetMyAssessments({ query: { enabled: isAuthenticated } })
const assessments = data?.data ?? []
```

Add loading/error/empty states. Map assessment fields to existing UI.

- [ ] **Step 2: Type-check and commit**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "assessments" | head -5
git add apps/web-candidate/src/routes/_account.assessments.tsx
git commit -m "feat(web-candidate): wire assessments page to useGetMyAssessments"
```

---

## Task 13: Wire _account.job-suggestions.tsx

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.job-suggestions.tsx`

- [ ] **Step 1: Replace mock data with useGetJobSuggestions**

```typescript
import { useGetJobSuggestions } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'
```

Inside component:

```typescript
const { isAuthenticated } = useAuthStore()
const { data, isLoading, isError } = useGetJobSuggestions({ query: { enabled: isAuthenticated } })
const suggestions = data?.data ?? []
```

Add loading/error/empty states.

- [ ] **Step 2: Type-check and commit**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "job-suggest" | head -5
git add apps/web-candidate/src/routes/_account.job-suggestions.tsx
git commit -m "feat(web-candidate): wire job suggestions to useGetJobSuggestions"
```

---

## Task 14: Wire _account.wishlists.tsx

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.wishlists.tsx`

- [ ] **Step 1: Replace mock with useGetMyWishlists + remove mutation**

```typescript
import { useGetMyWishlists } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'
```

Inside component:

```typescript
const { isAuthenticated } = useAuthStore()
const { data, isLoading, isError } = useGetMyWishlists({ query: { enabled: isAuthenticated } })
const jobs = data?.data ?? []
```

For the remove action: check `wishlist-controller.ts` for a delete/remove mutation with `grep "remove\|delete\|Remove\|Delete" packages/api/src/generated/user/wishlist-controller/wishlist-controller.ts | grep "export const "`. If found, wire it with `onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMyWishlistsQueryKey() })`. If not found, hide the remove button temporarily.

Add loading/error/empty states.

- [ ] **Step 2: Type-check and commit**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "wishlists" | head -5
git add apps/web-candidate/src/routes/_account.wishlists.tsx
git commit -m "feat(web-candidate): wire wishlists page to useGetMyWishlists"
```

---

## Task 15: Update _account.notifications.tsx (Empty State)

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.notifications.tsx`

No backend hook exists yet. Replace mock data with an empty state UI.

- [ ] **Step 1: Replace mock data with empty state**

Remove the `useCandidateStore` import. Replace the notifications list with:

```typescript
// Remove all useCandidateStore references
// Replace the content section with:
<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
  <p className="text-lg font-semibold text-foreground">No notifications yet</p>
  <p className="mt-2 text-sm text-muted-foreground">You'll see job alerts and application updates here.</p>
</div>
```

- [ ] **Step 2: Type-check and commit**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "notifications" | head -5
git add apps/web-candidate/src/routes/_account.notifications.tsx
git commit -m "feat(web-candidate): replace mock notifications with empty state"
```

---

## Task 16: Wire _account.settings.tsx

**Files:**
- Modify: `apps/web-candidate/src/routes/_account.settings.tsx`

- [ ] **Step 1: Replace mock with useGetSettings**

```typescript
import { useGetSettings } from '@smart-cv/api'
import { useAuthStore } from '../store/useAuthStore'
```

Inside component:

```typescript
const { isAuthenticated } = useAuthStore()
const { data, isLoading, isError } = useGetSettings({ query: { enabled: isAuthenticated } })
const settings = data?.data
```

Map settings fields to the existing UI form. For the save action, check `candidate-controller.ts` for an update settings mutation.

Add loading/error states.

- [ ] **Step 2: Type-check and commit**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "settings" | head -5
git add apps/web-candidate/src/routes/_account.settings.tsx
git commit -m "feat(web-candidate): wire settings page to useGetSettings"
```

---

## Task 17: Wire index.tsx (Home Page)

**Files:**
- Modify: `apps/web-candidate/src/routes/index.tsx`

- [ ] **Step 1: Check current home page imports**

```bash
head -20 apps/web-candidate/src/routes/index.tsx
```

- [ ] **Step 2: Add real hooks**

```typescript
import { useGetFeaturedJobs, useGetTopCompanies, useGetStats, useGetCategories } from '@smart-cv/api'
```

Replace any mock/static data with:

```typescript
const { data: featuredJobsData } = useGetFeaturedJobs()
const featuredJobs = featuredJobsData?.data ?? []

const { data: companiesData } = useGetTopCompanies()
const topCompanies = companiesData?.data ?? []

const { data: statsData } = useGetStats()
const stats = statsData?.data

const { data: categoriesData } = useGetCategories()
const categories = categoriesData?.data ?? []
```

Show empty arrays / zero counts while loading (no skeleton needed on public home page — just graceful empty state).

- [ ] **Step 3: Type-check and commit**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "index" | head -5
git add apps/web-candidate/src/routes/index.tsx
git commit -m "feat(web-candidate): wire home page to real API hooks"
```

---

## Task 18: Wire Jobs Pages

**Files:**
- Modify: `apps/web-candidate/src/routes/jobs/` (listing + detail pages)

- [ ] **Step 1: Wire jobs listing**

In the jobs listing route, replace any mock data:

```typescript
import { useGetActiveJobs, useSearchJobs } from '@smart-cv/api'

// For browsing:
const { data, isLoading } = useGetActiveJobs()
const jobs = data?.data?.content ?? []

// For search (when query is non-empty):
const { data: searchData } = useSearchJobs(
  { keyword: query, page: 0, size: 20 },
  { query: { enabled: query.trim().length > 0 } }
)
```

- [ ] **Step 2: Wire job detail**

In `jobs/$jobId.tsx`:

```typescript
import { useGetJobById, useGetRelatedJobs } from '@smart-cv/api'

const { jobId } = Route.useParams()
const { data, isLoading, isError } = useGetJobById(jobId)
const job = data?.data

const { data: relatedData } = useGetRelatedJobs(jobId)
const relatedJobs = relatedData?.data ?? []
```

Add loading (`<div>Loading...</div>`) and error states.

- [ ] **Step 3: Type-check and commit**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | grep "jobs" | head -5
git add apps/web-candidate/src/routes/jobs/
git commit -m "feat(web-candidate): wire jobs pages to real API hooks"
```

---

## Task 19: Wire Companies Pages

**Files:**
- Modify: `apps/web-candidate/src/routes/companies.tsx` and `companies/$companyId.tsx`

- [ ] **Step 1: Wire companies listing**

```typescript
import { useGetAll2 } from '@smart-cv/api'

const { data, isLoading } = useGetAll2()
const companies = data?.data ?? []
```

- [ ] **Step 2: Wire company detail**

```typescript
import { useGetById2, useGetCompanyJobs, useGetRelatedCompanies } from '@smart-cv/api'

const { companyId } = Route.useParams()
const { data, isLoading } = useGetById2(companyId)
const company = data?.data

const { data: jobsData } = useGetCompanyJobs(companyId)
const companyJobs = jobsData?.data?.content ?? []
```

- [ ] **Step 3: Type-check**

```bash
pnpm -F web-candidate tsc --noEmit 2>&1 | head -20
```

Expected: zero errors. If errors remain, fix before committing.

- [ ] **Step 4: Final commit**

```bash
git add apps/web-candidate/src/routes/companies.tsx apps/web-candidate/src/routes/companies/
git commit -m "feat(web-candidate): wire companies pages to real API hooks"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `pnpm -F web-candidate tsc --noEmit` exits with 0 errors
- [ ] `pnpm -F web-candidate build` succeeds
- [ ] Register new account → OTP modal appears → verify → redirect to /signin
- [ ] Sign in with verified account → cookie set → redirected to /
- [ ] Sign in with unverified account → OTP modal opens
- [ ] Refresh page while logged in → stays logged in (cookie persists)
- [ ] Sign out → cookies removed → redirected to /signin
- [ ] All `_account.*` pages load without errors (may show empty state if backend returns no data)
- [ ] Home page loads featured jobs and companies from API
