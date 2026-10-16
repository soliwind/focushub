import { isFirebaseConfigured } from '../lib/firebase'

// .env.local이 없을 때만 보이는 개발용 안내
export default function FirebaseSetupNotice() {
  if (isFirebaseConfigured) return null
  return (
    <p className="auth-error" role="alert" style={{ marginBottom: 24 }}>
      Firebase 설정이 아직 없어요. .env.example을 복사해 .env.local을 만들고 값을 채운 뒤 npm run dev를 다시 실행해
      주세요.
    </p>
  )
}
