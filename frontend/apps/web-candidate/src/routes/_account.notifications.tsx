import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_account/notifications')({
  beforeLoad: () => {
    throw redirect({ to: '/profile' })
  },
})
