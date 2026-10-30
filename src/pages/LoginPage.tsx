import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FirebaseSetupNotice from '../components/FirebaseSetupNotice'
import { useAuth } from '../lib/authContext'
import { getAuthErrorMessage } from '../lib/authErrors'
import './AuthPage.css'

export default function LoginPage() {
  const { logIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      // 로그인되면 GuestOnly가 원래 가려던 화면으로 보낸다.
      await logIn(email.trim(), password)
    } catch (err) {
      setError(getAuthErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <div className="auth">
        <h1 className="auth-title">로그인</h1>
        <FirebaseSetupNotice />
        <form className="auth-form" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? '로그인하는 중' : '로그인'}
          </button>
        </form>
        <p className="auth-switch">
          처음이라면 <Link to="/signup" state={location.state}>
            회원가입
          </Link>
        </p>
      </div>
    </main>
  )
}
