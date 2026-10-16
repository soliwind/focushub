import './TimerSettings.css'

export interface TimerSettingsValue {
  longAwayMinutes: number // 장기 이탈 기준 (10~120분)
  notifyOnLeave: boolean
  shareToGroups: boolean
}

interface Props {
  value: TimerSettingsValue
  onChange: (value: TimerSettingsValue) => void
}

export default function TimerSettings({ value, onChange }: Props) {
  return (
    <footer className="timer-settings">
      <div className="timer-settings-inner">
        <div className="timer-settings-threshold">
          <label htmlFor="threshold">장시간 자리 비움</label>
          <input
            type="range"
            id="threshold"
            min={10}
            max={120}
            step={5}
            value={value.longAwayMinutes}
            onChange={(e) => onChange({ ...value, longAwayMinutes: Number(e.target.value) })}
          />
          <span className="timer-settings-minutes">{value.longAwayMinutes}분</span>
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
        <span className="timer-settings-note">자리 비움은 탭이 가려졌는지만 보는 참고 기록입니다.</span>
      </div>
    </footer>
  )
}
