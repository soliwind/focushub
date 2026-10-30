import { weekdayName } from '../lib/dates'
import { formatDuration, formatHourMinute } from '../lib/format'
import type { Contribution, GroupMember } from '../lib/groupStore'
import './GroupWeek.css'

interface Props {
  days: string[] // 이번 주 월~일 dayKey
  todayKey: string
  members: GroupMember[]
  contributions: Contribution[]
  myUid: string
}

// 구성원의 이번 주. 순위를 매기지 않고 이름순으로 보여 준다.
export default function GroupWeek({ days, todayKey, members, contributions, myUid }: Props) {
  const rows = members
    .filter((m) => m.status === 'active')
    .map((member) => {
      const mine = contributions.filter((c) => c.uid === member.uid)
      return {
        ...member,
        label: member.uid === myUid ? '나' : member.displayName,
        studiedDays: new Set(mine.filter((c) => c.studyMs > 0).map((c) => c.dayKey)),
        totalMs: mine.reduce((sum, c) => sum + c.studyMs, 0),
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'ko'))

  return (
    <section className="group-week" aria-label="구성원의 이번 주">
      <div className="group-week-heading">
        <h2>구성원의 이번 주</h2>
        <span>이름순</span>
      </div>
      <div className="group-week-row group-week-head">
        <span />
        {days.map((day) => (
          <span key={day} className="group-week-day" data-today={day === todayKey}>
            {weekdayName(day)}
          </span>
        ))}
        <span className="group-week-total">시간</span>
      </div>
      {rows.map((row) => (
        <div key={row.uid} className="group-week-row group-week-member">
          <span className="group-week-name" data-me={row.uid === myUid}>
            {row.label}
          </span>
          {days.map((day) => {
            const studied = row.studiedDays.has(day)
            return (
              <span key={day} className="group-week-cell">
                <span
                  className="group-week-dot"
                  data-studied={studied}
                  data-today={day === todayKey}
                  title={`${weekdayName(day)} · ${studied ? '공부함' : '쉼'}`}
                />
              </span>
            )
          })}
          <span className="group-week-total" title={formatDuration(row.totalMs)}>
            {formatHourMinute(row.totalMs)}
          </span>
        </div>
      ))}
      <div className="group-week-legend">
        <span>
          <span className="group-week-swatch" aria-hidden="true" />
          공부한 날
        </span>
        <span>
          <span className="group-week-swatch" data-today="true" aria-hidden="true" />
          오늘 공부함
        </span>
      </div>
    </section>
  )
}
