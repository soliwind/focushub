import { useEffect, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { db } from '../lib/firebase'
import { subscribeMyGroups, type Group } from '../lib/groupStore'

// 내가 구성원인 그룹 목록. 승인되거나 탈퇴하면 바로 바뀐다.
export function useMyGroups(): { groups: Group[]; loading: boolean; failed: boolean } {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const [result, setResult] = useState<{ uid: string; groups: Group[]; failed: boolean } | null>(null)

  useEffect(() => {
    if (!db || !uid) return
    return subscribeMyGroups(
      uid,
      (groups) => setResult({ uid, groups, failed: false }),
      (error) => {
        console.error('그룹을 불러오지 못했어요.', error)
        setResult({ uid, groups: [], failed: true })
      },
    )
  }, [uid])

  if (!db) return { groups: [], loading: false, failed: false }
  const current = result?.uid === uid ? result : null
  return { groups: current?.groups ?? [], loading: current === null, failed: current?.failed ?? false }
}
