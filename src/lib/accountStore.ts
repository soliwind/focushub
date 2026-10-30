import { Timestamp, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { AppUser } from './authContext'
import { db } from './firebase'

// 계정·기록 삭제 요청. 문서 ID가 내 uid라서 요청은 사용자당 하나만 생긴다.
// 실제 삭제는 관리자가 Firebase 콘솔에서 직접 처리하고 status를 "done"으로 바꾼다.
export interface DeletionRequest {
  status: 'pending' | 'done'
  requestedAt: number
}

export async function getDeletionRequest(uid: string): Promise<DeletionRequest | null> {
  if (!db) return null
  const snapshot = await getDoc(doc(db, 'deletionRequests', uid))
  if (!snapshot.exists()) return null
  const requestedAt = snapshot.data().requestedAt
  return {
    status: snapshot.data().status,
    requestedAt: requestedAt instanceof Timestamp ? requestedAt.toMillis() : Date.now(),
  }
}

export async function requestDeletion(user: AppUser): Promise<void> {
  if (!db) throw new Error('Firestore가 설정되지 않았습니다.')
  await setDoc(doc(db, 'deletionRequests', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    status: 'pending',
    requestedAt: serverTimestamp(),
    handledAt: null,
  })
}
