// 한국어(또는 어떤 언어든) 설명 → 영어 이미지 프롬프트 변환 층.
// Flux 계열 모델은 영어 이해도가 훨씬 높아서, 한국어를 그대로 보내면
// 설명 속 요소(사물·행동·배경)가 누락되기 쉽다. imagefree 류 사이트들이
// 품질이 좋은 핵심 이유가 이 변환 층이다.
// 무료 텍스트 API(text.pollinations.ai, 키 불필요)를 사용한다.

const TIMEOUT_MS = 15000

// 반환: { prompt, refined } — refined=false 면 변환 실패로 원문을 그대로 쓴다는 뜻
export async function refinePrompt(description) {
  const instruction =
    'Translate the following image description into ONE concise English image-generation prompt (under 60 words). ' +
    'CRITICAL rules: (1) keep EVERY element of the description — every subject, object, action, place, time of day and mood must appear; ' +
    '(2) be concrete and specific, no vague poetic filler; ' +
    '(3) default to a photorealistic style unless the description asks for another style; ' +
    '(4) end with: lighting and composition in a few words. ' +
    'Output ONLY the prompt text, no quotes, no explanations.\n\n' +
    `Description: ${description}`

  const url = `https://text.pollinations.ai/${encodeURIComponent(instruction)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`status ${res.status}`)
    const text = (await res.text()).trim()
    // 비정상 응답 방어: 너무 짧거나 길면 변환 실패로 간주
    if (text.length < 10 || text.length > 2000) throw new Error('unexpected response')
    return { prompt: text, refined: true }
  } catch {
    // 실패 시 원문 그대로 사용 — 이 경우 이미지 API 쪽 enhance 로 보완한다
    return { prompt: description, refined: false }
  } finally {
    clearTimeout(timer)
  }
}
