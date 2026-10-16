import { NavLink } from 'react-router-dom'
import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">FocusHub</div>
      <nav className="header-nav" aria-label="주요 메뉴">
        {/* NavLink는 현재 주소와 같으면 active 클래스와 aria-current를 자동으로 붙여 준다 */}
        <NavLink to="/" end>
          타이머
        </NavLink>
        <NavLink to="/records">기록</NavLink>
        <NavLink to="/group">스터디그룹</NavLink>
      </nav>
    </header>
  )
}
