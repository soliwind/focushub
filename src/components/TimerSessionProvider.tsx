import type { ReactNode } from 'react'
import { TimerSessionContext } from '../hooks/timerSessionContext'
import { useTimerSession } from '../hooks/useTimerSession'

export default function TimerSessionProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const value = useTimerSession(uid)
  return <TimerSessionContext.Provider value={value}>{children}</TimerSessionContext.Provider>
}
