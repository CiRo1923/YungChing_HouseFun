import { version, fetchApi } from '@js/_api/memberAuth/.config.js'

// 忘記密碼流程(C 端)。另有 app/password-reset/* 三支是舊版 App 專用,這裡不接。
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
