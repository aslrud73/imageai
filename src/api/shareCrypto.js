// 공유 코드 암호화 — 서버 없이 부부가 코드를 주고받기 위한 계층.
// 두 사람이 정한 교환 PIN으로 PBKDF2(15만회) 키를 유도해 AES-GCM으로 암호화한다.
// 코드가 카톡·문자를 지나가더라도 PIN 없이는 내용을 읽을 수 없다.
const enc = new TextEncoder()
const dec = new TextDecoder()

const PREFIX = 'MG1.' // 포맷 버전

function toB64url(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s) {
  let t = s.replace(/-/g, '+').replace(/_/g, '/')
  while (t.length % 4) t += '='
  const bin = atob(t)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function deriveKey(pin, salt) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// 객체 → 암호화된 공유 코드 문자열
export async function encryptToCode(obj, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(pin, salt)
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))),
  )
  const all = new Uint8Array(16 + 12 + ct.length)
  all.set(salt)
  all.set(iv, 16)
  all.set(ct, 28)
  return PREFIX + toB64url(all)
}

// 공유 코드 + PIN → 원본 객체 (실패 시 null: 코드 손상 또는 PIN 불일치)
export async function decryptFromCode(code, pin) {
  try {
    const trimmed = code.trim()
    if (!trimmed.startsWith(PREFIX)) return null
    const all = fromB64url(trimmed.slice(PREFIX.length))
    const salt = all.slice(0, 16)
    const iv = all.slice(16, 28)
    const ct = all.slice(28)
    const key = await deriveKey(pin, salt)
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
    return JSON.parse(dec.decode(pt))
  } catch {
    return null
  }
}
