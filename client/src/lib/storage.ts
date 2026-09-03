/**
 * localStorage를 임시 데이터베이스로 사용하는 계층입니다.
 * 나중에 Firebase로 교체할 때 이 파일과 auth.ts, rooms.ts만 바꾸면 됩니다.
 */

const NETWORK_DELAY = 120 // 실제 서버 통신처럼 보이도록 약간의 지연을 줍니다.

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

/** 비동기 함수 형태를 유지하기 위한 지연 처리입니다. */
export function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY))
}

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export const KEYS = {
  users: 'focushub:users',
  currentUser: 'focushub:currentUserId',
  rooms: 'focushub:rooms',
  sessions: 'focushub:sessions',
}
