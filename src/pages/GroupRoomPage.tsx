import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import GroupGauge from '../components/GroupGauge'
import MemberCard from '../components/MemberCard'
import { useMyGroups } from '../hooks/useMyGroups'
import { useProfiles } from '../hooks/useProfiles'
import { useAuth, type AppUser } from '../lib/authContext'
import { addDays, getDayKey, getWeekKey, getWeekStart, listDays } from '../lib/dates'
import {
  approveRequest,
  inviteLink,
  leaveGroup,
  rejectRequest,
  subscribeMembers,
  subscribePendingRequests,
  subscribeWeekContributions,
  type Contribution,
  type Group,
  type GroupMember,
  type JoinRequest,
} from '../lib/groupStore'
import './AuthPage.css'
import './GroupPage.css'

// 스터디그룹 방: 맨 위에 공동 목표 게이지, 그 아래 구성원 상자
export default function GroupRoomPage() {
  const { groupId } = useParams()
  const { user } = useAuth()
  const { groups, loading } = useMyGroups()
  const location = useLocation()
  const message = (location.state as { message?: string } | null)?.message

  if (!user || loading) return <main className="page" />
  const group = groups.find((g) => g.id === groupId)
  if (!group) return <Navigate to="/group" replace />

  return (
    <main className="page">
      <Link to="/group" className="group-back">
        ‹ 내 그룹
      </Link>
      {message && <p className="group-message">{message}</p>}
      <RoomContent key={group.id} group={group} user={user} />
    </main>
  )
}

function RoomContent({ group, user }: { group: Group; user: AppUser }) {
  const isOwner = group.ownerUid === user.uid
  const [todayKey] = useState(() => getDayKey(Date.now()))
  const weekStart = getWeekStart(todayKey)
  const weekKey = getWeekKey(todayKey)
  const weekDays = listDays(weekStart, addDays(weekStart, 6))

  const [members, setMembers] = useState<GroupMember[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [confirmingLeave, setConfirmingLeave] = useState(false)

  useEffect(() => subscribeMembers(group.id, setMembers), [group.id])
  useEffect(() => subscribeWeekContributions(group.id, weekKey, setContributions), [group.id, weekKey])
  useEffect(() => {
    if (!isOwner) return
    return subscribePendingRequests(group.id, setRequests)
  }, [group.id, isOwner])

  const activeMembers = members
    .filter((m) => m.status === 'active')
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'))
  const profiles = useProfiles(activeMembers.map((m) => m.uid))
  const totalMs = contributions.reduce((sum, c) => sum + c.studyMs, 0)

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(group))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(`복사하지 못했어요. 이 주소를 직접 전해 주세요: ${inviteLink(group)}`)
    }
  }

  const run = async (action: () => Promise<void>) => {
    setError('')
    try {
      await action()
    } catch (err) {
      console.error('그룹 처리 실패', err)
      setError('처리하지 못했어요. 이미 처리된 요청일 수 있어요. 화면을 새로 고쳐 주세요.')
    }
  }

  return (
    <>
      <div className="group-title-row">
        <h1 className="group-title">{group.name}</h1>
        <p className="group-meta">
          {group.memberUids.length}명 · {group.joinMode === 'open' ? '바로 가입' : '승인 후 가입'}
          {isOwner && ' · 내가 운영 중'}
        </p>
        <button className="group-invite" onClick={copyInvite}>
          {copied ? '복사했어요' : '초대 링크 복사'}
        </button>
      </div>
      {group.description && <p className="group-description">{group.description}</p>}
      {error && (
        <p className="auth-error group-error" role="alert">
          {error}
        </p>
      )}

      <GroupGauge totalMs={totalMs} weeklyGoalHours={group.weeklyGoalHours} />

      <section className="group-members" aria-label="구성원">
        <h2 className="group-section-heading">구성원 · 이름순</h2>
        <div className="group-member-grid">
          {activeMembers.map((member) => {
            const mine = contributions.filter((c) => c.uid === member.uid && c.studyMs > 0)
            return (
              <MemberCard
                key={member.uid}
                to={`/group/${group.id}/members/${member.uid}`}
                name={member.displayName}
                photo={profiles[member.uid]?.photo}
                isMe={member.uid === user.uid}
                todayMs={mine.filter((c) => c.dayKey === todayKey).reduce((sum, c) => sum + c.studyMs, 0)}
                weekDays={weekDays}
                studiedDays={new Set(mine.map((c) => c.dayKey))}
                todayKey={todayKey}
              />
            )
          })}
        </div>
      </section>

      {isOwner && requests.length > 0 && (
        <section className="group-requests" aria-label="가입 요청">
          <h2 className="group-section-heading">가입 요청 {requests.length}건</h2>
          {requests.map((request) => (
            <div key={request.uid} className="group-request">
              <span className="group-request-name">{request.displayName}</span>
              <button className="group-request-reject" onClick={() => run(() => rejectRequest(group.id, request.uid))}>
                거절
              </button>
              <button className="group-request-approve" onClick={() => run(() => approveRequest(group.id, request))}>
                승인
              </button>
            </div>
          ))}
        </section>
      )}

      {!isOwner && (
        <section className="group-leave-section" aria-label="그룹 탈퇴">
          {confirmingLeave ? (
            <>
              <p className="group-leave-note">탈퇴하면 이 그룹을 볼 수 없고, 앞으로 마친 세션도 더해지지 않아요.</p>
              <div className="group-leave-actions">
                <button className="group-leave" onClick={() => run(() => leaveGroup(group.id, user.uid))}>
                  탈퇴하기
                </button>
                <button className="group-leave" onClick={() => setConfirmingLeave(false)}>
                  취소
                </button>
              </div>
            </>
          ) : (
            <button className="group-leave" onClick={() => setConfirmingLeave(true)}>
              그룹 탈퇴
            </button>
          )}
        </section>
      )}
    </>
  )
}
