import { useState, type FormEvent } from 'react'
import { formatDuration } from '../lib/format'
import './TimerNotices.css'

interface PauseNoticeProps {
  pausedMs: number // 이번 일시정지가 이어진 시간
  pausedByLeave: boolean
  longPauseMinutes: number
  onResume: (nextGoal: string) => void
  onEnd: () => void
}

// 일시정지 중 안내 (복귀 루틴). 탭을 떠났다 돌아왔을 때와 직접 일시정지했을 때 모두 보인다.
export function PauseNotice({ pausedMs, pausedByLeave, longPauseMinutes, onResume, onEnd }: PauseNoticeProps) {
  const [nextGoal, setNextGoal] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault() // 폼 제출로 페이지가 새로고침되지 않게 막는다
    onResume(nextGoal.trim())
  }

  return (
    <div className="notice">
      <p className="notice-title">{pausedByLeave ? '다시 왔네요.' : '잠시 쉬는 중이에요.'}</p>
      <p className="notice-body">
        {pausedByLeave && `${formatDuration(pausedMs)} 동안 자리를 비웠어요. `}
        다시 시작하기 전에 이어서 할 일을 한 줄 적어 두세요.
      </p>
      <form className="notice-form" onSubmit={handleSubmit}>
        <label htmlFor="next-goal" className="visually-hidden">
          이어서 할 일
        </label>
        <input
          id="next-goal"
          className="notice-input"
          value={nextGoal}
          onChange={(e) => setNextGoal(e.target.value)}
          placeholder="3번 문제 다시 풀기"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary notice-button">
          다시 시작
        </button>
        <button type="button" className="btn btn-secondary notice-button" onClick={onEnd}>
          마치고 저장
        </button>
      </form>
      <p className="notice-hint">{longPauseMinutes}분 넘게 쉬면 쉬기 전까지로 자동 저장해요.</p>
    </div>
  )
}
