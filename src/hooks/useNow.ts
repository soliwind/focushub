import { useEffect, useState } from 'react'

// 화면을 다시 그리기 위해 "지금 시각"만 주기적으로 갱신한다.
// 시간 계산은 events에 저장된 시각으로 하므로, 이 간격이 늦어져도 시간이 틀어지지 않는다.
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])

  return now
}
