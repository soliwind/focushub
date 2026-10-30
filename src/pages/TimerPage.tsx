import { useEffect } from 'react'
import SessionLog from '../components/SessionLog'
import { PauseNotice } from '../components/TimerNotices'
import TimerSettings from '../components/TimerSettings'
import { useTimerSessionContext } from '../hooks/timerSessionContext'
import { formatClock, formatDateLong, formatDuration, withObjectParticle } from '../lib/format'
import { getPauseStartAt, getStudyDate, getStudyMs, type TimerStatus } from '../lib/timer'
import './TimerPage.css'

const STATUS_TEXT: Record<TimerStatus, string> = {
  idle: '시작 전',
  running: '집중',
  paused: '일시정지 · 이 시간은 빼고 기록합니다',
  ended: '저장됨',
}

export default function TimerPage() {
  const {
    timer,
    now,
    settings,
    setSettings,
    restoring,
    message,
    saveFailed,
    retrySave,
    setGoal,
    start,
    pause,
    resume,
    end,
    reset,
  } = useTimerSessionContext()

  const { status, events, goal } = timer
  const studyMs = getStudyMs(events, now)
  const clock = formatClock(studyMs)
  const studyDate = getStudyDate(events[0]?.at ?? now)
  const pauseStartAt = getPauseStartAt(events)

  // 화면 전체 배경색이 상태를 알려 준다 (global.css의 body[data-timer] 규칙).
  useEffect(() => {
    document.body.dataset.timer = status
    return () => {
      delete document.body.dataset.timer
    }
  }, [status])

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

          {message && <p className="timer-message">{message}</p>}

          {status === 'idle' && (
            <div className="timer-actions">
              <button className="btn btn-primary btn-large" onClick={start} disabled={restoring}>
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
              <p className="timer-ended-title">{saveFailed ? '아직 저장하지 못했어요.' : '저장했어요.'}</p>
              <p className="timer-ended-text">
                {saveFailed ? '이 기기에는 남아 있어요. 인터넷 연결을 확인하고 다시 저장해 주세요.' : endedText}
              </p>
              <button className="btn btn-primary btn-medium" onClick={saveFailed ? retrySave : reset}>
                {saveFailed ? '다시 저장' : '새로 시작'}
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
