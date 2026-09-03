interface Props {
  size?: number
}

/** 끊긴 원호 세 개가 참여자를, 가운데 점이 공동의 목표를 뜻합니다. */
function Logo({ size = 22 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="#CAD2C5" strokeWidth="3.4" />
      <path d="M16 3a13 13 0 0 1 11.26 6.5" stroke="#84A98C" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M27.26 22.5A13 13 0 0 1 16 29" stroke="#52796F" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3.6" fill="#354F52" />
    </svg>
  )
}

export default Logo
