import { useRef, useState } from 'react'
import Icon from '../components/Icons'
import {
  clearData,
  loadData,
  exportBackup,
  parseBackup,
  getPinHash,
  setPin,
  removePin,
  todayKey,
} from '../store'

export default function Settings({ data, setData }) {
  const fileRef = useRef(null)
  const [pinOn, setPinOn] = useState(!!getPinHash())
  const [pinStep, setPinStep] = useState(null) // null | 'new' | 'confirm'
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinMsg, setPinMsg] = useState('')

  // ── 백업 내보내기: JSON 파일 다운로드 ─────────
  function handleExport() {
    const blob = new Blob([exportBackup(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `마음결_백업_${todayKey()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // ── 백업 가져오기: 파일 선택 → 검증 → 교체 ────
  function handleImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const restored = parseBackup(String(reader.result))
      if (!restored) {
        alert('마음결 백업 파일이 아니거나 손상된 파일이에요.')
        return
      }
      if (
        confirm(
          `백업에서 기록 ${restored.logs.length}건, 약속 ${restored.agreements.length}개를 찾았어요.\n\n지금 기기의 데이터를 이 백업으로 교체할까요?`,
        )
      ) {
        setData(restored)
      }
    }
    reader.readAsText(file)
  }

  // ── PIN 설정 흐름 ──────────────────────
  async function submitPin() {
    setPinMsg('')
    if (pinStep === 'new') {
      if (!/^\d{4}$/.test(pin1)) {
        setPinMsg('숫자 4자리로 입력해 주세요.')
        return
      }
      setPinStep('confirm')
      return
    }
    if (pinStep === 'confirm') {
      if (pin1 !== pin2) {
        setPinMsg('두 번 입력한 PIN이 달라요. 다시 확인해 주세요.')
        setPin2('')
        return
      }
      await setPin(pin1)
      sessionStorage.setItem('maumgyeol_unlocked', '1')
      setPinOn(true)
      setPinStep(null)
      setPin1('')
      setPin2('')
    }
  }

  function turnOffPin() {
    if (confirm('기록 잠금을 해제할까요? 앱을 열 때 PIN을 묻지 않게 돼요.')) {
      removePin()
      setPinOn(false)
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>설정</h1>
      </header>

      {/* 기록 잠금 */}
      <div className="setting-card">
        <h3>
          <Icon name="key" size={16} /> 기록 잠금 (PIN)
        </h3>
        {pinOn ? (
          <>
            <p>잠금이 켜져 있어요. 앱을 새로 열 때마다 PIN 4자리를 물어봐요.</p>
            <div className="setting-actions">
              <button className="small-btn" onClick={() => setPinStep('new')}>
                PIN 변경
              </button>
              <button className="small-btn danger" onClick={turnOffPin}>
                잠금 해제
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              민감한 기록을 보호하려면 PIN을 설정하세요. 폰을 열어둔 사이에도 기록은 잠겨 있어요.
            </p>
            {pinStep === null && (
              <div className="setting-actions">
                <button className="small-btn accent" onClick={() => setPinStep('new')}>
                  PIN 설정하기
                </button>
              </div>
            )}
          </>
        )}
        {pinStep && (
          <div className="pin-setup">
            {pinStep === 'new' ? (
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin1}
                onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))}
                placeholder="새 PIN 4자리"
                autoFocus
              />
            ) : (
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin2}
                onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
                placeholder="한 번 더 입력"
                autoFocus
              />
            )}
            <button className="small-btn accent" onClick={submitPin}>
              {pinStep === 'new' ? '다음' : '설정 완료'}
            </button>
            <button
              className="small-btn"
              onClick={() => {
                setPinStep(null)
                setPin1('')
                setPin2('')
                setPinMsg('')
              }}
            >
              취소
            </button>
          </div>
        )}
        {pinMsg && <p className="error">{pinMsg}</p>}
        {pinOn && (
          <p className="setting-note">
            PIN을 잊으면 복구할 수 없어요 (모든 데이터 삭제로만 초기화). 잊지 않을 번호로 정해 주세요.
          </p>
        )}
      </div>

      {/* 백업 / 복원 */}
      <div className="setting-card">
        <h3>
          <Icon name="download" size={16} /> 백업 / 복원
        </h3>
        <p>
          기록은 이 기기 안에만 있어서, 브라우저 데이터가 지워지면 사라져요. 가끔 파일로 백업해
          두세요.
        </p>
        <div className="setting-actions">
          <button className="small-btn accent" onClick={handleExport}>
            <Icon name="download" size={14} /> 파일로 백업
          </button>
          <button className="small-btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={14} /> 백업 불러오기
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleImport} />
        </div>
        <p className="setting-note">
          현재 기록 {data.logs.length}건 · 약속 {data.agreements.length}개 · 체크인{' '}
          {(data.checkins || []).length}일
        </p>
      </div>

      <div className="setting-card">
        <h3>
          <Icon name="heart" size={16} /> 마음결은
        </h3>
        <p>
          함께 쓰는 싸움 기록장이 아니라, <strong>각자 쓰고 필요한 만큼만 공유하는 관계 조율
          노트</strong>예요. 기록의 목적은 잘잘못을 가리는 것이 아니라, 반복되는 패턴을 확인하고 다음
          대화를 준비하는 것입니다.
        </p>
      </div>

      <div className="setting-card">
        <h3>
          <Icon name="share" size={16} /> 커플 연결
        </h3>
        <p>
          각자의 계정을 연결코드로 잇고, 선택 공유한 내용만 함께 보는 기능은 다음 버전에서 제공될
          예정이에요.
        </p>
      </div>

      <div className="setting-card warn">
        <h3>
          <Icon name="alert" size={16} /> 안전 안내
        </h3>
        <p>
          이 앱은 부부상담, 정신건강 진단, 법률 판단, 긴급 구조 서비스를 대체하지 않습니다. 폭력,
          협박, 감금, 반복적인 공포감이 있는 경우에는 앱 기록보다 안전 확보와 전문기관의 도움 요청이
          우선입니다.
        </p>
      </div>

      <button
        className="danger-btn"
        onClick={() => {
          if (confirm('모든 기록과 약속을 삭제할까요? 되돌릴 수 없어요.')) {
            clearData()
            setData(loadData())
          }
        }}
      >
        <Icon name="trash" size={15} /> 모든 데이터 삭제
      </button>

      <p className="version-line">마음결 v0.2 — 로컬 프로토타입</p>
    </div>
  )
}
