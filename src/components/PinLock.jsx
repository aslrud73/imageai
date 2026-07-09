import { useState } from 'react'
import Icon from './Icons'
import { hashPin, getPinHash, clearData, removePin } from '../store'

// 앱 진입 잠금 화면: 4자리 PIN.
// PIN을 잊으면 복구 수단이 없으므로(로컬 전용), 모든 데이터 삭제로만 초기화할 수 있다.
export default function PinLock({ onUnlock }) {
  const [entered, setEntered] = useState('')
  const [shake, setShake] = useState(false)

  async function press(n) {
    if (entered.length >= 4 || shake) return
    const next = entered + n
    setEntered(next)
    if (next.length === 4) {
      const h = await hashPin(next)
      if (h === getPinHash()) {
        onUnlock()
      } else {
        setShake(true)
        setTimeout(() => {
          setEntered('')
          setShake(false)
        }, 650)
      }
    }
  }

  function backspace() {
    setEntered(entered.slice(0, -1))
  }

  function forgot() {
    if (
      confirm(
        'PIN을 잊으셨나요?\n\n이 앱의 기록은 기기 안에만 있어 PIN을 복구할 방법이 없어요. 초기화하려면 모든 기록·약속·체크인이 삭제됩니다.\n\n모든 데이터를 삭제하고 처음부터 시작할까요?',
      ) &&
      confirm('정말 삭제할까요? 되돌릴 수 없어요.')
    ) {
      clearData()
      removePin()
      localStorage.removeItem('maumgyeol_started')
      location.reload()
    }
  }

  return (
    <div className="pinlock">
      <span className="landing-mark">
        <Icon name="lock" size={26} strokeWidth={1.5} />
      </span>
      <h1 className="pin-title">마음결</h1>
      <p className="pin-sub">PIN 4자리를 입력해 주세요</p>

      <div className={`pin-dots ${shake ? 'shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pin-dot ${entered.length > i ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="pin-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} className="pin-key" onClick={() => press(String(n))}>
            {n}
          </button>
        ))}
        <span />
        <button className="pin-key" onClick={() => press('0')}>
          0
        </button>
        <button className="pin-key soft" onClick={backspace} aria-label="지우기">
          <Icon name="backspace" size={20} />
        </button>
      </div>

      <button className="pin-forgot" onClick={forgot}>
        PIN을 잊었어요
      </button>
    </div>
  )
}
