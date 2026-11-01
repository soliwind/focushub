import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import StudyCalendar from '../components/StudyCalendar'
import { useMyGroups } from '../hooks/useMyGroups'
import { useProfiles } from '../hooks/useProfiles'
import { useAuth } from '../lib/authContext'
import { getDayKey, getWeekKey } from '../lib/dates'
import { formatDuration } from '../lib/format'
import {
  subscribeMemberContributions,
  subscribeMembers,
  type GroupMember,
  type MemberContribution,
} from '../lib/groupStore'
import { getStreakDays } from '../lib/stats'
import './GroupPage.css'

// 구성원 상세: 소개 메시지, 총 공부 시간, 학습 달력. 이 그룹에 공유한 시간만 보여 준다.
export default function MemberPage() {
  const { groupId = '', uid = '' } = useParams()
  const { user } = useAuth()
  const { groups, loading } = useMyGroups()
  const [todayKey] = useState(() => getDayKey(Date.now()))
  const [members, setMembers] = useState<GroupMember[] | null>(null)
  const [contributions, setContributions] = useState<MemberContribution[]>([])
  const isMyGroup = groups.some((g) => g.id === groupId)

  useEffect(() => {
    if (!isMyGroup) return
    return subscribeMembers(groupId, setMembers)
  }, [groupId, isMyGroup])
  useEffect(() => {
    if (!isMyGroup) return
    return subscribeMemberContributions(groupId, uid, setContributions)
  }, [groupId, uid, isMyGroup])

  const profile = useProfiles(useMemo(() => [uid], [uid]))[uid]

  const totals = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of contributions) map.set(c.dayKey, (map.get(c.dayKey) ?? 0) + c.studyMs)
    return map
  }, [contributions])

  if (!user || loading) return <main className="page" />
  if (!isMyGroup) return <Navigate to="/group" replace />
  if (members === null) return <main className="page" />

  const member = members.find((m) => m.uid === uid && m.status === 'active')
  if (!member) return <Navigate to={`/group/${groupId}`} replace />

  const weekKey = getWeekKey(todayKey)
  const totalMs = contributions.reduce((sum, c) => sum + c.studyMs, 0)
  const weekMs = contributions.filter((c) => c.weekKey === weekKey).reduce((sum, c) => sum + c.studyMs, 0)
  const studyDays = [...totals.values()].filter((ms) => ms > 0).length
  const streak = getStreakDays(totals, todayKey)

  return (
    <main className="page">
      <Link to={`/group/${groupId}`} className="group-back">
        ‹ 그룹으로
      </Link>

      <div className="member-head">
        <Avatar name={member.displayName} photo={profile?.photo} size={96} />
        <div className="member-head-text">
          <h1 className="group-title">{member.displayName}</h1>
          <p className="member-bio">{profile?.bio || '아직 소개 메시지가 없어요.'}</p>
        </div>
      </div>

      <dl className="member-stats">
        <div>
          <dt>총 공부 시간</dt>
          <dd>{totalMs > 0 ? formatDuration(totalMs) : '0분'}</dd>
        </div>
        <div>
          <dt>이번 주</dt>
          <dd>{weekMs > 0 ? formatDuration(weekMs) : '0분'}</dd>
        </div>
        <div>
          <dt>공부한 날</dt>
          <dd>{studyDays}일</dd>
        </div>
        <div>
          <dt>연속 공부</dt>
          <dd>{streak}일째</dd>
        </div>
      </dl>
      <p className="member-note">이 그룹에 공유한 기록만 보여요.</p>

      <section className="member-calendar" aria-label="학습 달력">
        <h2 className="group-section-heading">학습 달력</h2>
        <StudyCalendar totals={totals} todayKey={todayKey} />
      </section>
    </main>
  )
}
