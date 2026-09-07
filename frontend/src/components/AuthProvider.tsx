import { useEffect, useState, type ReactNode } from 'react'
import * as authApi from '#api/auth'
import { getMe } from '#api/users'
import type { AuthUser, LoginPayload, RegisterPayload } from '#api/auth'
import { AUTH_LOGOUT_EVENT } from '#lib/api-client'
import { AuthContext, type AuthStatus } from '#hooks/useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    getMe()
      .then((currentUser) => {
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch(() => {
        setStatus('unauthenticated')
      })
  }, [])

  useEffect(() => {
    function handleAuthLogout() {
      setUser(null)
      setStatus('unauthenticated')
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout)
  }, [])

  async function login(payload: LoginPayload) {
    await authApi.login(payload)
    const currentUser = await getMe()
    setUser(currentUser)
    setStatus('authenticated')
  }

  async function register(payload: RegisterPayload) {
    await authApi.register(payload)
    const currentUser = await getMe()
    setUser(currentUser)
    setStatus('authenticated')
  }

  async function logout() {
    setUser(null)
    setStatus('unauthenticated')
    await authApi.logout().catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
