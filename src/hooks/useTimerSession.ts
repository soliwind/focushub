import { useCallback, useEffect, useRef, useState } from 'react'
import type { StudySession } from '../lib/sessions'
import {
  clearSessionLocal,
  getOpenSessionRemote,
  getSessionRemote,
  isOpenSession,
  newSessionId,
  readSessionLocal,
  saveSessionLocal,
  saveSessionRemote,
  sendHeartbeat,
  sessionLocalKey,
  toStudySession,
  toTimerState,
} from '../lib/sessionStore'
import { getPauseStartAt, getStudyMs, initialTimerState, timerReducer, type TimerAction, type TimerState } from '../lib/timer'
import { formatClock } from '../lib/format'
import type { TimerSessionValue } from './timerSessionContext'
import { useNow } from './useNow'
import { useUserSettings } from './useUserSettings'

const MINUTE_MS = 60 * 1000
const HEARTBEAT_MS = MINUTE_MS // 화면이 열려 있다는 신호를 보내는 간격
const STALE_MS = 2 * MINUTE_MS // 이만큼 신호가 끊기면 탭이 닫혔거나 컴퓨터가 잠든 것으로 본다
const GOAL_SAVE_DELAY_MS = 800 // 공부 내용을 입력하는 동안 글자마다 저장하지 않는다
const LOOKUP_TIMEOUT_MS = 2000 // 인터넷이 없어도 시작 버튼이 오래 멈추지 않게 한다

// 공부 중으로 저장된 세션인데 신호가 오래 끊겼다면, 마지막 신호 시각에 일시정지한 것으로 본다.
function settleStale(session: StudySession, now: number): TimerState {
  const state = toTimerState(session)
  const lastSeen = Math.max(session.lastHeartbeatAt ?? 0, session.updatedAt)
  if (state.status !== 'running' || now - lastSeen <= STALE_MS) return state
  return timerReducer(state, { type: 'pause', at: lastSeen, byLeave: true })
}

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), LOOKUP_TIMEOUT_MS)),
  ])
}

