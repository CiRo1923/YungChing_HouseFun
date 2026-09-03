import { version, fetchApi } from '@js/_api/member/.config.js'

// 忘記密碼流程(C 端)。swagger 另有三支 app/password-reset/*,那是舊版 App 用的,不要接。
//
// 驗證碼是在 confirm 才驗的,request 只負責發碼 ——
// 所以步驟 1 的「下一步」只檢查格式,驗證碼錯誤要到步驟 2 送出才知道。

// mobilePhone + verificationChannel → success / resetToken / expireAt / message
export const apiAuthPasswordResetRequest = async (data) =>
  await fetchApi.post(`api/${version}/member/auth/password-reset/request`, data)

// mobilePhone + verificationCode + resetToken + newPassword + confirmPassword
// → success / requireRelogin / message
export const apiAuthPasswordResetConfirm = async (data) =>
  await fetchApi.post(`api/${version}/member/auth/password-reset/confirm`, data)
