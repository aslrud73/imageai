import { useState } from 'react'
import Icon from '../components/Icons'
import { TOPICS, MY_REACTIONS, PARTNER_REACTIONS, EMOTION_LABELS, newId } from '../store'

// 30초 빠른 기록: 판단 없이 사실과 느낌만. 저장은 기본 비공개.
// "기타"를 고르면 어떤 것인지 직접 적는다 (주제·나의 반응·상대 반응 공통).
export default function RecordForm({ update, onDone, onCancel }) {
  const [topics, setTopics] = useState([])
  const [topicEtc, setTopicEtc] = useState('')
  const [emotion, setEmotion] = useState(0)
  const [myReactions, setMyReactions] = useState([])
  const [myEtc, setMyEtc] = useState('')
  const [partnerReactions, setPartnerReactions] = useState([])
  const [partnerEtc, setPartnerEtc] = useState('')
  const [memo, setMemo] = useState('')
  const [resolved, setResolved] = useState(false)
  const [error, setError] = useState('')

  function toggle(list, setList, v) {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  }

  // "기타"를 직접 입력한 내용으로 치환
  function resolveEtc(list, etcText) {
    return list.map((v) => (v === '기타' ? etcText.trim() : v)).filter(Boolean)
  }

  function save() {
    if (topics.length === 0) {
      setError('주제를 하나 이상 골라 주세요.')
      return
    }
    if (topics.includes('기타') && !topicEtc.trim()) {
      setError('"기타" 주제가 어떤 것인지 적어 주세요.')
      return
    }
    if (!emotion) {
      setError('감정 강도를 선택해 주세요.')
      return
    }
    if (myReactions.includes('기타') && !myEtc.trim()) {
      setError('나의 반응 "기타"가 어떤 것인지 적어 주세요.')
      return
    }
    if (partnerReactions.includes('기타') && !partnerEtc.trim()) {
      setError('상대 반응 "기타"가 어떤 것인지 적어 주세요.')
      return
    }
    const now = new Date()
    update((d) => {
      d.logs.unshift({
        id: newId('log'),
        createdAt: now.toISOString(),
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        topics: resolveEtc(topics, topicEtc),
        emotion,
        myReactions: resolveEtc(myReactions, myEtc),
        partnerReactions: resolveEtc(partnerReactions, partnerEtc),
        memo: memo.trim(),
        resolved,
        reflection: null,
        share: null,
      })
      return d
    })
    onDone()
  }

  return (
    <div className="page">
      <header className="form-head">
        <button className="icon-btn" onClick={onCancel} aria-label="닫기">
          <Icon name="x" size={20} />
        </button>
        <h1>내 기록</h1>
        <span className="private-badge">
          <Icon name="lock" size={12} /> 나만 보기
        </span>
      </header>

      <p className="form-guide">지금은 판단하지 않고 내 느낌만 짧게 남겨요.</p>

      <section className="field">
        <label>어떤 주제였나요?</label>
        <div className="chip-row">
          {TOPICS.map((t) => (
            <button
              key={t}
              className={`chip ${topics.includes(t) ? 'on' : ''}`}
              onClick={() => toggle(topics, setTopics, t)}
            >
              {t}
            </button>
          ))}
        </div>
        {topics.includes('기타') && (
          <input
            type="text"
            className="etc-input"
            value={topicEtc}
            onChange={(e) => setTopicEtc(e.target.value)}
            placeholder="어떤 주제였는지 직접 적어 주세요"
            autoFocus
          />
        )}
      </section>

      <section className="field">
        <label>지금 감정의 세기는?</label>
        <div className="emotion-row">
          {EMOTION_LABELS.map((lb, i) => (
            <button
              key={lb}
              className={`emotion-dot ${emotion === i + 1 ? 'on' : ''}`}
              onClick={() => setEmotion(i + 1)}
            >
              <span className="dot-num">{i + 1}</span>
              <span className="dot-label">{lb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="field">
        <label>나의 반응은 어땠나요?</label>
        <div className="chip-row">
          {[...MY_REACTIONS, '기타'].map((r) => (
            <button
              key={r}
              className={`chip ${myReactions.includes(r) ? 'on' : ''}`}
              onClick={() => toggle(myReactions, setMyReactions, r)}
            >
              {r}
            </button>
          ))}
        </div>
        {myReactions.includes('기타') && (
          <input
            type="text"
            className="etc-input"
            value={myEtc}
            onChange={(e) => setMyEtc(e.target.value)}
            placeholder="나의 반응을 직접 적어 주세요"
          />
        )}
      </section>

      <section className="field">
        <label>내가 본 상대의 반응은? <small>(평가가 아니라 관찰만)</small></label>
        <div className="chip-row">
          {[...PARTNER_REACTIONS, '기타'].map((r) => (
            <button
              key={r}
              className={`chip ${partnerReactions.includes(r) ? 'on' : ''}`}
              onClick={() => toggle(partnerReactions, setPartnerReactions, r)}
            >
              {r}
            </button>
          ))}
        </div>
        {partnerReactions.includes('기타') && (
          <input
            type="text"
            className="etc-input"
            value={partnerEtc}
            onChange={(e) => setPartnerEtc(e.target.value)}
            placeholder="상대의 반응을 직접 적어 주세요"
          />
        )}
      </section>

      <section className="field">
        <label>남기고 싶은 말 <small>(비공개 메모 — 누구에게도 보이지 않아요)</small></label>
        <textarea
          rows={4}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="그날의 상황과 느낌을 자유롭게 적어보세요."
        />
      </section>

      <label className="toggle-row">
        <input type="checkbox" checked={resolved} onChange={(e) => setResolved(e.target.checked)} />
        <span>이 일은 어느 정도 풀렸어요</span>
      </label>

      <p className="safety-line">
        <Icon name="alert" size={13} /> 폭력·협박 등 안전이 걱정되는 상황이라면 기록보다 안전 확보가
        우선이에요.
      </p>

      {error && <p className="error">{error}</p>}

      <button className="btn-primary" onClick={save}>
        비공개로 저장하기
      </button>
    </div>
  )
}
