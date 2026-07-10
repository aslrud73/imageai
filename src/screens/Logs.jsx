import { useState } from 'react'
import Icon from '../components/Icons'
import { EMOTION_LABELS, SHARE_FIELDS, fmtDate, daysAgo } from '../store'
import { encryptToCode } from '../api/shareCrypto'

// 내 기록 목록 + 회고 작성 + 공유 선택.
// 원칙: 본인 기록은 본인만 수정·삭제, 공유는 미리보기를 거친 선택 행위.
export default function Logs({ data, update, onRecord }) {
  const [openId, setOpenId] = useState(null)
  const [mode, setMode] = useState(null) // 'reflect' | 'share'
  const [resolveInput, setResolveInput] = useState(null) // 나중에 "풀렸어요" 표시 중인 기록 id
  const [resolveHow, setResolveHow] = useState('')

  const log = data.logs.find((l) => l.id === openId)

  if (log && mode === 'reflect') {
    return (
      <ReflectForm
        log={log}
        update={update}
        onDone={() => setMode(null)}
        onCancel={() => setMode(null)}
      />
    )
  }
  if (log && mode === 'share') {
    return <ShareSheet log={log} update={update} onDone={() => setMode(null)} />
  }

  return (
    <div className="page">
      <header className="page-head row-between">
        <h1>내 기록</h1>
        <button className="small-btn" onClick={onRecord}>
          <Icon name="plus" size={15} /> 새 기록
        </button>
      </header>
      <p className="page-sub">
        <Icon name="lock" size={13} /> 모든 기록은 기본 비공개입니다.
      </p>

      {data.logs.length === 0 && (
        <div className="empty-state">
          <Icon name="sprout" size={36} strokeWidth={1.4} />
          <p>아직 기록이 없어요.<br />갈등 직후, 판단 대신 기록부터 시작해 보세요.</p>
        </div>
      )}

      {data.logs.map((l) => (
        <div key={l.id} className={`log-card ${openId === l.id ? 'open' : ''}`}>
          <button className="log-summary" onClick={() => setOpenId(openId === l.id ? null : l.id)}>
            <div className="log-main">
              <strong>{l.topics.join(' · ')}</strong>
              <small>
                {fmtDate(l.createdAt)} {l.time} · 감정 {l.emotion} ({EMOTION_LABELS[l.emotion - 1]})
              </small>
            </div>
            <div className="log-badges">
              {l.share && (
                <span className="mini-badge shared">
                  <Icon name="share" size={11} /> 공유됨
                </span>
              )}
              {l.reflection ? (
                <span className="mini-badge done">회고 완료</span>
              ) : (
                daysAgo(l.createdAt) >= 1 && <span className="mini-badge wait">회고 대기</span>
              )}
            </div>
            <span className={`expand-arrow ${openId === l.id ? 'up' : ''}`}>
              <Icon name="chevronRight" size={16} />
            </span>
          </button>

          {openId === l.id && (
            <div className="log-detail">
              <p>
                <span className="k">감정 강도</span> {l.emotion} / 5 ({EMOTION_LABELS[l.emotion - 1]})
              </p>
              {l.myReactions.length > 0 && (
                <p><span className="k">나의 반응</span> {l.myReactions.join(', ')}</p>
              )}
              {l.partnerReactions.length > 0 && (
                <p><span className="k">내가 본 상대</span> {l.partnerReactions.join(', ')}</p>
              )}
              <p>
                <span className="k">해결 여부</span> {l.resolved ? '어느 정도 풀렸어요' : '아직 풀리지 않았어요'}
              </p>
              {l.resolved && l.resolvedHow && (
                <p className="recovered-line">
                  <span className="k"><Icon name="sprout" size={11} /> 회복 기록</span> {l.resolvedHow}
                </p>
              )}
              {!l.resolved &&
                (resolveInput === l.id ? (
                  <div className="resolve-form">
                    <input
                      type="text"
                      className="etc-input recovered"
                      value={resolveHow}
                      onChange={(e) => setResolveHow(e.target.value)}
                      placeholder="어떻게 풀렸나요? (선택) — 예: 산책하며 이야기했다"
                      autoFocus
                    />
                    <button
                      className="small-btn accent"
                      onClick={() => {
                        update((d) => {
                          const t = d.logs.find((x) => x.id === l.id)
                          t.resolved = true
                          t.resolvedHow = resolveHow.trim()
                          return d
                        })
                        setResolveInput(null)
                        setResolveHow('')
                      }}
                    >
                      저장
                    </button>
                  </div>
                ) : (
                  <button className="resolve-later" onClick={() => setResolveInput(l.id)}>
                    <Icon name="sprout" size={13} /> 이제 풀렸어요
                  </button>
                ))}
              {l.memo && (
                <p className="memo">
                  <span className="k"><Icon name="lock" size={11} /> 남기고 싶은 말</span> {l.memo}
                </p>
              )}
              {l.reflection && (
                <div className="reflection-box">
                  <p><span className="k">실제 욕구</span> {l.reflection.realNeed}</p>
                  {l.reflection.request && (
                    <p><span className="k">요청 문장</span> {l.reflection.request}</p>
                  )}
                  {l.reflection.memo && (
                    <p><span className="k">회고 메모</span> {l.reflection.memo}</p>
                  )}
                </div>
              )}

              <div className="log-actions">
                {!l.reflection && (
                  <button className="small-btn accent" onClick={() => setMode('reflect')}>
                    <Icon name="moon" size={14} /> 회고 쓰기
                  </button>
                )}
                {!l.share ? (
                  <button
                    className={`small-btn ${l.reflection ? 'accent' : ''}`}
                    onClick={() => setMode('share')}
                  >
                    <Icon name="share" size={14} /> 공유 선택
                  </button>
                ) : (
                  <>
                    <button className="small-btn accent" onClick={() => setMode('share')}>
                      <Icon name="share" size={14} /> 공유 코드
                    </button>
                    <button
                      className="small-btn"
                      onClick={() =>
                        update((d) => {
                          const t = d.logs.find((x) => x.id === l.id)
                          t.share = null
                          return d
                        })
                      }
                    >
                      <Icon name="x" size={14} /> 철회
                    </button>
                  </>
                )}
                <button
                  className="small-btn danger"
                  onClick={() => {
                    if (confirm('이 기록을 삭제할까요? 되돌릴 수 없어요.')) {
                      update((d) => {
                        d.logs = d.logs.filter((x) => x.id !== l.id)
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
      ))}
    </div>
  )
}

// ── 하루 뒤 회고 ────────────────────────────
function ReflectForm({ log, update, onDone, onCancel }) {
  const [realNeed, setRealNeed] = useState('')
  const [request, setRequest] = useState('')
  const [memo, setMemo] = useState('')
  const [error, setError] = useState('')

  function save() {
    if (!realNeed.trim()) {
      setError('실제 욕구를 한 줄이라도 적어 주세요.')
      return
    }
    update((d) => {
      const t = d.logs.find((x) => x.id === log.id)
      t.reflection = {
        realNeed: realNeed.trim(),
        request: request.trim(),
        memo: memo.trim(),
        createdAt: new Date().toISOString(),
      }
      return d
    })
    onDone()
  }

  return (
    <div className="page">
      <header className="form-head">
        <button className="icon-btn" onClick={onCancel} aria-label="뒤로">
          <Icon name="chevronLeft" size={20} />
        </button>
        <h1>하루 뒤 회고</h1>
        <span className="private-badge">
          <Icon name="lock" size={12} /> 나만 보기
        </span>
      </header>

      <p className="form-guide">
        {fmtDate(log.createdAt)}의 기록 — <strong>{log.topics.join(' · ')}</strong>
      </p>

      <section className="field">
        <label>그때 내가 정말 바랐던 것은? <small>(표면 원인 뒤의 실제 욕구)</small></label>
        <textarea
          rows={2}
          value={realNeed}
          onChange={(e) => setRealNeed(e.target.value)}
          placeholder="예: 혼자 책임지는 느낌을 줄이고 싶었다."
        />
      </section>

      <section className="field">
        <label>상대에게 전하고 싶은 요청 한 문장 <small>(비난 대신 부탁으로)</small></label>
        <textarea
          rows={2}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="예: 식사 후 30분 안에 같이 정리했으면 좋겠어."
        />
      </section>

      <section className="field">
        <label>더 남기고 싶은 말 <small>(비공개)</small></label>
        <textarea rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="선택 사항" />
      </section>

      {error && <p className="error">{error}</p>}

      <button className="btn-primary" onClick={save}>
        회고 저장하기
      </button>
    </div>
  )
}

// ── 공유 선택 + 미리보기 + 암호화 코드 생성 ────────────
function ShareSheet({ log, update, onDone }) {
  const [fields, setFields] = useState(() =>
    log.share
      ? { topics: !!log.share.topics, emotion: !!log.share.emotion, realNeed: !!log.share.realNeed, request: !!log.share.request }
      : { topics: true, emotion: true, realNeed: false, request: true },
  )
  const [pin, setPin] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const anyOn = Object.values(fields).some(Boolean)

  function buildPacket() {
    const item = { date: log.createdAt.slice(0, 10) }
    if (fields.topics) item.topics = log.topics
    if (fields.emotion) item.emotion = log.emotion
    if (fields.realNeed && log.reflection?.realNeed) item.realNeed = log.reflection.realNeed
    if (fields.request && log.reflection?.request) item.request = log.reflection.request
    return { v: 1, kind: 'share', items: [item] }
  }

  async function shareAndCode() {
    setError('')
    if (pin.trim().length < 4) {
      setError('교환 PIN을 4자리 이상 정해 주세요. (상대와 미리 약속한 번호)')
      return
    }
    setBusy(true)
    const generated = await encryptToCode(buildPacket(), pin.trim())
    setBusy(false)
    update((d) => {
      const t = d.logs.find((x) => x.id === log.id)
      t.share = { ...fields, sharedAt: new Date().toISOString() }
      return d
    })
    setCode(generated)
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 클립보드 미지원 시 직접 선택 복사 */
    }
  }

  async function shareCode() {
    try {
      await navigator.share({ title: '마음결 공유 코드', text: code })
    } catch {
      copyCode()
    }
  }

  // 코드 생성 완료 화면
  if (code) {
    return (
      <div className="page">
        <header className="form-head">
          <button className="icon-btn" onClick={onDone} aria-label="완료">
            <Icon name="chevronLeft" size={20} />
          </button>
          <h1>공유 코드</h1>
        </header>
        <p className="form-guide">
          이 코드를 카톡·문자로 상대에게 보내세요. 상대는 <strong>우리 패턴 → 공유 받기</strong>에서
          코드와 교환 PIN을 입력하면 볼 수 있어요.
        </p>
        <textarea className="code-box" readOnly value={code} rows={5} onFocus={(e) => e.target.select()} />
        <div className="actions">
          <button className="btn-primary" onClick={shareCode}>
            <Icon name="share" size={16} /> 보내기
          </button>
          <button className="btn-ghost-mini" onClick={copyCode}>
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        <p className="section-hint center">
          코드는 교환 PIN 없이는 열 수 없게 암호화되어 있어요. PIN은 코드와 다른 경로로 전하거나 미리
          약속해 두세요.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="form-head">
        <button className="icon-btn" onClick={onDone} aria-label="뒤로">
          <Icon name="chevronLeft" size={20} />
        </button>
        <h1>공유 선택</h1>
      </header>

      <p className="form-guide">상대와 함께 볼 내용만 선택해요. 자유 메모와 반응 기록은 공유되지 않아요.</p>

      {SHARE_FIELDS.map((f) => {
        const unavailable =
          (f.key === 'realNeed' && !log.reflection?.realNeed) ||
          (f.key === 'request' && !log.reflection?.request)
        return (
          <label key={f.key} className={`share-row ${unavailable ? 'disabled' : ''}`}>
            <div>
              <strong>{f.label}</strong>
              <small>{unavailable ? '회고를 마치면 공유할 수 있어요' : f.desc}</small>
            </div>
            <input
              type="checkbox"
              disabled={unavailable}
              checked={!unavailable && fields[f.key]}
              onChange={(e) => setFields({ ...fields, [f.key]: e.target.checked })}
            />
          </label>
        )
      })}

      {!log.reflection && (
        <p className="section-hint">
          <Icon name="moon" size={13} /> 하루 뒤 회고를 마치면 "실제 욕구"와 "요청 문장"도 함께 공유할
          수 있어요.
        </p>
      )}

      <section className="preview-box">
        <h3>
          <Icon name="eye" size={15} /> 상대에게는 이렇게 보여요
        </h3>
        {!anyOn ? (
          <p className="preview-empty">선택된 항목이 없어요.</p>
        ) : (
          <ul>
            {fields.topics && <li>주제: {log.topics.join(', ')}</li>}
            {fields.emotion && <li>감정 강도: {log.emotion} / 5</li>}
            {fields.realNeed && log.reflection?.realNeed && <li>바랐던 것: {log.reflection.realNeed}</li>}
            {fields.request && log.reflection?.request && <li>요청: {log.reflection.request}</li>}
          </ul>
        )}
      </section>

      <section className="field">
        <label>교환 PIN <small>(상대와 약속한 번호 — 잠금 PIN과 달라도 돼요)</small></label>
        <input
          type="text"
          inputMode="numeric"
          className="etc-input"
          style={{ marginTop: 0 }}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="4자리 이상"
        />
      </section>

      {error && <p className="error">{error}</p>}

      <button className="btn-primary" disabled={!anyOn || busy} onClick={shareAndCode}>
        {busy ? '코드 만드는 중…' : '공유 코드 만들기'}
      </button>
      <p className="section-hint center">공유한 뒤에도 언제든 철회할 수 있어요.</p>
    </div>
  )
}
