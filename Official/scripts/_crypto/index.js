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

// 解密為字串;空值 / 格式錯誤 / 竄改一律回傳 null(不丟例外),讓呼叫端能安全判斷失敗。
export const deCrypto = (string) => {
  if (!string) return null
  try {
    return utf8Decode(cbcDecrypt(hexToBytes(String(string)), keyBytes, ivBytes))
  } catch {
    return null
  }
}

// 解密並解析為物件:任何失敗(空值 / 竄改 / 非 JSON 亂碼)皆回傳 null,絕不丟例外。
// CBC 無驗證標籤,竄改後可能解出亂碼,故連 JSON.parse 也一併保護。
export const deCryptoJSON = (string) => {
  const text = deCrypto(string)
  if (text == null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ---- 短版 API(同一套 AES + KEY / IV,只把輸出換成 Base64url)----
// 長度約為 hex 版的 2/3、且為 URL-safe 字元,較不易被安全過濾器誤判為釣魚字串。
// 與 hex 版彼此不通用(編碼不同),請成對使用。
export const enCryptoShort = (string) => {
  const cipher = cbcEncrypt(utf8Encode(String(string)), keyBytes, ivBytes)
  return bytesToBase64url(cipher)
}

// 解密為字串;空值 / 格式錯誤 / 竄改一律回傳 null(不丟例外)。
export const deCryptoShort = (string) => {
  if (!string) return null
  try {
    return utf8Decode(cbcDecrypt(base64urlToBytes(String(string)), keyBytes, ivBytes))
  } catch {
    return null
  }
}

// 解密並解析為物件:任何失敗皆回傳 null,絕不丟例外。
export const deCryptoShortJSON = (string) => {
  const text = deCryptoShort(string)
  if (text == null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// 圖片快取破壞用的短雜湊。
export const hashHex = (string, length = 8) => shortHash(String(string), length)
