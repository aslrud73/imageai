import Icon from '../components/Icons'
import { weekKey, fmtDate, daysAgo } from '../store'

export default function Home({ data, onRecord, goTab }) {
  const today = new Date()
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일 ${'일월화수목금토'[today.getDay()]}요일`

  // 하루가 지났는데 회고가 없는 기록
  const pendingReflections = data.logs.filter((l) => !l.reflection && daysAgo(l.createdAt) >= 1)
  const wk = weekKey()
  const checkedCount = data.agreements.filter((a) => a.checks?.includes(wk)).length

  return (
    <div className="page">
      <header className="page-head">
        <p className="date-line">{dateStr}</p>
        <h1>오늘도 내 마음부터<br />살펴요.</h1>
      </header>

      <button className="record-cta" onClick={onRecord}>
        <span className="cta-icon">
          <Icon name="pen" size={22} />
        </span>
        <span className="cta-text">
          <strong>30초 기록 시작하기</strong>
          <small>판단하지 않고, 내 느낌만 짧게</small>
        </span>
        <Icon name="chevronRight" size={18} className="cta-arrow" />
      </button>

      <p className="privacy-note">
        <Icon name="lock" size={14} /> 기록은 기본 비공개예요. 공유는 내가 선택할 때만 이루어져요.
      </p>

      {pendingReflections.length > 0 && (
        <section className="section">
          <h2 className="section-title">
            <Icon name="moon" size={16} /> 회고를 기다리는 기록
          </h2>
          {pendingReflections.slice(0, 2).map((l) => (
            <button key={l.id} className="list-card" onClick={() => goTab('logs')}>
              <div>
                <strong>{fmtDate(l.createdAt)}의 기록</strong>
                <small>{l.topics.join(' · ') || '주제 없음'}</small>
              </div>
              <span className="pill">회고 쓰기</span>
            </button>
          ))}
          <p className="section-hint">하루가 지난 뒤, 그때 정말 바랐던 것을 돌아봐요.</p>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">
          <Icon name="handshake" size={16} /> 이번 주 우리 약속
        </h2>
        {data.agreements.length === 0 ? (
          <button className="empty-card" onClick={() => goTab('agreements')}>
            아직 함께 정한 약속이 없어요. <span className="link">첫 약속 만들기</span>
          </button>
        ) : (
          <>
            <div className="progress-card">
              <div className="progress-num">
                <strong>{checkedCount}</strong>
                <span> / {data.agreements.length}개 실천 중</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${data.agreements.length ? (checkedCount / data.agreements.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            {data.agreements.slice(0, 2).map((a) => (
              <button key={a.id} className="list-card" onClick={() => goTab('agreements')}>
                <div>
                  <strong>{a.title}</strong>
                  {a.note && <small>{a.note}</small>}
                </div>
                {a.checks?.includes(wk) ? (
                  <span className="pill done">
                    <Icon name="check" size={12} /> 실천
                  </span>
                ) : (
                  <span className="pill">체크하기</span>
                )}
              </button>
            ))}
          </>
        )}
      </section>
    </div>
  )
}
