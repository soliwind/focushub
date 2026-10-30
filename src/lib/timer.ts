// 타이머 계산 규칙
// 1초마다 숫자를 더하지 않고, 시작·일시정지·재개·종료 "시각"을 events에 쌓아 두고
// 필요할 때마다 그 시각들로 학습 시간을 계산한다.
// (다른 탭에 있으면 브라우저가 setInterval을 느리게 돌려서, 더하는 방식은 시간이 틀어진다.)
//
// 상태는 공부 중(running)과 일시정지(paused) 두 가지뿐이다.
// - 다른 탭으로 가면 바로 일시정지한다. 직접 누른 일시정지와 구분하지 않는다.
// - 일시정지 시간은 학습 시간에서 뺀다.
// - 일시정지가 기준 시간(longPauseMinutes)을 넘으면 쉬기 전까지로 자동 저장한다.

export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended'

export type TimerEventType = 'start' | 'pause' | 'resume' | 'end'

export interface TimerEvent {
  type: TimerEventType
  at: number // 밀리초 단위 시각 (Date.now() 값)
}

// 쉬었다가 다시 시작할 때 적어 두는 "이어서 할 일" (복귀 루틴)
export interface NextGoal {
  at: number
  text: string
}

export interface TimerState {
  sessionId: string | null // Firestore sessions 문서 ID
  goal: string // 공부 내용
  status: TimerStatus
  events: TimerEvent[]
  nextGoals: NextGoal[]
  closeReason: null | 'long_pause'
  // 화면 안내용: 이번 일시정지가 탭을 떠나서 생긴 것인지. 기록에는 남기지 않는다.
  pausedByLeave: boolean
  updatedAt: number // 마지막으로 바뀐 시각. 여러 탭·저장본 중 가장 새것을 고를 때 쓴다.
}

export const initialTimerState: TimerState = {
  sessionId: null,
  goal: '',
  status: 'idle',
  events: [],
  nextGoals: [],
  closeReason: null,
  pausedByLeave: false,
  updatedAt: 0,
}

export type TimerAction =
  | { type: 'start'; at: number; sessionId: string }
  | { type: 'setGoal'; at: number; goal: string }
  | { type: 'pause'; at: number; byLeave: boolean }
  | { type: 'resume'; at: number; nextGoal: string }
  | { type: 'end'; at: number }
  | { type: 'autoEnd'; at: number }
  | { type: 'reset' }
  | { type: 'restore'; state: TimerState } // 저장해 둔 세션으로 바꾼다 (새로고침, 다른 탭)

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

// 하루는 오전 5시에 시작한다.
export const DAY_START_HOUR = 5

function addEvent(state: TimerState, type: TimerEventType, at: number): TimerEvent[] {
  return [...state.events, { type, at }]
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  if (action.type === 'restore') return action.state
  if (action.type === 'reset') return initialTimerState
  const next = applyAction(state, action)
  // 실제로 바뀐 경우에만 마지막 변경 시각을 적는다.
  return next === state ? state : { ...next, updatedAt: Math.max(state.updatedAt, action.at) }
}

function applyAction(state: TimerState, action: Exclude<TimerAction, { type: 'restore' | 'reset' }>): TimerState {
  switch (action.type) {
    case 'start':
      if (state.status === 'running' || state.status === 'paused') return state
      return {
        ...initialTimerState,
        sessionId: action.sessionId,
        goal: state.goal,
        status: 'running',
        events: [{ type: 'start', at: action.at }],
      }

    case 'setGoal':
      if (state.status === 'ended') return state
      return { ...state, goal: action.goal }

    case 'pause':
      if (state.status !== 'running') return state
      return {
        ...state,
        status: 'paused',
        pausedByLeave: action.byLeave,
        events: addEvent(state, 'pause', action.at),
      }

    case 'resume': {
      if (state.status !== 'paused') return state
      const nextGoals = action.nextGoal
        ? [...state.nextGoals, { at: action.at, text: action.nextGoal }]
        : state.nextGoals
      return {
        ...state,
        status: 'running',
        pausedByLeave: false,
        nextGoals,
        events: addEvent(state, 'resume', action.at),
      }
    }

    case 'end':
      if (state.status !== 'running' && state.status !== 'paused') return state
      return { ...state, status: 'ended', events: addEvent(state, 'end', action.at) }

    // 기준 시간 넘게 쉬어서 자동으로 저장한다. 일시정지 시간은 이미 빠져 있으므로
    // 학습 시간은 쉬기 전까지가 된다.
    case 'autoEnd':
      if (state.status !== 'paused') return state
      return {
        ...state,
        status: 'ended',
        closeReason: 'long_pause',
        events: addEvent(state, 'end', action.at),
      }
  }
}

// 지금 일시정지 중이면 그 시작 시각, 아니면 null
export function getPauseStartAt(events: TimerEvent[]): number | null {
  const last = events[events.length - 1]
  return last?.type === 'pause' ? last.at : null
}

// 시작·재개부터 일시정지·종료(또는 지금)까지의 구간만 더한다. 일시정지 구간은 빠진다.
export function getStudyMs(events: TimerEvent[], now: number): number {
  let total = 0
  let runningSince: number | null = null

  for (const event of events) {
    if (event.type === 'start' || event.type === 'resume') {
      runningSince = event.at
    } else if (runningSince !== null) {
      total += event.at - runningSince
      runningSince = null
    }
  }

  if (runningSince !== null) {
    total += Math.max(0, now - runningSince)
  }
  return total
}

// 일시정지한 시간의 합. 화면에는 보여 주지 않고 데이터로만 저장한다 (sessions.pausedMs).
export function getPausedMs(events: TimerEvent[], now: number): number {
  let total = 0
  let pausedSince: number | null = null

  for (const event of events) {
    if (event.type === 'pause') {
      pausedSince = event.at
    } else if (pausedSince !== null) {
      total += event.at - pausedSince
      pausedSince = null
    }
  }

  if (pausedSince !== null) {
    total += Math.max(0, now - pausedSince)
  }
  return total
}

// 오전 5시 이전 시각은 전날로 본다. 5시간을 뺀 날짜가 "공부한 날"이다.
export function getStudyDate(at: number): Date {
  return new Date(at - DAY_START_HOUR * HOUR_MS)
}
