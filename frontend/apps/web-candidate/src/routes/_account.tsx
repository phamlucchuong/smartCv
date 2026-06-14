import { createFileRoute, redirect } from '@tanstack/react-router'
import Cookies from 'js-cookie'
import { CandidateDashboardLayout } from '../components/layouts/CandidateDashboardLayout'

export const Route = createFileRoute('/_account')({
  beforeLoad: () => {
    if (!Cookies.get('smart_cv_token')) {
      throw redirect({ to: '/signin' })
    }
  },
  component: CandidateDashboardLayout,
})
