import { useState } from 'react'

// 개별 생성 이미지 카드: 로딩 상태 표시 + 다운로드.
export default function ImageCard({ url, filename }) {
  const [status, setStatus] = useState('loading') // loading | loaded | error
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      // fetch → blob 방식으로 받아야 파일명이 제대로 적용되고 교차출처 문제도 피할 수 있다.
      const res = await fetch(url)
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${filename}.png`
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
        {status === 'loading' && <div className="spinner" aria-label="생성 중">그리는 중…</div>}
        {status === 'error' && (
          <div className="img-error">불러오기 실패<br />다시 시도해 주세요</div>
        )}
        <img
          src={url}
          alt="생성된 이미지"
          className={status === 'loaded' ? 'visible' : 'hidden'}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      </div>
      <div className="card-actions">
        <button
          className="btn-download"
          onClick={handleDownload}
          disabled={status !== 'loaded' || downloading}
        >
          {downloading ? '저장 중…' : '⬇ 저장'}
        </button>
        <a className="btn-open" href={url} target="_blank" rel="noopener noreferrer">
          🔍 크게 보기
        </a>
      </div>
    </div>
  )
}
