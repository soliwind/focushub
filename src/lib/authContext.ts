import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export interface AuthValue {
  user: User | null
  loading: boolean // 처음 접속해서 로그인 여부를 확인하는 중인지
  signUp: (name: string, email: string, password: string) => Promise<void>
  logIn: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
}

// Context: 로그인한 사용자 정보를 모든 화면에서 꺼내 쓸 수 있게 하는 React 기능
export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.')
  return value
}
