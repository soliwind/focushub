import { createContext, useContext } from 'react'
import type { Group } from '../lib/groupStore'
import type { TimerState } from '../lib/timer'
import type { UserSettings } from '../lib/userProfile'

export interface TimerSessionValue {
  timer: TimerState
  now: number
  groups: Group[] // 내가 가입한 그룹
  settings: UserSettings
  setSettings: (next: UserSettings) => void
  restoring: boolean // 저장된 세션을 불러오는 중인지
  message: string // 다른 곳의 세션을 이어받았을 때 보여 줄 안내
  saveFailed: boolean
  sharedGroupCount: number // 방금 마친 세션을 더한 그룹 수
  retrySave: () => void
  setGoal: (goal: string) => void
  start: () => void
  pause: () => void
  resume: (nextGoal: string) => void
  end: () => void
  reset: () => void
}

export const TimerSessionContext = createContext<TimerSessionValue | null>(null)

// 메뉴를 옮겨 다녀도 타이머가 끊기지 않도록 세션은 앱 전체에서 하나만 관리한다.
export function useTimerSessionContext(): TimerSessionValue {
  const value = useContext(TimerSessionContext)
  if (!value) throw new Error('useTimerSessionContext는 TimerSessionProvider 안에서만 쓸 수 있습니다.')
  return value
}
