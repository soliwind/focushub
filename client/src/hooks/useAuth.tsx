import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as authApi from '../lib/auth'
import type { PublicUser } from '../types'

interface AuthContextValue {
  user: PublicUser | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<void>
  signUp: (username: string, password: string, nickname: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(authApi.getCurrentUser())
    setLoading(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (username, password) => {
        setUser(await authApi.signIn(username, password))
      },
      signUp: async (username, password, nickname) => {
        setUser(await authApi.signUp(username, password, nickname))
      },
      signOut: () => {
        authApi.signOut()
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider 안에서만 사용할 수 있습니다.')
  return context
}
