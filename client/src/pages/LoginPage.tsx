import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'

function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(username, password)
      } else {
        await signUp(username, password, nickname)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청을 처리하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
  }

  return (
    <div className="auth-screen">
      <div className="auth">
        <div className="wordmark lg">
          <Logo size={30} />
          FocusHub
        </div>
        <p className="auth-note">
          스터디룸 코드가 있다면 로그인한 뒤 바로 참가할 수 있습니다.
        </p>

        <div className="segmented">
          <button
            className={mode === 'login' ? 'on' : ''}
            onClick={() => setMode('login')}
          >
            로그인
          </button>
          <button
            className={mode === 'signup' ? 'on' : ''}
            onClick={() => setMode('signup')}
          >
            회원가입
          </button>
        </div>

        <input
          className="input"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <input
          className="input"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        {mode === 'signup' && (
          <input
            className="input"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        )}

        {error && <p className="error">{error}</p>}

        <button className="btn solid" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '확인하는 중' : mode === 'login' ? '로그인' : '계정 만들기'}
        </button>

        <button className="text-btn center" onClick={switchMode}>
          {mode === 'login' ? '처음이신가요? 계정 만들기' : '이미 계정이 있다면 로그인'}
        </button>
      </div>
    </div>
  )
}

export default LoginPage
