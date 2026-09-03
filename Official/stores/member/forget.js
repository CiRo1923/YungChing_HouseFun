import { defineStore } from 'pinia'

// 忘記密碼流程(手機驗證 → 重設密碼 → 設定完成)。
//
// ⚠️ 目前是空殼 —— API 規格還沒到,apiDefault 的欄位刻意留空:
// 欄位名要跟著 API 的 request body 命名(比照 register / upgrade),
// 先自己編一組再回頭改等於白做兩次。
//
// 頁面現在用自己的 ref 撐畫面,見 pages/member/forget/_components/*/Content.vue 的 TODO。
//
// 段落名為 verify(步驟 1)/ resetPassword(步驟 2)——
// 後者不叫 reset 是因為 Actions 那邊的清空工具已經佔用 `reset` 這個名字。
export const useMemberForgetStore = defineStore('memberForget', () => {
  const apiDefault = readonly({
    verify: {},
    resetPassword: {},
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
