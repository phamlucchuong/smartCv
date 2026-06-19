import { createFileRoute, redirect } from '@tanstack/react-router'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { AdminLayout } from '@/components/layouts/AdminLayout'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    const token = Cookies.get('smart_cv_token')
    if (!token) throw redirect({ to: '/signin' })
    try {
      const { scope } = jwtDecode<{ scope?: string }>(token)
      if (!scope?.includes('ROLE_ADMIN')) throw redirect({ to: '/signin' })
    } catch {
      throw redirect({ to: '/signin' })
    }
  },
  component: AdminLayout,
})
