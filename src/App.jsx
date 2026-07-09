import { useMemo, useState } from 'react'
import { ASPECTS, getAspect, checkSafety } from './data/presets'
import Icon from './components/Icons'
import ImageCard from './components/ImageCard'

export default function App() {
  const [subject, setSubject] = useState('')
  const [aspectId, setAspectId] = useState('1:1')
  const [highRes, setHighRes] = useState(false)
  // 생성 시점의 스냅샷: 이후 옵션을 바꿔도 이미 생성된 카드는 영향받지 않는다.
  const [gen, setGen] = useState(null) // { prompt, width, height, seed, filename }
  const [error, setError] = useState('')

  const aspect = useMemo(() => getAspect(aspectId), [aspectId])
  const [width, height] = highRes ? aspect.high : aspect.standard

  function handleGenerate(e) {
    e?.preventDefault()
    setError('')
    const trimmed = subject.trim()
    if (!trimmed) {
      setError('만들고 싶은 이미지를 설명해 주세요.')
      return
    }
    const safety = checkSafety(trimmed)
    if (!safety.ok) {
      setError(`부적절할 수 있는 단어("${safety.word}")가 포함되어 생성을 막았습니다.`)
      return
    }
    // 입력한 설명을 그대로 모델에 전달한다 (스타일 강제 없음).
    // seed 는 입력값 기반으로 만들어 같은 입력이면 재현되도록 한다.
    const seed = (hashString(trimmed) % 100000) + 1
    setGen({
      prompt: trimmed,
      width,
      height,
      seed,
      filename: makeFilename(trimmed),
    })
  }

  function reshuffle() {
    if (!gen) return
    // 결정적 재생성(랜덤 대신): seed 를 일정 간격으로 이동
    setGen({ ...gen, seed: gen.seed + 7919 })
  }

  return (
    <div className="app">
      <header className="header">
        <h1>
          <span className="logo">
            <Icon name="palette" size={26} strokeWidth={1.6} />
          </span>
          우리반 이미지 메이커
        </h1>
        <p className="tagline">만들고 싶은 이미지를 설명하고 사이즈만 고르세요.</p>
      </header>

      <form className="panel" onSubmit={handleGenerate}>
        {/* 1. 이미지 설명 */}
        <section className="field">
          <label className="field-label" htmlFor="subject">
            1. 만들고 싶은 이미지를 설명해 주세요
          </label>
          <textarea
            id="subject"
            className="subject-input"
            rows={3}
            value={subject}
            placeholder="예: 저녁노을이 시작되는 퇴근시간, 차를 운전하고 가는 여자주인공"
            onChange={(e) => setSubject(e.target.value)}
          />
          <p className="hint">
            <Icon name="alert" size={14} /> 학생 이름·사진·개인정보는 입력하지 마세요. 스타일을 원하면
            설명에 함께 적으세요 (예: "동화책 그림체로", "수채화 스타일로").
          </p>
        </section>

        {/* 2. 사이즈 선택 */}
        <section className="field">
          <label className="field-label">2. 사이즈</label>
          <div className="aspect-row">
            {ASPECTS.map((a) => (
              <button
                type="button"
                key={a.id}
                className={`aspect-chip ${a.id === aspectId ? 'selected' : ''}`}
                onClick={() => setAspectId(a.id)}
              >
                <strong>{a.label}</strong>
                <small>{a.hint}</small>
              </button>
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={highRes} onChange={(e) => setHighRes(e.target.checked)} />
            고화질(인쇄용) — 현재 {width}×{height}px
          </label>
        </section>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button type="submit" className="btn-primary">
            <Icon name="sparkles" size={18} /> 이미지 생성
          </button>
          {gen && (
            <button type="button" className="btn-ghost" onClick={reshuffle}>
              <Icon name="refresh" size={16} /> 다른 그림
            </button>
          )}
        </div>
      </form>

      {/* 결과: 미리보기 → 수정/업스케일 → 저장 */}
      {gen && (
        <section className="results">
          <div className="results-head">
            <h2>미리보기</h2>
            <p>마음에 들면 저장하고, 아니면 "다른 그림"으로 새로 만들어 보세요.</p>
          </div>
          <div className="result-grid">
            <ImageCard
              key={`${gen.seed}-${gen.width}x${gen.height}-${gen.prompt}`}
              prompt={gen.prompt}
              seed={gen.seed}
              width={gen.width}
              height={gen.height}
              enhance
              filename={gen.filename}
            />
          </div>
        </section>
      )}

      <footer className="footer">
        <p>
          이미지는 무료 AI API로 생성됩니다. 수업에 쓸 이미지는 <strong>저장해서 재사용</strong>하세요
          (서비스 중단 대비). 생성물은 교사가 확인 후 사용하는 것을 전제로 합니다.
        </p>
      </footer>
    </div>
  )
}

// 문자열 → 안정적인 정수 해시 (seed 생성용, 재현성 확보)
function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function makeFilename(subject) {
  const clean = subject.trim().replace(/\s+/g, '-').slice(0, 24) || 'image'
  return `이미지_${clean}`
}
