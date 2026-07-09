import { useState } from 'react'
import Icon from '../components/Icons'
import { newId, weekKey } from '../store'

// 공동 절충안: 함께 정한 작은 생활 규칙 + 주간 실천 체크.
// 문구 원칙 — "상대가 고쳐야 할 점"이 아니라 "다음에 시도할 작은 약속".
export default function Agreements({ data, update }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const wk = weekKey()

  function add() {
    if (!title.trim()) return
    update((d) => {
      d.agreements.unshift({
        id: newId('agr'),
        title: title.trim(),
        note: note.trim(),
        checks: [],
        createdAt: new Date().toISOString(),
      })
      return d
    })
    setTitle('')
    setNote('')
    setAdding(false)
  }

  function toggleCheck(id) {
    update((d) => {
      const a = d.agreements.find((x) => x.id === id)
      a.checks = a.checks || []
      a.checks = a.checks.includes(wk) ? a.checks.filter((w) => w !== wk) : [...a.checks, wk]
      return d
    })
  }

  return (
    <div className="page">
      <header className="page-head row-between">
        <h1>우리 약속</h1>
        <button className="small-btn" onClick={() => setAdding(!adding)}>
          <Icon name={adding ? 'x' : 'plus'} size={15} /> {adding ? '닫기' : '새 약속'}
        </button>
      </header>
      <p className="page-sub">다음에 시도할 작은 약속을 함께 정해요.</p>

      {adding && (
        <div className="add-card">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 식사 후 30분 안에 같이 정리하기"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="메모 (선택) — 예: 밤 10시 이후엔 무리하지 않기"
          />
          <button className="btn-primary compact" onClick={add}>
            약속 추가하기
          </button>
        </div>
      )}

      {data.agreements.length === 0 && !adding && (
        <div className="empty-state">
          <Icon name="handshake" size={36} strokeWidth={1.4} />
          <p>
            아직 약속이 없어요.
            <br />
            거창한 다짐보다, 이번 주에 실천할 수 있는 작은 것부터요.
          </p>
        </div>
      )}

      {data.agreements.map((a) => {
        const done = a.checks?.includes(wk)
        return (
          <div key={a.id} className={`agreement-card ${done ? 'done' : ''}`}>
            <div className="agreement-main">
              <strong>{a.title}</strong>
              {a.note && <small>{a.note}</small>}
              <span className="check-history">지금까지 {a.checks?.length || 0}주 실천</span>
            </div>
            <div className="agreement-actions">
              <button className={`check-btn ${done ? 'on' : ''}`} onClick={() => toggleCheck(a.id)}>
                <Icon name="check" size={16} />
                {done ? '이번 주 실천!' : '이번 주 체크'}
              </button>
              <button
                className="icon-btn subtle"
                aria-label="약속 삭제"
                onClick={() => {
                  if (confirm('이 약속을 삭제할까요?')) {
                    update((d) => {
                      d.agreements = d.agreements.filter((x) => x.id !== a.id)
                      return d
                    })
                  }
                }}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </div>
        )
      })}

      {data.agreements.length > 0 && (
        <p className="section-hint center">지키지 못한 주가 있어도 괜찮아요. 약속은 다시 조정하면 돼요.</p>
      )}
    </div>
  )
}
