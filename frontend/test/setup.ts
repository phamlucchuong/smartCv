import { afterEach } from 'vitest'

afterEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  document.documentElement.className = ''
})
