import { useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { AuthContext, type AuthValue } from './authContext'
import { auth } from './firebase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(auth !== null)
  const [, setProfileVersion] = useState(0)

  // Firebase가 로그인 상태가 바뀔 때마다 알려 준다. 새로고침해도 로그인이 유지된다.
  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  const value: AuthValue = {
    user,
    loading,
    signUp: async (name, email, password) => {
      const credential = await createUserWithEmailAndPassword(requireAuth(), email, password)
      await updateProfile(credential.user, { displayName: name })
      // 가입 직후에는 이름이 비어 있는 채로 로그인 상태가 먼저 바뀐다. 이름이 바로 보이도록 다시 그린다.
      setProfileVersion((v) => v + 1)
    },
    logIn: async (email, password) => {
      await signInWithEmailAndPassword(requireAuth(), email, password)
    },
    logOut: () => signOut(requireAuth()),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function requireAuth() {
  if (!auth) throw { code: 'app/not-configured' }
  return auth
}
