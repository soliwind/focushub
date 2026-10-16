import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

// 로그인·회원가입 화면을 감싼다. 이미 로그인했으면(방금 로그인한 경우 포함) 원래 가려던 화면으로 보낸다.
export default function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }
  return children
}
