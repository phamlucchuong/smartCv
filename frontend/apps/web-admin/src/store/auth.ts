import { create } from 'zustand'

interface AuthUser {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  setAuth: (payload: { user: AuthUser; token: string }) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: ({ user, token }) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
}))
