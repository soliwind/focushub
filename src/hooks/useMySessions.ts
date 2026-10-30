import { useMemo, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { isDevWithoutFirebase } from '../lib/firebase'
import { createSampleSessions } from '../lib/sampleData'
import type { StudySession } from '../lib/sessions'

// 내 세션 목록을 가져온다.
// 지금은 개발 모드에서 예시 데이터를 돌려준다. 4단계에서 Firestore 조회로 바꾼다.
export function useMySessions(): { sessions: StudySession[]; loading: boolean } {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const [openedAt] = useState(() => Date.now()) // 화면을 연 시각 기준으로 예시 데이터를 만든다

  const sessions = useMemo(
    () => (isDevWithoutFirebase && uid ? createSampleSessions(uid, openedAt) : []),
    [uid, openedAt],
  )

  return { sessions, loading: false }
}
