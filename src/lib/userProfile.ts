import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

// users/{uid}.settings (docs/data-model.md)
export interface UserSettings {
  longPauseMinutes: number // 이 시간 넘게 쉬면 자동 저장 (10~120분)
  notifyOnLeave: boolean // 탭을 떠나 일시정지됐을 때 탭 제목을 바꿀지
  shareToGroups: boolean // 마친 세션을 그룹에 공유할지 (새 세션의 기본값)
}

export const DEFAULT_SETTINGS: UserSettings = {
  longPauseMinutes: 30,
  notifyOnLeave: true,
  shareToGroups: true,
}

function requireDb() {
  if (!db) throw new Error('Firestore가 설정되지 않았습니다.')
  return db
}

// 로그인할 때마다 부른다. 문서가 없으면 만들고, 있으면 마지막 로그인 시각만 바꾼다.
// 이름은 비어 있지 않을 때만 쓴다. (가입 직후에는 이름이 잠깐 비어 있다가 채워진다)
export async function ensureUserProfile(user: { uid: string; displayName: string; email: string }) {
  const ref = doc(requireDb(), 'users', user.uid)
  const snapshot = await getDoc(ref)
  const name = user.displayName ? { displayName: user.displayName } : {}

  if (!snapshot.exists()) {
    await setDoc(
      ref,
      {
        ...name,
        email: user.email,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        settings: DEFAULT_SETTINGS,
      },
      { merge: true },
    )
  } else {
    await updateDoc(ref, { ...name, lastLoginAt: serverTimestamp() })
  }
}

export async function saveDisplayName(uid: string, displayName: string) {
  await setDoc(doc(requireDb(), 'users', uid), { displayName }, { merge: true })
}

// 설정이 바뀔 때마다 알려 준다. 문서나 일부 값이 없으면 기본값으로 채운다.
export function subscribeSettings(uid: string, onChange: (settings: UserSettings) => void) {
  return onSnapshot(doc(requireDb(), 'users', uid), (snapshot) => {
    onChange({ ...DEFAULT_SETTINGS, ...(snapshot.data()?.settings ?? {}) })
  })
}

export async function saveSettings(uid: string, settings: UserSettings) {
  await setDoc(doc(requireDb(), 'users', uid), { settings }, { merge: true })
}
