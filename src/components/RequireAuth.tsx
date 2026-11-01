import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

// 로그인한 사용자만 볼 수 있는 화면을 감싼다. 로그인하지 않았으면 로그인 화면으로, 방금 로그아웃했으면 랜딩으로 보낸다.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loggedOut } = useAuth()
  const location = useLocation()

  if (!user) {
    if (loggedOut) return <Navigate to="/" replace />
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
