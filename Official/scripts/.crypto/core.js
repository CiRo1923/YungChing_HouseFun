// AES 加解密核心引擎(純 JS,不依賴第三方):AES-128/192/256-CBC + PKCS7、Hex 與 UTF-8 編解碼、短雜湊。
// 本檔不含任何專案設定(KEY / IV),金鑰與 IV 一律由呼叫端傳入,設定集中在 ./index.js。

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const utf8Encode = (text) => encoder.encode(text)
export const utf8Decode = (bytes) => decoder.decode(bytes)

// ---- GF(2^8) 對數/反對數表(生成元 0x03),用於 S-box 與 MixColumns ----
const EXP = new Uint8Array(256)
const LOG = new Uint8Array(256)

;(() => {
  let x = 1
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x
    LOG[x] = i
    // x = x * 3 in GF(2^8),模數 0x11b
    x ^= (x << 1) ^ (x & 0x80 ? 0x11b : 0)
    x &= 0xff
  }
  EXP[255] = EXP[0]
})()

const gmul = (a, b) => {
  if (a === 0 || b === 0) return 0
  return EXP[(LOG[a] + LOG[b]) % 255]
}

const xtime = (a) => ((a << 1) ^ (a & 0x80 ? 0x11b : 0)) & 0xff

// ---- S-box / 反 S-box(由乘法反元素 + 仿射轉換即時產生)----
const SBOX = new Uint8Array(256)
const INV_SBOX = new Uint8Array(256)

;(() => {
  for (let i = 0; i < 256; i += 1) {
    const inv = i === 0 ? 0 : EXP[(255 - LOG[i]) % 255]
    let s = inv
    let rot = inv
    for (let j = 0; j < 4; j += 1) {
      rot = ((rot << 1) | (rot >> 7)) & 0xff
      s ^= rot
    }
    s = (s ^ 0x63) & 0xff
    SBOX[i] = s
    INV_SBOX[s] = i
  }
})()

// ---- 金鑰展開(Rijndael key schedule)----
const expandKey = (keyBytes) => {
  const Nk = keyBytes.length / 4
  const Nr = Nk + 6
  const total = 4 * (Nr + 1)
  const w = new Array(total)

  for (let i = 0; i < Nk; i += 1) {
    w[i] = [keyBytes[4 * i], keyBytes[4 * i + 1], keyBytes[4 * i + 2], keyBytes[4 * i + 3]]
  }

  let rcon = 1
  for (let i = Nk; i < total; i += 1) {
    let temp = w[i - 1].slice()

    if (i % Nk === 0) {
      temp = [SBOX[temp[1]], SBOX[temp[2]], SBOX[temp[3]], SBOX[temp[0]]] // RotWord + SubWord
      temp[0] ^= rcon
      rcon = xtime(rcon)
    } else if (Nk > 6 && i % Nk === 4) {
      temp = temp.map((b) => SBOX[b])
    }

    w[i] = [
      w[i - Nk][0] ^ temp[0],
      w[i - Nk][1] ^ temp[1],
      w[i - Nk][2] ^ temp[2],
      w[i - Nk][3] ^ temp[3],
    ]
  }

  return { w, Nr }
}

// ---- 單一 16-byte 區塊運算(state 以 column-major 排列:index = c*4 + r)----
const addRoundKey = (s, w, round) => {
  for (let c = 0; c < 4; c += 1) {
    const word = w[round * 4 + c]
    for (let r = 0; r < 4; r += 1) {
      s[c * 4 + r] ^= word[r]
    }
  }
}

const subBytes = (s, box) => {
  for (let i = 0; i < 16; i += 1) s[i] = box[s[i]]
}

const shiftRows = (s) => {
  const t = s.slice()
  for (let r = 1; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      s[c * 4 + r] = t[((c + r) % 4) * 4 + r]
    }
  }
}

const invShiftRows = (s) => {
  const t = s.slice()
  for (let r = 1; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      s[c * 4 + r] = t[((c - r + 4) % 4) * 4 + r]
    }
  }
}

