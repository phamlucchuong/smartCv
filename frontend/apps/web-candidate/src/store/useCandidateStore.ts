import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

export interface Experience {
  id: string
  title: string
  company: string
  type: string
  dateRange: string
  location: string
  achievements: string[]
}

export interface Education {
  id: string
  school: string
  degree: string
  dateRange: string
}

export interface CVItem {
  id: string
  name: string
  type: 'PDF' | 'DOC'
  uploaded: string
  status: 'Parsed' | 'Processing' | 'Active'
  isDefault: boolean
}

export interface CandidateNotification {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
  type: 'job' | 'application' | 'system'
}

export interface CandidateJob {
  id: string
  title: string
  company: string
  initials: string
  salary: string
  location: string
  skills: string[]
  postedAt?: string
}

type Theme = 'dark' | 'light'
type Language = 'EN' | 'VI'

interface CandidateState {
  count: number
  searchQuery: string
  isAuthenticated: boolean
  theme: Theme
  language: Language
  user: MockUser
  experiences: Experience[]
  educations: Education[]
  skills: string[]
  cvList: CVItem[]
  notifications: CandidateNotification[]
  settings: {
    email: string
    notifications: Record<string, boolean>
    privacy: Record<string, boolean>
  }
  wishlistJobs: (CandidateJob & { savedAt: string; category: 'Công nghệ' | 'Thiết kế' | 'Marketing' })[]
  appliedJobs: (CandidateJob & { appliedAt: string; status: 'applied' | 'under_review' | 'interview' | 'rejected' | 'offer' })[]
  jobSuggestions: (CandidateJob & { matchReason: string; matchScore: number })[]
  appliedJobIds: string[]
  setSearchQuery: (query: string) => void
  refreshAuthState: () => void
  signOut: () => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleLanguage: () => void
  syncLanguageFromI18n: (language: string | undefined) => void
  updateUser: (partial: Partial<MockUser>) => void
  setSkills: (skills: string[]) => void
  addExperience: (payload: Omit<Experience, 'id'>) => void
  updateExperience: (id: string, payload: Omit<Experience, 'id'>) => void
  removeExperience: (id: string) => void
  addEducation: (payload: Omit<Education, 'id'>) => void
  updateEducation: (id: string, payload: Omit<Education, 'id'>) => void
  removeEducation: (id: string) => void
  setSettingsEmail: (email: string) => void
  setNotificationSetting: (key: string, value: boolean) => void
  setPrivacySetting: (key: string, value: boolean) => void
  addCV: (cv: CVItem) => void
  setDefaultCV: (id: string) => void
  removeCV: (id: string) => void
  updateCVStatus: (id: string, status: CVItem['status']) => void
  markAllRead: () => void
  markRead: (id: string) => void
  removeFromWishlist: (id: string) => void
  applyToJob: (id: string) => void
  clearAccountState: () => void
}

