import { afterEach, describe, expect, it } from 'vitest'
import { useRecruiterStore } from './useRecruiterStore'

const initialState = useRecruiterStore.getState()

afterEach(() => {
  useRecruiterStore.setState(initialState, true)
  window.localStorage.clear()
})

describe('useRecruiterStore', () => {
  it('stores theme changes in localStorage', () => {
    useRecruiterStore.getState().setTheme('dark')

    expect(useRecruiterStore.getState().theme).toBe('dark')
    expect(window.localStorage.getItem('smartcv_theme')).toBe('dark')
  })

  it('updates sidebar collapsed state', () => {
    useRecruiterStore.getState().setSidebarCollapsed(true)

    expect(useRecruiterStore.getState().sidebarCollapsed).toBe(true)
  })
})
