import { useState } from 'react'
import Icon from '../components/Icons'
import { todayKey, localDateKey, fmtDate, daysAgo, WEATHERS, getWeather } from '../store'

export default function Home({ data, update, onRecord, goTab, onReceive }) {
  const today = new Date()
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일 ${'일월화수목금토'[today.getDay()]}요일`

  // 하루가 지났는데 회고가 없는 기록
  const pendingReflections = data.logs.filter((l) => !l.reflection && daysAgo(l.createdAt) >= 1)
  const tk = todayKey()
  const checkedToday = data.agreements.filter((a) => a.checks?.includes(tk)).length

  function toggleToday(id) {
    update((d) => {
      const a = d.agreements.find((x) => x.id === id)
      a.checks = a.checks || []
      a.checks = a.checks.includes(tk) ? a.checks.filter((k) => k !== tk) : [...a.checks, tk]
      return d
    })
  }

  // ── 매일 한 줄 체크인 ──────────────────
  const todayCheckin = (data.checkins || []).find((c) => c.date === tk)
  const [editingCheckin, setEditingCheckin] = useState(false)
  const [selWeather, setSelWeather] = useState(todayCheckin?.weather || '')
  const [checkinNote, setCheckinNote] = useState(todayCheckin?.note || '')

  function saveCheckin() {
    if (!selWeather) return
    update((d) => {
      d.checkins = (d.checkins || []).filter((c) => c.date !== tk)
      d.checkins.push({ date: tk, weather: selWeather, note: checkinNote.trim() })
      return d
    })
    setEditingCheckin(false)
  }

  // 최근 7일 날씨 스트립 (오늘 포함)
  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return localDateKey(d)
  })

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

      <button className="receive-entry" onClick={onReceive}>
        <span className="receive-icon">
          <Icon name="download" size={18} />
        </span>
        <span className="receive-text">
          <strong>상대의 공유 코드 받기</strong>
          <small>카톡으로 받은 코드를 여기서 열어요</small>
        </span>
        <Icon name="chevronRight" size={16} className="cta-arrow" />
      </button>

      <p className="privacy-note">
        <Icon name="lock" size={14} /> 기록은 기본 비공개예요. 공유는 내가 선택할 때만 이루어져요.
      </p>

      <section className="section">
        <h2 className="section-title">
          <Icon name="cloudSun" size={16} /> 오늘 우리 사이 날씨
        </h2>
        <div className="checkin-card">
          {todayCheckin && !editingCheckin ? (
            <div className="checkin-done">
              <span className="weather-badge">
                <Icon name={getWeather(todayCheckin.weather)?.icon || 'cloud'} size={22} />
              </span>
              <div className="checkin-text">
                <strong>{getWeather(todayCheckin.weather)?.label}</strong>
                {todayCheckin.note && <small>{todayCheckin.note}</small>}
              </div>
              <button
                className="small-btn"
                onClick={() => {
                  setSelWeather(todayCheckin.weather)
                  setCheckinNote(todayCheckin.note)
                  setEditingCheckin(true)
                }}
              >
                수정
              </button>
            </div>
          ) : (
            <>
              <div className="weather-row">
                {WEATHERS.map((w) => (
                  <button
                    key={w.id}
                    className={`weather-btn ${selWeather === w.id ? 'on' : ''}`}
                    onClick={() => setSelWeather(w.id)}
                  >
                    <Icon name={w.icon} size={21} />
                    <span>{w.label}</span>
                  </button>
                ))}
              </div>
              <div className="checkin-input-row">
                <input
                  type="text"
                  value={checkinNote}
                  onChange={(e) => setCheckinNote(e.target.value)}
                  placeholder="한 줄 남기기 (선택)"
                />
                <button className="small-btn accent" disabled={!selWeather} onClick={saveCheckin}>
                  저장
                </button>
              </div>
            </>
          )}
          <div className="weather-strip">
            {recentDays.map((dk) => {
              const c = (data.checkins || []).find((x) => x.date === dk)
              return (
                <span key={dk} className={`weather-day ${dk === tk ? 'today' : ''}`}>
                  {c ? <Icon name={getWeather(c.weather)?.icon || 'cloud'} size={15} /> : <span className="weather-empty" />}
                </span>
              )
            })}
          </div>
        </div>
      </section>

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
          <Icon name="handshake" size={16} /> 오늘의 우리 약속
        </h2>
        {data.agreements.length === 0 ? (
          <button className="empty-card" onClick={() => goTab('agreements')}>
            아직 함께 정한 약속이 없어요. <span className="link">첫 약속 만들기</span>
          </button>
        ) : (
          <>
            <div className="progress-card">
              <div className="progress-num">
                <strong>{checkedToday}</strong>
                <span> / {data.agreements.length}개 오늘 실천</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${data.agreements.length ? (checkedToday / data.agreements.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            {data.agreements.slice(0, 3).map((a) => {
              const done = a.checks?.includes(tk)
              return (
                <div key={a.id} className="list-card static">
                  <button className="list-card-main" onClick={() => goTab('agreements')}>
                    <strong>{a.title}</strong>
                    {a.note && <small>{a.note}</small>}
                  </button>
                  <button
                    className={`pill clickable ${done ? 'done' : ''}`}
                    onClick={() => toggleToday(a.id)}
                  >
                    {done && <Icon name="check" size={12} />} {done ? '완료' : '오늘 체크'}
                  </button>
                </div>
              )
            })}
          </>
        )}
      </section>
    </div>
  )
}
