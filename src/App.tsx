import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import GuestOnly from './components/GuestOnly'
import Header from './components/Header'
import RequireAuth from './components/RequireAuth'
import TimerSessionProvider from './components/TimerSessionProvider'
import { AuthProvider } from './lib/auth'
import { useAuth } from './lib/authContext'
import AccountPage from './pages/AccountPage'
import GroupPage from './pages/GroupPage'
import GroupRoomPage from './pages/GroupRoomPage'
import JoinPage from './pages/JoinPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import MemberPage from './pages/MemberPage'
import NewGroupPage from './pages/NewGroupPage'
import RecordsPage from './pages/RecordsPage'
import SignupPage from './pages/SignupPage'
import TimerPage from './pages/TimerPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  // 로그인 여부를 확인하는 아주 짧은 동안은 아무것도 그리지 않는다. (랜딩이 깜빡 보이는 것을 막는다)
  if (loading) return null

  const routes = (
    <>
      <Header />
      {/* 주소에 따라 아래 화면 중 하나만 보여 준다 */}
      <Routes>
        <Route path="/" element={user ? <TimerPage /> : <LandingPage />} />
        <Route
          path="/records"
          element={
            <RequireAuth>
              <RecordsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/group"
          element={
            <RequireAuth>
              <GroupPage />
            </RequireAuth>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route
          path="/group/new"
          element={
            <RequireAuth>
              <NewGroupPage />
            </RequireAuth>
          }
        />
        <Route
          path="/group/:groupId"
          element={
            <RequireAuth>
              <GroupRoomPage />
            </RequireAuth>
          }
        />
        <Route
          path="/group/:groupId/members/:uid"
          element={
            <RequireAuth>
              <MemberPage />
            </RequireAuth>
          }
        />
        <Route
          path="/join/:groupId"
          element={
            <RequireAuth>
              <JoinPage />
            </RequireAuth>
          }
        />
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <SignupPage />
            </GuestOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )

  // 로그인했으면 메뉴를 옮겨도 타이머가 이어지도록 세션을 화면들 바깥에서 관리한다.
  return user ? (
    <TimerSessionProvider key={user.uid} uid={user.uid}>
      {routes}
    </TimerSessionProvider>
  ) : (
    routes
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
