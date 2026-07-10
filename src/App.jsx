import { useEffect, useState } from 'react'
import { loadData, saveData, getPinHash } from './store'
import Icon from './components/Icons'
import PinLock from './components/PinLock'
import Landing from './screens/Landing'
import Home from './screens/Home'
import RecordForm from './screens/RecordForm'
import Logs from './screens/Logs'
import Patterns from './screens/Patterns'
import Agreements from './screens/Agreements'
import Settings from './screens/Settings'

const TABS = [
  { id: 'home', label: '홈', icon: 'home' },
  { id: 'logs', label: '내 기록', icon: 'pen' },
  { id: 'patterns', label: '우리 패턴', icon: 'chart' },
  { id: 'agreements', label: '우리 약속', icon: 'handshake' },
  { id: 'settings', label: '설정', icon: 'gear' },
]

export default function App() {
  const [data, setData] = useState(loadData)
  const [tab, setTab] = useState('home')
  const [recording, setRecording] = useState(false)
  const [started, setStarted] = useState(() => localStorage.getItem('maumgyeol_started') === '1')
  // PIN이 설정돼 있으면 세션마다 잠금 화면부터 (탭 전환은 유지, 앱을 새로 열면 다시 잠김)
  const [locked, setLocked] = useState(
    () => !!getPinHash() && sessionStorage.getItem('maumgyeol_unlocked') !== '1',
  )

  useEffect(() => {
    saveData(data)
  }, [data])

  // 모든 화면이 이 함수 하나로 데이터를 갱신한다
  function update(fn) {
    setData((prev) => fn(structuredClone(prev)))
  }

  // 잠금이 최우선 (개인 기록 보호)
  if (locked) {
    return (
      <div className="app">
        <PinLock
          onUnlock={() => {
            sessionStorage.setItem('maumgyeol_unlocked', '1')
            setLocked(false)
          }}
        />
      </div>
    )
  }

  // 첫 방문: 메인(온보딩) 페이지
  if (!started) {
    return (
      <div className="app">
        <Landing
          onStart={() => {
            localStorage.setItem('maumgyeol_started', '1')
            setStarted(true)
          }}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <main className="screen">
        {recording ? (
          <RecordForm
            update={update}
            onDone={() => {
              setRecording(false)
              setTab('logs')
            }}
            onCancel={() => setRecording(false)}
          />
        ) : (
          <>
            {tab === 'home' && (
              <Home data={data} update={update} onRecord={() => setRecording(true)} goTab={setTab} />
            )}
            {tab === 'logs' && <Logs data={data} update={update} onRecord={() => setRecording(true)} />}
            {tab === 'patterns' && <Patterns data={data} update={update} />}
            {tab === 'agreements' && <Agreements data={data} update={update} />}
            {tab === 'settings' && <Settings data={data} setData={setData} />}
          </>
        )}
      </main>

      {!recording && (
        <nav className="tabbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={21} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
