import { formatDuration } from '../lib/format'
import { segmentColor } from '../lib/colors'
import type { RoomMember } from '../types'

const STATUS_LABEL: Record<string, string> = {
  studying: '공부 중',
  resting: '쉬는 중',
  away: '자리 비움',
}

interface Props {
  /** 기여도 내림차순으로 정렬된 참여자 목록입니다. */
  members: RoomMember[]
  myId?: string
}

function ParticipantList({ members, myId }: Props) {
  return (
    <section className="block">
      <div className="block-head">
        <h3>참여자</h3>
        <span className="soft">{members.length}명</span>
      </div>

      <ul className="people">
        {members.map((member, index) => (
          <li className="person" key={member.userId}>
            <span className="chip" style={{ background: segmentColor(index) }} />
            <span className="nm">{member.nickname}</span>
            {member.userId === myId && <span className="tag">나</span>}
            <span className="st">{STATUS_LABEL[member.status]}</span>
            <span className="tm">{formatDuration(member.totalSeconds)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ParticipantList
