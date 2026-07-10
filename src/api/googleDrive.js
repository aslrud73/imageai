// Google Drive 자동 백업 계층 (선택 기능).
// - 사용자가 "연결하기"를 누르면 구글 공식 로그인/승인 팝업(OAuth)이 뜬다.
//   앱은 비밀번호를 전혀 알 수 없고, drive.file 범위라 "이 앱이 만든 파일"에만 접근한다.
// - VITE_GOOGLE_CLIENT_ID 가 설정되지 않으면 기능 전체가 "준비 중"으로 비활성화된다.
// - 개발자 비용 0원: 저장 용량은 각 사용자 본인의 드라이브를 쓴다.
import { exportBackup, parseBackup } from '../store'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES =
  'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email'
const FILE_NAME = 'maumgyeol-backup.json'
const STATUS_KEY = 'maumgyeol_drive'

let accessToken = null
let tokenExpiresAt = 0
let gsiPromise = null
let autoTimer = null

export function isDriveConfigured() {
  return !!CLIENT_ID
}

export function getDriveStatus() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY))
  } catch {
    return null
  }
}

function setDriveStatus(status) {
  if (status) localStorage.setItem(STATUS_KEY, JSON.stringify(status))
  else localStorage.removeItem(STATUS_KEY)
}

// 구글 로그인 스크립트를 필요할 때 1회만 로드
function loadGsi() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = resolve
    s.onerror = () => {
      gsiPromise = null
      reject(new Error('구글 로그인 스크립트를 불러오지 못했어요. 네트워크를 확인해 주세요.'))
    }
    document.head.appendChild(s)
  })
  return gsiPromise
}

function hasValidToken() {
  return !!accessToken && Date.now() < tokenExpiresAt
}

// 승인 팝업을 통해 접근 토큰 발급 (약 1시간 유효)
async function requestToken() {
  await loadGsi()
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error === 'access_denied' ? '승인이 취소되었어요.' : resp.error))
          return
        }
        accessToken = resp.access_token
        tokenExpiresAt = Date.now() + (Number(resp.expires_in || 3600) - 60) * 1000
        resolve(accessToken)
      },
      error_callback: (err) => reject(new Error(err?.message || '승인 창이 닫혔어요.')),
    })
    client.requestAccessToken()
  })
}

async function ensureToken() {
  if (hasValidToken()) return accessToken
  return requestToken()
}

async function api(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { Authorization: `Bearer ${accessToken}`, ...(opts.headers || {}) },
  })
  if (!res.ok) throw new Error(`Drive 요청 실패 (${res.status})`)
  return res
}

async function findBackupFile() {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`)
  const res = await api(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`)
  const json = await res.json()
  return json.files?.[0] || null
}

// 최초 연결: 승인 → 이메일 확인 → 상태 저장
export async function connectDrive() {
  await ensureToken()
  let email = ''
  try {
    const res = await api('https://www.googleapis.com/oauth2/v3/userinfo')
    email = (await res.json()).email || ''
  } catch {
    /* 이메일 표시는 부가 정보일 뿐 */
  }
  setDriveStatus({
    email,
    connectedAt: new Date().toISOString(),
    lastBackupAt: getDriveStatus()?.lastBackupAt || null,
  })
  return { email }
}

// 드라이브에 백업 (기존 파일이 있으면 덮어쓰기)
export async function backupToDrive(data) {
  await ensureToken()
  const content = exportBackup(data)
  const existing = await findBackupFile()
  if (existing) {
    await api(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    })
  } else {
    const boundary = `maumgyeol${Date.now()}`
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify({ name: FILE_NAME }),
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n')
    await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    })
  }
  setDriveStatus({ ...(getDriveStatus() || {}), lastBackupAt: new Date().toISOString() })
}

// 드라이브 백업에서 복원 (없으면 null)
export async function restoreFromDrive() {
  await ensureToken()
  const existing = await findBackupFile()
  if (!existing) return null
  const res = await api(`https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`)
  return parseBackup(await res.text())
}

export function disconnectDrive() {
  if (accessToken && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(accessToken)
    } catch {
      /* 이미 만료된 토큰이어도 무방 */
    }
  }
  accessToken = null
  tokenExpiresAt = 0
  setDriveStatus(null)
}

// 데이터가 바뀔 때 자동 백업 — 연결돼 있고 토큰이 살아있는 동안만.
// (토큰이 만료됐으면 팝업을 띄우지 않고 조용히 건너뜀 — 다음 수동 백업 때 갱신)
export function maybeAutoBackup(data) {
  if (!isDriveConfigured() || !getDriveStatus() || !hasValidToken()) return
  clearTimeout(autoTimer)
  autoTimer = setTimeout(() => {
    backupToDrive(data).catch(() => {})
  }, 3000)
}
