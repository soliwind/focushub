import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import FirebaseSetupNotice from '../components/FirebaseSetupNotice'
import { useAuth } from '../lib/authContext'
import { getAuthErrorMessage } from '../lib/authErrors'
import './AuthPage.css'

export default function SignupPage() {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.')
      return
    }
    setSubmitting(true)
    try {
      // 가입되면 바로 로그인 상태가 되고, GuestOnly가 타이머 화면으로 보낸다.
      await signUp(name.trim(), email.trim(), password)
    } catch (err) {
      setError(getAuthErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <div className="auth">
        <h1 className="auth-title">회원가입</h1>
        <FirebaseSetupNotice />
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            이름
            <input
              className="auth-input"
              autoComplete="name"
              required
              maxLength={20}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <span className="auth-hint">스터디그룹 구성원에게 이 이름으로 보여요.</span>
          </label>
          <label className="auth-field">
            이메일
            <input
              className="auth-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="auth-field">
            비밀번호
            <input
              className="auth-input"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="auth-hint">6자 이상</span>
          </label>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? '가입하는 중' : '가입하기'}
          </button>
        </form>
        <p className="auth-switch">
          이미 가입했다면 <Link to="/login">로그인</Link>
        </p>
      </div>
    </main>
  )
}
