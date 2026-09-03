// 忘記密碼流程的執行事件。
//
// ⚠️ 目前是空殼 —— API 還沒到,三支動作(發送驗證碼 / 驗證手機 + 驗證碼 / 重設密碼)
// 都還沒有對應的 scripts/_api/member/forget.js 實作。
// 補的時候照 .claude/skills/store-conventions 那套:
//   1. 一律回傳 { config, status, data }
//   2. 狀態用 else if 串接,不要排除清單
//   3. 只有「整頁換掉」的狀態才寫 apiResult(超限那種),一般錯誤走 onAlert
//   4. 需要 token 的動作補兩道防線(開頭以 cookie 重新確認 + 401/403 的統一出口)
export default () => {
  const memberForget = useMemberForgetStore()
  const { verify, resetPassword } = storeToRefs(memberForget)

  const reset = {
    onVerify() {
      verify.value.apiData = { ...memberForget.apiDefault.verify }
      verify.value.apiResult = null
    },
    onResetPassword() {
      resetPassword.value.apiData = { ...memberForget.apiDefault.resetPassword }
      resetPassword.value.apiResult = null
    },
  }

  return {
    reset,
  }
}
