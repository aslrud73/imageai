// 로컬 프로토타입 저장소: 모든 데이터는 이 기기(localStorage)에만 저장된다.
// 기획서 원칙 — 기본 비공개, 공유는 선택 행위, 공유 패킷과 개인 기록 분리.
const KEY = 'maumgyeol_v1'

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* 손상된 데이터는 초기화 */
  }
  return { logs: [], agreements: [] }
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

export function weekKey(date = new Date()) {
  // 월요일 시작 주차 키 (약속 이행 체크 단위)
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

export function daysAgo(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}
