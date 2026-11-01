import type { ReactNode } from 'react'
import type { NextGoal, TimerEvent, TimerState } from '../lib/timer'
import { formatTimeOfDay } from '../lib/format'
import './SessionLog.css'

type RowKind = 'focus' | 'pause'

interface Row {
  at: number
  text: string
  kind: RowKind
}

function toRows(events: TimerEvent[], nextGoals: NextGoal[], closeReason: TimerState['closeReason']): Row[] {
  const rows: Row[] = events.map((event) => {
    switch (event.type) {
      case 'start':
        return { at: event.at, text: '시작', kind: 'focus' }
      case 'pause':
        return { at: event.at, text: '일시정지', kind: 'pause' }
      case 'resume':
        return { at: event.at, text: '다시 시작', kind: 'focus' }
      case 'end':
        return closeReason === 'long_pause'
          ? { at: event.at, text: '저장 · 오래 쉼', kind: 'pause' }
          : { at: event.at, text: '저장', kind: 'focus' }
    }
  })

  nextGoals.forEach((goal) => rows.push({ at: goal.at, text: goal.text, kind: 'focus' }))

  // 같은 시각이면 "다시 시작" 다음에 이어서 할 일이 오도록 원래 순서를 유지한다.
  return rows.sort((a, b) => a.at - b.at)
}

interface Props {
  events: TimerEvent[]
  nextGoals: NextGoal[]
  closeReason: TimerState['closeReason']
  children?: ReactNode // 이번 세션 아래에 붙는 내용
}

export default function SessionLog({ events, nextGoals, closeReason, children }: Props) {
  const rows = toRows(events, nextGoals, closeReason)

  return (
    <aside className="session-log" aria-label="이번 세션 기록">
      <h2 className="session-log-title">이번 세션</h2>
      {rows.map((row, i) => (
        <div key={`${row.at}-${i}`} className="session-log-row" data-kind={row.kind}>
          <span className="session-log-time">{formatTimeOfDay(row.at)}</span>
          <span className="session-log-text">{row.text}</span>
        </div>
      ))}
      {children}
    </aside>
  )
}
