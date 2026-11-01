import { useNow } from '../hooks/useNow'
import { addDays, parseDayKey } from '../lib/dates'
import { formatDuration, formatTimeOfDay } from '../lib/format'
import type { StudySession } from '../lib/sessions'
import { DAY_START_HOUR, getStudyIntervals } from '../lib/timer'
import './TodayStrip.css'

const MINUTE_MS = 60 * 1000
const HOUR_LABELS = ['오전 5시', '오전 11시', '오후 5시', '오후 11시', '오전 5시']

function dayStartAt(dayKey: string): number {
  const date = parseDayKey(dayKey)
  date.setHours(DAY_START_HOUR, 0, 0, 0)
  return date.getTime()
}

interface Props {
  todayKey: string
  sessions: StudySession[] // 오늘의 기록 대상 세션
}

// 오늘의 띠: 오전 5시부터 다음 날 오전 5시까지 공부한 구간을 보여 준다. 쉰 구간은 비워 둔다.
export default function TodayStrip({ todayKey, sessions }: Props) {
  const now = useNow(true, MINUTE_MS)
  const start = dayStartAt(todayKey)
  const end = dayStartAt(addDays(todayKey, 1))
  const percent = (at: number) => ((Math.min(Math.max(at, start), end) - start) / (end - start)) * 100

  const segments = sessions.flatMap((session) =>
    getStudyIntervals(session.events)
      .filter(({ from, to }) => to > start && from < end)
      .map(({ from, to }) => ({
        key: `${session.id}-${from}`,
        left: percent(from),
        width: percent(to) - percent(from),
        title: `${formatTimeOfDay(from)} – ${formatTimeOfDay(to)} ${session.goal || '공부 내용 없음'}`,
      })),
  )
  const totalMs = sessions.reduce((sum, s) => sum + s.studyMs, 0)

  return (
    <section className="today-strip" aria-label="오늘의 공부 구간">
      <div className="today-strip-heading">
        <h2>오늘의 띠</h2>
        <span>{totalMs > 0 ? formatDuration(totalMs) : '아직 공부한 구간이 없어요'}</span>
      </div>
      <div className="today-strip-track">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="today-strip-segment"
            title={segment.title}
            style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
          />
        ))}
        {now >= start && now < end && (
          <div className="today-strip-now" style={{ left: `${percent(now)}%` }} title="지금" />
        )}
      </div>
      <div className="today-strip-hours" aria-hidden="true">
        {HOUR_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </section>
  )
}
