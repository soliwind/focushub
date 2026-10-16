import { useEffect, useState } from 'react'
import SessionLog from '../components/SessionLog'
import TimerSettings, { type TimerSettingsValue } from '../components/TimerSettings'
import { useNow } from '../hooks/useNow'
import { formatClock, formatDateLong, formatDuration, withObjectParticle } from '../lib/format'
import { getStudyDate, getStudyMs, type TimerEvent, type TimerEventType, type TimerStatus } from '../lib/timer'
import './TimerPage.css'

const STATUS_TEXT: Record<TimerStatus, string> = {
  idle: '시작 전',
  running: '집중',
  paused: '일시정지 · 이 시간은 빼고 기록합니다',
  ended: '저장됨',
}

export default function TimerPage() {
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [goal, setGoal] = useState('')
  const [events, setEvents] = useState<TimerEvent[]>([])
  const [settings, setSettings] = useState<TimerSettingsValue>({
    longAwayMinutes: 30,
    notifyOnLeave: true,
    shareToGroups: true,
  })

  // 공부 중일 때만 화면을 자주 다시 그린다.
  const now = useNow(status === 'running')
  const studyMs = getStudyMs(events, now)
  const clock = formatClock(studyMs)
  const studyDate = getStudyDate(events[0]?.at ?? now)

  // 화면 전체 배경색이 상태를 알려 준다 (global.css의 body[data-timer] 규칙).
  useEffect(() => {
    document.body.dataset.timer = status
    return () => {
      delete document.body.dataset.timer
    }
  }, [status])

  // 브라우저 탭 제목도 상태에 맞게 바꾼다.
  useEffect(() => {
    const label = goal.trim() || '공부 중'
    const titles: Record<TimerStatus, string> = {
      idle: 'FocusHub',
      running: `${clock} ${label}`,
      paused: `일시정지 · ${label}`,
      ended: '저장됨',
    }
    document.title = titles[status]
  }, [status, clock, goal])

  useEffect(() => {
    return () => {
      document.title = 'FocusHub'
    }
  }, [])

  const addEvent = (type: TimerEventType) => {
    setEvents((prev) => [...prev, { type, at: Date.now() }])
  }

  const start = () => {
    setEvents([{ type: 'start', at: Date.now() }])
    setStatus('running')
  }
  const pause = () => {
    addEvent('pause')
    setStatus('paused')
  }
  const resume = () => {
    addEvent('resume')
    setStatus('running')
  }
  const end = () => {
    addEvent('end')
    setStatus('ended')
  }
  const reset = () => {
    setEvents([])
    setGoal('')
    setStatus('idle')
  }

  const endedText =
    withObjectParticle(formatDuration(studyMs)) +
    ' 기록했습니다.' +
    (settings.shareToGroups ? '' : ' 이번 세션은 그룹에 공유하지 않았습니다.')

  return (
    <>
      <main className="timer-main">
        <section className="timer" aria-label="타이머" data-status={status}>
          <div className="timer-status">
            <span className="timer-status-dot" aria-hidden="true" />
            <span className="timer-status-text">{STATUS_TEXT[status]}</span>
            <span className="timer-status-date">· {formatDateLong(studyDate)}</span>
          </div>

          <label htmlFor="goal" className="visually-hidden">
            지금 공부하는 것
          </label>
          <input
            id="goal"
            className="timer-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="무엇을 공부하나요"
            autoComplete="off"
          />

          <div className="timer-clock" role="timer" aria-label={`공부한 시간 ${formatDuration(studyMs)}`}>
            {clock}
          </div>

          {status === 'idle' && (
            <div className="timer-actions">
              <button className="btn btn-primary btn-large" onClick={start}>
                시작
              </button>
            </div>
          )}

          {status === 'running' && (
            <div className="timer-actions">
              <button className="btn btn-primary" onClick={end}>
                마치고 저장
              </button>
              <button className="btn btn-secondary" onClick={pause}>
                일시정지
              </button>
            </div>
          )}

          {status === 'paused' && (
            <div className="timer-actions">
              <button className="btn btn-primary" onClick={resume}>
                다시 시작
              </button>
              <button className="btn btn-secondary" onClick={end}>
                마치고 저장
              </button>
            </div>
          )}

          {status === 'ended' && (
            <div className="timer-ended">
              <p className="timer-ended-title">저장했어요.</p>
              <p className="timer-ended-text">{endedText}</p>
              <button className="btn btn-primary btn-medium" onClick={reset}>
                새로 시작
              </button>
            </div>
          )}
        </section>

        <SessionLog events={events} />
      </main>

      <TimerSettings value={settings} onChange={setSettings} />
    </>
  )
}
