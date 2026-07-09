import Icon from '../components/Icons'

// 첫 방문 시 보여주는 메인(온보딩) 페이지.
// 앱의 성격 — 감시 도구가 아니라 각자의 기록과 선택적 공유 — 를 먼저 알린다.
export default function Landing({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-body">
        <span className="landing-mark">
          <Icon name="heart" size={30} strokeWidth={1.5} />
        </span>
        <h1 className="landing-title">마음결</h1>
        <p className="landing-tag">
          각자 쓰고, 필요한 만큼만 나누는
          <br />
          관계 조율 노트
        </p>

        <ul className="landing-points">
          <li>
            <span className="point-icon">
              <Icon name="lock" size={19} />
            </span>
            <div>
              <strong>기본 비공개</strong>
              <small>내 감정 기록은 나만 볼 수 있어요. 상대에게 자동으로 공개되지 않아요.</small>
            </div>
          </li>
          <li>
            <span className="point-icon">
              <Icon name="share" size={19} />
            </span>
            <div>
              <strong>선택 공유</strong>
              <small>공유할 항목은 내가 고르고, 상대에게 보일 모습을 미리 확인해요.</small>
            </div>
          </li>
          <li>
            <span className="point-icon">
              <Icon name="handshake" size={19} />
            </span>
            <div>
              <strong>함께 조율</strong>
              <small>잘잘못을 가리는 대신, 반복되는 패턴을 보고 작은 약속을 만들어요.</small>
            </div>
          </li>
        </ul>
      </div>

      <div className="landing-foot">
        <button className="btn-primary" onClick={onStart}>
          시작하기
        </button>
        <p className="landing-note">가입 없이 시작해요. 모든 기록은 이 기기 안에만 저장됩니다.</p>
      </div>
    </div>
  )
}
