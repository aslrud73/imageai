// 이미지 생성 백엔드 어댑터.
// 현재는 무료 API(Pollinations, 키 불필요)로 시작하되,
// 나중에 안전 필터가 강한 유료 제공자로 쉽게 교체할 수 있도록 인터페이스를 분리해 둔다.
//
// 새 제공자를 추가하려면 아래 형태의 객체를 만들어 PROVIDERS 에 등록하면 된다.
//   {
//     id: 'my-provider',
//     name: '표시 이름',
//     // 옵션을 받아 <img src> 로 바로 쓸 수 있는 URL 을 돌려준다.
//     buildImageUrl({ prompt, width, height, seed }): string
//   }

const pollinations = {
  id: 'pollinations',
  name: 'Pollinations (무료)',
  buildImageUrl({ prompt, width, height, seed, model = 'flux', enhance = false }) {
    const encoded = encodeURIComponent(prompt)
    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      seed: String(seed),
      model,
      nologo: 'true',
      // 앱 식별용 referrer — 익명 사용 시 요청 허용량 확보에 도움
      referrer: 'classroom-image-maker',
    })
    // enhance: LLM 이 프롬프트에 디테일을 보강해 결과물 품질을 크게 올린다.
    // (라인아트·플랫 아이콘처럼 의도된 단순함이 필요한 유형에서는 끈다)
    if (enhance) params.set('enhance', 'true')
    return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`
  },
}

const PROVIDERS = {
  [pollinations.id]: pollinations,
}

// 현재 활성 제공자. 교체 시 이 값만 바꾸면 된다.
let activeProviderId = pollinations.id

export function getProvider() {
  return PROVIDERS[activeProviderId]
}

export function setProvider(id) {
  if (PROVIDERS[id]) activeProviderId = id
}

export function listProviders() {
  return Object.values(PROVIDERS)
}

// 현재 활성 제공자로 이미지 URL 생성 (카드의 생성·수정·업스케일에서 사용)
export function buildImageUrl(opts) {
  return getProvider().buildImageUrl(opts)
}
