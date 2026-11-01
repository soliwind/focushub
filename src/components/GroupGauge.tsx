import { formatDuration, withObjectParticle } from '../lib/format'
import './GroupGauge.css'

const HOUR_MS = 60 * 60 * 1000

interface Props {
  totalMs: number
  weeklyGoalHours: number | null
}

// 이번 주 공동 목표 게이지
export default function GroupGauge({ totalMs, weeklyGoalHours }: Props) {
  const goalMs = weeklyGoalHours ? weeklyGoalHours * HOUR_MS : null
  const remainingMs = goalMs === null ? 0 : Math.max(0, goalMs - totalMs)
  const progress = goalMs === null ? 0 : Math.min(100, (totalMs / goalMs) * 100)
  const total = formatDuration(totalMs)
  const particle = withObjectParticle(total).slice(-1)

  return (
    <section className="group-gauge" aria-label="이번 주 공동 목표">
      <p className="group-gauge-sentence">
        {totalMs === 0 ? (
          '이번 주에는 아직 함께 쌓은 시간이 없어요.'
        ) : (
          <>
            이번 주에 함께 <em>{total}</em>
            {particle} 채웠어요.
          </>
        )}
        {goalMs !== null &&
          (remainingMs > 0
            ? ` 목표 ${weeklyGoalHours}시간까지 ${formatDuration(remainingMs)} 남았습니다.`
            : ` 목표 ${weeklyGoalHours}시간을 채웠습니다.`)}
      </p>
      {goalMs !== null && (
        <div className="group-gauge-bar" role="img" aria-label={`${weeklyGoalHours}시간 중 ${total}`}>
          <div style={{ width: `${progress}%` }} />
        </div>
      )}
      <p className="group-gauge-reset">월요일 오전 5시에 다시 시작</p>
    </section>
  )
}
