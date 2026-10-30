// Firebase 없이 개발할 때 쓰는 예시 세션. 오늘을 기준으로 최근 12주치를 만든다.
// 매번 같은 결과가 나오도록 날짜로 정해지는 가짜 난수를 쓴다.
import { addDays, getDayKey, getWeekKey, getWeekdayIndex, parseDayKey } from './dates'
import type { StudySession } from './sessions'
import { getPausedMs, getStudyMs, type TimerEvent } from './timer'

const MINUTE_MS = 60 * 1000

const GOALS = [
  '미적분 문제풀이',
  '영어 독해 3장',
  '정보처리기사 필기 1과목',
  '한국사 근현대',
  '미적분 개념 정리',
  '영어 단어',
  '정보처리기사 필기 2과목',
  '자료구조 과제',
  '운영체제 복습',
]

function seededRandom(seedText: string) {
  let seed = 0
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) % 233280
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

export function createSampleSessions(uid: string, now: number): StudySession[] {
  const todayKey = getDayKey(now)
  const sessions: StudySession[] = []

  for (let offset = 83; offset >= 0; offset--) {
    const dayKey = addDays(todayKey, -offset)
    const random = seededRandom(dayKey)
    const weekend = getWeekdayIndex(dayKey) >= 5
    if (random() > (weekend ? 0.45 : 0.85)) continue

    const count = 1 + Math.floor(random() * 3)
    let hour = 9 + random() * 3 // 첫 세션 시작 시각 (9~12시)

    for (let i = 0; i < count; i++) {
      const startDate = parseDayKey(dayKey)
      startDate.setHours(Math.floor(hour), Math.floor((hour % 1) * 60), 0, 0)
      const startedAt = startDate.getTime()
      const runMin = 20 + Math.floor(random() * 130)
      const autoClosed = random() < 0.06
      const events: TimerEvent[] = [{ type: 'start', at: startedAt }]

      let endedAt: number
      if (autoClosed) {
        // 공부하다 일시정지한 채 30분이 지나 자동 저장된 세션
        const pauseAt = startedAt + runMin * MINUTE_MS
        endedAt = pauseAt + 30 * MINUTE_MS
        events.push({ type: 'pause', at: pauseAt }, { type: 'end', at: endedAt })
      } else if (random() < 0.4) {
        const pauseAt = startedAt + Math.floor(runMin / 2) * MINUTE_MS
        const resumeAt = pauseAt + (3 + Math.floor(random() * 12)) * MINUTE_MS
        endedAt = resumeAt + Math.ceil(runMin / 2) * MINUTE_MS
        events.push({ type: 'pause', at: pauseAt }, { type: 'resume', at: resumeAt }, { type: 'end', at: endedAt })
      } else {
        endedAt = startedAt + runMin * MINUTE_MS
        events.push({ type: 'end', at: endedAt })
      }

      if (endedAt > now) break // 아직 오지 않은 시간의 세션은 만들지 않는다

      sessions.push({
        id: `sample-${dayKey}-${i}`,
        uid,
        goal: GOALS[Math.floor(random() * GOALS.length)],
        status: autoClosed ? 'auto_closed' : 'completed',
        startedAt,
        endedAt,
        dayKey,
        weekKey: getWeekKey(dayKey),
        events,
        pausedMs: getPausedMs(events, endedAt),
        studyMs: getStudyMs(events, endedAt),
        shareToGroups: random() > 0.12,
        closeReason: autoClosed ? 'long_pause' : null,
        nextGoals: [],
      })

      hour = (endedAt - parseDayKey(dayKey).setHours(0, 0, 0, 0)) / (60 * MINUTE_MS) + 0.5 + random() * 3
      if (hour > 22) break
    }
  }

  return sessions
}