const mixColumns = (s) => {
  for (let c = 0; c < 4; c += 1) {
    const a0 = s[c * 4]
    const a1 = s[c * 4 + 1]
    const a2 = s[c * 4 + 2]
    const a3 = s[c * 4 + 3]
    s[c * 4] = gmul(a0, 2) ^ gmul(a1, 3) ^ a2 ^ a3
    s[c * 4 + 1] = a0 ^ gmul(a1, 2) ^ gmul(a2, 3) ^ a3
    s[c * 4 + 2] = a0 ^ a1 ^ gmul(a2, 2) ^ gmul(a3, 3)
    s[c * 4 + 3] = gmul(a0, 3) ^ a1 ^ a2 ^ gmul(a3, 2)
  }
}

const invMixColumns = (s) => {
  for (let c = 0; c < 4; c += 1) {
    const a0 = s[c * 4]
    const a1 = s[c * 4 + 1]
    const a2 = s[c * 4 + 2]
    const a3 = s[c * 4 + 3]
    s[c * 4] = gmul(a0, 14) ^ gmul(a1, 11) ^ gmul(a2, 13) ^ gmul(a3, 9)
    s[c * 4 + 1] = gmul(a0, 9) ^ gmul(a1, 14) ^ gmul(a2, 11) ^ gmul(a3, 13)
    s[c * 4 + 2] = gmul(a0, 13) ^ gmul(a1, 9) ^ gmul(a2, 14) ^ gmul(a3, 11)
    s[c * 4 + 3] = gmul(a0, 11) ^ gmul(a1, 13) ^ gmul(a2, 9) ^ gmul(a3, 14)
  }
}

const encryptBlock = (block, w, Nr) => {
  const s = block.slice()
  addRoundKey(s, w, 0)
  for (let round = 1; round < Nr; round += 1) {
    subBytes(s, SBOX)
    shiftRows(s)
    mixColumns(s)
    addRoundKey(s, w, round)
  }
  subBytes(s, SBOX)
  shiftRows(s)
  addRoundKey(s, w, Nr)
  return s
}

const decryptBlock = (block, w, Nr) => {
  const s = block.slice()
  addRoundKey(s, w, Nr)
  for (let round = Nr - 1; round >= 1; round -= 1) {
    invShiftRows(s)
    subBytes(s, INV_SBOX)
    addRoundKey(s, w, round)
    invMixColumns(s)
  }
  invShiftRows(s)
  subBytes(s, INV_SBOX)
  addRoundKey(s, w, 0)
  return s
}

// ---- PKCS7 補齊 ----
const pkcs7Pad = (bytes) => {
  const padLen = 16 - (bytes.length % 16)
  const out = new Uint8Array(bytes.length + padLen)
  out.set(bytes)
  out.fill(padLen, bytes.length)
  return out
}

const pkcs7Unpad = (bytes) => {
  if (bytes.length === 0 || bytes.length % 16 !== 0) throw new Error('Invalid block length')
  const padLen = bytes[bytes.length - 1]
  if (padLen < 1 || padLen > 16) throw new Error('Invalid padding')
  return bytes.subarray(0, bytes.length - padLen)
}

// ---- Hex 編解碼 ----
export const bytesToHex = (bytes) => {
  let hex = ''
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return hex
}

export const hexToBytes = (hex) => {
  const clean = hex.trim()
  if (clean.length % 2 !== 0) throw new Error('Invalid hex length')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

// ---- Base64url 編解碼(URL-safe:-、_,無 = padding;不依賴 btoa/atob,SSR / client 皆可用)----
// 相較 Hex(每 byte 2 字元),Base64url 每 3 bytes 4 字元,長度約為 Hex 的 2/3,較不易被誤判為釣魚字串。
const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const B64URL_LOOKUP = (() => {
  const table = new Int16Array(128).fill(-1)
  for (let i = 0; i < B64URL.length; i += 1) table[B64URL.charCodeAt(i)] = i
  return table
})()

export const bytesToBase64url = (bytes) => {
  let out = ''
  let i = 0

  for (; i + 3 <= bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63] + B64URL[n & 63]
  }

  const rem = bytes.length - i
  if (rem === 1) {
    const n = bytes[i] << 16
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63]
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63]
  }

  return out
}

