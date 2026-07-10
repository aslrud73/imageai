import { useState } from 'react'
import Icon from '../components/Icons'
import { timeBucket, todayKey, weekDates, newId, EMOTION_LABELS } from '../store'
import { decryptFromCode } from '../api/shareCrypto'

const PERIODS = [
  { days: 7, label: '7일' },
  { days: 30, label: '30일' },
  { days: 0, label: '전체' },
]

// 우리 패턴: 내가 공유에 동의한 기록 + 상대가 코드로 보내준 기록을 함께 본다.
// 비공개 메모·회고 원문은 절대 집계에 넣지 않는다.
export default function Patterns({ data, update }) {
  const [period, setPeriod] = useState(7)
  const [receiving, setReceiving] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [recvMsg, setRecvMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const inPeriod = (dateIso) =>
    !period || Date.now() - new Date(dateIso).getTime() < period * 86400000

  // 내가 공유한 기록
  const shared = data.logs.filter((l) => l.share)
  const recent = shared.filter((l) => inPeriod(l.createdAt))

  // 상대가 보내준 항목 (공유 코드 / 전체 파일)
  const receivedItems = (data.received || [])
    .flatMap((r) =>
      r.kind === 'full'
        ? (r.logs || []).map((l) => ({
            date: l.createdAt.slice(0, 10),
            topics: l.topics,
            emotion: l.emotion,
            realNeed: l.reflection?.realNeed,
            request: l.reflection?.request,
            entryId: r.id,
          }))
        : (r.items || []).map((it) => ({ ...it, entryId: r.id })),
    )
    .filter((it) => inPeriod(it.date))

  const periodLabel = period ? `최근 ${period}일` : '전체 기간'

  // 주제 빈도 (나 + 상대)
  const topicCount = {}
  recent.forEach((l) => {
    if (l.share.topics) l.topics.forEach((t) => (topicCount[t] = (topicCount[t] || 0) + 1))
  })
  receivedItems.forEach((it) => (it.topics || []).forEach((t) => (topicCount[t] = (topicCount[t] || 0) + 1)))
  const topTopics = Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

  // 감정 강도 평균 (나 + 상대)
  const emotions = [
    ...recent.filter((l) => l.share.emotion).map((l) => l.emotion),
    ...receivedItems.map((it) => it.emotion).filter(Boolean),
  ]
  const avgEmotion = emotions.length
    ? (emotions.reduce((a, b) => a + b, 0) / emotions.length).toFixed(1)
    : null

  // 취약 시간대 (내 기록 기준)
  const buckets = {}
  recent.forEach((l) => {
    const b = timeBucket(l.time)
    buckets[b] = (buckets[b] || 0) + 1
  })
  const topBucket = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0]

  // 요청 문장 (나 + 상대)
  const myRequests = recent.filter((l) => l.share.request && l.reflection?.request)
  const partnerRequests = receivedItems.filter((it) => it.request)

  // 약속 실천율
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

  const hasAny = recent.length > 0 || receivedItems.length > 0

  // ── 공유 코드 받기 ──────────────────────
  async function receive() {
    setRecvMsg('')
    if (!codeInput.trim() || pinInput.trim().length < 4) {
      setRecvMsg('코드와 교환 PIN(4자리 이상)을 입력해 주세요.')
      return
    }
    setBusy(true)
    const packet = await decryptFromCode(codeInput, pinInput.trim())
    setBusy(false)
    if (!packet || packet.v !== 1 || (packet.kind !== 'share' && packet.kind !== 'full')) {
      setRecvMsg('코드나 PIN이 맞지 않아요. 다시 확인해 주세요.')
      return
    }
    update((d) => {
      d.received = d.received || []
      d.received.push({
        id: newId('rcv'),
        receivedAt: new Date().toISOString(),
        kind: packet.kind,
        items: packet.items,
        logs: packet.logs,
      })
      return d
    })
    setCodeInput('')
    setPinInput('')
    setReceiving(false)
  }

  function deleteReceived(entryId) {
    if (!confirm('받은 공유를 삭제할까요?')) return
    update((d) => {
      d.received = (d.received || []).filter((r) => r.id !== entryId)
      return d
    })
  }

  return (
    <div className="page">
      <header className="page-head row-between">
        <h1>우리 패턴</h1>
        <button className="small-btn" onClick={() => setReceiving(!receiving)}>
          <Icon name={receiving ? 'x' : 'download'} size={15} /> {receiving ? '닫기' : '공유 받기'}
        </button>
      </header>
      <p className="page-sub">
        <Icon name="share" size={13} /> 서로 공유에 동의한 내용만으로 만들어져요.
      </p>

      {receiving && (
        <div className="add-card">
          <textarea
            rows={3}
            className="code-box in"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="상대에게 받은 공유 코드를 붙여넣어 주세요 (MG1.…)"
          />
          <input
            type="text"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="교환 PIN"
          />
          {recvMsg && <p className="error">{recvMsg}</p>}
          <button className="btn-primary compact" disabled={busy} onClick={receive}>
            {busy ? '여는 중…' : '공유 열기'}
          </button>
        </div>
      )}

      <div className="period-tabs">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            className={`period-tab ${period === p.days ? 'on' : ''}`}
            onClick={() => setPeriod(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!hasAny ? (
        <div className="empty-state">
          <Icon name="chart" size={36} strokeWidth={1.4} />
          <p>
            {periodLabel} 공유된 기록이 없어요.
            <br />
            회고를 마친 기록에서 공유 코드를 만들거나,
            <br />
            상대의 코드를 "공유 받기"로 열어 보세요.
          </p>
        </div>
      ) : (
        <>
          <div className="stat-card">
            <h3>반복 주제 {receivedItems.length > 0 && <em className="both-note">나 + 상대</em>}</h3>
            {topTopics.length === 0 ? (
              <p className="stat-empty">주제가 공유된 기록이 없어요.</p>
            ) : (
              <div className="topic-bars">
                {topTopics.map(([t, n]) => (
                  <div key={t} className="topic-bar">
                    <span className="topic-name">{t}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(n / topTopics[0][1]) * 100}%` }} />
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

          {(myRequests.length > 0 || partnerRequests.length > 0) && (
            <div className="stat-card">
              <h3>서로에게 전한 요청</h3>
              {myRequests.slice(0, 3).map((l) => (
                <p key={l.id} className="request-line">
                  <span className="who me">나</span> "{l.reflection.request}"
                </p>
              ))}
              {partnerRequests.slice(0, 3).map((it, i) => (
                <p key={`p${i}`} className="request-line">
                  <span className="who partner">상대</span> "{it.request}"
                </p>
              ))}
            </div>
          )}

          {recent.some((l) => l.resolved) && (
            <div className="stat-card recovery">
              <h3>
                <Icon name="sprout" size={14} /> 우리는 이렇게 풀어요
              </h3>
              <p className="recovery-count">
                공유된 기록 {recent.length}건 중 <strong>{recent.filter((l) => l.resolved).length}건</strong>이
                풀렸어요.
              </p>
              {recent
                .filter((l) => l.resolved && l.resolvedHow)
                .slice(0, 3)
                .map((l) => (
                  <p key={l.id} className="request-line">"{l.resolvedHow}"</p>
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

          {receivedItems.length > 0 && (
            <div className="stat-card">
              <h3>상대가 공유해 준 기록</h3>
              {receivedItems
                .slice()
                .reverse()
                .slice(0, 5)
                .map((it, i) => (
                  <div key={i} className="received-item">
                    <div className="received-main">
                      <strong>{(it.topics || []).join(' · ') || '주제 비공개'}</strong>
                      <small>
                        {it.date}
                        {it.emotion ? ` · 감정 ${it.emotion} (${EMOTION_LABELS[it.emotion - 1]})` : ''}
                      </small>
                      {it.realNeed && <p className="received-line">바랐던 것: {it.realNeed}</p>}
                      {it.request && <p className="received-line">요청: {it.request}</p>}
                    </div>
                    <button
                      className="icon-btn subtle"
                      aria-label="받은 공유 삭제"
                      onClick={() => deleteReceived(it.entryId)}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      <p className="disclaimer">
        이 리포트는 서로 공유에 동의한 기록만 기반으로 합니다. 보이지 않는 기록이나 서로의 전체 감정을
        대표하지 않으며, 목적은 잘잘못 판단이 아니라 다음 대화를 위한 패턴 확인입니다.
      </p>
    </div>
  )
}
