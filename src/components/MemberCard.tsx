import { Link } from 'react-router-dom'
import { weekdayName } from '../lib/dates'
import { formatDuration } from '../lib/format'
import Avatar from './Avatar'
import './MemberCard.css'

interface Props {
  to: string
  name: string
  photo?: string
  isMe: boolean
  todayMs: number
  weekDays: string[] // 이번 주 월~일 dayKey
  studiedDays: Set<string>
  todayKey: string
}

// 구성원 상자. 오늘 공부했으면 하늘색 그라데이션으로 눈에 띄게 한다. 순위는 매기지 않는다.
export default function MemberCard({ to, name, photo, isMe, todayMs, weekDays, studiedDays, todayKey }: Props) {
  return (
    <Link to={to} className="member-card" data-studied={todayMs > 0}>
      <div className="member-card-top">
        <Avatar name={name} photo={photo} size={72} />
        <div className="member-card-name">
          {name}
          {isMe && <span className="member-card-me">나</span>}
        </div>
      </div>
      <div className="member-card-label">오늘 공부</div>
      <div className="member-card-time" data-empty={todayMs === 0}>
        {todayMs > 0 ? formatDuration(todayMs) : '아직 기록 없음'}
      </div>
      <div className="member-card-week">
        {weekDays.map((day) => (
          <span key={day} className="member-card-day" data-today={day === todayKey}>
            <span className="member-card-dot" data-studied={studiedDays.has(day)} />
            {weekdayName(day)}
          </span>
        ))}
      </div>
    </Link>
  )
}
