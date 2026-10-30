import { formatMonthDay, weekdayName } from '../lib/dates'
import { formatDuration, formatHourMinute, formatTimeOfDay } from '../lib/format'
import type { StudySession } from '../lib/sessions'
import './SessionList.css'

interface Props {
  sessions: StudySession[] // 기간 안의 기록 대상 세션
}

function sessionNote(session: StudySession): string {
  const notes: string[] = []
  if (session.closeReason === 'long_pause') notes.push('오래 쉬어서 쉬기 전까지 기록함')
  if (!session.shareToGroups) notes.push('그룹에 공유하지 않음')
  return notes.join(' · ')
}

// 날짜별 세션 목록. 최근 날짜가 위에 온다.
export default function SessionList({ sessions }: Props) {
  const byDay = new Map<string, StudySession[]>()
  for (const s of [...sessions].sort((a, b) => b.startedAt - a.startedAt)) {
    byDay.set(s.dayKey, [...(byDay.get(s.dayKey) ?? []), s])
  }

  return (
    <section className="session-list" aria-label="세션 기록">
      <h2 className="session-list-heading">세션</h2>
      {[...byDay.entries()].map(([dayKey, daySessions]) => (
        <div key={dayKey} className="session-list-day">
          <div className="session-list-day-title">
            <span>
              {formatMonthDay(dayKey)} {weekdayName(dayKey)}요일
            </span>
            <span>{formatDuration(daySessions.reduce((sum, s) => sum + s.studyMs, 0))}</span>
          </div>
          {daySessions.map((s) => {
            const note = sessionNote(s)
            return (
              <div key={s.id} className="session-list-row">
                <span className="session-list-range">
                  {formatTimeOfDay(s.startedAt)} – {s.endedAt ? formatTimeOfDay(s.endedAt) : ''}
                </span>
                <span>
                  <span>{s.goal || '공부 내용 없음'}</span>
                  {note && <span className="session-list-note">{note}</span>}
                </span>
                <span className="session-list-time">{formatHourMinute(s.studyMs)}</span>
              </div>
            )
          })}
        </div>
      ))}
    </section>
  )
}
