import type { TimerEvent, TimerEventType } from '../lib/timer'
import { formatTimeOfDay } from '../lib/format'
import './SessionLog.css'

const LABELS: Record<TimerEventType, string> = {
  start: '시작',
  pause: '일시정지',
  resume: '다시 시작',
  end: '저장',
}

interface Props {
  events: TimerEvent[]
}

export default function SessionLog({ events }: Props) {
  return (
    <aside className="session-log" aria-label="이번 세션 기록">
      <h2 className="session-log-title">이번 세션</h2>
      {events.length === 0 && <p className="session-log-empty">시작하면 여기에 기록이 쌓여요.</p>}
      {events.map((event) => (
        <div key={`${event.type}-${event.at}`} className="session-log-row" data-type={event.type}>
          <span className="session-log-time">{formatTimeOfDay(event.at)}</span>
          <span className="session-log-text">{LABELS[event.type]}</span>
        </div>
      ))}
    </aside>
  )
}
