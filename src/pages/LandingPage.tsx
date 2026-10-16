import { Link } from 'react-router-dom'
import './LandingPage.css'

// 로그인하지 않은 사용자가 처음 보는 소개 화면
const FEATURES = [
  {
    title: '다른 탭으로 가면 일시정지',
    body: '탭이 가려졌는지만 봅니다. 다른 탭의 내용이나 키 입력은 보지 않아요.',
  },
  {
    title: '쉬기 전으로 돌아오는 한 줄',
    body: '다시 시작할 때 이어서 할 일을 한 줄 적어 두면, 흐름을 다시 잡기 쉬워요.',
  },
  {
    title: '하루는 오전 5시에 시작',
    body: '자정을 넘겨 이어진 공부도 시작한 날의 기록으로 남아요.',
  },
  {
    title: '스터디그룹에 함께 더해지는 시간',
    body: '마친 세션은 가입한 그룹에 자동으로 더해져요. 순위는 매기지 않고, 함께 쌓은 시간을 보여 줘요.',
  },
]

export default function LandingPage() {
  return (
    <main className="page landing">
      <h1 className="landing-title">공부한 시간만 정직하게 쌓이는 타이머</h1>
      <p className="landing-lead">
        공부할 내용을 적고 시작하세요. 다른 탭으로 가면 알아서 멈추고, 쌓인 시간은 하루·주 단위 기록과 스터디그룹에
        함께 남아요.
      </p>
      <div className="landing-actions">
        <Link to="/signup" className="btn btn-primary btn-large btn-link">
          회원가입
        </Link>
        <Link to="/login" className="btn btn-secondary btn-large btn-link">
          로그인
        </Link>
      </div>

      <section className="landing-features" aria-label="FocusHub의 특징">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="landing-feature">
            <h2 className="landing-feature-title">{feature.title}</h2>
            <p className="landing-feature-body">{feature.body}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
