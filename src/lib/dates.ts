// 날짜 규칙: 하루는 오전 5시에 시작하고, 한 주는 월요일 오전 5시에 시작한다.
// dayKey는 "2026-10-16"처럼 쓰고, weekKey는 "2026-W42"처럼 쓴다 (ISO 주 번호, 월요일 시작).
import { getStudyDate } from './timer'

const pad = (n: number) => String(n).padStart(2, '0')

function toKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// 어떤 시각이 속한 "공부한 날"
export function getDayKey(at: number): string {
  return toKey(getStudyDate(at))
}

// dayKey를 Date로 (그날 정오. 시간대 계산 중 날짜가 밀리지 않게 정오를 쓴다)
export function parseDayKey(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function addDays(dayKey: string, days: number): string {
  const date = parseDayKey(dayKey)
  date.setDate(date.getDate() + days)
  return toKey(date)
}

// 0 = 월요일 … 6 = 일요일
export function getWeekdayIndex(dayKey: string): number {
  return (parseDayKey(dayKey).getDay() + 6) % 7
}

// 그 주의 월요일
export function getWeekStart(dayKey: string): string {
  return addDays(dayKey, -getWeekdayIndex(dayKey))
}

// ISO 주 번호: 그 주의 목요일이 속한 해와 몇 번째 주인지
export function getWeekKey(dayKey: string): string {
  const thursday = parseDayKey(addDays(getWeekStart(dayKey), 3))
  const year = thursday.getFullYear()
  const firstThursday = parseDayKey(addDays(getWeekStart(`${year}-01-04`), 3))
  const week = Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  return `${year}-W${pad(week)}`
}

// start부터 end까지(둘 다 포함) dayKey 목록
export function listDays(start: string, end: string): string[] {
  const days: string[] = []
  for (let key = start; key <= end; key = addDays(key, 1)) days.push(key)
  return days
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

export function weekdayName(dayKey: string): string {
  return WEEKDAYS[getWeekdayIndex(dayKey)]
}

// "10월 16일"
export function formatMonthDay(dayKey: string): string {
  const date = parseDayKey(dayKey)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}