export function useTimerSession(uid: string): TimerSessionValue {
  const [settings, setSettings, settingsReady] = useUserSettings()
  const [timer, setTimer] = useState<TimerState>(initialTimerState)
  const [restoring, setRestoring] = useState(true)
  const [message, setMessage] = useState('')
  const [saveFailed, setSaveFailed] = useState(false)
  const [saveAttempt, setSaveAttempt] = useState(0)

  const timerRef = useRef(timer) // 이벤트 처리 중에 항상 최신 상태를 읽기 위한 값
  const shareRef = useRef(settings.shareToGroups)
  const heartbeatRef = useRef<number | null>(null)
  const lastTickRef = useRef(0)
  const unloadingRef = useRef(false)
  const savedKeyRef = useRef('') // 상태 변화(일시정지 등)를 이미 저장했는지
  const savedSignatureRef = useRef('') // 내용까지 같은 저장을 건너뛰기 위한 값

  useEffect(() => {
    shareRef.current = settings.shareToGroups
  }, [settings.shareToGroups])

  const applyState = useCallback((next: TimerState) => {
    timerRef.current = next
    setTimer(next)
  }, [])

  // 상태를 바꾸고 localStorage에 바로 저장한다. 탭이 닫히는 순간에도 남도록 화면을 다시 그리기 전에 쓴다.
  const act = useCallback(
    (action: TimerAction) => {
      const next = timerReducer(timerRef.current, action)
      if (next === timerRef.current) return
      applyState(next)
      const session = toStudySession(next, uid, shareRef.current, heartbeatRef.current)
      if (session) saveSessionLocal(session)
      else if (action.type === 'reset') clearSessionLocal(uid)
    },
    [uid, applyState],
  )

  // 접속할 때 진행 중인 세션을 찾아 복구한다.
  useEffect(() => {
    let cancelled = false

    const findSession = async (): Promise<StudySession | null> => {
      const local = readSessionLocal(uid)
      const openLocal = local && isOpenSession(local) ? local : null
      try {
        // 끝난 세션이 Firestore에 저장되기 전에 탭이 닫혔다면 지금 마저 저장한다.
        if (local && !openLocal) {
          await saveSessionRemote(local)
          clearSessionLocal(uid)
        }
        const remoteOpen = await getOpenSessionRemote(uid)
        if (!openLocal) return remoteOpen
        const remoteSame = await getSessionRemote(openLocal.id)
        if (remoteSame && !isOpenSession(remoteSame)) {
          clearSessionLocal(uid) // 다른 곳에서 이미 끝난 세션
          return remoteOpen
        }
        const candidates = [openLocal, remoteSame, remoteOpen].filter((s) => s !== null)
        return candidates.sort((a, b) => b.updatedAt - a.updatedAt)[0]
      } catch (error) {
        console.error('저장된 세션을 불러오지 못했어요.', error)
        return openLocal
      }
    }

    findSession().then((session) => {
      if (cancelled) return
      if (session) applyState(settleStale(session, Date.now()))
      setRestoring(false)
    })
    return () => {
      cancelled = true
    }
  }, [uid, applyState])

  // 같은 브라우저의 다른 탭에서 바뀐 세션을 따라간다. (storage 이벤트는 다른 탭에서만 발생한다)
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== sessionLocalKey(uid) || !event.newValue) return
      const session = JSON.parse(event.newValue) as StudySession
      if (session.updatedAt <= timerRef.current.updatedAt) return
      const next = toTimerState(session)
      // 이 변경은 다른 탭이 Firestore에 저장한다.
      savedKeyRef.current = `${next.sessionId}:${next.status}:${next.events.length}`
      savedSignatureRef.current = `${next.updatedAt}:${session.shareToGroups}`
      applyState(next)
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [uid, applyState])

  // 탭 이탈 감지: visibilitychange 이벤트만 쓴다 (window.blur는 쓰지 않는다).
  // 탭이 가려지면 바로 일시정지한다. 다른 탭의 내용이나 키 입력은 전혀 보지 않는다.
  // 새로고침할 때도 탭이 잠깐 가려진 것으로 나오므로, 페이지를 떠나는 중에는 이탈로 세지 않는다.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !unloadingRef.current) {
        act({ type: 'pause', at: Date.now(), byLeave: true })
      }
    }
    const handlePageHide = () => {
      unloadingRef.current = true
      heartbeatRef.current = Date.now()
      const session = toStudySession(timerRef.current, uid, shareRef.current, heartbeatRef.current)
      if (session) saveSessionLocal(session)
    }
    const handlePageShow = () => {
      unloadingRef.current = false
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [uid, act])

  const { status, updatedAt, sessionId } = timer
  const open = status === 'running' || status === 'paused'
  const now = useNow(open)

  // Firestore에 저장한다. 상태가 바뀌면 바로, 공부 내용만 바뀌면 입력이 멈춘 뒤에.
  useEffect(() => {
    if (restoring) return
    const session = toStudySession(timerRef.current, uid, settings.shareToGroups, heartbeatRef.current)
    if (!session) return
    const signature = `${session.updatedAt}:${session.shareToGroups}`
    const key = `${session.id}:${timerRef.current.status}:${session.events.length}`
    if (signature === savedSignatureRef.current && key === savedKeyRef.current && saveAttempt === 0) return

    const save = () => {
      savedKeyRef.current = key
      savedSignatureRef.current = signature
      saveSessionRemote(session)
        .then(() => {
          setSaveFailed(false)
          if (!isOpenSession(session)) clearSessionLocal(uid)
        })
        .catch((error) => {
          console.error('세션을 저장하지 못했어요.', error)
          setSaveFailed(true)
        })
    }

    if (key !== savedKeyRef.current || saveAttempt > 0) {
      save()
      return
    }
    const id = window.setTimeout(save, GOAL_SAVE_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [uid, restoring, status, updatedAt, sessionId, settings.shareToGroups, saveAttempt])

  // 화면이 열려 있다는 신호. 탭을 닫아 버린 세션을 나중에 알아보는 데 쓴다.
  useEffect(() => {
    if (!open || !sessionId) return
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      const at = Date.now()
      heartbeatRef.current = at
      const session = toStudySession(timerRef.current, uid, shareRef.current, at)
      if (session) saveSessionLocal(session)
      sendHeartbeat(sessionId, at).catch((error) => console.error('신호를 보내지 못했어요.', error))
    }, HEARTBEAT_MS)
    return () => window.clearInterval(id)
  }, [uid, open, sessionId])

  // 공부 중에 시계가 오래 멈췄다가 돌아오면 컴퓨터가 잠들었던 것이다. 그 시간은 공부로 치지 않는다.
  useEffect(() => {
    if (status !== 'running') {
      lastTickRef.current = 0
      return
    }
    const previous = lastTickRef.current
    const current = Date.now()
    lastTickRef.current = current
    if (previous && document.visibilityState === 'visible' && current - previous > STALE_MS) {
      act({ type: 'pause', at: previous, byLeave: true })
    }
  }, [status, now, act])

  // 기준 시간 넘게 쉬면 자동 저장한다. 끝난 시각은 기준을 넘긴 순간으로 기록한다.
  // (다른 탭에 있는 동안 확인이 늦어져도 같은 시각으로 남는다.)
  const pauseStartAt = getPauseStartAt(timer.events)
  const autoEndAt =
    pauseStartAt === null || !settingsReady ? null : pauseStartAt + settings.longPauseMinutes * MINUTE_MS
  useEffect(() => {
    if (status === 'paused' && autoEndAt !== null && now >= autoEndAt) {
      act({ type: 'autoEnd', at: autoEndAt })
    }
  }, [status, now, autoEndAt, act])

  // 브라우저 탭 제목. 메뉴를 옮겨도 유지된다.
  // "탭을 떠나면 알림"이 꺼져 있으면 탭을 떠나 일시정지됐을 때 제목을 바꾸지 않는다.
  const label = timer.goal.trim() || '공부 중'
  const title =
    status === 'running'
      ? `${formatClock(getStudyMs(timer.events, now))} ${label}`
      : status === 'paused' && !(timer.pausedByLeave && !settings.notifyOnLeave)
        ? `일시정지 · ${label}`
        : status === 'ended'
          ? '저장됨'
          : 'FocusHub'
  useEffect(() => {
    document.title = title
  }, [title])
  useEffect(() => {
    return () => {
      document.title = 'FocusHub'
    }
  }, [])

  const start = useCallback(async () => {
    const at = Date.now()
    // 사용자당 진행 중인 세션은 하나만. 다른 기기에서 시작한 세션이 있으면 그것을 이어서 보여 준다.
    const existing = await withTimeout(
      getOpenSessionRemote(uid).catch(() => null),
      null,
    )
    if (existing) {
      applyState(settleStale(existing, Date.now()))
      setMessage('진행 중인 세션이 있어서 이어서 보여 드려요.')
      return
    }
    setMessage('')
    act({ type: 'start', at, sessionId: newSessionId() })
  }, [uid, act, applyState])

  return {
    timer,
    now,
    settings,
    setSettings,
    restoring,
    message,
    saveFailed,
    retrySave: () => setSaveAttempt((n) => n + 1),
    setGoal: (goal) => act({ type: 'setGoal', at: Date.now(), goal }),
    start,
    pause: () => act({ type: 'pause', at: Date.now(), byLeave: false }),
    resume: (nextGoal) => act({ type: 'resume', at: Date.now(), nextGoal }),
    end: () => act({ type: 'end', at: Date.now() }),
    reset: () => {
      setMessage('')
      setSaveFailed(false)
      setSaveAttempt(0)
      act({ type: 'reset' })
    },
  }
}

