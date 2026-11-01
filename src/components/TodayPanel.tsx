import { formatDuration } from '../lib/format'
import type { StudySession } from '../lib/sessions'
import { getLatestNextGoal, getRecentGoals, getStreakDays, totalsByDay } from '../lib/stats'
import './TodayPanel.css'

const RECENT_GOALS = 3

interface Props {
  todayKey: string
  sessions: StudySession[] // 기록 대상 세션 전체
  disabled: boolean
  onStart: (goal: string) => void
}

// 시작 전 오른쪽: 오늘 공부한 시간과, 이어서 하거나 다시 할 공부를 눌러 바로 시작하는 목록
export default function TodayPanel({ todayKey, sessions, disabled, onStart }: Props) {
  const totals = totalsByDay(sessions)
  const todayMs = totals.get(todayKey) ?? 0
  const streak = getStreakDays(totals, todayKey)
  const nextGoal = getLatestNextGoal(sessions)
  const recentGoals = getRecentGoals(sessions, RECENT_GOALS + 1)
    .filter((goal) => goal !== nextGoal)
    .slice(0, RECENT_GOALS)

  return (
    <aside className="today-panel" aria-label="오늘">
      <h2 className="today-panel-heading">오늘</h2>
      <p className="today-panel-total">
        {todayMs > 0 ? (
          <>
            <em>{formatDuration(todayMs)}</em> 공부했어요.
          </>
        ) : (
          '아직 시작하지 않았어요.'
        )}
      </p>
      {streak > 0 && <p className="today-panel-streak">{streak}일째 이어서 공부하고 있어요.</p>}

      {nextGoal && (
        <>
          <h2 className="today-panel-heading today-panel-section">지난번 이어서 할 일</h2>
          <button className="today-panel-goal" onClick={() => onStart(nextGoal)} disabled={disabled}>
            <span>{nextGoal}</span>
            <span className="today-panel-start">시작</span>
          </button>
        </>
      )}

      {recentGoals.length > 0 && (
        <>
          <h2 className="today-panel-heading today-panel-section">최근 공부</h2>
          {recentGoals.map((goal) => (
            <button key={goal} className="today-panel-goal" onClick={() => onStart(goal)} disabled={disabled}>
              <span>{goal}</span>
              <span className="today-panel-start">시작</span>
            </button>
          ))}
        </>
      )}
    </aside>
  )
}
