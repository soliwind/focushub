import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getRoom, leaveRoom, tickDemoMembers } from '../lib/rooms'
import { formatDuration } from '../lib/format'
import Header from '../components/Header'
import Gauge from '../components/Gauge'
import ParticipantList from '../components/ParticipantList'
import type { Room } from '../types'

/** 데모 참여자가 1초마다 늘리는 공부 시간입니다. 시연할 때 조절하세요. */
const DEMO_SECONDS_PER_TICK = 30

function RoomPage() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const refresh = useCallback(async () => {
    if (!code) return
    setRoom(await getRoom(code))
    setLoading(false)
  }, [code])

  useEffect(() => {
    refresh()
  }, [refresh])

  // 다른 참여자가 공부하고 있는 상황을 흉내 냅니다.
  useEffect(() => {
    if (!code) return
    const timer = setInterval(() => {
      tickDemoMembers(code, DEMO_SECONDS_PER_TICK)
      getRoom(code).then(setRoom)
    }, 1000)
    return () => clearInterval(timer)
  }, [code])

  const handleCopy = () => {
    navigator.clipboard.writeText(code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleLeave = async () => {
    if (!code || !user) return
    if (!confirm('이 스터디룸에서 나가시겠습니까?')) return
    await leaveRoom(code, user.id)
    navigate('/')
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="page">
          <p className="soft">불러오는 중</p>
        </main>
      </>
    )
  }

  if (!room) {
    return (
      <>
        <Header />
        <main className="page">
          <div className="empty">
            해당 코드의 스터디룸이 없습니다.
            <br />
            코드를 다시 확인해주세요.
          </div>
          <button className="btn line" onClick={() => navigate('/')}>
            목록으로
          </button>
        </main>
      </>
    )
  }

  const members = Object.values(room.members).sort((a, b) => b.totalSeconds - a.totalSeconds)
  const totalSeconds = members.reduce((sum, m) => sum + m.totalSeconds, 0)
  const me = user ? room.members[user.id] : undefined
  const myShare = totalSeconds > 0 && me ? Math.round((me.totalSeconds / totalSeconds) * 100) : 0

  return (
    <>
      <Header />
      <main className="page">
        <section className="room-head">
          <h2>{room.name}</h2>
          <button className="code clickable" onClick={handleCopy}>
            {copied ? '복사됨' : room.code}
          </button>
        </section>

        <Gauge members={members} goalHours={room.goalHours} />

        <section className="pair">
          <div>
            <span className="k">내가 채운 시간</span>
            <strong className="v">{formatDuration(me?.totalSeconds ?? 0)}</strong>
          </div>
          <div>
            <span className="k">전체 중 비중</span>
            <strong className="v">{myShare}%</strong>
          </div>
        </section>

        <button className="btn solid" onClick={() => navigate(`/room/${room.code}/timer`)}>
          공부 시작하기
        </button>

        <ParticipantList members={members} myId={user?.id} />

        <button className="text-btn center" onClick={handleLeave}>
          스터디룸 나가기
        </button>
      </main>
    </>
  )
}

export default RoomPage
