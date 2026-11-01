import { useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { AuthContext, type AppUser, type AuthValue } from './authContext'
import { auth, isDevWithoutFirebase } from './firebase'
import { ensureUserProfile, saveDisplayName } from './userProfile'

function toAppUser(user: User): AppUser {
  return { uid: user.uid, displayName: user.displayName ?? '', email: user.email ?? '' }
}

// Firebase 없이 개발할 때 쓰는 가짜 사용자 (npm run dev에서 .env.local이 없을 때만)
const DEV_USER: AppUser = { uid: 'dev-user', displayName: '개발용 사용자', email: 'dev@focushub.local' }

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isDevWithoutFirebase) return <DevAuthProvider>{children}</DevAuthProvider>
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
}

function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(auth !== null)
  const [loggedOut, setLoggedOut] = useState(false)

  // Firebase가 로그인 상태가 바뀔 때마다 알려 준다. 새로고침해도 로그인이 유지된다.
  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser ? toAppUser(nextUser) : null)
      setLoading(false)
      // Firestore에 내 정보 문서(users/{uid})를 만들거나 마지막 로그인 시각을 바꾼다.
      if (nextUser) {
        ensureUserProfile(toAppUser(nextUser)).catch((error) => console.error('내 정보를 저장하지 못했어요.', error))
      }
    })
  }, [])

  const value: AuthValue = {
    user,
    loading,
    isDevUser: false,
    loggedOut,
    signUp: async (name, email, password) => {
      setLoggedOut(false)
      const credential = await createUserWithEmailAndPassword(requireAuth(), email, password)
      await updateProfile(credential.user, { displayName: name })
      await saveDisplayName(credential.user.uid, name)
      // 가입 직후에는 이름이 비어 있는 채로 로그인 상태가 먼저 바뀐다. 이름을 넣은 정보로 다시 바꾼다.
      setUser(toAppUser(credential.user))
    },
    logIn: async (email, password) => {
      await signInWithEmailAndPassword(requireAuth(), email, password)
      setLoggedOut(false)
    },
    logOut: async () => {
      setLoggedOut(true)
      await signOut(requireAuth())
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 처음부터 개발용 사용자로 로그인된 상태. 로그인·회원가입은 어떤 값을 넣어도 통과한다.
function DevAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(DEV_USER)
  const [loggedOut, setLoggedOut] = useState(false)

  const value: AuthValue = {
    user,
    loading: false,
    isDevUser: true,
    loggedOut,
    signUp: async (name, email) => {
      setLoggedOut(false)
      setUser({ ...DEV_USER, displayName: name || DEV_USER.displayName, email })
    },
    logIn: async (email) => {
      setLoggedOut(false)
      setUser({ ...DEV_USER, email })
    },
    logOut: async () => {
      setLoggedOut(true)
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function requireAuth() {
  if (!auth) throw { code: 'app/not-configured' }
  return auth
}
