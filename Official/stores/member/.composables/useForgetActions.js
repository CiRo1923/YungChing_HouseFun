// 忘記密碼流程的執行事件。
//
// ⚠️ 目前只有 reset —— API 已經有了(scripts/_api/member/forget.js 的兩支),
// 但還缺兩個值才接得起來,都在等後端 / 使用者回覆:
//   1. request 的 verificationChannel 是 0 / 1,swagger 沒寫哪個是簡訊哪個是 LINE
//   2. 60 秒重送冷卻沒有對應的回傳欄位(200 只給 token 的 expireAt),
//      倒數要吃什麼還沒定 —— 用 expireAt 是錯的語意(那是 token 到期不是可重送時間)
//
// 接的時候照 .claude/skills/store-conventions 那套:
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
