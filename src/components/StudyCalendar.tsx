import { useState } from 'react'
import { formatMonthDay, getWeekdayIndex, listDays } from '../lib/dates'
import { formatDuration } from '../lib/format'
import { getHeatLevel } from '../lib/stats'
import './StudyCalendar.css'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']
const pad = (n: number) => String(n).padStart(2, '0')

interface Props {
  totals: Map<string, number> // dayKey별 공부 시간
  todayKey: string
}

// 학습 달력: 한 달을 달력 모양으로 보여 주고, 많이 공부한 날일수록 진하게 칠한다.
export default function StudyCalendar({ totals, todayKey }: Props) {
  const [todayYear, todayMonth] = todayKey.split('-').map(Number)
  const [monthsBack, setMonthsBack] = useState(0)

  const shown = new Date(todayYear, todayMonth - 1 - monthsBack, 1)
  const year = shown.getFullYear()
  const month = shown.getMonth() + 1
  const lastDate = new Date(year, month, 0).getDate()
  const first = `${year}-${pad(month)}-01`
  const days = listDays(first, `${year}-${pad(month)}-${pad(lastDate)}`)
  const blanks = getWeekdayIndex(first)

  return (
    <div className="study-calendar">
      <div className="study-calendar-head">
        <button
          type="button"
          className="study-calendar-move"
          aria-label="이전 달"
          onClick={() => setMonthsBack((n) => n + 1)}
        >
          ‹
        </button>
        <span className="study-calendar-month">
          {year}년 {month}월
        </span>
        <button
          type="button"
          className="study-calendar-move"
          aria-label="다음 달"
          disabled={monthsBack === 0}
          onClick={() => setMonthsBack((n) => n - 1)}
        >
          ›
        </button>
      </div>

      <div className="study-calendar-grid">
        {WEEKDAYS.map((name) => (
          <span key={name} className="study-calendar-weekday">
            {name}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const ms = totals.get(day) ?? 0
          const future = day > todayKey
          return (
            <span
              key={day}
              className="study-calendar-day"
              data-level={future ? undefined : getHeatLevel(ms)}
              data-future={future}
              data-today={day === todayKey}
              title={`${formatMonthDay(day)} · ${ms ? formatDuration(ms) : '공부 안 함'}`}
            >
              {Number(day.slice(-2))}
            </span>
          )
        })}
      </div>

      <div className="study-calendar-legend" aria-hidden="true">
        <span>0시간</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className="study-calendar-swatch" data-level={level} />
        ))}
        <span>4시간 이상</span>
      </div>
    </div>
  )
}
