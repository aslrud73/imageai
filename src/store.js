// 로컬 프로토타입 저장소: 모든 데이터는 이 기기(localStorage)에만 저장된다.
// 기획서 원칙 — 기본 비공개, 공유는 선택 행위, 공유 패킷과 개인 기록 분리.
const KEY = 'maumgyeol_v1'

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const d = JSON.parse(raw)
      // 구버전 데이터 마이그레이션: 없는 필드는 기본값으로
      return {
        logs: d.logs || [],
        agreements: d.agreements || [],
        checkins: d.checkins || [],
        received: d.received || [], // 상대가 공유 코드로 보내준 것들
      }
    }
  } catch {
    /* 손상된 데이터는 초기화 */
  }
  return { logs: [], agreements: [], checkins: [], received: [] }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function clearData() {
  localStorage.removeItem(KEY)
}

export function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

// ── 선택지 프리셋 (기획서 5·6장 기반) ──────────────────
export const TOPICS = ['집안일', '말투', '돈', '육아', '시간 약속', '가족', '휴대폰', '기타']

export const MY_REACTIONS = [
  '목소리가 커짐',
  '말을 멈춤',
  '자리를 피함',
  '눈물이 남',
  '같은 말을 반복함',
  '비꼬는 말투가 나옴',
]

export const PARTNER_REACTIONS = ['침묵', '대화 회피', '한숨', '반박', '자리를 뜸', '화제 전환']

export const EMOTION_LABELS = ['잔잔함', '조금 불편', '답답함', '많이 힘듦', '격함']

// ── 공유 가능 항목 정의 (권한 매트릭스 기반) ──────────────
export const SHARE_FIELDS = [
  { key: 'topics', label: '주제 태그', desc: '어떤 주제였는지' },
  { key: 'emotion', label: '감정 강도', desc: '1~5 단계 수치만' },
  { key: 'realNeed', label: '실제 욕구', desc: '내가 정말 바랐던 것' },
  { key: 'request', label: '요청 문장', desc: '상대에게 전하고 싶은 한 문장' },
]
// 자유 메모·나의 반응은 기획서 원칙상 공유 대상에서 제외 (가장 민감한 영역)

// ── 시간대 버킷 ──────────────────────────────
export function timeBucket(hhmm) {
  const h = parseInt(hhmm.split(':')[0], 10)
  if (h >= 5 && h < 11) return '아침'
  if (h >= 11 && h < 17) return '낮'
  if (h >= 17 && h < 22) return '저녁'
  return '밤'
}

// 로컬 기준 날짜 키 (YYYY-MM-DD) — 약속은 매일 체크한다
export function localDateKey(date = new Date()) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayKey() {
  return localDateKey(new Date())
}

// 이번 주(월~일) 7일의 날짜 키 배열
export function weekDates() {
  return weekDatesOffset(0)
}

// 기준 주에서 offset 주만큼 이동한 주(월~일)의 날짜 키 배열 (약속 주간 넘겨보기용)
export function weekDatesOffset(offset = 0) {
  const d = new Date()
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d)
    x.setDate(d.getDate() + i)
    return localDateKey(x)
  })
}

// 오늘부터 n일짜리 기간의 종료일 키
export function endDateAfter(days) {
  const d = new Date()
  d.setDate(d.getDate() + days - 1)
  return localDateKey(d)
}

// 두 날짜 키 사이의 일수 (양 끝 포함)
export function daysBetween(startKey, endKey) {
  return Math.round((new Date(endKey) - new Date(startKey)) / 86400000) + 1
}

export const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일']

// ── 매일 한 줄 체크인: 오늘 우리 사이 날씨 ─────────────
export const WEATHERS = [
  { id: 'sunny', label: '맑음', icon: 'sun' },
  { id: 'partly', label: '구름 조금', icon: 'cloudSun' },
  { id: 'cloudy', label: '흐림', icon: 'cloud' },
  { id: 'rain', label: '비', icon: 'rain' },
  { id: 'storm', label: '폭풍', icon: 'storm' },
]

export function getWeather(id) {
  return WEATHERS.find((w) => w.id === id)
}

// ── 기록 잠금(PIN): SHA-256 해시로 저장 ──────────────
const PIN_KEY = 'maumgyeol_pin'

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`maumgyeol:${pin}`))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function getPinHash() {
  return localStorage.getItem(PIN_KEY)
}

export async function setPin(pin) {
  localStorage.setItem(PIN_KEY, await hashPin(pin))
}

export function removePin() {
  localStorage.removeItem(PIN_KEY)
}

// ── 백업 / 복원 ─────────────────────────────
export function exportBackup(data) {
  return JSON.stringify(
    { app: 'maumgyeol', version: 1, exportedAt: new Date().toISOString(), data },
    null,
    2,
  )
}

// 백업 파일 검증: 형식이 맞으면 데이터를, 아니면 null 반환
export function parseBackup(text) {
  try {
    const obj = JSON.parse(text)
    if (obj.app !== 'maumgyeol' || !obj.data) return null
    const { logs, agreements, checkins, received } = obj.data
    if (!Array.isArray(logs) || !Array.isArray(agreements)) return null
    return {
      logs,
      agreements,
      checkins: Array.isArray(checkins) ? checkins : [],
      received: Array.isArray(received) ? received : [],
    }
  } catch {
    return null
  }
}

export function daysAgo(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}
