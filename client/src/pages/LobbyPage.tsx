import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createRoom, getMyRooms, getMySessions, joinRoom } from '../lib/rooms'
import { formatDuration } from '../lib/format'
import { segmentColor } from '../lib/colors'
import Header from '../components/Header'
import type { Room } from '../types'

function LobbyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [rooms, setRooms] = useState<Room[]>([])
  const [totalStudied, setTotalStudied] = useState(0)
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [goalHours, setGoalHours] = useState(8)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const [myRooms, sessions] = await Promise.all([
        getMyRooms(user.id),
        getMySessions(user.id),
      ])
      setRooms(myRooms)
      setTotalStudied(sessions.reduce((sum, s) => sum + s.seconds, 0))
      setLoading(false)
    }

    load()
  }, [user])

  const handleCreate = async () => {
    if (!user) return
    setError('')
    try {
      const room = await createRoom(roomName, goalHours, user)
      navigate(`/room/${room.code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '스터디룸을 만들지 못했습니다.')
    }
  }

  const handleJoin = async () => {
    if (!user) return
    setError('')
    try {
      const room = await joinRoom(joinCode, user)
      navigate(`/room/${room.code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '참가하지 못했습니다.')
    }
  }

  return (
    <>
      <Header />
      <main className="page">
        <section className="stat">
          <span className="stat-label">지금까지 채운 시간</span>
          <strong className="stat-value">{formatDuration(totalStudied)}</strong>
        </section>

        <section className="block">
          <div className="block-head">
            <h3>스터디룸</h3>
            <button className="text-btn" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? '접기' : '새로 만들기'}
            </button>
          </div>

          {showCreate && (
            <div className="form">
              <label className="label" htmlFor="room-name">이름</label>
              <input
                id="room-name"
                className="input"
                placeholder="예) 새벽 기상 모임"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />

              <label className="label" htmlFor="goal">하루 목표 시간</label>
              <input
                id="goal"
                className="input"
                type="number"
                min={1}
                max={100}
                value={goalHours}
                onChange={(e) => setGoalHours(Number(e.target.value))}
              />

              <button className="btn solid" onClick={handleCreate}>
                만들기
              </button>
            </div>
          )}

          <div className="join">
            <input
              className="input code-input"
              placeholder="참가 코드"
              value={joinCode}
              maxLength={5}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button className="btn line" onClick={handleJoin}>
              참가
            </button>
          </div>
        </section>

        {error && <p className="error">{error}</p>}

        {loading && <p className="soft">불러오는 중</p>}

        {!loading && rooms.length === 0 && (
          <div className="empty">
            참여 중인 스터디룸이 없습니다.
            <br />
            코드를 입력하거나 새로 만들어 시작하세요.
          </div>
        )}

        <ul className="room-list">
          {rooms.map((room) => {
            const members = Object.values(room.members).sort(
              (a, b) => b.totalSeconds - a.totalSeconds,
            )
            const total = members.reduce((sum, m) => sum + m.totalSeconds, 0)
            const goal = room.goalHours * 3600
            const percent = Math.min(Math.round((total / goal) * 100), 100)

            return (
              <li key={room.code}>
                <button className="room" onClick={() => navigate(`/room/${room.code}`)}>
                  <span className="room-top">
                    <strong>{room.name}</strong>
                    <span className="code">{room.code}</span>
                  </span>

                  <span className="stack">
                    {members.map((member, index) => (
                      <span
                        key={member.userId}
                        style={{
                          width: `${Math.min((member.totalSeconds / goal) * 100, 100)}%`,
                          background: segmentColor(index),
                        }}
                      />
                    ))}
                  </span>

                  <span className="room-bot">
                    <span>{members.length}명 참여</span>
                    <span>{percent}% 달성</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </main>
    </>
  )
}

export default LobbyPage
