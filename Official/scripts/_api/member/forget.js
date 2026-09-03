// 忘記密碼流程的 API。
//
// ⚠️ 目前是空的 —— 路徑與 request body 都等後端規格,
// 補的時候比照 register.js:一支 API 一個 export,只負責發請求不做判斷。
//
// 預計要三支:
//   1. 發送驗證碼(手機號碼 → expiresAt / verificationToken)
//   2. 驗證手機 + 驗證碼(→ 重設密碼用的 token)
//   3. 重設密碼(新密碼 + token)
// export const apiAuthForgetVerificationCode = async (data) =>
//   await fetchApi.post(`api/${version}/member/auth/...`, data)
export {}
