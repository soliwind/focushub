import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { addStudyTime, saveSession, setMemberStatus } from '../lib/rooms'
import { formatClock, formatDuration } from '../lib/format'

function TimerPage() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [awayCount, setAwayCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  // 탭을 벗어나면 자리 비움으로 표시하고 횟수를 셉니다.
  useEffect(() => {
    const handleChange = () => {
      const visible = document.visibilityState === 'visible'
      setIsVisible(visible)

      if (!visible && isRunning) {
        setAwayCount((prev) => prev + 1)
      }

      if (code && user) {
        setMemberStatus(code, user.id, visible && isRunning ? 'studying' : 'away')
      }
    }

    document.addEventListener('visibilitychange', handleChange)
    return () => document.removeEventListener('visibilitychange', handleChange)
  }, [code, user, isRunning])

  const handleStart = () => {
    setIsRunning(true)
    if (code && user) setMemberStatus(code, user.id, 'studying')
  }

  const handlePause = () => {
    setIsRunning(false)
    if (code && user) setMemberStatus(code, user.id, 'resting')
  }

  const handleFinish = async () => {
    if (!code || !user) return
    setIsRunning(false)

    await addStudyTime(code, user.id, seconds)
    await saveSession({
      userId: user.id,
      roomCode: code,
      seconds,
      awayCount,
      endedAt: Date.now(),
    })

    setFinished(true)
  }

  if (finished) {
    return (
      <div className="focus">
        <p className="focus-label">오늘 채운 시간</p>
        <div className="focus-result">{formatDuration(seconds)}</div>
        <p className="focus-sub">
          {awayCount === 0 ? '한 번도 자리를 비우지 않았습니다' : `자리를 비운 횟수 ${awayCount}회`}
        </p>

        <div className="focus-actions">
          <button className="focus-btn wide" onClick={() => navigate(`/room/${code}`)}>
            스터디룸으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const stateText = !isRunning
    ? '시작을 기다리는 중'
    : isVisible
      ? '집중하고 있습니다'
      : '자리를 비웠습니다'

  return (
    <div className={`focus ${isRunning && !isVisible ? 'off-track' : ''}`}>
      <p className="focus-state">
        <span className="pulse" />
        {stateText}
      </p>

      <div className="clock">{formatClock(seconds)}</div>

      <p className="focus-sub">
        {awayCount > 0 ? `이번 세션 이탈 ${awayCount}회` : '\u00A0'}
      </p>

      <div className="focus-actions">
        <div className="focus-pair">
          {!isRunning ? (
            <button className="focus-btn" onClick={handleStart}>
              {seconds === 0 ? '시작' : '이어서'}
            </button>
          ) : (
            <button className="focus-btn" onClick={handlePause}>
              잠시 멈춤
            </button>
          )}

          <button className="focus-btn" onClick={handleFinish} disabled={seconds === 0}>
            마치기
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimerPage
