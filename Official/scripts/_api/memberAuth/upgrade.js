import { fetchApi } from '@js/_api/memberAuth/.config.js'

// 發送 email 驗證碼
// req  { email }
// res  {
//        challengeToken: string,      // 驗證時要一併帶回,存 cookie(EMAILVERIFY)
//        expiresAt: string,           // ISO 8601,不使用 —— 見下方說明
//        resendAvailableAt: string,   // ISO 8601,可重新發送的時間
//        message: string,
//      }
//
// 為什麼不用 expiresAt:倒數結束後使用者會重新呼叫本 API,那時會拿到新的 challengeToken,
// 舊的自然作廢 → token 的生命週期實際上由「重送」決定,而不是 expiresAt。
// 因此 challengeToken 的 cookie 效期與重送倒數一律以 resendAvailableAt 為準。
export const apiPostMemberAuthEmailUpgradeEmailVerificationCode = async (data) =>
  await fetchApi.post(`member/auth/email-upgrade/email/verification-code`, data)

// 驗證 email 驗證碼
// req  { challengeToken, verificationCode }
// res  {
//        upgradeToken: string,   // 存 cookie(EMAILVERIFYTOKEN),後續 mobile/* 要放進
//                                // header X-Upgrade-Token
//        expiresAt: string,      // ISO 8601,upgradeToken 的失效時間 → 即 cookie 效期
//      }
export const apiPostMemberAuthEmailUpgradeEmailVerificationCodeVerify = async (data) =>
  await fetchApi.post(`member/auth/email-upgrade/email/verification-code/verify`, data)

// 檢查手機號碼
// req     { mobilePhone }
// header  X-Upgrade-Token: email 驗證成功回傳的 upgradeToken(由呼叫端以 config 帶入)
export const apiPostMemberAuthEmailUpgradeMobileCheck = async (data, config) =>
  await fetchApi.post(`member/auth/email-upgrade/mobile/check`, data, config)

// 發送手機驗證碼
// req     { mobilePhone }
// header  X-Upgrade-Token: email 驗證成功回傳的 upgradeToken(由呼叫端以 config 帶入)
// res     {
//           verificationToken: string,          // 驗證時要一併帶回
//           expiresAt: string,                  // ISO 8601,不使用 —— 倒數結束後會重新發碼,
//                                                拿到新的 verificationToken 讓舊的作廢,
//                                                所以效期實際由重送決定
//           resendAvailableAt: string,          // ISO 8601,可重新發送的時間
//           developmentVerificationCode: string, // 僅 dev 環境回傳,直接帶入輸入框
//         }
export const apiPostMemberAuthEmailUpgradeMobileVerificationCode = async (data, config) =>
  await fetchApi.post(`member/auth/email-upgrade/mobile/verification-code`, data, config)

// 驗證手機驗證碼
// req     { mobilePhone, verificationToken, verificationCode }
// header  X-Upgrade-Token: email 驗證成功回傳的 upgradeToken(由呼叫端以 config 帶入)
export const apiPostMemberAuthEmailUpgradeMobileVerificationCodeVerify = async (data, config) =>
  await fetchApi.post(`member/auth/email-upgrade/mobile/verification-code/verify`, data, config)

// 綁定(手機未被使用 → 直接綁上完成升級)
// header  X-Upgrade-Token: email 驗證成功回傳的 upgradeToken(由呼叫端以 config 帶入)
export const apiPostMemberAuthEmailUpgradeBind = async (data, config) =>
  await fetchApi.post(`member/auth/email-upgrade/bind`, data, config)

// 合併(手機已有帳號 → 走 mobile/check 回 requiresMerge 的那條路)
// header  X-Upgrade-Token: email 驗證成功回傳的 upgradeToken(由呼叫端以 config 帶入)
export const apiPostMemberAuthEmailUpgradeMerge = async (data, config) =>
  await fetchApi.post(`member/auth/email-upgrade/merge`, data, config)
