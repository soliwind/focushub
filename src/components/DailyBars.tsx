import { formatMonthDay, parseDayKey, weekdayName } from '../lib/dates'
import { formatDuration, formatHourMinute } from '../lib/format'
import './DailyBars.css'

const HOUR_MS = 60 * 60 * 1000
const BAR_MAX_PX = 190

interface Props {
  days: string[] // 보여 줄 dayKey 목록 (왼쪽부터)
  totals: Map<string, number>
  todayKey: string
}

// 날짜별 공부 시간 막대. 가장 많이 공부한 날을 기준으로 높이를 정한다 (최소 2시간 눈금).
export default function DailyBars({ days, totals, todayKey }: Props) {
  const maxMs = Math.max(2 * HOUR_MS, ...days.map((d) => totals.get(d) ?? 0))
  const compact = days.length > 7

  return (
    <section className="daily-bars" aria-label="날짜별 공부 시간" data-compact={compact}>
      <div className="daily-bars-plot" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((day) => {
          const ms = totals.get(day) ?? 0
          return (
            <div
              key={day}
              className="daily-bars-col"
              data-today={day === todayKey}
              role="img"
              aria-label={`${formatMonthDay(day)} ${ms ? formatDuration(ms) : '공부 안 함'}`}
            >
              {ms > 0 && !compact && <span className="daily-bars-value">{formatHourMinute(ms)}</span>}
              <div
                className="daily-bars-bar"
                data-empty={ms === 0}
                style={{ height: ms ? Math.max(4, Math.round((ms / maxMs) * BAR_MAX_PX)) : 3 }}
                title={compact ? `${formatMonthDay(day)} · ${ms ? formatDuration(ms) : '공부 안 함'}` : undefined}
              />
            </div>
          )
        })}
      </div>
      <div className="daily-bars-labels" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((day) => (
          <div key={day} className="daily-bars-label" data-today={day === todayKey}>
            {compact ? (
              <>
                <div>{parseDayKey(day).getDate()}</div>
                <div className="daily-bars-weekday">{weekdayName(day)}</div>
              </>
            ) : (
              <>
                {weekdayName(day)} {parseDayKey(day).getDate()}
                {day === todayKey && <span className="daily-bars-today-mark"> · 오늘</span>}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
