// 加解密對外入口:集中專案設定(KEY / IV),並組裝 core 引擎為對外 API(同步、大寫 Hex,與舊 crypto-js 相容)。
import {
  cbcEncrypt,
  cbcDecrypt,
  bytesToHex,
  hexToBytes,
  utf8Encode,
  utf8Decode,
  shortHash,
} from './core.js'

// ---- 設定(沿用舊值,確保既有已加密網址仍可解回)----
export const KEY = 'HOUSEFUN_BUY_NEWHOUSE_RENT_PRICE' // 32 bytes → AES-256
export const IV = 'HOUSEFUN_URL_TOKEN_F2E' // 16 bytes → 區塊長度

const keyBytes = utf8Encode(KEY)
const ivBytes = utf8Encode(IV)

// ---- 對外 API ----
export const enCrypto = (string) => {
  const cipher = cbcEncrypt(utf8Encode(String(string)), keyBytes, ivBytes)
  return bytesToHex(cipher).toUpperCase()
}

export const deCrypto = (string) => {
  if (!string) return ''
  try {
    return utf8Decode(cbcDecrypt(hexToBytes(String(string)), keyBytes, ivBytes))
  } catch {
    return ''
  }
}

// 圖片快取破壞用的短雜湊。
export const hashHex = (string, length = 8) => shortHash(String(string), length)
