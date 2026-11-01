import { addDays } from './dates'
import type { StudySession } from './sessions'

const HOUR_MS = 60 * 60 * 1000

export interface PeriodSummary {
  totalMs: number
  sessionCount: number
  averageMs: number
  studyDays: number // 공부한 날 수
}

// sessions는 이미 기간과 상태로 걸러진 목록이어야 한다.
export function summarize(sessions: StudySession[]): PeriodSummary {
  const totalMs = sessions.reduce((sum, s) => sum + s.studyMs, 0)
  const studyDays = new Set(sessions.filter((s) => s.studyMs > 0).map((s) => s.dayKey)).size
  return {
    totalMs,
    sessionCount: sessions.length,
    averageMs: sessions.length ? totalMs / sessions.length : 0,
    studyDays,
  }
}

// dayKey별 공부 시간 합계
export function totalsByDay(sessions: StudySession[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const s of sessions) {
    totals.set(s.dayKey, (totals.get(s.dayKey) ?? 0) + s.studyMs)
  }
  return totals
}

// 히트맵 농도 0~4: 공부 안 함, 1시간 미만, 1~2시간, 2~4시간, 4시간 이상
export function getHeatLevel(ms: number): 0 | 1 | 2 | 3 | 4 {
  if (ms <= 0) return 0
  if (ms < HOUR_MS) return 1
  if (ms < 2 * HOUR_MS) return 2
  if (ms < 4 * HOUR_MS) return 3
  return 4
}

// 며칠째 이어서 공부했는지. 오늘 아직 안 했으면 어제까지 이어진 날을 센다.
export function getStreakDays(totals: Map<string, number>, todayKey: string): number {
  let day = (totals.get(todayKey) ?? 0) > 0 ? todayKey : addDays(todayKey, -1)
  let count = 0
  while ((totals.get(day) ?? 0) > 0) {
    count += 1
    day = addDays(day, -1)
  }
  return count
}

// 가장 최근에 적어 둔 "이어서 할 일"
export function getLatestNextGoal(sessions: StudySession[]): string | null {
  const notes = sessions.flatMap((s) => s.nextGoals)
  return notes.sort((a, b) => b.at - a.at)[0]?.text ?? null
}

// 최근 공부 내용. 같은 내용은 한 번만, 최근 것부터.
export function getRecentGoals(sessions: StudySession[], limit: number): string[] {
  const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt)
  const goals = sorted.map((s) => s.goal.trim()).filter(Boolean)
  return [...new Set(goals)].slice(0, limit)
}