const defaultUser: MockUser = {
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

const defaultState = {
  user: defaultUser,
  experiences: [
    {
      id: 'exp-1',
      title: 'Frontend Engineer',
      company: 'Nova Product Studio',
      type: 'Full-time',
      dateRange: '01/2024 - Present',
      location: 'TP. Hồ Chí Minh',
      achievements: ['Built React + TypeScript SPAs for HR and fintech products.', 'Improved performance by 40% through code-splitting and query caching.'],
    },
  ] as Experience[],
  educations: [{ id: 'edu-1', school: 'Đại học Bách Khoa TP.HCM', degree: 'Cử nhân Kỹ thuật Phần mềm', dateRange: '2018 - 2022' }] as Education[],
  skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Node.js', 'Figma', 'Git'],
  cvList: [
    { id: 'cv1', name: 'CV_NguyenMinhAnh_Backend.pdf', type: 'PDF', uploaded: '15/05/2026', status: 'Parsed', isDefault: true },
    { id: 'cv2', name: 'CV_NguyenMinhAnh_Fullstack.docx', type: 'DOC', uploaded: '01/04/2026', status: 'Parsed', isDefault: false },
  ] as CVItem[],
  notifications: [
    { id: 'n1', title: 'Nhà tuyển dụng đã xem CV của bạn', message: 'NexusTech Solutions vừa xem CV của bạn cho vị trí Senior Backend Developer.', time: '5 phút trước', unread: true, type: 'job' },
    { id: 'n2', title: 'Lịch phỏng vấn được xác nhận', message: 'Nova Product Studio xác nhận phỏng vấn vòng 2 vào lúc 14:00 thứ Tư.', time: '2 giờ trước', unread: true, type: 'application' },
  ] as CandidateNotification[],
  settings: {
    email: 'minh.anh@example.com',
    notifications: {
      jobRecommendations: true,
      applicationUpdates: true,
      newMessages: true,
      promotionalEmails: false,
    },
    privacy: {
      publicProfile: true,
      showSalaryExpectation: false,
      activityStatus: true,
    },
  },
  appliedJobs: [
    { id: 'senior-nodejs', title: 'Senior Node.js Backend Developer', company: 'NexusTech Solutions', initials: 'NTS', salary: '$2,500 - $3,500', location: 'TP. HCM', skills: ['Node.js', 'TypeScript', 'AWS'], status: 'interview', appliedAt: 'Ứng tuyển 1 tuần trước' },
    { id: 'devops-aws-kubernetes', title: 'DevOps Engineer (AWS/Kubernetes)', company: 'CloudBridge Tech', initials: 'CBT', salary: '$2,700 - $3,600', location: 'Remote', skills: ['Kubernetes', 'Terraform', 'AWS'], status: 'under_review', appliedAt: 'Ứng tuyển 5 ngày trước' },
  ] as (CandidateJob & { appliedAt: string; status: 'applied' | 'under_review' | 'interview' | 'rejected' | 'offer' })[],
  wishlistJobs: [
    { id: 'frontend-react-nextjs', title: 'Frontend Engineer (React + Next.js)', company: 'Nova Product Studio', initials: 'NPS', salary: '$2,000 - $2,800', location: 'Hà Nội', skills: ['React', 'Next.js'], postedAt: 'Đăng 3 ngày trước', savedAt: 'Lưu 2 ngày trước', category: 'Công nghệ' },
    { id: 'product-designer-ux-ui', title: 'Product Designer (UX/UI)', company: 'PixelCraft Studio', initials: 'PCS', salary: '$1,600 - $2,400', location: 'Đà Nẵng', skills: ['Figma'], postedAt: 'Đăng 1 tuần trước', savedAt: 'Lưu 1 tuần trước', category: 'Thiết kế' },
  ] as (CandidateJob & { savedAt: string; category: 'Công nghệ' | 'Thiết kế' | 'Marketing' })[],
  jobSuggestions: [
    { id: 'frontend-react-nextjs', title: 'Frontend Engineer (React + Next.js)', company: 'Nova Product Studio', initials: 'NPS', salary: '$2,000 - $2,800', location: 'Hà Nội', skills: ['React', 'Next.js', 'Tailwind'], postedAt: 'Đăng 3 ngày trước', matchReason: 'Phù hợp với kỹ năng React, Next.js', matchScore: 98 },
    { id: 'senior-nodejs', title: 'Senior Node.js Backend Developer', company: 'NexusTech Solutions', initials: 'NTS', salary: '$2,500 - $3,500', location: 'TP. HCM', skills: ['Node.js', 'TypeScript', 'AWS'], postedAt: 'Đăng 2 ngày trước', matchReason: 'Phù hợp với kỹ năng TypeScript', matchScore: 85 },
  ],
  appliedJobIds: ['senior-nodejs', 'devops-aws-kubernetes'],
}

const getInitialAuthState = () => (typeof window === 'undefined' ? false : localStorage.getItem('isAuthenticated') === 'true')
const getInitialTheme = (): Theme => (typeof window === 'undefined' ? 'light' : (localStorage.getItem('smartcv_theme') as Theme | null) ?? 'light')
const getInitialLanguage = (): Language => (typeof window === 'undefined' ? 'EN' : localStorage.getItem('smartcv_lang') === 'vi' ? 'VI' : 'EN')

export const useCandidateStore = create<CandidateState>()(
  persist(
    (set, get) => ({
      searchQuery: '',
      count: 0,
      isAuthenticated: getInitialAuthState(),
      theme: getInitialTheme(),
      language: getInitialLanguage(),
      ...defaultState,
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      refreshAuthState: () => set({ isAuthenticated: getInitialAuthState() }),
      signOut: () => {
        localStorage.removeItem('isAuthenticated')
        set({ isAuthenticated: false })
      },
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
      syncLanguageFromI18n: (language) => set({ language: language?.toUpperCase() === 'VI' ? 'VI' : 'EN' }),
      updateUser: (partial) => set((state) => ({ user: { ...state.user, ...partial } })),
      setSkills: (skills) => set({ skills }),
      addExperience: (payload) => set((state) => ({ experiences: [...state.experiences, { id: crypto.randomUUID(), ...payload }] })),
      updateExperience: (id, payload) => set((state) => ({ experiences: state.experiences.map((item) => (item.id === id ? { id, ...payload } : item)) })),
      removeExperience: (id) => set((state) => ({ experiences: state.experiences.filter((item) => item.id !== id) })),
      addEducation: (payload) => set((state) => ({ educations: [...state.educations, { id: crypto.randomUUID(), ...payload }] })),
      updateEducation: (id, payload) => set((state) => ({ educations: state.educations.map((item) => (item.id === id ? { id, ...payload } : item)) })),
      removeEducation: (id) => set((state) => ({ educations: state.educations.filter((item) => item.id !== id) })),
      setSettingsEmail: (email) => set((state) => ({ settings: { ...state.settings, email } })),
      setNotificationSetting: (key, value) => set((state) => ({ settings: { ...state.settings, notifications: { ...state.settings.notifications, [key]: value } } })),
      setPrivacySetting: (key, value) => set((state) => ({ settings: { ...state.settings, privacy: { ...state.settings.privacy, [key]: value } } })),
      addCV: (cv) => set((state) => ({ cvList: [...state.cvList, cv] })),
      setDefaultCV: (id) => set((state) => ({ cvList: state.cvList.map((cv) => ({ ...cv, isDefault: cv.id === id })) })),
      removeCV: (id) => set((state) => ({ cvList: state.cvList.filter((cv) => cv.id !== id) })),
      updateCVStatus: (id, status) => set((state) => ({ cvList: state.cvList.map((cv) => (cv.id === id ? { ...cv, status } : cv)) })),
      markAllRead: () => set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, unread: false })) })),
      markRead: (id) => set((state) => ({ notifications: state.notifications.map((item) => (item.id === id ? { ...item, unread: false } : item)) })),
      removeFromWishlist: (id) => set((state) => ({ wishlistJobs: state.wishlistJobs.filter((item) => item.id !== id) })),
      applyToJob: (id) => set((state) => ({
        appliedJobIds: state.appliedJobIds.includes(id) ? state.appliedJobIds : [...state.appliedJobIds, id],
        appliedJobs: state.appliedJobs.some((item) => item.id === id)
          ? state.appliedJobs
          : [
            ...state.appliedJobs,
            {
              ...(state.jobSuggestions.find((item) => item.id === id) ?? state.wishlistJobs.find((item) => item.id === id) ?? { id, title: id, company: 'SmartCV', initials: 'SCV', salary: '-', location: '-', skills: [] }),
              appliedAt: 'Vừa ứng tuyển',
              status: 'applied',
            },
          ],
      })),
      clearAccountState: () => set({ count: 0, searchQuery: '', ...defaultState }),
    }),
    {
      name: 'smartcv_account',
      partialize: (state) => ({
        user: state.user,
        experiences: state.experiences,
        educations: state.educations,
        skills: state.skills,
        cvList: state.cvList,
        notifications: state.notifications,
        settings: state.settings,
        wishlistJobs: state.wishlistJobs,
        appliedJobs: state.appliedJobs,
        jobSuggestions: state.jobSuggestions,
        appliedJobIds: state.appliedJobIds,
      }),
    },
  ),
)
