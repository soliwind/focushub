// 타이머 계산 규칙
// 1초마다 숫자를 더하지 않고, 시작·일시정지·재개·종료 "시각"을 events에 쌓아 두고
// 필요할 때마다 그 시각들로 학습 시간을 계산한다.
// (다른 탭에 있으면 브라우저가 setInterval을 느리게 돌려서, 더하는 방식은 시간이 틀어진다.)

export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended'

export type TimerEventType = 'start' | 'pause' | 'resume' | 'end'

export interface TimerEvent {
  type: TimerEventType
  at: number // 밀리초 단위 시각 (Date.now() 값)
}

const HOUR_MS = 60 * 60 * 1000

// 하루는 오전 5시에 시작한다.
export const DAY_START_HOUR = 5

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

// 오전 5시 이전 시각은 전날로 본다. 5시간을 뺀 날짜가 "공부한 날"이다.
export function getStudyDate(at: number): Date {
  return new Date(at - DAY_START_HOUR * HOUR_MS)
}
