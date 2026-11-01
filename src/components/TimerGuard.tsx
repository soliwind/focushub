import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { TimerSessionContext } from '../hooks/timerSessionContext'

// 공부 중이거나 일시정지 중이면 타이머 화면 밖으로 나갈 수 없다. 주소를 직접 입력해도 되돌린다.
export default function TimerGuard() {
  const session = useContext(TimerSessionContext)
  const { pathname } = useLocation()
  const locked = session?.timer.status === 'running' || session?.timer.status === 'paused'
  return locked && pathname !== '/' ? <Navigate to="/" replace /> : null
}
