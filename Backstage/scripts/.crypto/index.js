// 加解密對外入口:集中專案設定(KEY / IV),並組裝 core 引擎為對外 API(同步、大寫 Hex,與舊 crypto-js 相容)。
import {
  cbcEncrypt,
  cbcDecrypt,
  bytesToHex,
  hexToBytes,
  bytesToBase64url,
  base64urlToBytes,
  utf8Encode,
  utf8Decode,
  serializeValue,
  parseValue,
  shortHash,
} from './core.js'

// ---- 設定(沿用舊值,確保既有已加密網址仍可解回)----
export const KEY = 'HOUSEFUN_BUY_NEWHOUSE_RENT_PRICE' // 32 bytes → AES-256
export const IV = 'HOUSEFUN_URL_TOKEN_F2E' // 16 bytes → 區塊長度

const keyBytes = utf8Encode(KEY)
const ivBytes = utf8Encode(IV)

// ---- 對外 API ----
// 值可以是字串以外的型別(物件 / 陣列 / 布林),core 的 serializeValue 會處理,
// 解密時由 parseValue 還原 —— 呼叫端不必自己 JSON.stringify / JSON.parse。
export const enCrypto = (value) => {
  const cipher = cbcEncrypt(utf8Encode(serializeValue(value)), keyBytes, ivBytes)
  return bytesToHex(cipher).toUpperCase()
}

// 解密並還原成原本的型別;空值 / 格式錯誤 / 竄改一律回傳 null(不丟例外),
// 讓呼叫端能安全判斷失敗。
export const deCrypto = (string) => {
  if (!string) return null
  try {
    return parseValue(utf8Decode(cbcDecrypt(hexToBytes(String(string)), keyBytes, ivBytes)))
  } catch {
    return null
  }
}

// ---- 短版 API(同一套 AES + KEY / IV,只把輸出換成 Base64url)----
// 長度約為 hex 版的 2/3、且為 URL-safe 字元,較不易被安全過濾器誤判為釣魚字串。
// 與 hex 版彼此不通用(編碼不同),請成對使用。
export const enCryptoShort = (value) => {
  const cipher = cbcEncrypt(utf8Encode(serializeValue(value)), keyBytes, ivBytes)
  return bytesToBase64url(cipher)
}

// 解密並還原成原本的型別;空值 / 格式錯誤 / 竄改一律回傳 null(不丟例外)。
export const deCryptoShort = (string) => {
  if (!string) return null
  try {
    return parseValue(utf8Decode(cbcDecrypt(base64urlToBytes(String(string)), keyBytes, ivBytes)))
  } catch {
    return null
  }
}

// 圖片快取破壞用的短雜湊。
export const hashHex = (string, length = 8) => shortHash(String(string), length)
