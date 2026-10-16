import { useEffect, useReducer, useState } from 'react'
import SessionLog from '../components/SessionLog'
import { PauseNotice } from '../components/TimerNotices'
import TimerSettings, { type TimerSettingsValue } from '../components/TimerSettings'
import { useNow } from '../hooks/useNow'
import { formatClock, formatDateLong, formatDuration, withObjectParticle } from '../lib/format'
import {
  getPauseStartAt,
  getStudyDate,
  getStudyMs,
  initialTimerState,
  timerReducer,
  type TimerStatus,
} from '../lib/timer'
import './TimerPage.css'

const MINUTE_MS = 60 * 1000

const STATUS_TEXT: Record<TimerStatus, string> = {
  idle: '시작 전',
  running: '집중',
  paused: '일시정지 · 이 시간은 빼고 기록합니다',
  ended: '저장됨',
}

export default function TimerPage() {
  const [timer, dispatch] = useReducer(timerReducer, initialTimerState)
  const [goal, setGoal] = useState('')
  const [settings, setSettings] = useState<TimerSettingsValue>({
    longPauseMinutes: 30,
    notifyOnLeave: true,
    shareToGroups: true,
  })

  const { status, events } = timer

  // 공부 중이거나 쉬는 중일 때만 화면을 자주 다시 그린다.
  const now = useNow(status === 'running' || status === 'paused')
  const studyMs = getStudyMs(events, now)
  const clock = formatClock(studyMs)
  const studyDate = getStudyDate(events[0]?.at ?? now)
  const pauseStartAt = getPauseStartAt(events)

  // 탭 이탈 감지: visibilitychange 이벤트만 쓴다 (window.blur는 쓰지 않는다).
  // 탭이 가려지면 바로 일시정지한다. 다른 탭의 내용이나 키 입력은 전혀 보지 않는다.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        dispatch({ type: 'pause', at: Date.now(), byLeave: true })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // 기준 시간 넘게 쉬면 자동 저장한다. 끝난 시각은 기준을 넘긴 순간으로 기록한다.
  // (다른 탭에 있는 동안 확인이 늦어져도 같은 시각으로 남는다.)
  const autoEndAt = pauseStartAt === null ? null : pauseStartAt + settings.longPauseMinutes * MINUTE_MS
  useEffect(() => {
    if (status === 'paused' && autoEndAt !== null && now >= autoEndAt) {
      dispatch({ type: 'autoEnd', at: autoEndAt })
    }
  }, [status, now, autoEndAt])

  // 화면 전체 배경색이 상태를 알려 준다 (global.css의 body[data-timer] 규칙).
  useEffect(() => {
    document.body.dataset.timer = status
    return () => {
      delete document.body.dataset.timer
    }
  }, [status])

  // 브라우저 탭 제목도 상태에 맞게 바꾼다.
  // "탭을 떠나면 알림"이 꺼져 있으면 탭을 떠나 일시정지됐을 때 제목을 바꾸지 않는다.
  const label = goal.trim() || '공부 중'
  const titles: Record<TimerStatus, string> = {
    idle: 'FocusHub',
    running: `${clock} ${label}`,
    paused: timer.pausedByLeave && !settings.notifyOnLeave ? 'FocusHub' : `일시정지 · ${label}`,
    ended: '저장됨',
  }
  const title = titles[status]

  useEffect(() => {
    document.title = title
  }, [title])

  useEffect(() => {
    return () => {
      document.title = 'FocusHub'
    }
  }, [])

  const start = () => dispatch({ type: 'start', at: Date.now() })
  const pause = () => dispatch({ type: 'pause', at: Date.now(), byLeave: false })
  const resume = (nextGoal: string) => dispatch({ type: 'resume', at: Date.now(), nextGoal })
  const end = () => dispatch({ type: 'end', at: Date.now() })
  const reset = () => {
    dispatch({ type: 'reset' })
    setGoal('')
  }

  const recordedText = withObjectParticle(formatDuration(studyMs))
  const endedText =
    (timer.closeReason === 'long_pause'
      ? `${settings.longPauseMinutes}분 넘게 쉬어서, 쉬기 전까지인 ${recordedText} 기록해 두었어요.`
      : `${recordedText} 기록했습니다.`) +
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

          {status === 'paused' && pauseStartAt !== null && (
            <PauseNotice
              key={pauseStartAt}
              pausedMs={Math.max(0, now - pauseStartAt)}
              pausedByLeave={timer.pausedByLeave}
              longPauseMinutes={settings.longPauseMinutes}
              onResume={resume}
              onEnd={end}
            />
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

        <SessionLog events={events} nextGoals={timer.nextGoals} closeReason={timer.closeReason} />
      </main>

      <TimerSettings value={settings} onChange={setSettings} />
    </>
  )
}
