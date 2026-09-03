import { formatDuration } from '../lib/format'
import { segmentColor } from '../lib/colors'
import type { RoomMember } from '../types'

interface Props {
  /** 기여도 내림차순으로 정렬된 참여자 목록입니다. */
  members: RoomMember[]
  goalHours: number
}

const RADIUS = 80
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 3

function Gauge({ members, goalHours }: Props) {
  const goalSeconds = goalHours * 3600
  const totalSeconds = members.reduce((sum, m) => sum + m.totalSeconds, 0)
  const progress = Math.min(totalSeconds / goalSeconds, 1)

  // 각 참여자의 시간을 원 둘레 위의 구간으로 바꿉니다.
  let cursor = 0
  const segments = members.map((member, index) => {
    const ratio = Math.min(member.totalSeconds / goalSeconds, 1 - cursor)
    const start = cursor
    cursor += Math.max(ratio, 0)

    return {
      key: member.userId,
      color: segmentColor(index),
      length: Math.max(ratio * CIRCUMFERENCE - GAP, 0),
      rotation: -90 + start * 360,
    }
  })

  return (
    <div className="gauge">
      <svg width="196" height="196" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#E4E9E1" strokeWidth="13" />

        {segments.map((segment) =>
          segment.length > 0 ? (
            <circle
              key={segment.key}
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
              transform={`rotate(${segment.rotation} 100 100)`}
              style={{ transition: 'stroke-dasharray 0.4s ease, transform 0.4s ease' }}
            />
          ) : null,
        )}

        <text className="ring-value" x="100" y="98" textAnchor="middle">
          {Math.round(progress * 100)}%
        </text>
        <text className="ring-sub" x="100" y="118" textAnchor="middle">
          {formatDuration(totalSeconds)} / {goalHours}시간
        </text>
      </svg>

      <p className="ring-caption">
        {members.length}명이 함께 채우고 있습니다
      </p>
    </div>
  )
}

export default Gauge
