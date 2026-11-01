import { useEffect, useState } from 'react'
import { useProfiles } from '../hooks/useProfiles'
import { readPresence, subscribeMembers, subscribePresence, type Group, type GroupMember, type Presence } from '../lib/groupStore'
import LiveMemberBlock from './LiveMemberBlock'
import './LiveGroups.css'

interface Props {
  groups: Group[]
  myUid: string
  now: number
}

// 공부하는 동안 메뉴 아래에 뜨는 그룹 탭. 누르면 그 그룹의 지금 상태를 보여 준다.
export default function LiveGroups({ groups, myUid, now }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const sorted = [...groups].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  const selected = sorted.find((g) => g.id === selectedId)

  if (sorted.length === 0) return null

  return (
    <div className="live-groups">
      <nav className="live-tabs" aria-label="공부 중인 그룹">
        {sorted.map((group) => (
          <button
            key={group.id}
            type="button"
            className="live-tab"
            aria-pressed={group.id === selectedId}
            onClick={() => setSelectedId(group.id === selectedId ? null : group.id)}
          >
            {group.name}
          </button>
        ))}
      </nav>
      {selected && <LiveMembers key={selected.id} groupId={selected.id} myUid={myUid} now={now} />}
    </div>
  )
}

function LiveMembers({ groupId, myUid, now }: { groupId: string; myUid: string; now: number }) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [presence, setPresence] = useState<Record<string, Presence>>({})

  useEffect(() => subscribeMembers(groupId, setMembers), [groupId])
  useEffect(() => subscribePresence(groupId, setPresence), [groupId])

  const active = members
    .filter((m) => m.status === 'active')
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'))
  const profiles = useProfiles(active.map((m) => m.uid))

  return (
    <div className="live-list">
      {active.map((member) => {
        const { state, studyMs } = readPresence(presence[member.uid], now)
        return (
          <LiveMemberBlock
            key={member.uid}
            name={member.uid === myUid ? '나' : member.displayName}
            photo={profiles[member.uid]?.photo}
            state={state}
            studyMs={studyMs}
          />
        )
      })}
    </div>
  )
}
