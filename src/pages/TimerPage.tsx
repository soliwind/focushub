import { useEffect } from 'react'
import SessionLog from '../components/SessionLog'
import { PauseNotice } from '../components/TimerNotices'
import TodayPanel from '../components/TodayPanel'
import TodayStrip from '../components/TodayStrip'
import TimerSettings from '../components/TimerSettings'
import { useTimerSessionContext } from '../hooks/timerSessionContext'
import { useMySessions } from '../hooks/useMySessions'
import { useNow } from '../hooks/useNow'
import { getDayKey } from '../lib/dates'
import { formatClock, formatDateLong, formatDuration, withObjectParticle } from '../lib/format'
import { isCountedSession } from '../lib/sessions'
import { getPauseStartAt, getStudyDate, getStudyMs, type TimerStatus } from '../lib/timer'
import './TimerPage.css'

const MINUTE_MS = 60 * 1000

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
    sharedGroupCount,
    retrySave,
    setGoal,
    start,
    pause,
    resume,
    end,
    reset,
  } = useTimerSessionContext()

  const { sessions, loading } = useMySessions()
  const { status, events, goal } = timer
  const studyMs = getStudyMs(events, now)
  const clock = formatClock(studyMs)
  const studyDate = getStudyDate(events[0]?.at ?? now)
  const pauseStartAt = getPauseStartAt(events)
  const counted = sessions.filter(isCountedSession)
  const minuteNow = useNow(true, MINUTE_MS) // 창을 열어 둔 채 오전 5시가 지나도 오늘이 바뀌도록
  const todayKey = getDayKey(minuteNow)

  const startGoal = (nextGoal: string) => {
    setGoal(nextGoal)
    start()
  }

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
    (settings.shareToGroups
      ? sharedGroupCount > 0
        ? ` 가입한 그룹 ${sharedGroupCount}곳에도 같은 시간이 더해졌어요.`
        : ''
      : ' 이번 세션은 그룹에 공유하지 않았습니다.')

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
              <button className="btn btn-primary btn-start btn-large" onClick={start} disabled={restoring}>
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

        {status === 'idle' ? (
          !loading && (
            <TodayPanel todayKey={todayKey} sessions={counted} disabled={restoring} onStart={startGoal} />
          )
        ) : (
          <SessionLog events={events} nextGoals={timer.nextGoals} closeReason={timer.closeReason} />
        )}
      </main>

      {(status === 'idle' || status === 'ended') && !loading && (
        <TodayStrip todayKey={todayKey} sessions={counted.filter((s) => s.dayKey === todayKey)} />
      )}

      <TimerSettings value={settings} onChange={setSettings} shareLocked={status === 'ended'} />
    </>
  )
}
