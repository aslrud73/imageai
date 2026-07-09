import { useState } from 'react'
import Icon from '../components/Icons'
import { newId, todayKey, weekDates, DAY_NAMES } from '../store'

// 공동 절충안: 함께 정한 작은 생활 규칙 + 매일 실천 체크.
// 문구 원칙 — "상대가 고쳐야 할 점"이 아니라 "다음에 시도할 작은 약속".
export default function Agreements({ data, update }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const today = todayKey()
  const wdates = weekDates()

  function add() {
    if (!title.trim()) return
    update((d) => {
      d.agreements.unshift({
        id: newId('agr'),
        title: title.trim(),
        note: note.trim(),
        checks: [], // 실천한 날짜(YYYY-MM-DD) 목록
        createdAt: new Date().toISOString(),
      })
      return d
    })
    setTitle('')
    setNote('')
    setAdding(false)
  }

  function toggleToday(id) {
    update((d) => {
      const a = d.agreements.find((x) => x.id === id)
      a.checks = a.checks || []
      a.checks = a.checks.includes(today)
        ? a.checks.filter((k) => k !== today)
        : [...a.checks, today]
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
      <p className="page-sub">작은 약속을 정하고, 하루하루 실천을 쌓아가요.</p>

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
            거창한 다짐보다, 오늘 실천할 수 있는 작은 것부터요.
          </p>
        </div>
      )}

      {data.agreements.map((a) => {
        const checks = a.checks || []
        const doneToday = checks.includes(today)
        const weekCount = wdates.filter((dt) => checks.includes(dt)).length
        return (
          <div key={a.id} className={`agreement-card ${doneToday ? 'done' : ''}`}>
            <div className="agreement-top">
              <div className="agreement-main">
                <strong>{a.title}</strong>
                {a.note && <small>{a.note}</small>}
              </div>
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

            <div className="week-strip">
              {wdates.map((dt, i) => {
                const on = checks.includes(dt)
                const isToday = dt === today
                const future = dt > today
                return (
                  <div
                    key={dt}
                    className={`day-cell ${on ? 'on' : ''} ${isToday ? 'today' : ''} ${future ? 'future' : ''}`}
                  >
                    <span className="day-name">{DAY_NAMES[i]}</span>
                    <span className="day-dot">{on ? <Icon name="check" size={12} strokeWidth={2.4} /> : ''}</span>
                  </div>
                )
              })}
            </div>

            <div className="agreement-bottom">
              <span className="check-history">
                이번 주 {weekCount}일 · 지금까지 {checks.length}일 실천
              </span>
              <button className={`check-btn ${doneToday ? 'on' : ''}`} onClick={() => toggleToday(a.id)}>
                <Icon name="check" size={15} />
                {doneToday ? '오늘 실천 완료' : '오늘 실천했어요'}
              </button>
            </div>
          </div>
        )
      })}

      {data.agreements.length > 0 && (
        <p className="section-hint center">놓친 날이 있어도 괜찮아요. 오늘 다시 이어가면 돼요.</p>
      )}
    </div>
  )
}
