import { useEffect, useMemo, useState } from 'react'
import { subscribeProfile, type Profile } from '../lib/profileStore'

// 여러 사람의 프로필을 구독한다. 아직 못 읽었으면 목록에 없다.
export function useProfiles(uids: string[]): Record<string, Profile> {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const key = [...uids].sort().join(',')
  const uidList = useMemo(() => (key ? key.split(',') : []), [key])

  useEffect(() => {
    const stops = uidList.map((uid) =>
      subscribeProfile(uid, (profile) => setProfiles((prev) => ({ ...prev, [uid]: profile }))),
    )
    return () => stops.forEach((stop) => stop())
  }, [uidList])

  return profiles
}
