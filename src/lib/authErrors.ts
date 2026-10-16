// Firebase 오류 코드를 사용자에게 보여 줄 한국어 문장으로 바꾼다.
export function getAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return '이메일 또는 비밀번호가 맞지 않아요.'
    case 'auth/email-already-in-use':
      return '이미 가입한 이메일이에요. 로그인해 주세요.'
    case 'auth/invalid-email':
      return '이메일 형식을 확인해 주세요.'
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 해요.'
    case 'auth/too-many-requests':
      return '시도가 너무 많았어요. 잠시 후 다시 해 주세요.'
    case 'auth/network-request-failed':
      return '인터넷 연결을 확인해 주세요.'
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Firebase 콘솔에서 이메일/비밀번호 로그인이 켜져 있는지 확인해 주세요.'
    case 'app/not-configured':
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return '.env.local의 Firebase 설정 값을 확인해 주세요.'
    default:
      return '처리하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
