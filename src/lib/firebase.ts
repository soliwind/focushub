import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// Firebase 설정 값은 .env.local에서 읽는다. (VITE_로 시작해야 브라우저 코드에서 읽을 수 있다.)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// .env.local을 아직 만들지 않았으면 false. 화면에서 안내 문구를 보여 줄 때 쓴다.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

// npm run dev인데 설정 값이 없으면, Firebase 대신 개발용 사용자와 예시 데이터로 화면을 본다.
// (import.meta.env.DEV는 npm run dev일 때만 true다. 배포용 빌드에서는 항상 false.)
export const isDevWithoutFirebase = import.meta.env.DEV && !isFirebaseConfigured

// 설정 값이 없으면 Firebase를 켜지 않는다. (켜면 바로 오류가 나서 화면 전체가 멈춘다.)
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null

export const auth: Auth | null = app ? getAuth(app) : null
export const db: Firestore | null = app ? getFirestore(app) : null
