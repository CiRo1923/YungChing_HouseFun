import { defineStore } from 'pinia'

// 忘記密碼流程(手機驗證 → 重設密碼 → 設定完成)。
//
// 欄位跟著 swagger 的兩支 C 端 API 走(.apiJson/swagger.json):
//   password-reset/request  mobilePhone + verificationChannel → resetToken / expireAt
//   password-reset/confirm  mobilePhone + verificationCode + resetToken
//                           + newPassword + confirmPassword  → success / requireRelogin
//
// 驗證碼是 confirm 才驗的 → mobilePhone 與 verificationCode 是兩步共用,放在 verify 段,
// resetPassword 段只放新密碼那兩個欄位,送出時兩段合併。
//
// 段落名為 verify(步驟 1)/ resetPassword(步驟 2)——
// 後者不叫 reset 是因為 Actions 那邊的清空工具已經佔用 `reset` 這個名字。
export const useMemberForgetStore = defineStore('memberForget', () => {
  const apiDefault = readonly({
    verify: {
      mobilePhone: null,
      verificationCode: null,
      resetToken: null,
    },
    resetPassword: {
      newPassword: null,
      confirmPassword: null,
    },
  })
  const verify = ref({
    countdownData: {
      expires: null,
    },
    apiData: { ...apiDefault.verify },
    apiResult: null,
  })
  const resetPassword = ref({
    apiData: { ...apiDefault.resetPassword },
    apiResult: null,
  })

  return {
    apiDefault,
    verify,
    resetPassword,
  }
})
