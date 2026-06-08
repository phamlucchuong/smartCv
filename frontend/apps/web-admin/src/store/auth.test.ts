import { afterEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth'

const initialState = useAuthStore.getState()

afterEach(() => {
  useAuthStore.setState(initialState, true)
})

describe('useAuthStore', () => {
  it('sets authenticated user state', () => {
    useAuthStore.getState().setAuth({
      user: {
        id: 'admin-1',
        name: 'Admin SmartCV',
        email: 'admin@smartcv.vn',
      },
      token: 'token-123',
    })

    expect(useAuthStore.getState().user?.email).toBe('admin@smartcv.vn')
    expect(useAuthStore.getState().token).toBe('token-123')
  })

  it('clears authentication state', () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      user: {
        id: 'admin-1',
        name: 'Admin SmartCV',
        email: 'admin@smartcv.vn',
      },
      token: 'token-123',
    })

    useAuthStore.getState().clearAuth()

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
  })
})
