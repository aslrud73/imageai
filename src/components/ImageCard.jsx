import { useEffect, useMemo, useState } from 'react'
import { buildImageUrl } from '../api/imageProvider'
import { checkSafety } from '../data/presets'
import Icon from './Icons'

// 업스케일 시 한 변의 최대 픽셀 (무료 API 한계 고려)
const MAX_DIM = 2048

// 개별 생성 이미지 카드: 로딩 표시 + 수정(프롬프트 보정) + 업스케일(2×) + 다운로드.
// 같은 seed 를 유지한 채 프롬프트/해상도만 바꿔 재요청하므로
// 구도를 크게 잃지 않으면서 이미지를 다듬을 수 있다.
// 실패 시 자동 재시도 횟수 (무료 API 는 순간 과부하로 간헐 실패할 수 있음)
const AUTO_RETRIES = 2

export default function ImageCard({ prompt, seed, width, height, enhance, filename }) {
  const [status, setStatus] = useState('loading') // loading | loaded | retry-wait | error
  const [attempts, setAttempts] = useState(0)
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
  const url = useMemo(() => {
    const base = buildImageUrl({ prompt: fullPrompt, width: w, height: h, seed, enhance })
    // 재시도 시 캐시를 우회해 새로 요청 (seed 가 같아 결과 이미지는 동일 구도)
    return attempts > 0 ? `${base}&r=${attempts}` : base
  }, [fullPrompt, w, h, seed, enhance, attempts])

  // URL 이 바뀌면(수정/업스케일/재시도) 다시 로딩 상태로
  useEffect(() => {
    setStatus('loading')
  }, [url])

  // 실패 → 잠시 기다렸다가 자동 재시도 (점점 길게)
  useEffect(() => {
    if (status !== 'retry-wait') return
    const t = setTimeout(() => setAttempts((a) => a + 1), 3000 * (attempts + 1))
    return () => clearTimeout(t)
  }, [status, attempts])

  function handleImgError() {
    setStatus(attempts < AUTO_RETRIES ? 'retry-wait' : 'error')
  }

  function manualRetry() {
    setAttempts((a) => a + 1)
  }

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
        {(status === 'loading' || status === 'retry-wait') && (
          <div className="loading-box" aria-label="생성 중">
            <span className="spinner-ring" />
            <span>{status === 'retry-wait' ? '잠시 후 다시 시도…' : '그리는 중…'}</span>
          </div>
        )}
        {status === 'error' && (
          <div className="img-error">
            <p>
              이미지 생성에 실패했어요.
              <br />
              무료 서버가 붐비는 중일 수 있어요.
            </p>
            <button type="button" className="retry-btn" onClick={manualRetry}>
              <Icon name="refresh" size={14} /> 다시 시도
            </button>
          </div>
        )}
        <img
          src={url}
          alt="생성된 이미지"
          className={status === 'loaded' ? 'visible' : 'hidden'}
          onLoad={() => setStatus('loaded')}
          onError={handleImgError}
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
