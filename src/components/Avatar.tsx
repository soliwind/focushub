import './Avatar.css'

interface Props {
  name: string
  photo?: string
  size: number
}

// 프로필 사진. 사진이 없으면 이름 첫 글자를 보여 준다.
export default function Avatar({ name, photo, size }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) }
  if (photo) return <img className="avatar" src={photo} alt="" style={style} />
  return (
    <span className="avatar avatar-initial" style={style} aria-hidden="true">
      {name.trim().charAt(0) || '?'}
    </span>
  )
}
