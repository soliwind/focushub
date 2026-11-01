import { useEffect, useState, type ChangeEvent } from 'react'
import { BIO_MAX_LENGTH, getProfile, resizePhoto, saveProfile } from '../lib/profileStore'
import Avatar from './Avatar'
import './ProfileEditor.css'

interface Props {
  uid: string
  name: string
}

// 프로필 사진과 소개 메시지 편집. 같은 그룹 구성원에게 보인다.
export default function ProfileEditor({ uid, name }: Props) {
  const [photo, setPhoto] = useState('')
  const [bio, setBio] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProfile(uid)
      .then((profile) => {
        if (cancelled) return
        setPhoto(profile.photo)
        setBio(profile.bio)
      })
      .catch((error) => console.error('프로필을 불러오지 못했어요.', error))
    return () => {
      cancelled = true
    }
  }, [uid])

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 사진을 다시 골라도 동작하게 한다
    if (!file) return
    setNotice('')
    try {
      setPhoto(await resizePhoto(file))
    } catch (error) {
      console.error('사진을 읽지 못했어요.', error)
      setNotice('이 사진은 읽지 못했어요. 다른 사진을 골라 주세요.')
    }
  }

  const handleSave = async () => {
    setNotice('')
    setSaving(true)
    try {
      await saveProfile(uid, { photo, bio: bio.trim() })
      setNotice('저장했어요.')
    } catch (error) {
      console.error('프로필 저장 실패', error)
      setNotice('저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
    setSaving(false)
  }

  return (
    <section className="profile-editor" aria-label="프로필">
      <h2>프로필</h2>
      <div className="profile-editor-photo">
        <Avatar name={name} photo={photo} size={88} />
        <div className="profile-editor-photo-actions">
          <label className="btn btn-secondary btn-medium profile-editor-file">
            사진 고르기
            <input type="file" accept="image/*" className="visually-hidden" onChange={handleFile} />
          </label>
          {photo && (
            <button type="button" className="profile-editor-remove" onClick={() => setPhoto('')}>
              사진 지우기
            </button>
          )}
        </div>
      </div>
      <label className="profile-editor-bio">
        소개 메시지
        <input
          value={bio}
          maxLength={BIO_MAX_LENGTH}
          autoComplete="off"
          placeholder="한 줄로 나를 소개해 주세요"
          onChange={(e) => setBio(e.target.value)}
        />
      </label>
      <p className="profile-editor-hint">같은 그룹 구성원에게 보여요.</p>
      <div className="profile-editor-save">
        <button type="button" className="btn btn-primary btn-medium" onClick={handleSave} disabled={saving}>
          {saving ? '저장하는 중' : '프로필 저장'}
        </button>
        {notice && <span role="status">{notice}</span>}
      </div>
    </section>
  )
}
