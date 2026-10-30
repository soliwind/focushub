import type { UserSettings } from '../lib/userProfile'
import './TimerSettings.css'

export type TimerSettingsValue = UserSettings

interface Props {
  value: TimerSettingsValue
  onChange: (value: TimerSettingsValue) => void
}

export default function TimerSettings({ value, onChange }: Props) {
  return (
    <footer className="timer-settings">
      <div className="timer-settings-inner">
        <div className="timer-settings-threshold">
          <label htmlFor="threshold">오래 쉬면 자동 저장</label>
          <input
            type="range"
            id="threshold"
            min={10}
            max={120}
            step={5}
            value={value.longPauseMinutes}
            onChange={(e) => onChange({ ...value, longPauseMinutes: Number(e.target.value) })}
          />
          <span className="timer-settings-minutes">{value.longPauseMinutes}분</span>
        </div>
        <div className="timer-settings-check">
          <input
            type="checkbox"
            id="notify"
            checked={value.notifyOnLeave}
            onChange={(e) => onChange({ ...value, notifyOnLeave: e.target.checked })}
          />
          <label htmlFor="notify">탭을 떠나면 알림</label>
        </div>
        <div className="timer-settings-check">
          <input
            type="checkbox"
            id="share"
            checked={value.shareToGroups}
            onChange={(e) => onChange({ ...value, shareToGroups: e.target.checked })}
          />
          <label htmlFor="share">그룹에 기록 공유</label>
        </div>
        <span className="timer-settings-note">다른 탭으로 가면 일시정지합니다. 다른 탭의 내용은 보지 않습니다.</span>
      </div>
    </footer>
  )
}
