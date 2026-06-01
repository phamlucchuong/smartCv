import { create } from 'zustand'

interface RecruiterStore {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
}

export const useRecruiterStore = create<RecruiterStore>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}))
