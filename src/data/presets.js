// 유형(TYPES): 교사가 고르면 스타일 프롬프트가 자동으로 붙는다.
// {subject} 자리에 교사가 입력한 주제가 들어간다.
// 프롬프트는 이미지 모델이 가장 잘 알아듣는 영어 스타일 토큰으로 구성하고,
// 주제(한글)는 그대로 삽입한다.
export const TYPES = [
  {
    id: 'flashcard',
    label: '그림카드',
    emoji: '🃏',
    desc: '흰 배경, 사물 하나, 또렷한 외곽선. 낱말·플래시카드용',
    placeholder: '예: 사과, 강아지, 소방차',
    defaultAspect: '1:1',
    buildPrompt: (s) =>
      `simple cute illustration of ${s}, single object centered, thick clean outline, flat bright colors, plain white background, children's flashcard style, no text, friendly`,
  },
  {
    id: 'story',
    label: '이야기 삽화',
    emoji: '📖',
    desc: '동화책 그림체, 따뜻한 색감. 이야기·동화 자료용',
    placeholder: '예: 숲속에서 토끼가 당근을 먹는 장면',
    defaultAspect: '4:3',
    buildPrompt: (s) =>
      `storybook illustration of ${s}, warm soft colors, gentle lighting, children's picture book art style, whimsical, detailed cozy scene`,
  },
  {
    id: 'icon',
    label: '아이콘',
    emoji: '⬛',
    desc: '플랫·심플한 아이콘. 학습지·시간표·UI용',
    placeholder: '예: 연필, 시계, 우산',
    defaultAspect: '1:1',
    buildPrompt: (s) =>
      `flat minimal icon of ${s}, simple vector style, bold shapes, solid soft background, centered, clean, modern flat design, no text`,
  },
  {
    id: 'coloring',
    label: '색칠공부',
    emoji: '🖍️',
    desc: '흑백 라인아트. 인쇄해서 색칠하기용',
    placeholder: '예: 공룡, 꽃밭, 자동차',
    defaultAspect: 'A4',
    buildPrompt: (s) =>
      `black and white line art coloring page of ${s}, clean bold outlines only, no shading, no grayscale, pure white background, simple for young children to color, no text`,
  },
  {
    id: 'poster',
    label: '게시물/포스터',
    emoji: '📢',
    desc: '세로형, 여백 확보. 교실 게시·안내문용',
    placeholder: '예: 손 씻기, 교실 규칙, 계절 안내',
    defaultAspect: '3:4',
    buildPrompt: (s) =>
      `bright friendly classroom poster illustration about ${s}, vertical layout, cheerful, clear space at top for a title, appealing to young children, no text`,
  },
]

// 사이즈(ASPECTS): 가로세로 비율 + 표준/고화질 두 단계.
// 고화질은 인쇄용, 표준은 화면 표시용.
export const ASPECTS = [
  { id: '1:1', label: '정사각형', hint: '카드·아이콘', standard: [768, 768], high: [1024, 1024] },
  { id: '4:3', label: '가로 (4:3)', hint: '삽화·화면', standard: [1024, 768], high: [1280, 960] },
  { id: '16:9', label: '와이드 (16:9)', hint: '슬라이드', standard: [1024, 576], high: [1280, 720] },
  { id: '3:4', label: '세로 (3:4)', hint: '포스터', standard: [768, 1024], high: [960, 1280] },
  { id: 'A4', label: 'A4 세로', hint: '인쇄물', standard: [744, 1052], high: [1024, 1448] },
]

export function getAspect(id) {
  return ASPECTS.find((a) => a.id === id) || ASPECTS[0]
}

export function getType(id) {
  return TYPES.find((t) => t.id === id) || TYPES[0]
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
