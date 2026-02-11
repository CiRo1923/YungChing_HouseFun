import CryptoJS from 'crypto-js'

export const KEY = CryptoJS.enc.Utf8.parse('HOUSEFUN_BUY_NEWHOUSE_RENT_PRICE')
export const IV = CryptoJS.enc.Utf8.parse('housefun_to_nuxt')
const enString = (string) => {
  return `'${string}'`
}
const deString = (string) => {
  return string.replace(/^'|'$/g, '')
}
export const enCrypto = (string, type) => {
  const content =
    typeof string !== 'string'
      ? typeof string === 'number' || typeof string === 'boolean'
        ? string
        : JSON.stringify(string)
      : enString(string)
  const srcs = CryptoJS.enc.Utf8.parse(content)
  const encrypted = CryptoJS.AES.encrypt(srcs, KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

export const deCrypto = (string) => {
  if (string) {
    const decrypt = CryptoJS.AES.decrypt(string, KEY, {
      iv: IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })
    const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8)
    const decryptContent = decryptedStr.toString()

    return /^({|\[).*(}|\])$/.test(decryptContent)
      ? JSON.parse(decryptContent)
      : /^\d+$/.test(decryptContent)
        ? Number(decryptContent)
        : /^'.*'$/.test(decryptContent)
          ? deString(decryptContent)
          : decryptContent === 'true'
  } else {
    return ''
  }
}

export const sha256Crypto = (string) => {
  return CryptoJS.SHA256(string).toString(CryptoJS.enc.Hex)
}

export const hashHex = (string, length) => {
  return enCrypto(string).toLocaleLowerCase().split('').reverse().join('').slice(0, length)
}
