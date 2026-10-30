import { createContext, useContext } from 'react'

// 앱에서 쓰는 사용자 정보. Firebase 사용자 정보에서 필요한 것만 꺼낸다.
export interface AppUser {
  uid: string
  displayName: string
  email: string
}

export interface AuthValue {
  user: AppUser | null
  loading: boolean // 처음 접속해서 로그인 여부를 확인하는 중인지
  isDevUser: boolean // Firebase 없이 개발용 사용자로 보는 중인지
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
