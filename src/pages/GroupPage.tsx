import { useState } from 'react'
import { Link } from 'react-router-dom'
import GroupRoomCard from '../components/GroupRoomCard'
import { useMyGroups } from '../hooks/useMyGroups'
import { useAuth } from '../lib/authContext'
import { getDayKey, getWeekKey } from '../lib/dates'
import { db } from '../lib/firebase'
import './GroupPage.css'

// 스터디그룹 첫 화면: 내가 들어간 방 목록
export default function GroupPage() {
  const { user } = useAuth()
  const { groups, loading, failed } = useMyGroups()
  const [weekKey] = useState(() => getWeekKey(getDayKey(Date.now())))

  if (!user) return null
  if (!db) {
    return (
      <main className="page">
        <h1 className="page-title">스터디그룹</h1>
        <p className="page-note">스터디그룹은 Firebase를 연결하면 쓸 수 있어요.</p>
      </main>
    )
  }
  if (loading) return <main className="page" />

  const sorted = [...groups].sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  return (
    <main className="page">
      <div className="group-list-head">
        <h1 className="page-title">스터디그룹</h1>
        <Link to="/group/new" className="btn btn-secondary group-new-button btn-link">
          새 그룹 만들기
        </Link>
      </div>

      {sorted.length > 0 ? (
        <div className="group-room-grid">
          {sorted.map((group) => (
            <GroupRoomCard key={group.id} group={group} isOwner={group.ownerUid === user.uid} weekKey={weekKey} />
          ))}
        </div>
      ) : (
        <p className="page-note">
          {failed
            ? '그룹을 불러오지 못했어요. 잠시 후 다시 열어 주세요.'
            : '아직 가입한 그룹이 없어요. 그룹을 만들거나, 받은 초대 링크를 열어 함께 공부해 보세요.'}
        </p>
      )}
    </main>
  )
}
