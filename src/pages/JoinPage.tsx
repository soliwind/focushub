import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { db } from '../lib/firebase'
import { getGroup, getMyJoinRequest, joinOpenGroup, requestToJoin, type Group, type JoinRequest } from '../lib/groupStore'
import './AuthPage.css'
import './GroupPage.css'

// 초대 링크로 들어오는 화면: /join/그룹ID?code=초대코드
export default function JoinPage() {
  const { groupId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') ?? ''
  const { user } = useAuth()
  const uid = user?.uid ?? ''

  const [loaded, setLoaded] = useState(false)
  const [group, setGroup] = useState<Group | null>(null)
  const [request, setRequest] = useState<JoinRequest | null>(null)
  const [done, setDone] = useState<'joined' | 'requested' | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!db || !uid) return
    let cancelled = false
    Promise.all([getGroup(groupId), getMyJoinRequest(groupId, uid)])
      .then(([nextGroup, nextRequest]) => {
        if (cancelled) return
        setGroup(nextGroup)
        setRequest(nextRequest)
      })
      .catch((err) => {
        console.error('그룹을 불러오지 못했어요.', err)
        if (!cancelled) setGroup(null)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [groupId, uid])

  if (!loaded) return <main className="page" />

  const valid = group !== null && group.inviteCode === code
  if (!user || !valid) {
    return (
      <main className="page">
        <div className="auth">
          <h1 className="auth-title">쓸 수 없는 초대 링크예요.</h1>
          <p className="auth-switch">운영자에게 새 링크를 받아 주세요.</p>
        </div>
      </main>
    )
  }

  const member = group.memberUids.includes(user.uid)
  const pending = request?.status === 'pending'
  const person = { uid: user.uid, displayName: user.displayName || user.email }

  const handleJoin = async () => {
    setError('')
    setSubmitting(true)
    try {
      if (group.joinMode === 'open') {
        await joinOpenGroup(group, person, code)
        setDone('joined')
      } else {
        await requestToJoin(group, person, code)
        setDone('requested')
      }
    } catch (err) {
      console.error('가입하지 못했어요.', err)
      setError('처리하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
    setSubmitting(false)
  }

  return (
    <main className="page">
      <div className="auth">
        <h1 className="auth-title">{group.name}</h1>
        {group.description && <p className="group-join-description">{group.description}</p>}
        <p className="auth-hint">
          {group.memberUids.length}명 · {group.joinMode === 'open' ? '바로 가입' : '승인 후 가입'}
        </p>

        {member || done === 'joined' ? (
          <>
            <p className="group-join-result">{done === 'joined' ? '가입했어요. 함께 공부해요.' : '이미 가입한 그룹이에요.'}</p>
            <Link to={`/group/${group.id}`} className="btn btn-primary btn-medium btn-link">
              그룹으로 가기
            </Link>
          </>
        ) : pending || done === 'requested' ? (
          <p className="group-join-result">가입을 요청했어요. 운영자가 승인하면 그룹이 보여요.</p>
        ) : (
          <>
            {request?.status === 'rejected' && <p className="group-join-result">지난 가입 요청은 거절되었어요.</p>}
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary group-join-button" onClick={handleJoin} disabled={submitting}>
              {group.joinMode === 'open' ? '가입하기' : '가입 요청'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
