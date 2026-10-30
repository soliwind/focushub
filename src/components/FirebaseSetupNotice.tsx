import { isDevWithoutFirebase, isFirebaseConfigured } from '../lib/firebase'

// .env.local이 없을 때만 보이는 개발용 안내
export default function FirebaseSetupNotice() {
  if (isFirebaseConfigured) return null
  if (isDevWithoutFirebase) {
    return (
      <p className="auth-hint" style={{ marginBottom: 24 }}>
        개발 모드: Firebase 설정이 없어서 어떤 값을 넣어도 개발용 사용자로 들어가요.
      </p>
    )
  }
  return (
    <p className="auth-error" role="alert" style={{ marginBottom: 24 }}>
      Firebase 설정이 아직 없어요. .env.example을 복사해 .env.local을 만들고 값을 채운 뒤 npm run dev를 다시 실행해
      주세요.
    </p>
  )
}
