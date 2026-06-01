import { create } from 'zustand'

export interface MockUser {
  name: string
  firstName: string
  email: string
  phone: string
  initials: string
  title: string
  location: string
  bio: string
  avatarColor: string
}

export const mockUser: MockUser = {
  name: 'Nguyen Minh Anh',
  firstName: 'Minh Anh',
  email: 'minh.anh@example.com',
  phone: '0901 234 567',
  initials: 'NMA',
  title: 'Frontend Engineer',
  location: 'TP. Hồ Chí Minh',
  bio: 'Passionate frontend developer with 3 years of experience building scalable React applications.',
  avatarColor: 'bg-primary/20 text-primary',
}

interface CandidateState {
  count: number
  searchQuery: string
  isAuthenticated: boolean
  user: MockUser
  setSearchQuery: (query: string) => void
  increment: () => void
  signOut: () => void
  refreshAuthState: () => void
}

const getInitialAuthState = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return localStorage.getItem('isAuthenticated') === 'true'
}

export const useCandidateStore = create<CandidateState>((set) => ({
  count: 0,
  searchQuery: '',
  isAuthenticated: getInitialAuthState(),
  user: mockUser,
  setSearchQuery: (query) => set({ searchQuery: query }),
  increment: () => set((state) => ({ count: state.count + 1 })),
  signOut: () => {
    localStorage.removeItem('isAuthenticated')
    set({ isAuthenticated: false })
  },
  refreshAuthState: () => {
    set({ isAuthenticated: getInitialAuthState() })
  },
}))
