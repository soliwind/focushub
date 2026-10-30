import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/authContext'
import { DEFAULT_SETTINGS, saveSettings, subscribeSettings, type UserSettings } from '../lib/userProfile'

const SAVE_DELAY_MS = 500 // 슬라이더를 끄는 동안 매번 저장하지 않고, 멈춘 뒤 한 번만 저장한다

// 내 설정을 Firestore에서 읽고, 바꾸면 저장한다. 개발 모드에서는 화면에서만 바뀐다.
export function useUserSettings(): [UserSettings, (next: UserSettings) => void] {
  const { user, isDevUser } = useAuth()
  const uid = user && !isDevUser ? user.uid : null
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const saveTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!uid) return
    return subscribeSettings(uid, setSettings)
  }, [uid])

  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  const update = (next: UserSettings) => {
    setSettings(next)
    if (!uid) return
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveSettings(uid, next).catch((error) => console.error('설정을 저장하지 못했어요.', error))
    }, SAVE_DELAY_MS)
  }

  return [settings, update]
}
