import type { NextGoal, TimerEvent } from './timer'

// Firestore sessions/{sessionId} 문서 모양 (docs/data-model.md)
// 시각은 모두 밀리초 숫자로 다룬다. Firestore에 저장할 때와 읽을 때 4단계에서 변환한다.
export type SessionStatus = 'active' | 'paused' | 'completed' | 'auto_closed' | 'cancelled'

export interface StudySession {
  id: string
  uid: string
  goal: string
  status: SessionStatus
  startedAt: number
  endedAt: number | null
  dayKey: string
  weekKey: string
  events: TimerEvent[]
  pausedMs: number
  studyMs: number
  shareToGroups: boolean
  closeReason: null | 'long_pause'
  nextGoals: NextGoal[]
  lastHeartbeatAt: number | null // 화면이 열려 있다는 신호를 마지막으로 보낸 시각
  updatedAt: number // 마지막으로 바뀐 시각
}

// 기록과 통계에 들어가는 세션: 마친 세션과 자동 저장된 세션. 취소·진행 중 세션은 뺀다.
export function isCountedSession(session: StudySession): boolean {
  return session.status === 'completed' || session.status === 'auto_closed'
}
