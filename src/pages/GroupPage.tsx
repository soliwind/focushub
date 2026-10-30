import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useParams } from 'react-router-dom'
import GroupWeek from '../components/GroupWeek'
import { useMyGroups } from '../hooks/useMyGroups'
import { useAuth, type AppUser } from '../lib/authContext'
import { addDays, getDayKey, getWeekKey, getWeekStart, listDays } from '../lib/dates'
import { db } from '../lib/firebase'
import { formatDuration } from '../lib/format'
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

const HOUR_MS = 60 * 60 * 1000

export default function GroupPage() {
  const { groupId } = useParams()
  const { user } = useAuth()
  const { groups, loading, failed } = useMyGroups()
  const location = useLocation()
  const message = (location.state as { message?: string } | null)?.message

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
  const selected = sorted.find((g) => g.id === groupId) ?? sorted[0]

  if (!selected) {
    return (
      <main className="page">
        <h1 className="page-title">{failed ? '그룹을 불러오지 못했어요.' : '아직 가입한 그룹이 없어요.'}</h1>
        <p className="page-note">
          {failed ? '잠시 후 다시 열어 주세요.' : '그룹을 만들거나, 받은 초대 링크를 열어 함께 공부해 보세요.'}
        </p>
        <Link to="/group/new" className="btn btn-primary btn-medium btn-link group-empty-action">
          새 그룹 만들기
        </Link>
      </main>
    )
  }

  return (
    <main className="page">
      <nav className="group-tabs" aria-label="내 그룹">
        {sorted.map((g) => (
          <NavLink
            key={g.id}
            to={`/group/${g.id}`}
            className={() => (g.id === selected.id ? 'group-tab active' : 'group-tab')}
            aria-current={g.id === selected.id ? 'true' : undefined}
          >
            {g.name}
          </NavLink>
        ))}
        <Link to="/group/new" className="group-tab group-tab-new">
          새 그룹 만들기
        </Link>
      </nav>
      {message && <p className="group-message">{message}</p>}
      <GroupDetail key={selected.id} group={selected} user={user} />
    </main>
  )
}

function GroupDetail({ group, user }: { group: Group; user: AppUser }) {
  const isOwner = group.ownerUid === user.uid
  const [todayKey] = useState(() => getDayKey(Date.now()))
  const weekStart = getWeekStart(todayKey)
  const weekKey = getWeekKey(todayKey)

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

  const totalMs = contributions.reduce((sum, c) => sum + c.studyMs, 0)
  const goalMs = group.weeklyGoalHours ? group.weeklyGoalHours * HOUR_MS : null
  const remainingMs = goalMs === null ? 0 : Math.max(0, goalMs - totalMs)
  const progress = goalMs === null ? 0 : Math.min(100, (totalMs / goalMs) * 100)
  const activeCount = group.memberUids.length

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
          {activeCount}명 · {group.joinMode === 'open' ? '바로 가입' : '승인 후 가입'}
          {isOwner && ' · 내가 운영 중'}
        </p>
        <button className="btn btn-secondary group-invite" onClick={copyInvite}>
          {copied ? '복사했어요' : '초대 링크 복사'}
        </button>
      </div>
      {group.description && <p className="group-description">{group.description}</p>}
      {error && (
        <p className="auth-error group-error" role="alert">
          {error}
        </p>
      )}

      <section className="group-goal" aria-label="이번 주 공동 목표">
        <p className="group-goal-sentence">
          {totalMs === 0 ? (
            '이번 주에는 아직 함께 쌓은 시간이 없어요.'
          ) : (
            <>
              이번 주에 함께 <em>{formatDuration(totalMs)}</em>
              {formatDuration(totalMs).endsWith('초') ? '를' : '을'} 채웠어요.
            </>
          )}
          {goalMs !== null &&
            (remainingMs > 0
              ? ` 목표 ${group.weeklyGoalHours}시간까지 ${formatDuration(remainingMs)} 남았습니다.`
              : ` 목표 ${group.weeklyGoalHours}시간을 채웠습니다.`)}
        </p>
        {goalMs !== null && (
          <div
            className="group-goal-bar"
            role="img"
            aria-label={`${group.weeklyGoalHours}시간 중 ${formatDuration(totalMs)}`}
          >
            <div style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="group-goal-foot">
          <span>
            기록된 시간 {formatDuration(totalMs)}
          </span>
          <span className="group-goal-reset">월요일 오전 5시에 다시 시작</span>
        </div>
      </section>

      <div className="group-columns">
        <GroupWeek
          days={listDays(weekStart, addDays(weekStart, 6))}
          todayKey={todayKey}
          members={members}
          contributions={contributions}
          myUid={user.uid}
        />

        <aside className="group-side">
          {isOwner && requests.length > 0 && (
            <section aria-label="가입 요청">
              <h2 className="group-side-heading">가입 요청 {requests.length}건</h2>
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
            <section aria-label="그룹 탈퇴">
              <h2 className="group-side-heading">내 가입 상태</h2>
              <p className="group-leave-note">
                {confirmingLeave
                  ? '탈퇴하면 이 그룹을 볼 수 없고, 앞으로 마친 세션도 더해지지 않아요.'
                  : '가입 중이에요.'}
              </p>
              {confirmingLeave ? (
                <div className="group-leave-actions">
                  <button className="group-leave" onClick={() => run(() => leaveGroup(group.id, user.uid))}>
                    탈퇴하기
                  </button>
                  <button className="group-leave" onClick={() => setConfirmingLeave(false)}>
                    취소
                  </button>
                </div>
              ) : (
                <button className="group-leave" onClick={() => setConfirmingLeave(true)}>
                  그룹 탈퇴
                </button>
              )}
            </section>
          )}
        </aside>
      </div>
    </>
  )
}
