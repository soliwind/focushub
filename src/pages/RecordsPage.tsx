import { useState } from 'react'
import { Link } from 'react-router-dom'
import DailyBars from '../components/DailyBars'
import SessionList from '../components/SessionList'
import StudyHeatmap from '../components/StudyHeatmap'
import { useMySessions } from '../hooks/useMySessions'
import { addDays, formatMonthDay, getDayKey, getWeekStart, listDays, parseDayKey, weekdayName } from '../lib/dates'
import { formatDuration } from '../lib/format'
import { isCountedSession } from '../lib/sessions'
import { summarize, totalsByDay } from '../lib/stats'
import './RecordsPage.css'

type PeriodKind = 'today' | 'week' | 'range'

const MAX_BAR_DAYS = 31 // 이보다 긴 기간은 막대를 그리지 않는다

// "10월 12일 ~ 18일", 달이 바뀌면 "9월 28일 ~ 10월 4일"
function formatRange(start: string, end: string): string {
  if (start === end) return `${formatMonthDay(start)} ${weekdayName(start)}요일`
  const sameMonth = parseDayKey(start).getMonth() === parseDayKey(end).getMonth()
  return `${formatMonthDay(start)} ~ ${sameMonth ? `${parseDayKey(end).getDate()}일` : formatMonthDay(end)}`
}

export default function RecordsPage() {
  const { sessions } = useMySessions()
  const [todayKey] = useState(() => getDayKey(Date.now()))
  const [kind, setKind] = useState<PeriodKind>('week')
  const [rangeStart, setRangeStart] = useState(() => addDays(todayKey, -13))
  const [rangeEnd, setRangeEnd] = useState(todayKey)

  let start = todayKey
  let end = todayKey
  if (kind === 'week') {
    start = getWeekStart(todayKey)
    end = addDays(start, 6)
  } else if (kind === 'range') {
    // 시작일이 끝일보다 늦으면 서로 바꿔서 본다
    ;[start, end] = rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart]
  }

  const counted = sessions.filter(isCountedSession)
  const inPeriod = counted.filter((s) => s.dayKey >= start && s.dayKey <= end)
  const summary = summarize(inPeriod)
  const allTotals = totalsByDay(counted)
  const days = listDays(start, end)

  const subject = kind === 'today' ? '오늘은' : kind === 'week' ? '이번 주에는' : `${formatRange(start, end)}에는`

  return (
    <main className="page records">
      <div className="records-period">
        <nav className="records-tabs" aria-label="기간">
          {(
            [
              ['today', '오늘'],
              ['week', '이번 주'],
              ['range', '기간 선택'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="records-tab"
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
            >
              {label}
            </button>
          ))}
        </nav>
        {kind === 'range' && (
          <div className="records-range">
            <label className="visually-hidden" htmlFor="range-start">
              시작일
            </label>
            <input
              id="range-start"
              type="date"
              className="records-date"
              value={rangeStart}
              max={todayKey}
              onChange={(e) => e.target.value && setRangeStart(e.target.value)}
            />
            <span>~</span>
            <label className="visually-hidden" htmlFor="range-end">
              끝일
            </label>
            <input
              id="range-end"
              type="date"
              className="records-date"
              value={rangeEnd}
              max={todayKey}
              onChange={(e) => e.target.value && setRangeEnd(e.target.value)}
            />
          </div>
        )}
        <span className="records-period-note">{formatRange(start, end)} · 하루는 오전 5시에 시작</span>
      </div>

      {summary.totalMs > 0 ? (
        <h1 className="records-headline">
          {subject}
          {kind !== 'today' && (
            <>
              {' '}
              <em>{summary.studyDays}일</em> 동안
            </>
          )}{' '}
          <em>{formatDuration(summary.totalMs)}</em> 공부했어요.
        </h1>
      ) : (
        <h1 className="records-headline">{subject} 아직 공부 기록이 없어요.</h1>
      )}
      <p className="records-summary">
        세션 {summary.sessionCount}개 · 평균 {summary.sessionCount ? formatDuration(summary.averageMs) : '0분'}
      </p>

      {kind !== 'today' && days.length <= MAX_BAR_DAYS && (
        <DailyBars days={days} totals={allTotals} todayKey={todayKey} />
      )}

      <div className="records-columns">
        {inPeriod.length > 0 ? (
          <SessionList sessions={inPeriod} />
        ) : (
          <section className="records-empty" aria-label="세션 기록">
            <p>이 기간에 마친 세션이 없어요. 타이머에서 공부를 시작하면 여기에 쌓여요.</p>
            <Link to="/" className="btn btn-primary btn-medium btn-link">
              타이머로 가기
            </Link>
          </section>
        )}
        <StudyHeatmap totals={allTotals} todayKey={todayKey} />
      </div>
    </main>
  )
}
