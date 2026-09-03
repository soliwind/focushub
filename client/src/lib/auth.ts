import { KEYS, createId, delay, read, write } from './storage'
import type { PublicUser, User } from '../types'

function loadUsers(): Record<string, User> {
  return read<Record<string, User>>(KEYS.users, {})
}

function toPublic(user: User): PublicUser {
  const { password: _password, ...rest } = user
  return rest
}

export async function signUp(
  username: string,
  password: string,
  nickname: string,
): Promise<PublicUser> {
  const users = loadUsers()

  const duplicated = Object.values(users).some((u) => u.username === username)
  if (duplicated) {
    throw new Error('이미 사용 중인 아이디입니다.')
  }
  if (username.trim().length < 3) {
    throw new Error('아이디는 3자 이상이어야 합니다.')
  }
  if (password.length < 4) {
    throw new Error('비밀번호는 4자 이상이어야 합니다.')
  }
  if (!nickname.trim()) {
    throw new Error('닉네임을 입력해주세요.')
  }

  const user: User = {
    id: createId('u'),
    username: username.trim(),
    nickname: nickname.trim(),
    password,
    createdAt: Date.now(),
  }

  users[user.id] = user
  write(KEYS.users, users)
  write(KEYS.currentUser, user.id)

  return delay(toPublic(user))
}

export async function signIn(username: string, password: string): Promise<PublicUser> {
  const users = loadUsers()
  const found = Object.values(users).find((u) => u.username === username.trim())

  if (!found || found.password !== password) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
  }

  write(KEYS.currentUser, found.id)
  return delay(toPublic(found))
}

export function signOut(): void {
  localStorage.removeItem(KEYS.currentUser)
}

/** 새로고침해도 로그인이 유지되도록 현재 사용자를 읽어옵니다. */
export function getCurrentUser(): PublicUser | null {
  const id = read<string | null>(KEYS.currentUser, null)
  if (!id) return null

  const users = loadUsers()
  const user = users[id]
  return user ? toPublic(user) : null
}

export async function updateNickname(userId: string, nickname: string): Promise<PublicUser> {
  const users = loadUsers()
  const user = users[userId]
  if (!user) throw new Error('사용자를 찾을 수 없습니다.')

  user.nickname = nickname.trim()
  write(KEYS.users, users)
  return delay(toPublic(user))
}
