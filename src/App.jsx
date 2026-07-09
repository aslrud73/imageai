import { useMemo, useState } from 'react'
import { TYPES, ASPECTS, getType, getAspect, checkSafety } from './data/presets'
import { buildVariations } from './api/imageProvider'
import ImageCard from './components/ImageCard'

const VARIATION_COUNT = 3

export default function App() {
  const [typeId, setTypeId] = useState(TYPES[0].id)
  const [subject, setSubject] = useState('')
  const [aspectId, setAspectId] = useState(TYPES[0].defaultAspect)
  const [highRes, setHighRes] = useState(false)
  const [variations, setVariations] = useState([])
  const [error, setError] = useState('')

  const type = useMemo(() => getType(typeId), [typeId])
  const aspect = useMemo(() => getAspect(aspectId), [aspectId])
  const [width, height] = highRes ? aspect.high : aspect.standard

  function selectType(id) {
    setTypeId(id)
    // 유형을 바꾸면 그 유형의 추천 사이즈로 자동 전환
    setAspectId(getType(id).defaultAspect)
  }

  function handleGenerate(e) {
    e?.preventDefault()
    setError('')
    const trimmed = subject.trim()
    if (!trimmed) {
      setError('주제를 입력해 주세요.')
      return
    }
    const safety = checkSafety(trimmed)
    if (!safety.ok) {
      setError(`부적절할 수 있는 단어("${safety.word}")가 포함되어 생성을 막았습니다.`)
      return
    }
    const prompt = type.buildPrompt(trimmed)
    // seedBase 는 입력값 기반으로 만들어 같은 입력이면 재현되도록 한다.
    const seedBase = (hashString(prompt) % 100000) + 1
    const urls = buildVariations({ prompt, width, height, count: VARIATION_COUNT, seedBase })
    setVariations(urls.map((v) => ({ ...v, id: `${v.seed}-${width}x${height}` })))
  }

  function reshuffle() {
    if (!variations.length) return
    const bump = Math.floor(width * height) % 7919 // 결정적 재생성(랜덤 대신)
    const prompt = type.buildPrompt(subject.trim())
    const seedBase = (hashString(prompt) % 100000) + 1 + (variations[0].seed % 500) + bump
    const urls = buildVariations({ prompt, width, height, count: VARIATION_COUNT, seedBase })
    setVariations(urls.map((v) => ({ ...v, id: `${v.seed}-${width}x${height}` })))
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎨 우리반 이미지 메이커</h1>
        <p className="tagline">유형과 사이즈를 고르면 수업용 이미지를 만들어 드려요.</p>
      </header>

      <form className="panel" onSubmit={handleGenerate}>
        {/* 1. 유형 선택 */}
        <section className="field">
          <label className="field-label">1. 유형 선택</label>
          <div className="type-grid">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t.id}
                className={`type-card ${t.id === typeId ? 'selected' : ''}`}
                onClick={() => selectType(t.id)}
              >
                <span className="type-emoji">{t.emoji}</span>
                <span className="type-label">{t.label}</span>
                <span className="type-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 2. 주제 입력 */}
        <section className="field">
          <label className="field-label" htmlFor="subject">
            2. 주제 입력
          </label>
          <input
            id="subject"
            className="subject-input"
            type="text"
            value={subject}
            placeholder={type.placeholder}
            onChange={(e) => setSubject(e.target.value)}
          />
          <p className="hint">
            ⚠️ 학생 이름·사진·개인정보는 입력하지 마세요. 주제(사물·장면)만 적어 주세요.
          </p>
        </section>

        {/* 3. 사이즈 선택 */}
        <section className="field">
          <label className="field-label">3. 사이즈</label>
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
            ✨ 이미지 생성 ({VARIATION_COUNT}장)
          </button>
          {variations.length > 0 && (
            <button type="button" className="btn-ghost" onClick={reshuffle}>
              🔄 다시 생성
            </button>
          )}
        </div>
      </form>

      {/* 결과: 미리보기 → 선택 → 저장 */}
      {variations.length > 0 && (
        <section className="results">
          <h2>미리보기 · 마음에 드는 것을 저장하세요</h2>
          <div className="result-grid">
            {variations.map((v) => (
              <ImageCard key={v.id} url={v.url} filename={makeFilename(type.label, subject)} />
            ))}
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

function makeFilename(typeLabel, subject) {
  const clean = subject.trim().replace(/\s+/g, '-').slice(0, 20) || 'image'
  return `${typeLabel}_${clean}`
}
