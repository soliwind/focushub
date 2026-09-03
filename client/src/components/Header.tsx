import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'

function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="app-bar">
      <button className="wordmark" onClick={() => navigate('/')}>
        <Logo size={21} />
        FocusHub
      </button>

      <div className="app-bar-right">
        <span className="soft">{user?.nickname}</span>
        <button className="text-btn" onClick={signOut}>
          로그아웃
        </button>
      </div>
    </header>
  )
}

export default Header
