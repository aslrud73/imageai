import { useState } from 'react'
import Icon from '../components/Icons'
import { newId, todayKey, weekDatesOffset, endDateAfter, daysBetween, DAY_NAMES } from '../store'

const PERIOD_OPTIONS = [
  { days: 7, label: '1주' },
  { days: 14, label: '2주' },
  { days: 28, label: '4주' },
  { days: 0, label: '계속' },
]

// 공동 절충안: 함께 정한 작은 생활 규칙 + 매일 실천 체크.
// 아코디언 목록, 기간 설정(1주/2주/4주/계속), 주간 좌우 이동 + 소급 체크,
// 기간이 끝나면 실천 통계 요약을 보여준다.
export default function Agreements({ data, update }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [periodDays, setPeriodDays] = useState(14)
  const [openId, setOpenId] = useState(null)
  const [weekOff, setWeekOff] = useState(0)
  const tk = todayKey()

  const startOf = (a) => a.startDate || a.createdAt.slice(0, 10)
  const isDone = (a) => !!a.endDate && a.endDate < tk

  function add() {
    if (!title.trim()) return
    update((d) => {
      d.agreements.unshift({
        id: newId('agr'),
        title: title.trim(),
        note: note.trim(),
        startDate: tk,
        endDate: periodDays ? endDateAfter(periodDays) : null,
        checks: [],
        createdAt: new Date().toISOString(),
      })
      return d
    })
    setTitle('')
    setNote('')
    setAdding(false)
  }

  function toggleDay(id, dateKey) {
    update((d) => {
      const a = d.agreements.find((x) => x.id === id)
      a.checks = a.checks || []
      a.checks = a.checks.includes(dateKey)
        ? a.checks.filter((k) => k !== dateKey)
        : [...a.checks, dateKey]
      return d
    })
  }

  function toggleOpen(id) {
    setOpenId(openId === id ? null : id)
    setWeekOff(0)
  }

  const fmtShort = (key) => `${parseInt(key.slice(5, 7), 10)}.${parseInt(key.slice(8, 10), 10)}`

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
          <div className="chip-row">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.days}
                type="button"
                className={`chip ${periodDays === p.days ? 'on' : ''}`}
                onClick={() => setPeriodDays(p.days)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="setting-note" style={{ marginTop: 0 }}>
            {periodDays
              ? `오늘부터 ${periodDays}일 (${fmtShort(tk)} ~ ${fmtShort(endDateAfter(periodDays))}) 동안 실천해요. 끝나면 통계가 정리돼요.`
              : '기간 없이 계속 이어가는 약속이에요.'}
          </p>
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
        const start = startOf(a)
        const done = isDone(a)
        const doneToday = checks.includes(tk)
        const open = openId === a.id
        const dday = a.endDate && !done ? daysBetween(tk, a.endDate) - 1 : null
        // 기간 내 실천 통계
        const periodTotal = a.endDate ? daysBetween(start, a.endDate) : null
        const periodChecks = a.endDate
          ? checks.filter((k) => k >= start && k <= a.endDate).length
          : checks.length
        const pct = periodTotal ? Math.round((periodChecks / periodTotal) * 100) : null

        // 펼침 상태에서 보여줄 주 (좌우 이동)
        const wdates = open ? weekDatesOffset(weekOff) : []
        const canPrev = open && wdates[0] > start
        const canNext = open && weekOff < 0

        return (
          <div key={a.id} className={`agreement-card ${done ? 'finished' : doneToday ? 'done' : ''}`}>
            {/* 접힌 헤더 */}
            <div className="agreement-head" onClick={() => toggleOpen(a.id)}>
              <div className="agreement-main">
                <strong>{a.title}</strong>
                <small>
                  {done
                    ? `기간 완료 · ${periodTotal}일 중 ${periodChecks}일 실천`
                    : a.endDate
                      ? `${fmtShort(start)} ~ ${fmtShort(a.endDate)} · 기간 중 ${periodChecks}일 실천`
                      : `계속 · 지금까지 ${checks.length}일 실천`}
                </small>
              </div>
              {done ? (
                <span className="mini-badge done">완료</span>
              ) : (
                <>
                  {dday !== null && <span className="mini-badge wait">{dday === 0 ? 'D-DAY' : `D-${dday}`}</span>}
                  <button
                    className={`day-quick ${doneToday ? 'on' : ''}`}
                    aria-label="오늘 실천 체크"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDay(a.id, tk)
                    }}
                  >
                    <Icon name="check" size={15} strokeWidth={2.4} />
                  </button>
                </>
              )}
              <span className={`expand-arrow ${open ? 'up' : ''}`}>
                <Icon name="chevronRight" size={16} />
              </span>
            </div>

            {/* 펼친 내용 */}
            {open && (
              <div className="agreement-body">
                {a.note && <p className="agreement-note">{a.note}</p>}

                {/* 주간 좌우 이동 */}
                <div className="week-nav">
                  <button className="icon-btn" disabled={!canPrev} onClick={() => setWeekOff(weekOff - 1)}>
                    <Icon name="chevronLeft" size={16} />
                  </button>
                  <span className="week-label">
                    {fmtShort(wdates[0])} ~ {fmtShort(wdates[6])}
                    {weekOff === 0 && ' (이번 주)'}
                  </span>
                  <button className="icon-btn" disabled={!canNext} onClick={() => setWeekOff(weekOff + 1)}>
                    <Icon name="chevronRight" size={16} />
                  </button>
                </div>

                <div className="week-strip">
                  {wdates.map((dt, i) => {
                    const inPeriod = dt >= start && (!a.endDate || dt <= a.endDate)
                    const isFuture = dt > tk
                    const tappable = inPeriod && !isFuture
                    const on = checks.includes(dt)
                    return (
                      <button
                        key={dt}
                        type="button"
                        className={`day-cell ${on ? 'on' : ''} ${dt === tk ? 'today' : ''} ${
                          isFuture || !inPeriod ? 'future' : ''
                        } ${tappable ? 'tap' : ''}`}
                        disabled={!tappable}
                        onClick={() => toggleDay(a.id, dt)}
                      >
                        <span className="day-name">{DAY_NAMES[i]}</span>
                        <span className="day-dot">
                          {on ? <Icon name="check" size={12} strokeWidth={2.4} /> : ''}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="section-hint">지난 날짜도 눌러서 체크를 보완할 수 있어요.</p>

                {/* 통계 */}
                {a.endDate ? (
                  <div className={`agreement-result ${done ? 'final' : ''}`}>
                    <div className="result-line">
                      <strong>
                        {done ? '기간 완료' : '진행 중'} — {periodTotal}일 중 {periodChecks}일 실천
                      </strong>
                      <span className="result-pct">{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    {done && (
                      <p className="result-note">
                        {pct >= 70
                          ? '꾸준히 잘 지켰어요. 다음 약속으로 이어가 볼까요?'
                          : '지키기 어려웠다면, 더 작은 약속으로 조정해 봐요.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="check-history">지금까지 {checks.length}일 실천했어요.</p>
                )}

                <div className="agreement-foot">
                  <button
                    className="small-btn danger"
                    onClick={() => {
                      if (confirm('이 약속을 삭제할까요?')) {
                        update((d) => {
                          d.agreements = d.agreements.filter((x) => x.id !== a.id)
                          return d
                        })
                        setOpenId(null)
                      }
                    }}
                  >
                    <Icon name="trash" size={14} /> 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {data.agreements.length > 0 && (
        <p className="section-hint center">놓친 날이 있어도 괜찮아요. 오늘 다시 이어가면 돼요.</p>
      )}
    </div>
  )
}
