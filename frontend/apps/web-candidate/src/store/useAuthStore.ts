import { create } from 'zustand'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

const ACCESS_COOKIE = 'smart_cv_token'
const REFRESH_COOKIE = 'smart_cv_refresh'

interface JwtPayload {
  sub?: string
  email?: string
  scope?: string
  [key: string]: unknown
}

interface AuthState {
  userId: string | null
  email: string | null
  role: string | null
  fullName: string | null
  isAuthenticated: boolean
  signIn: (accessToken: string, refreshToken: string) => void
  signOut: () => void
  setFullName: (name: string) => void
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

function initFromCookie(): Pick<AuthState, 'userId' | 'email' | 'role' | 'fullName' | 'isAuthenticated'> {
  const token = Cookies.get(ACCESS_COOKIE)
  if (!token) return { userId: null, email: null, role: null, fullName: null, isAuthenticated: false }
  return { ...decodeJwt(token), fullName: null, isAuthenticated: true }
}

export const useAuthStore = create<AuthState>()((set) => ({
  ...initFromCookie(),

  signIn: (accessToken, refreshToken) => {
    Cookies.set(ACCESS_COOKIE, accessToken, { expires: 1, path: '/', sameSite: 'Lax' })
    Cookies.set(REFRESH_COOKIE, refreshToken, { expires: 7, path: '/', sameSite: 'Lax' })
    set({ ...decodeJwt(accessToken), fullName: null, isAuthenticated: true })
  },

  signOut: () => {
    Cookies.remove(ACCESS_COOKIE, { path: '/' })
    Cookies.remove(REFRESH_COOKIE, { path: '/' })
    set({ userId: null, email: null, role: null, fullName: null, isAuthenticated: false })
  },

  setFullName: (name) => set({ fullName: name }),
}))
