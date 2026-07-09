import Icon from '../components/Icons'
import { timeBucket, todayKey, weekDates } from '../store'

// 우리 패턴: 공유에 동의한 데이터만 사용한다 (기획서 9장).
// 비공개 메모·회고 원문은 절대 집계에 넣지 않는다.
export default function Patterns({ data }) {
  const shared = data.logs.filter((l) => l.share)
  const recent = shared.filter((l) => Date.now() - new Date(l.createdAt).getTime() < 7 * 86400000)

  // 주제 빈도 (공유 동의된 것만)
  const topicCount = {}
  recent.forEach((l) => {
    if (l.share.topics) l.topics.forEach((t) => (topicCount[t] = (topicCount[t] || 0) + 1))
  })
  const topTopics = Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

  // 감정 강도 평균
  const emotions = recent.filter((l) => l.share.emotion).map((l) => l.emotion)
  const avgEmotion = emotions.length
    ? (emotions.reduce((a, b) => a + b, 0) / emotions.length).toFixed(1)
    : null

  // 취약 시간대
  const buckets = {}
  recent.forEach((l) => {
    const b = timeBucket(l.time)
    buckets[b] = (buckets[b] || 0) + 1
  })
  const topBucket = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0]

  // 공유된 요청 문장
  const requests = recent.filter((l) => l.share.request && l.reflection?.request)

  // 약속 실천율: 이번 주 실천한 날 수 ÷ (약속 수 × 이번 주 지나간 날 수)
  const wdates = weekDates()
  const tk = todayKey()
  const elapsed = wdates.filter((d) => d <= tk).length
  const weekChecks = data.agreements.reduce(
    (sum, a) => sum + (a.checks || []).filter((d) => wdates.includes(d)).length,
    0,
  )
  const rate =
    data.agreements.length && elapsed
      ? Math.round((weekChecks / (data.agreements.length * elapsed)) * 100)
      : null

  return (
    <div className="page">
      <header className="page-head">
        <h1>우리 패턴</h1>
      </header>
      <p className="page-sub">
        <Icon name="share" size={13} /> 공유에 동의한 기록만으로 만들어져요.
      </p>

      {recent.length === 0 ? (
        <div className="empty-state">
          <Icon name="chart" size={36} strokeWidth={1.4} />
          <p>
            최근 7일간 공유된 기록이 없어요.
            <br />
            회고를 마친 기록에서 공유할 항목을 골라 보세요.
          </p>
        </div>
      ) : (
        <>
          <div className="stat-card">
            <h3>반복 주제</h3>
            {topTopics.length === 0 ? (
              <p className="stat-empty">주제가 공유된 기록이 없어요.</p>
            ) : (
              <div className="topic-bars">
                {topTopics.map(([t, n]) => (
                  <div key={t} className="topic-bar">
                    <span className="topic-name">{t}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(n / topTopics[0][1]) * 100}%` }}
                      />
                    </div>
                    <span className="topic-n">{n}회</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <h3>감정 강도</h3>
              {avgEmotion ? (
                <p className="big-num">
                  {avgEmotion}
                  <small> / 5 평균</small>
                </p>
              ) : (
                <p className="stat-empty">공유된 수치 없음</p>
              )}
            </div>
            <div className="stat-card">
              <h3>기록이 많은 시간</h3>
              {topBucket ? (
                <p className="big-num">
                  {topBucket[0]}
                  <small> {topBucket[1]}건</small>
                </p>
              ) : (
                <p className="stat-empty">데이터 없음</p>
              )}
            </div>
          </div>

          {requests.length > 0 && (
            <div className="stat-card">
              <h3>서로에게 전한 요청</h3>
              {requests.slice(0, 3).map((l) => (
                <p key={l.id} className="request-line">"{l.reflection.request}"</p>
              ))}
            </div>
          )}

          {rate !== null && (
            <div className="stat-card">
              <h3>이번 주 약속 실천율</h3>
              <p className="big-num">
                {rate}
                <small>%</small>
              </p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${rate}%` }} />
              </div>
            </div>
          )}
        </>
      )}

      <p className="disclaimer">
        이 리포트는 공유에 동의한 기록만 기반으로 합니다. 보이지 않는 기록이나 서로의 전체 감정을
        대표하지 않으며, 목적은 잘잘못 판단이 아니라 다음 대화를 위한 패턴 확인입니다.
      </p>
    </div>
  )
}
