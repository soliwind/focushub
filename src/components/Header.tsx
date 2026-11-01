import { useContext } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { TimerSessionContext } from '../hooks/timerSessionContext'
import { useAuth } from '../lib/authContext'
import './Header.css'

export default function Header() {
  const { user, isDevUser, logOut } = useAuth()
  const session = useContext(TimerSessionContext)
  // 공부 중이거나 일시정지 중이면 타이머 말고 다른 기능은 쓸 수 없다.
  const locked = session?.timer.status === 'running' || session?.timer.status === 'paused'

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        FocusHub
      </Link>
      {user && (
        <>
          <nav className="header-nav" aria-label="주요 메뉴">
            {/* NavLink는 현재 주소와 같으면 active 클래스와 aria-current를 자동으로 붙여 준다 */}
            <NavLink to="/" end>
              타이머
            </NavLink>
            {locked ? (
              <>
                <span className="header-disabled" aria-disabled="true">
                  기록
                </span>
                <span className="header-disabled" aria-disabled="true">
                  스터디그룹
                </span>
              </>
            ) : (
              <>
                <NavLink to="/records">기록</NavLink>
                <NavLink to="/group">스터디그룹</NavLink>
              </>
            )}
          </nav>
          <div className="header-user">
            {isDevUser && <span className="header-dev">개발 모드 · 예시 데이터</span>}
            {locked ? (
              <span className="header-disabled">{user.displayName || user.email}</span>
            ) : (
              <Link to="/account" className="header-account">
                {user.displayName || user.email}
              </Link>
            )}
            <button type="button" className="header-logout" onClick={logOut} disabled={locked}>
              로그아웃
            </button>
          </div>
        </>
      )}
    </header>
  )
}
