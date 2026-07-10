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
  newId,
} from '../store'
import { encryptToCode, decryptFromCode } from '../api/shareCrypto'
import {
  isDriveConfigured,
  getDriveStatus,
  connectDrive,
  backupToDrive,
  restoreFromDrive,
  disconnectDrive,
} from '../api/googleDrive'

// 접을 수 있는 설정 섹션 (아코디언)
function Section({ icon, title, warn = false, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`setting-card ${warn ? 'warn' : ''}`}>
      <button type="button" className="setting-head" onClick={() => setOpen(!open)}>
        <h3>
          <Icon name={icon} size={16} /> {title}
        </h3>
        <span className={`expand-arrow ${open ? 'up' : ''}`}>
          <Icon name="chevronRight" size={15} />
        </span>
      </button>
      {open && <div className="setting-body">{children}</div>}
    </div>
  )
}

export default function Settings({ data, setData }) {
  const fileRef = useRef(null)
  const fullRef = useRef(null)
  const [pinOn, setPinOn] = useState(!!getPinHash())
  const [pinStep, setPinStep] = useState(null) // null | 'new' | 'confirm'
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [drive, setDrive] = useState(getDriveStatus())
  const [driveBusy, setDriveBusy] = useState('')

  // ── Google Drive 백업 ──────────────────
  async function handleDriveConnect() {
    setDriveBusy('connect')
    try {
      await connectDrive()
      await backupToDrive(data) // 연결 직후 첫 백업까지
      setDrive(getDriveStatus())
    } catch (err) {
      alert(`연결에 실패했어요.\n${err.message}`)
    } finally {
      setDriveBusy('')
    }
  }

  async function handleDriveBackup() {
    setDriveBusy('backup')
    try {
      await backupToDrive(data)
      setDrive(getDriveStatus())
    } catch (err) {
      alert(`백업에 실패했어요.\n${err.message}`)
    } finally {
      setDriveBusy('')
    }
  }

  async function handleDriveRestore() {
    setDriveBusy('restore')
    try {
      const restored = await restoreFromDrive()
      if (!restored) {
        alert('드라이브에 저장된 백업이 아직 없어요.')
        return
      }
      if (
        confirm(
          `드라이브 백업에서 기록 ${restored.logs.length}건, 약속 ${restored.agreements.length}개를 찾았어요.\n\n지금 기기의 데이터를 이 백업으로 교체할까요?`,
        )
      ) {
        setData(restored)
      }
    } catch (err) {
      alert(`복원에 실패했어요.\n${err.message}`)
    } finally {
      setDriveBusy('')
    }
  }

  function handleDriveDisconnect() {
    if (confirm('Google Drive 연결을 해제할까요?\n드라이브에 이미 저장된 백업 파일은 그대로 남아요.')) {
      disconnectDrive()
      setDrive(null)
    }
  }

  const fmtTime = (iso) => {
    if (!iso) return null
    const d = new Date(iso)
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

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

  // ── 전체 기록 전달: 메모까지 포함해 암호화 파일로 ────
  async function exportFullForPartner() {
    if (
      !confirm(
        '전체 전달에는 비공개 메모를 포함한 모든 기록 내용이 담겨요.\n\n선택 공유와 달리 전부 보이게 됩니다. 계속할까요?',
      )
    )
      return
    const pin = prompt('교환 PIN을 정해 주세요 (4자리 이상, 상대와 약속한 번호)')
    if (!pin || pin.trim().length < 4) {
      if (pin !== null) alert('PIN은 4자리 이상이어야 해요.')
      return
    }
    const code = await encryptToCode({ v: 1, kind: 'full', logs: data.logs }, pin.trim())
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `마음결_전체공유_${todayKey()}.mgshare`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function importFullFromPartner(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const pin = prompt('상대와 약속한 교환 PIN을 입력해 주세요')
      if (!pin) return
      const packet = await decryptFromCode(String(reader.result), pin.trim())
      if (!packet || packet.kind !== 'full' || !Array.isArray(packet.logs)) {
        alert('파일이나 PIN이 맞지 않아요.')
        return
      }
      setData({
        ...data,
        received: [
          ...(data.received || []),
          { id: newId('rcv'), receivedAt: new Date().toISOString(), kind: 'full', logs: packet.logs },
        ],
      })
      alert(`상대의 기록 ${packet.logs.length}건을 받았어요. "우리 패턴"에서 확인할 수 있어요.`)
    }
    reader.readAsText(file)
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
      <Section icon="key" title="기록 잠금 (PIN)" defaultOpen={!pinOn}>
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
      </Section>

      {/* 백업 / 복원 */}
      <Section icon="download" title="백업 / 복원">
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
      </Section>

      {/* Google Drive 자동 백업 */}
      <Section icon="cloud" title="Google Drive 자동 백업">
        {!isDriveConfigured() ? (
          <p>
            내 구글 드라이브에 자동으로 백업하는 기능이에요. <strong>준비 중</strong> — 관리자가 구글
            클라이언트 ID를 설정하면 활성화됩니다.
          </p>
        ) : !drive ? (
          <>
            <p>
              연결해 두면 기록이 바뀔 때마다 <strong>내 구글 드라이브</strong>에 자동 백업돼요. 앱은
              비밀번호를 알 수 없고, 이 앱이 만든 백업 파일 하나에만 접근합니다.
            </p>
            <div className="setting-actions">
              <button className="small-btn accent" disabled={!!driveBusy} onClick={handleDriveConnect}>
                <Icon name="cloud" size={14} /> {driveBusy === 'connect' ? '연결 중…' : 'Google Drive 연결하기'}
              </button>
            </div>
            <p className="setting-note">
              베타 기능 — 현재는 등록된 테스트 사용자만 연결할 수 있어요. 연결 시 "확인되지 않은 앱"
              안내가 뜨면 아직 명단에 없는 계정이에요. 일반 백업은 위의 파일 백업을 이용해 주세요.
            </p>
          </>
        ) : (
          <>
            <p>
              연결됨{drive.email ? `: ${drive.email}` : ''}
              {drive.lastBackupAt && (
                <>
                  <br />
                  마지막 백업: {fmtTime(drive.lastBackupAt)}
                </>
              )}
            </p>
            <div className="setting-actions">
              <button className="small-btn accent" disabled={!!driveBusy} onClick={handleDriveBackup}>
                {driveBusy === 'backup' ? '백업 중…' : '지금 백업'}
              </button>
              <button className="small-btn" disabled={!!driveBusy} onClick={handleDriveRestore}>
                {driveBusy === 'restore' ? '복원 중…' : '드라이브에서 복원'}
              </button>
              <button className="small-btn danger" disabled={!!driveBusy} onClick={handleDriveDisconnect}>
                연결 해제
              </button>
            </div>
            <p className="setting-note">
              오랜 시간이 지나면 보안을 위해 구글 승인 창이 다시 뜰 수 있어요. 새 기기에서는 연결 후
              "드라이브에서 복원"을 누르면 기록이 돌아와요.
            </p>
          </>
        )}
      </Section>

      {/* 전체 기록 전달 */}
      <Section icon="share" title="전체 기록 전달 (상대에게)">
        <p>
          내 기록 전체를 <strong>비공개 메모까지 포함해</strong> 상대에게 전할 수 있어요. 교환 PIN으로
          암호화된 파일이 만들어지며, 카톡·메일 등으로 보내면 상대가 파일과 PIN으로 열어요.
        </p>
        <div className="setting-actions">
          <button className="small-btn accent" onClick={exportFullForPartner}>
            <Icon name="share" size={14} /> 전체 전달 파일 만들기
          </button>
          <button className="small-btn" onClick={() => fullRef.current?.click()}>
            <Icon name="upload" size={14} /> 상대의 전체 기록 열기
          </button>
          <input ref={fullRef} type="file" accept=".mgshare,text/plain" hidden onChange={importFullFromPartner} />
        </div>
        <p className="setting-note">
          선택 공유와 달리 모든 내용이 보이게 되는 방식이에요. 신중하게, 준비가 되었을 때 사용하세요.
        </p>
      </Section>

      <Section icon="heart" title="마음결은">
        <p>
          함께 쓰는 싸움 기록장이 아니라, <strong>각자 쓰고 필요한 만큼만 공유하는 관계 조율
          노트</strong>예요. 기록의 목적은 잘잘못을 가리는 것이 아니라, 반복되는 패턴을 확인하고 다음
          대화를 준비하는 것입니다.
        </p>
        <ul className="intro-points">
          <li>
            <Icon name="lock" size={15} />
            <span>
              <strong>기본 비공개</strong> — 내 감정 기록은 나만 볼 수 있어요. 상대에게 자동으로
              공개되지 않아요.
            </span>
          </li>
          <li>
            <Icon name="share" size={15} />
            <span>
              <strong>선택 공유</strong> — 공유할 항목은 내가 고르고, 상대에게 보일 모습을 미리
              확인해요.
            </span>
          </li>
          <li>
            <Icon name="handshake" size={15} />
            <span>
              <strong>함께 조율</strong> — 잘잘못을 가리는 대신, 반복되는 패턴을 보고 작은 약속을
              만들어요.
            </span>
          </li>
        </ul>
      </Section>

      <Section icon="alert" title="안전 안내" warn>
        <p>
          이 앱은 부부상담, 정신건강 진단, 법률 판단, 긴급 구조 서비스를 대체하지 않습니다. 폭력,
          협박, 감금, 반복적인 공포감이 있는 경우에는 앱 기록보다 안전 확보와 전문기관의 도움 요청이
          우선입니다.
        </p>
      </Section>

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

      <p className="version-line">
        마음결 v0.2 ·{' '}
        <a className="policy-link" href="/privacy.html" target="_blank" rel="noopener noreferrer">
          개인정보처리방침
        </a>
      </p>
    </div>
  )
}
