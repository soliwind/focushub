import { addDays, formatMonthDay, getWeekStart } from '../lib/dates'
import { formatDuration } from '../lib/format'
import { getHeatLevel, getStreakDays } from '../lib/stats'
import './StudyHeatmap.css'

const WEEKS = 12

interface Props {
  totals: Map<string, number> // 전체 기간의 dayKey별 공부 시간
  todayKey: string
}

// 최근 12주 히트맵. 한 열이 한 주(월~일)다.
export default function StudyHeatmap({ totals, todayKey }: Props) {
  const firstMonday = addDays(getWeekStart(todayKey), -(WEEKS - 1) * 7)
  const streak = getStreakDays(totals, todayKey)

  const columns = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(firstMonday, w * 7 + d)),
  )

  return (
    <section className="study-heatmap" aria-label="최근 12주">
      <h2 className="study-heatmap-heading">최근 12주</h2>
      <p className="study-heatmap-streak">
        {streak > 0 ? `${streak}일째 이어서 공부하고 있어요.` : '오늘 공부하면 다시 이어 가기 시작해요.'}
      </p>
      <div className="study-heatmap-grid">
        {columns.map((days) => (
          <div key={days[0]} className="study-heatmap-col">
            {days.map((day) => {
              if (day > todayKey) return <div key={day} className="study-heatmap-cell" data-future="true" />
              const ms = totals.get(day) ?? 0
              return (
                <div
                  key={day}
                  className="study-heatmap-cell"
                  data-level={getHeatLevel(ms)}
                  title={`${formatMonthDay(day)} · ${ms ? formatDuration(ms) : '공부 안 함'}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="study-heatmap-legend" aria-hidden="true">
        <span>0시간</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className="study-heatmap-swatch" data-level={level} />
        ))}
        <span>4시간 이상</span>
      </div>
    </section>
  )
}
