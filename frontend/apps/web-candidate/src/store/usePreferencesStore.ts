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
