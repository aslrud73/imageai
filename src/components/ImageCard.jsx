import { useEffect, useMemo, useState } from 'react'
import { buildImageUrl } from '../api/imageProvider'
import { checkSafety } from '../data/presets'
import Icon from './Icons'

// 업스케일 시 한 변의 최대 픽셀 (무료 API 한계 고려)
const MAX_DIM = 2048

// 개별 생성 이미지 카드: 로딩 표시 + 수정(프롬프트 보정) + 업스케일(2×) + 다운로드.
// 같은 seed 를 유지한 채 프롬프트/해상도만 바꿔 재요청하므로
// 구도를 크게 잃지 않으면서 이미지를 다듬을 수 있다.
export default function ImageCard({ prompt, seed, width, height, filename }) {
  const [status, setStatus] = useState('loading') // loading | loaded | error
  const [downloading, setDownloading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editText, setEditText] = useState('')
  const [appliedEdit, setAppliedEdit] = useState('')
  const [editError, setEditError] = useState('')
  const [upscaled, setUpscaled] = useState(false)

  // 업스케일: 같은 seed 로 2배 해상도 재요청 (최대 변 길이 제한)
  const scale = upscaled ? Math.min(2, MAX_DIM / Math.max(width, height)) : 1
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const fullPrompt = appliedEdit ? `${prompt}, ${appliedEdit}` : prompt
  const url = useMemo(
    () => buildImageUrl({ prompt: fullPrompt, width: w, height: h, seed }),
    [fullPrompt, w, h, seed],
  )

  // URL 이 바뀌면(수정/업스케일) 다시 로딩 상태로
  useEffect(() => {
    setStatus('loading')
  }, [url])

  function applyEdit(e) {
    e.preventDefault()
    setEditError('')
    const t = editText.trim()
    if (!t) {
      setAppliedEdit('')
      setEditOpen(false)
      return
    }
    const safety = checkSafety(t)
    if (!safety.ok) {
      setEditError(`"${safety.word}" 단어는 사용할 수 없습니다.`)
      return
    }
    setAppliedEdit(t)
    setEditOpen(false)
  }

  function resetEdit() {
    setAppliedEdit('')
    setEditText('')
    setEditError('')
    setEditOpen(false)
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      // fetch → blob 방식으로 받아야 파일명이 제대로 적용되고 교차출처 문제도 피할 수 있다.
      const res = await fetch(url)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${filename}${appliedEdit ? '_수정' : ''}${upscaled ? '_2x' : ''}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      // 실패 시 새 탭에서 열어 수동 저장하도록 폴백
      window.open(url, '_blank', 'noopener')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="image-card">
      <div className="image-frame">
        {status === 'loading' && (
          <div className="loading-box" aria-label="생성 중">
            <span className="spinner-ring" />
            <span>그리는 중…</span>
          </div>
        )}
        {status === 'error' && (
          <div className="img-error">
            불러오기 실패
            <br />
            다시 시도해 주세요
          </div>
        )}
        <img
          src={url}
          alt="생성된 이미지"
          className={status === 'loaded' ? 'visible' : 'hidden'}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
        <div className="badges">
          {upscaled && <span className="badge">2× {w}×{h}</span>}
          {appliedEdit && <span className="badge badge-edit">수정됨</span>}
        </div>
      </div>

      {editOpen && (
        <form className="edit-panel" onSubmit={applyEdit}>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="예: 배경을 밤하늘로, 더 밝게"
            autoFocus
          />
          <button type="submit" className="edit-apply">
            적용
          </button>
          {appliedEdit && (
            <button type="button" className="edit-reset" onClick={resetEdit}>
              원본
            </button>
          )}
        </form>
      )}
      {editError && <p className="edit-error">{editError}</p>}
      {appliedEdit && !editOpen && <p className="edit-note">수정: {appliedEdit}</p>}

      <div className="card-actions">
        <button
          type="button"
          className={`tool-btn ${editOpen ? 'active' : ''}`}
          onClick={() => setEditOpen((v) => !v)}
        >
          <Icon name="pencil" size={15} /> 수정
        </button>
        <button
          type="button"
          className={`tool-btn ${upscaled ? 'active' : ''}`}
          onClick={() => setUpscaled((v) => !v)}
          disabled={status === 'loading'}
        >
          <Icon name="scaling" size={15} /> {upscaled ? '2× 해제' : '업스케일'}
        </button>
        <button
          type="button"
          className="tool-btn tool-primary"
          onClick={handleDownload}
          disabled={status !== 'loaded' || downloading}
        >
          <Icon name="download" size={15} /> {downloading ? '저장 중…' : '저장'}
        </button>
        <a className="tool-btn" href={url} target="_blank" rel="noopener noreferrer">
          <Icon name="external" size={15} /> 크게
        </a>
      </div>
    </div>
  )
}
