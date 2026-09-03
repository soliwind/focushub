import { KEYS, createId, delay, read, write } from './storage'
import type { MemberStatus, PublicUser, Room, RoomMember, StudySession } from '../types'

function loadRooms(): Record<string, Room> {
  return read<Record<string, Room>>(KEYS.rooms, {})
}

function saveRooms(rooms: Record<string, Room>): void {
  write(KEYS.rooms, rooms)
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // 헷갈리는 글자(O, 0, I, 1)는 제외했습니다.
  let code = ''
  for (let i = 0; i < 5; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * 혼자서는 협업 게이지가 의미를 갖기 어렵기 때문에,
 * 방을 만들 때 예시 참여자를 함께 넣어둡니다.
 * 실제 다중 접속을 붙이면 이 함수는 제거하면 됩니다.
 */
function createDemoMembers(): Record<string, RoomMember> {
  const names = ['민지', '태호', '지수']
  const members: Record<string, RoomMember> = {}

  names.forEach((nickname, index) => {
    const id = `demo_${index}`
    members[id] = {
      userId: id,
      nickname,
      status: index === 1 ? 'away' : 'studying',
      totalSeconds: 1800 + Math.floor(Math.random() * 5400),
      joinedAt: Date.now(),
      isDemo: true,
    }
  })

  return members
}

function toMember(user: PublicUser): RoomMember {
  return {
    userId: user.id,
    nickname: user.nickname,
    status: 'resting',
    totalSeconds: 0,
    joinedAt: Date.now(),
  }
}

export async function createRoom(
  name: string,
  goalHours: number,
  owner: PublicUser,
): Promise<Room> {
  if (!name.trim()) throw new Error('방 이름을 입력해주세요.')
  if (goalHours < 1) throw new Error('목표 시간은 1시간 이상이어야 합니다.')

  const rooms = loadRooms()

  let code = generateCode()
  while (rooms[code]) code = generateCode()

  const room: Room = {
    code,
    name: name.trim(),
    goalHours,
    ownerId: owner.id,
    createdAt: Date.now(),
    members: {
      ...createDemoMembers(),
      [owner.id]: toMember(owner),
    },
  }

  rooms[code] = room
  saveRooms(rooms)
  return delay(room)
}

export async function getRoom(code: string): Promise<Room | null> {
  const rooms = loadRooms()
  return delay(rooms[code.toUpperCase()] ?? null)
}

export async function joinRoom(code: string, user: PublicUser): Promise<Room> {
  const rooms = loadRooms()
  const room = rooms[code.trim().toUpperCase()]

  if (!room) throw new Error('존재하지 않는 방 코드입니다.')

  if (!room.members[user.id]) {
    room.members[user.id] = toMember(user)
    saveRooms(rooms)
  }

  return delay(room)
}

export async function leaveRoom(code: string, userId: string): Promise<void> {
  const rooms = loadRooms()
  const room = rooms[code]
  if (!room) return

  delete room.members[userId]

  // 실제 참여자가 아무도 남지 않으면 방을 정리합니다.
  const realMembers = Object.values(room.members).filter((m) => !m.isDemo)
  if (realMembers.length === 0) {
    delete rooms[code]
  }

  saveRooms(rooms)
  await delay(null)
}

export async function getMyRooms(userId: string): Promise<Room[]> {
  const rooms = loadRooms()
  const mine = Object.values(rooms)
    .filter((room) => Boolean(room.members[userId]))
    .sort((a, b) => b.createdAt - a.createdAt)

  return delay(mine)
}

export async function setMemberStatus(
  code: string,
  userId: string,
  status: MemberStatus,
): Promise<void> {
  const rooms = loadRooms()
  const member = rooms[code]?.members[userId]
  if (!member) return

  member.status = status
  saveRooms(rooms)
}

export async function addStudyTime(
  code: string,
  userId: string,
  seconds: number,
): Promise<void> {
  const rooms = loadRooms()
  const member = rooms[code]?.members[userId]
  if (!member) return

  member.totalSeconds += seconds
  member.status = 'resting'
  saveRooms(rooms)
  await delay(null)
}

/** 데모용으로 다른 참여자들의 시간을 조금씩 늘립니다. */
export function tickDemoMembers(code: string, secondsPerTick: number): void {
  const rooms = loadRooms()
  const room = rooms[code]
  if (!room) return

  Object.values(room.members).forEach((member) => {
    if (member.isDemo && member.status === 'studying') {
      member.totalSeconds += secondsPerTick
    }
  })

  saveRooms(rooms)
}

export async function saveSession(session: Omit<StudySession, 'id'>): Promise<void> {
  const sessions = read<StudySession[]>(KEYS.sessions, [])
  sessions.push({ ...session, id: createId('s') })
  write(KEYS.sessions, sessions)
  await delay(null)
}

export async function getMySessions(userId: string): Promise<StudySession[]> {
  const sessions = read<StudySession[]>(KEYS.sessions, [])
  return delay(sessions.filter((s) => s.userId === userId).sort((a, b) => b.endedAt - a.endedAt))
}
