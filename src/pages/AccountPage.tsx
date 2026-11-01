import { useEffect, useState } from 'react'
import ProfileEditor from '../components/ProfileEditor'
import { useAuth } from '../lib/authContext'
import { getDeletionRequest, requestDeletion, type DeletionRequest } from '../lib/accountStore'
import { formatDateLong } from '../lib/format'
import './AccountPage.css'

export default function AccountPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const [loaded, setLoaded] = useState(false)
  const [request, setRequest] = useState<DeletionRequest | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getDeletionRequest(uid)
      .then((next) => {
        if (!cancelled) setRequest(next)
      })
      .catch((err) => {
        console.error('삭제 요청을 불러오지 못했어요.', err)
        if (!cancelled) setError('요청 상태를 불러오지 못했어요. 잠시 후 다시 열어 주세요.')
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  if (!user || !loaded) return <main className="page" />

  const handleRequest = async () => {
    setError('')
    setSubmitting(true)
    try {
      await requestDeletion(user)
      setRequest(await getDeletionRequest(user.uid))
      setConfirming(false)
    } catch (err) {
      console.error('삭제 요청 실패', err)
      setError('요청이 접수되지 않았어요. 잠시 후 다시 시도해 주세요.')
    }
    setSubmitting(false)
  }

  return (
    <main className="page">
      <h1 className="page-title">계정</h1>

      <dl className="account-info">
        <dt>이름</dt>
        <dd>{user.displayName || '이름 없음'}</dd>
        <dt>이메일</dt>
        <dd>{user.email}</dd>
      </dl>

      <ProfileEditor uid={user.uid} name={user.displayName || user.email} />

      <section className="account-delete" aria-label="계정과 기록 삭제">
        <h2>계정과 기록 삭제</h2>
        {request ? (
          <>
            <p>
              {formatDateLong(new Date(request.requestedAt))}에 요청을 접수했어요.{' '}
              {request.status === 'done' ? '처리를 마쳤습니다.' : '관리자가 확인한 뒤 삭제합니다.'}
            </p>
            <p className="account-status">처리 상태: {request.status === 'done' ? '처리 완료' : '처리 대기'}</p>
          </>
        ) : (
          <>
            <p>내 계정과 공부 기록, 그룹에 더해진 내 시간을 삭제하도록 요청합니다. 다른 사람의 기록은 요청할 수 없어요.</p>
            {confirming ? (
              <>
                <p className="account-warning">삭제가 처리되면 기록을 되돌릴 수 없어요. 요청할까요?</p>
                <div className="account-actions">
                  <button className="btn btn-primary btn-medium" onClick={handleRequest} disabled={submitting}>
                    {submitting ? '요청하는 중' : '삭제 요청'}
                  </button>
                  <button className="btn btn-secondary btn-medium" onClick={() => setConfirming(false)} disabled={submitting}>
                    취소
                  </button>
                </div>
              </>
            ) : (
              <button className="btn btn-secondary btn-medium" onClick={() => setConfirming(true)}>
                삭제 요청하기
              </button>
            )}
          </>
        )}
        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  )
}
