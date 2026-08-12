import { version, fetchApi } from '@js/_api/member/.config.js'

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
export const apiAuthEmailUpgradeVerificationCode = async (data) =>
  await fetchApi.post(`api/${version}/member/auth/email-upgrade/email/verification-code`, data)

// 驗證 email 驗證碼
// req  { challengeToken, verificationCode }
export const apiAuthEmailUpgradeVerificationCodeVerify = async (data) =>
  await fetchApi.post(
    `api/${version}/member/auth/email-upgrade/email/verification-code/verify`,
    data
  )
