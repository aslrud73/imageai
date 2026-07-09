import Icon from '../components/Icons'
import { clearData, loadData } from '../store'

export default function Settings({ data, setData }) {
  return (
    <div className="page">
      <header className="page-head">
        <h1>설정</h1>
      </header>

      <div className="setting-card">
        <h3>
          <Icon name="heart" size={16} /> 마음결은
        </h3>
        <p>
          함께 쓰는 싸움 기록장이 아니라, <strong>각자 쓰고 필요한 만큼만 공유하는 관계 조율
          노트</strong>예요. 기록의 목적은 잘잘못을 가리는 것이 아니라, 반복되는 패턴을 확인하고 다음
          대화를 준비하는 것입니다.
        </p>
      </div>

      <div className="setting-card">
        <h3>
          <Icon name="lock" size={16} /> 데이터 보관
        </h3>
        <p>
          지금 버전의 모든 기록은 <strong>이 기기 안에만</strong> 저장돼요. 서버로 전송되지 않으며,
          앱 데이터를 지우면 복구할 수 없어요.
        </p>
      </div>

      <div className="setting-card">
        <h3>
          <Icon name="share" size={16} /> 커플 연결
        </h3>
        <p>
          각자의 계정을 연결코드로 잇고, 선택 공유한 내용만 함께 보는 기능은 다음 버전에서 제공될
          예정이에요. 지금은 내 기록과 공유 연습에 집중해 보세요.
        </p>
      </div>

      <div className="setting-card warn">
        <h3>
          <Icon name="alert" size={16} /> 안전 안내
        </h3>
        <p>
          이 앱은 부부상담, 정신건강 진단, 법률 판단, 긴급 구조 서비스를 대체하지 않습니다. 폭력,
          협박, 감금, 반복적인 공포감이 있는 경우에는 앱 기록보다 안전 확보와 전문기관의 도움 요청이
          우선입니다.
        </p>
      </div>

      <button
        className="danger-btn"
        onClick={() => {
          if (confirm('모든 기록과 약속을 삭제할까요? 되돌릴 수 없어요.')) {
            clearData()
            setData(loadData())
          }
        }}
      >
        <Icon name="trash" size={15} /> 모든 데이터 삭제
      </button>

      <p className="version-line">마음결 v0.1 — 로컬 프로토타입 · 기록 {data.logs.length}건</p>
    </div>
  )
}
