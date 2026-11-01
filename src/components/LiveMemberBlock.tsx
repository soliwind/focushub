import { formatClock } from '../lib/format'
import type { Presence } from '../lib/groupStore'
import Avatar from './Avatar'
import './LiveGroups.css'

const STATE_TEXT: Record<Presence['state'], string> = {
  studying: '공부 중',
  paused: '쉬는 중',
  off: '오프라인',
}

interface Props {
  name: string
  photo?: string
  state: Presence['state']
  studyMs: number
}

// 공부하는 동안 보는 작은 구성원 블록: 사진, 이름, 상태, 지금 세션 시간
export default function LiveMemberBlock({ name, photo, state, studyMs }: Props) {
  return (
    <div className="live-block" data-state={state}>
      <Avatar name={name} photo={photo} size={32} />
      <div className="live-block-text">
        <span className="live-block-name">{name}</span>
        <span className="live-block-state">
          <span className="live-block-dot" aria-hidden="true" />
          {STATE_TEXT[state]}
        </span>
      </div>
      <span className="live-block-time">{state === 'off' ? '–' : formatClock(studyMs)}</span>
    </div>
  )
}
