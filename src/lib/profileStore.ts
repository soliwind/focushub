// 프로필(사진, 소개 메시지). 그룹 구성원 상자와 상세 화면에서 쓴다.
// 사진은 브라우저에서 작게 줄여 Firestore 문서에 글자 형태(data URL)로 저장한다.
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface Profile {
  photo: string // 없으면 빈 문자열
  bio: string
}

export const EMPTY_PROFILE: Profile = { photo: '', bio: '' }
export const BIO_MAX_LENGTH = 60
const PHOTO_SIZE = 160 // 큰 화면에서도 선명하도록 표시 크기의 2배로 저장한다

export async function getProfile(uid: string): Promise<Profile> {
  if (!db) return EMPTY_PROFILE
  const snapshot = await getDoc(doc(db, 'profiles', uid))
  return { ...EMPTY_PROFILE, ...snapshot.data() }
}

export function subscribeProfile(uid: string, onChange: (profile: Profile) => void) {
  if (!db) return () => {}
  return onSnapshot(
    doc(db, 'profiles', uid),
    (snapshot) => onChange({ ...EMPTY_PROFILE, ...snapshot.data() }),
    (error) => console.error('프로필을 불러오지 못했어요.', error),
  )
}

export async function saveProfile(uid: string, profile: Profile): Promise<void> {
  if (!db) throw new Error('Firestore가 설정되지 않았습니다.')
  await setDoc(doc(db, 'profiles', uid), profile)
}

// 사진 가운데를 정사각형으로 잘라 작은 JPEG로 만든다.
export async function resizePhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = PHOTO_SIZE
    canvas.height = PHOTO_SIZE
    canvas
      .getContext('2d')!
      .drawImage(
        image,
        (image.naturalWidth - side) / 2,
        (image.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        PHOTO_SIZE,
        PHOTO_SIZE,
      )
    return canvas.toDataURL('image/jpeg', 0.8)
  } finally {
    URL.revokeObjectURL(url)
  }
}
