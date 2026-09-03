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

  // 驗證碼的發送管道。swagger 寫成 integer 0 / 1 是轉譯錯誤,實際要帶字串。
  // 目前一律 sms;未來可能改發 LINE,所以留成表而不是寫死在呼叫端。
  const verificationChannels = readonly({
    sms: 'sms',
    line: 'line',
  })

  // 完成頁的進入憑證效期(分鐘)。比照 upgrade 的完成頁:短效,
  // 讓使用者重整還看得到,過了就自然失效、事後貼網址進不去。
  const completeExpiresMinutes = 5

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
    verificationChannels,
    completeExpiresMinutes,
    verify,
    resetPassword,
  }
})
