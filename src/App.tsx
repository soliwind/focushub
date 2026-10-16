import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import TimerPage from './pages/TimerPage'
import RecordsPage from './pages/RecordsPage'
import GroupPage from './pages/GroupPage'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      {/* 주소에 따라 아래 화면 중 하나만 보여 준다 */}
      <Routes>
        <Route path="/" element={<TimerPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/group" element={<GroupPage />} />
      </Routes>
    </BrowserRouter>
  )
}
