// 사이즈(ASPECTS): 가로세로 비율 + 표준/고화질 두 단계.
// 고화질은 인쇄용, 표준은 화면 표시용. (해상도가 낮으면 결과물 질이 떨어져 기본을 1024px급으로 유지)
export const ASPECTS = [
  { id: '1:1', label: '정사각형', hint: '1024×1024', standard: [1024, 1024], high: [1536, 1536] },
  { id: '4:3', label: '가로 (4:3)', hint: '1152×864', standard: [1152, 864], high: [1600, 1200] },
  { id: '16:9', label: '와이드 (16:9)', hint: '1280×720', standard: [1280, 720], high: [1920, 1080] },
  { id: '3:4', label: '세로 (3:4)', hint: '864×1152', standard: [864, 1152], high: [1200, 1600] },
  { id: 'A4', label: 'A4 세로', hint: '인쇄물', standard: [1024, 1448], high: [1240, 1754] },
]

export function getAspect(id) {
  return ASPECTS.find((a) => a.id === id) || ASPECTS[0]
}

// 기본적인 안전 필터 한 겹: 부적절 키워드가 포함된 주제는 생성을 막는다.
// (교사용이라 human-in-the-loop 이지만 최소한의 방어선)
const BLOCKED = [
  'nude', 'naked', 'nsfw', 'sex', 'porn', 'erotic', 'blood', 'gore',
  'gun', 'weapon', 'kill', 'drug', '누드', '성인', '야한', '폭력', '음란',
]

export function checkSafety(subject) {
  const lower = subject.toLowerCase()
  const hit = BLOCKED.find((w) => lower.includes(w))
  return hit ? { ok: false, word: hit } : { ok: true }
}
