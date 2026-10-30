import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { isDevWithoutFirebase } from '../lib/firebase'
import { createSampleSessions } from '../lib/sampleData'
import { subscribeMySessions } from '../lib/sessionStore'
import type { StudySession } from '../lib/sessions'

// 내 세션 목록을 가져온다. 저장될 때마다 자동으로 새 목록을 받는다.
// Firebase 없는 개발 모드에서는 예시 데이터를 돌려준다.
export function useMySessions(): { sessions: StudySession[]; loading: boolean } {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const [openedAt] = useState(() => Date.now()) // 화면을 연 시각 기준으로 예시 데이터를 만든다
  const [remote, setRemote] = useState<{ uid: string; sessions: StudySession[] } | null>(null)

  useEffect(() => {
    if (isDevWithoutFirebase || !uid) return
    return subscribeMySessions(
      uid,
      (sessions) => setRemote({ uid, sessions }),
      (error) => {
        console.error('기록을 불러오지 못했어요.', error)
        setRemote({ uid, sessions: [] })
      },
    )
  }, [uid])

  const sample = useMemo(
    () => (isDevWithoutFirebase && uid ? createSampleSessions(uid, openedAt) : []),
    [uid, openedAt],
  )

  if (isDevWithoutFirebase) return { sessions: sample, loading: false }
  return { sessions: remote?.uid === uid ? remote.sessions : [], loading: remote?.uid !== uid }
}
