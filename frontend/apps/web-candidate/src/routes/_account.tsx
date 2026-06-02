import { createFileRoute, redirect } from '@tanstack/react-router'
import { CandidateDashboardLayout } from '../components/layouts/CandidateDashboardLayout'

export const Route = createFileRoute('/_account')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: CandidateDashboardLayout,
})
