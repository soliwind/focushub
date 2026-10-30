// 세션 저장·불러오기 (Firestore + localStorage)
// - Firestore: 진짜 저장소. 다른 기기에서도 이어서 볼 수 있다.
// - localStorage: 브라우저 안의 작은 저장 공간. 바로(동기로) 저장되어 탭을 닫는 순간에도 남고, 같은 브라우저의 다른 탭과 공유된다.
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { getDayKey, getWeekKey } from './dates'
import { db } from './firebase'
import type { SessionStatus, StudySession } from './sessions'
import { getPausedMs, getStudyMs, initialTimerState, type TimerState } from './timer'

const OPEN_STATUSES: SessionStatus[] = ['active', 'paused']

// ---------- 타이머 상태 ↔ 세션 ----------

export function toStudySession(
  timer: TimerState,
  uid: string,
  shareToGroups: boolean,
  lastHeartbeatAt: number | null,
): StudySession | null {
  if (!timer.sessionId || timer.events.length === 0) return null
  const startedAt = timer.events[0].at
  const last = timer.events[timer.events.length - 1]
  const endedAt = timer.status === 'ended' ? last.at : null
  const dayKey = getDayKey(startedAt)
  const status: SessionStatus =
    timer.status === 'running'
      ? 'active'
      : timer.status === 'paused'
        ? 'paused'
        : timer.closeReason
          ? 'auto_closed'
          : 'completed'

  return {
    id: timer.sessionId,
    uid,
    goal: timer.goal.trim(),
    status,
    startedAt,
    endedAt,
    dayKey,
    weekKey: getWeekKey(dayKey),
    events: timer.events,
    // 진행 중이면 지금까지, 끝났으면 확정 값
    pausedMs: getPausedMs(timer.events, endedAt ?? timer.updatedAt),
    studyMs: getStudyMs(timer.events, endedAt ?? timer.updatedAt),
    shareToGroups,
    closeReason: timer.closeReason,
    nextGoals: timer.nextGoals,
    lastHeartbeatAt,
    updatedAt: timer.updatedAt,
  }
}

export function toTimerState(session: StudySession): TimerState {
  return {
    ...initialTimerState,
    sessionId: session.id,
    goal: session.goal,
    status: session.status === 'active' ? 'running' : session.status === 'paused' ? 'paused' : 'ended',
    events: session.events,
    nextGoals: session.nextGoals,
    closeReason: session.closeReason,
    // 일시정지된 세션으로 돌아왔으면 "다시 왔네요" 안내를 보여 준다.
    pausedByLeave: session.status === 'paused',
    updatedAt: session.updatedAt,
  }
}

export function isOpenSession(session: StudySession): boolean {
  return OPEN_STATUSES.includes(session.status)
}

// ---------- Firestore ----------

const ms = (value: unknown): number => (value instanceof Timestamp ? value.toMillis() : Number(value ?? 0))
const ts = (value: number) => Timestamp.fromMillis(value)

function toFirestore(session: StudySession): DocumentData {
  return {
    uid: session.uid,
    goal: session.goal,
    status: session.status,
    startedAt: ts(session.startedAt),
    endedAt: session.endedAt === null ? null : ts(session.endedAt),
    dayKey: session.dayKey,
    weekKey: session.weekKey,
    events: session.events.map((e) => ({ type: e.type, at: ts(e.at) })),
    pausedMs: session.pausedMs,
    studyMs: session.studyMs,
    shareToGroups: session.shareToGroups,
    closeReason: session.closeReason,
    nextGoals: session.nextGoals.map((g) => ({ at: ts(g.at), text: g.text })),
    lastHeartbeatAt: session.lastHeartbeatAt === null ? null : ts(session.lastHeartbeatAt),
    updatedAt: ts(session.updatedAt),
  }
}

function fromFirestore(id: string, data: DocumentData): StudySession {
  return {
    id,
    uid: data.uid,
    goal: data.goal ?? '',
    status: data.status,
    startedAt: ms(data.startedAt),
    endedAt: data.endedAt ? ms(data.endedAt) : null,
    dayKey: data.dayKey,
    weekKey: data.weekKey,
    events: (data.events ?? []).map((e: DocumentData) => ({ type: e.type, at: ms(e.at) })),
    pausedMs: data.pausedMs ?? 0,
    studyMs: data.studyMs ?? 0,
    shareToGroups: data.shareToGroups ?? true,
    closeReason: data.closeReason ?? null,
    nextGoals: (data.nextGoals ?? []).map((g: DocumentData) => ({ at: ms(g.at), text: g.text })),
    lastHeartbeatAt: data.lastHeartbeatAt ? ms(data.lastHeartbeatAt) : null,
    updatedAt: ms(data.updatedAt),
  }
}

// Firestore 없이(개발 모드) 쓸 때를 위한 새 세션 ID
export function newSessionId(): string {
  return db ? doc(collection(db, 'sessions')).id : `local-${crypto.randomUUID()}`
}

export async function saveSessionRemote(session: StudySession): Promise<void> {
  if (!db) return
  await setDoc(doc(db, 'sessions', session.id), toFirestore(session))
}

export async function sendHeartbeat(sessionId: string, at: number): Promise<void> {
  if (!db) return
  await updateDoc(doc(db, 'sessions', sessionId), { lastHeartbeatAt: ts(at) })
}

export async function getSessionRemote(sessionId: string): Promise<StudySession | null> {
  if (!db) return null
  const snapshot = await getDoc(doc(db, 'sessions', sessionId))
  return snapshot.exists() ? fromFirestore(snapshot.id, snapshot.data()) : null
}

// 내 진행 중(공부 중·일시정지) 세션. 여러 개면 가장 최근 것.
export async function getOpenSessionRemote(uid: string): Promise<StudySession | null> {
  if (!db) return null
  const snapshot = await getDocs(
    query(collection(db, 'sessions'), where('uid', '==', uid), where('status', 'in', OPEN_STATUSES)),
  )
  const sessions = snapshot.docs.map((d) => fromFirestore(d.id, d.data()))
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
}

// 내 세션 전체를 구독한다. 저장될 때마다 새 목록을 알려 준다.
export function subscribeMySessions(
  uid: string,
  onChange: (sessions: StudySession[]) => void,
  onError: (error: unknown) => void,
) {
  if (!db) return () => {}
  return onSnapshot(
    query(collection(db, 'sessions'), where('uid', '==', uid)),
    (snapshot) => onChange(snapshot.docs.map((d) => fromFirestore(d.id, d.data()))),
    onError,
  )
}

// ---------- localStorage ----------

export const sessionLocalKey = (uid: string) => `focushub.openSession.${uid}`

export function saveSessionLocal(session: StudySession): void {
  try {
    localStorage.setItem(sessionLocalKey(session.uid), JSON.stringify(session))
  } catch {
    // 저장 공간이 꽉 찼거나 막혀 있어도 타이머는 계속 동작해야 한다.
  }
}

export function readSessionLocal(uid: string): StudySession | null {
  try {
    const raw = localStorage.getItem(sessionLocalKey(uid))
    return raw ? (JSON.parse(raw) as StudySession) : null
  } catch {
    return null
  }
}

export function clearSessionLocal(uid: string): void {
  try {
    localStorage.removeItem(sessionLocalKey(uid))
  } catch {
    // 무시
  }
}
