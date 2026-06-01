import { create } from 'zustand'

interface RecruiterStore {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
}

export const useRecruiterStore = create<RecruiterStore>((set) => ({
  theme: typeof window !== 'undefined'
    ? ((localStorage.getItem('smartcv_theme') as 'light' | 'dark' | null) ?? 'light')
    : 'light',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartcv_theme', theme)
    }
    set({ theme })
  },
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}))
