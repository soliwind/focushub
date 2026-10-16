const pad = (n: number) => String(n).padStart(2, '0')

// 큰 타이머 숫자: 00:47:12
export function formatClock(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

// 문장 속 시간: 30초, 47분, 1시간 5분
export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${totalSec}초`
  const totalMin = Math.round(totalSec / 60)
  if (totalMin < 60) return `${totalMin}분`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m ? `${h}시간 ${m}분` : `${h}시간`
}

// formatDuration 뒤에 붙는 조사: "47분을", "30초를"
export function withObjectParticle(text: string): string {
  return text.endsWith('초') ? `${text}를` : `${text}을`
}

// 세션 기록 옆 시각: 14:02
export function formatTimeOfDay(at: number): string {
  const d = new Date(at)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 10월 16일 금요일
export function formatDateLong(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`
}
