import { afterEach, describe, expect, it } from 'vitest'
import { useCandidateStore } from './useCandidateStore'

const initialState = useCandidateStore.getState()

afterEach(() => {
  useCandidateStore.setState(initialState, true)
  window.localStorage.clear()
})

describe('useCandidateStore', () => {
  it('toggles theme and syncs it to localStorage', () => {
    const { toggleTheme } = useCandidateStore.getState()

    expect(useCandidateStore.getState().theme).toBe('light')

    toggleTheme()

    expect(useCandidateStore.getState().theme).toBe('dark')
    expect(window.localStorage.getItem('smartcv_theme')).toBe('dark')
  })

  it('applies a suggested job once without duplicating it', () => {
    const { applyToJob } = useCandidateStore.getState()

    applyToJob('frontend-react-nextjs')
    applyToJob('frontend-react-nextjs')

    const { appliedJobIds, appliedJobs } = useCandidateStore.getState()
    const createdEntries = appliedJobs.filter((job) => job.id === 'frontend-react-nextjs')

    expect(appliedJobIds.filter((id) => id === 'frontend-react-nextjs')).toHaveLength(1)
    expect(createdEntries).toHaveLength(1)
    expect(createdEntries[0]?.status).toBe('applied')
  })

  it('clears account state back to the seeded defaults', () => {
    const { setSearchQuery, toggleLanguage, clearAccountState } = useCandidateStore.getState()

    setSearchQuery('react engineer')
    toggleLanguage()
    clearAccountState()

    const state = useCandidateStore.getState()

    expect(state.searchQuery).toBe('')
    expect(state.language).toBe('VI')
    expect(state.cvList).toHaveLength(2)
    expect(state.appliedJobIds).toEqual(['senior-nodejs', 'devops-aws-kubernetes'])
  })
})
