const encoder = new TextEncoder()
const decoder = new TextDecoder()

const ACTIVE_KID = 'main-key-v1'

const KEY_RING = {
  'main-key-v1': 'SUGARFUN_F2E_TEAM_CRYPTO_KEY_VAL',
}

const PBKDF2_CONFIG = {
  salt: 'sugarfun-salt-v1',
  iterations: 100000,
  hash: 'SHA-256',
}

const AES_CONFIG = {
  name: 'AES-GCM',
  length: 256,
  ivLength: 12,
}

const URL_TOKEN_SECRET = 'SUGARFUN_URL_TOKEN_F2E'

const isPlainObject = (value) => {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

const fromBase64 = (base64) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes.buffer
}

const toUrlSafeBase64 = (text) => {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const fromUrlSafeBase64 = (text) => {
  const base64 = text
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(text.length / 4) * 4, '=')

  return atob(base64)
}

const xorText = (text, secret) => {
  let result = ''

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length)
    result += String.fromCharCode(code)
  }

  return result
}

export const onHashHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const onSha256 = async (text) => {
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return onHashHex(hashBuffer)
}

export const onShortHash = (text, length = 8) => {
  let hash = 5381

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33) ^ text.charCodeAt(i)
  }

  const value = hash >>> 0
  return value.toString(36).slice(0, length)
}

const getAesKey = async (password) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(PBKDF2_CONFIG.salt),
      iterations: PBKDF2_CONFIG.iterations,
      hash: PBKDF2_CONFIG.hash,
    },
    keyMaterial,
    {
      name: AES_CONFIG.name,
      length: AES_CONFIG.length,
    },
    false,
    ['encrypt', 'decrypt']
  )
}

const serializeValue = (input) => {
  if (input === null) {
    return { t: 'null', v: null }
  }

  if (input instanceof Date) {
    return { t: 'date', v: input.toISOString() }
  }

  if (Array.isArray(input)) {
    return {
      t: 'array',
      v: input.map((item) => serializeValue(item)),
    }
  }

  switch (typeof input) {
    case 'string':
      return { t: 'string', v: input }

    case 'number':
      if (!Number.isFinite(input)) {
        throw new TypeError('Unsupported number value')
      }
      return { t: 'number', v: input }

    case 'boolean':
      return { t: 'boolean', v: input }

    case 'object': {
      if (!isPlainObject(input)) {
        throw new TypeError('Unsupported object value')
      }

      const output = {}

      for (const [key, value] of Object.entries(input)) {
        if (typeof value === 'undefined') continue
        output[key] = serializeValue(value)
      }

      return { t: 'object', v: output }
    }

    default:
      throw new TypeError(`Unsupported input type: ${typeof input}`)
  }
}

const deserializeValue = (input) => {
  switch (input.t) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
      return input.v

    case 'date':
      return new Date(input.v)

    case 'array':
      return input.v.map((item) => deserializeValue(item))

    case 'object': {
      const output = {}

      for (const [key, value] of Object.entries(input.v)) {
        output[key] = deserializeValue(value)
      }

      return output
    }

    default:
      return undefined
  }
}

const parsePayload = (cipherText) => {
  const parsed = JSON.parse(atob(cipherText))

  if (parsed.v !== 1) throw new Error('Unsupported payload version')
  if (parsed.alg !== 'AES-GCM') throw new Error('Unsupported encryption algorithm')
  if (!parsed.kid || !(parsed.kid in KEY_RING)) throw new Error('Unsupported key id')
  if (!parsed.iv || !parsed.data) throw new Error('Invalid payload')

  return parsed
}

export const onEnCrypto = async (input) => {
  const password = KEY_RING[ACTIVE_KID]
  const key = await getAesKey(password)
  const iv = crypto.getRandomValues(new Uint8Array(AES_CONFIG.ivLength))

  const serialized = serializeValue(input)
  const plainText = JSON.stringify(serialized)

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: AES_CONFIG.name, iv },
    key,
    encoder.encode(plainText)
  )

  const payload = {
    v: 1,
    alg: 'AES-GCM',
    kid: ACTIVE_KID,
    iv: toBase64(iv.buffer),
    data: toBase64(encryptedBuffer),
  }

  return btoa(JSON.stringify(payload))
}

export const onDeCrypto = async (cipherText) => {
  if (!cipherText) return null

  try {
    const payload = parsePayload(cipherText)
    const key = await getAesKey(KEY_RING[payload.kid])

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: payload.alg,
        iv: new Uint8Array(fromBase64(payload.iv)),
      },
      key,
      fromBase64(payload.data)
    )

    const serialized = JSON.parse(decoder.decode(decryptedBuffer))
    return deserializeValue(serialized)
  } catch {
    return null
  }
}

export const onEnDeToken = (value) => {
  const serialized = JSON.stringify(value)
  const mixed = xorText(serialized, URL_TOKEN_SECRET)

  const payload = {
    d: mixed,
    s: onShortHash(`${mixed}${URL_TOKEN_SECRET}`, 10),
  }

  return toUrlSafeBase64(JSON.stringify(payload))
}

export const onDeToken = (token) => {
  if (!token || !token.trim()) return null

  try {
    const decoded = fromUrlSafeBase64(token)
    const payload = JSON.parse(decoded)

    if (!payload?.d || !payload?.s) return null

    const expected = onShortHash(`${payload.d}${URL_TOKEN_SECRET}`, 10)

    if (payload.s !== expected) return null

    const text = xorText(payload.d, URL_TOKEN_SECRET)

    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  } catch {
    return null
  }
}