export const base64urlToBytes = (str) => {
  const clean = String(str).trim()
  const len = clean.length
  const rem = len % 4
  // 合法 Base64url 的長度 mod 4 只會是 0 / 2 / 3
  if (rem === 1) throw new Error('Invalid base64url length')

  const full = Math.floor(len / 4)
  const out = new Uint8Array(full * 3 + (rem === 2 ? 1 : rem === 3 ? 2 : 0))
  const val = (index) => {
    const v = B64URL_LOOKUP[clean.charCodeAt(index)]
    if (v < 0) throw new Error('Invalid base64url char')
    return v
  }

  let oi = 0
  let ci = 0
  for (let b = 0; b < full; b += 1) {
    const n = (val(ci) << 18) | (val(ci + 1) << 12) | (val(ci + 2) << 6) | val(ci + 3)
    out[oi++] = (n >> 16) & 0xff
    out[oi++] = (n >> 8) & 0xff
    out[oi++] = n & 0xff
    ci += 4
  }
  // 尾端補寫:oi 之後不再被讀取,故直接以位移索引寫入,不再遞增
  if (rem === 2) {
    const n = (val(ci) << 18) | (val(ci + 1) << 12)
    out[oi] = (n >> 16) & 0xff
  } else if (rem === 3) {
    const n = (val(ci) << 18) | (val(ci + 1) << 12) | (val(ci + 2) << 6)
    out[oi] = (n >> 16) & 0xff
    out[oi + 1] = (n >> 8) & 0xff
  }

  return out
}

// ---- AES-CBC(金鑰 / IV 由呼叫端傳入 Uint8Array)----
export const cbcEncrypt = (dataBytes, keyBytes, ivBytes) => {
  const { w, Nr } = expandKey(keyBytes)
  const padded = pkcs7Pad(dataBytes)
  const out = new Uint8Array(padded.length)
  let prev = ivBytes

  for (let offset = 0; offset < padded.length; offset += 16) {
    const block = padded.slice(offset, offset + 16)
    for (let i = 0; i < 16; i += 1) block[i] ^= prev[i]
    const enc = encryptBlock(block, w, Nr)
    out.set(enc, offset)
    prev = enc
  }

  return out
}

export const cbcDecrypt = (cipherBytes, keyBytes, ivBytes) => {
  const { w, Nr } = expandKey(keyBytes)
  const out = new Uint8Array(cipherBytes.length)
  let prev = ivBytes

  for (let offset = 0; offset < cipherBytes.length; offset += 16) {
    const block = cipherBytes.slice(offset, offset + 16)
    const dec = decryptBlock(block, w, Nr)
    for (let i = 0; i < 16; i += 1) dec[i] ^= prev[i]
    out.set(dec, offset)
    prev = block
  }

  return pkcs7Unpad(out)
}

// ---- 值的序列化 / 還原 ----
// 加解密只吃字串,但呼叫端常要存物件、陣列、布林,所以在這一層來回轉換。

// 字串原樣送出,其餘型別一律 JSON 序列化。
export const serializeValue = (value) => (typeof value === 'string' ? value : JSON.stringify(value))

// { 或 [ 開頭視為 JSON,true / false / null 視為原生值,其餘一律維持字串。
// ⚠️ 純數字字串刻意不轉回數字 —— guid、商品代碼這類值本來就是字串,
//    轉成數字會掉前導 0('007' → 7),也可能超過安全整數範圍。
export const parseValue = (text) => {
  if (typeof text !== 'string') return text

  const trimmed = text.trim()

  if (!/^[{[]/.test(trimmed) && !/^(true|false|null)$/.test(trimmed)) return text

  try {
    return JSON.parse(trimmed)
  } catch {
    // 竄改後可能解出「看起來像 JSON」的亂碼,解析失敗就當原字串
    return text
  }
}

// ---- 短雜湊(djb2):輸入穩定即可,不涉及加解密,供快取破壞等用途 ----
export const shortHash = (text, length = 8) => {
  let hash = 5381
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33) ^ text.charCodeAt(i)
  }
  return (hash >>> 0).toString(36).slice(0, length)
}
