export type MemberStatus = 'studying' | 'resting' | 'away'

export interface User {
  id: string
  username: string
  nickname: string
  password: string // 데모용 저장 방식입니다. 실제 서비스에서는 절대 이렇게 두면 안 됩니다.
  createdAt: number
}

/** 화면에 넘길 때 비밀번호를 제거한 형태입니다. */
export type PublicUser = Omit<User, 'password'>

export interface RoomMember {
  userId: string
  nickname: string
  status: MemberStatus
  totalSeconds: number
  joinedAt: number
  isDemo?: boolean
}

export interface Room {
  code: string
  name: string
  goalHours: number
  ownerId: string
  createdAt: number
  members: Record<string, RoomMember>
}

export interface StudySession {
  id: string
  userId: string
  roomCode: string
  seconds: number
  awayCount: number
  endedAt: number
}
