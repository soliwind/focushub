import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDuration } from '../lib/format'
import { subscribeWeekContributions, type Contribution, type Group } from '../lib/groupStore'

const HOUR_MS = 60 * 60 * 1000

interface Props {
  group: Group
  isOwner: boolean
  weekKey: string
}

// 방 목록의 상자 하나. 이번 주 함께 쌓은 시간과 목표 진행을 보여 준다.
export default function GroupRoomCard({ group, isOwner, weekKey }: Props) {
  const [contributions, setContributions] = useState<Contribution[]>([])

  useEffect(() => subscribeWeekContributions(group.id, weekKey, setContributions), [group.id, weekKey])

  const totalMs = contributions.reduce((sum, c) => sum + c.studyMs, 0)
  const goalMs = group.weeklyGoalHours ? group.weeklyGoalHours * HOUR_MS : null

  return (
    <Link to={`/group/${group.id}`} className="group-room-card">
      <h2>{group.name}</h2>
      {group.description && <p className="group-room-description">{group.description}</p>}
      <p className="group-room-meta">
        {group.memberUids.length}명{isOwner && ' · 내가 운영 중'}
      </p>
      <p className="group-room-time">이번 주 {totalMs > 0 ? formatDuration(totalMs) : '기록 없음'}</p>
      {goalMs !== null && (
        <div className="group-room-bar" aria-hidden="true">
          <div style={{ width: `${Math.min(100, (totalMs / goalMs) * 100)}%` }} />
        </div>
      )}
    </Link>
  )
}
