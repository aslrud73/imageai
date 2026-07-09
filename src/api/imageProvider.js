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
  buildImageUrl({ prompt, width, height, seed, model = 'flux' }) {
    const encoded = encodeURIComponent(prompt)
    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      seed: String(seed),
      model,
      nologo: 'true',
    })
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

// 현재 활성 제공자로 이미지 URL 하나 생성 (개별 카드의 수정·업스케일에서 사용)
export function buildImageUrl(opts) {
  return getProvider().buildImageUrl(opts)
}

// 여러 장의 변형(variation)을 만들기 위한 URL 배열 생성.
// 서로 다른 seed 를 써서 교사가 미리보기 후 마음에 드는 것을 고를 수 있게 한다.
export function buildVariations({ prompt, width, height, count, seedBase }) {
  const provider = getProvider()
  const urls = []
  for (let i = 0; i < count; i++) {
    const seed = seedBase + i * 1000
    urls.push({ seed, url: provider.buildImageUrl({ prompt, width, height, seed }) })
  }
  return urls
}
