import { create } from 'zustand'

interface CandidateState {
  count: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  increment: () => void
}

export const useCandidateStore = create<CandidateState>((set) => ({
  count: 0,
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
