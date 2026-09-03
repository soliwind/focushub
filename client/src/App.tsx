import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import LobbyPage from './pages/LobbyPage'
import RoomPage from './pages/RoomPage'
import TimerPage from './pages/TimerPage'

/** 로그인하지 않은 사용자를 로그인 화면으로 돌려보냅니다. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="page center">불러오는 중...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <LobbyPage />
          </RequireAuth>
        }
      />
      <Route
        path="/room/:code"
        element={
          <RequireAuth>
            <RoomPage />
          </RequireAuth>
        }
      />
      <Route
        path="/room/:code/timer"
        element={
          <RequireAuth>
            <TimerPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
