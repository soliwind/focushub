import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { createGroup, type JoinMode } from '../lib/groupStore'
import './AuthPage.css'
import './GroupPage.css'

export default function NewGroupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joinMode, setJoinMode] = useState<JoinMode>('approval')
  const [goalHours, setGoalHours] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || submitting) return
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('그룹 이름을 적어 주세요.')
      return
    }
    setError('')
    setSubmitting(true) // 버튼을 두 번 눌러도 그룹은 하나만 만들어진다
    try {
      const groupId = await createGroup(
        { uid: user.uid, displayName: user.displayName || user.email },
        {
          name: trimmedName,
          description: description.trim(),
          joinMode,
          weeklyGoalHours: goalHours ? Number(goalHours) : null,
        },
      )
      navigate(`/group/${groupId}`, {
        replace: true,
        state: { message: `'${trimmedName}' 그룹을 만들었어요. 운영자로 등록했습니다.` },
      })
    } catch (err) {
      console.error('그룹을 만들지 못했어요.', err)
      setError('그룹을 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <div className="auth">
        <h1 className="auth-title">새 그룹 만들기</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            그룹 이름
            <input
              className="auth-input"
              required
              maxLength={30}
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="auth-field">
            설명
            <input
              className="auth-input"
              maxLength={80}
              autoComplete="off"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <fieldset className="group-join-mode">
            <legend>가입 방식</legend>
            <label>
              <input
                type="radio"
                name="joinMode"
                checked={joinMode === 'approval'}
                onChange={() => setJoinMode('approval')}
              />
              운영자가 승인한 뒤 가입
            </label>
            <label>
              <input type="radio" name="joinMode" checked={joinMode === 'open'} onChange={() => setJoinMode('open')} />
              초대 링크로 바로 가입
            </label>
          </fieldset>
          <label className="auth-field">
            주간 공동 목표 (시간)
            <input
              className="auth-input"
              type="number"
              min={1}
              max={1000}
              value={goalHours}
              onChange={(e) => setGoalHours(e.target.value)}
            />
            <span className="auth-hint">비워 두면 목표 없이 함께 공부한 시간만 보여 줘요.</span>
          </label>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? '만드는 중' : '만들기'}
          </button>
        </form>
        <p className="auth-switch">
          <Link to="/group">돌아가기</Link>
        </p>
      </div>
    </main>
  )
}
