import { createFileRoute, redirect } from '@tanstack/react-router'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { AdminLayout } from '@/components/layouts/AdminLayout'

export const Route = createFileRoute('/admin')({
  beforeLoad: () => {
    const token = Cookies.get('smart_cv_token')
    if (!token) throw redirect({ to: '/signin' })

    let scope: string | undefined
    try {
      scope = jwtDecode<{ scope?: string }>(token).scope
    } catch {
      Cookies.remove('smart_cv_token')
      throw redirect({ to: '/signin' })
    }

    if (!scope?.includes('ROLE_ADMIN')) {
      Cookies.remove('smart_cv_token')
      throw redirect({ to: '/signin' })
    }
  },
  component: AdminLayout,
})
