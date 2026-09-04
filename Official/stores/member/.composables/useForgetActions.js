import { apiAuthPasswordResetRequest, apiAuthPasswordResetConfirm } from '@js/_api/member/forget.js'
import { enCrypto, deCrypto } from '@js/.crypto/index.js'
import { FORGETRESET, FORGETCOMPLETE } from '@js/_storage.js'

// 忘記密碼流程的執行事件。
//
// 這條流程只有兩支 API,而驗證碼是 confirm 才驗的 —— 步驟 1 的「下一步」沒有東西可打,
// 只檢查格式並確認已經發過碼。驗證碼錯誤要到步驟 2 送出才會知道,那時導回步驟 1。
export default () => {
  const memberForget = useMemberForgetStore()
  const { verify, resetPassword } = storeToRefs(memberForget)
  const { onApiError, onAlert } = usePopupActions()
  // 在 setup 期間先取好:action 是在事件處理器、且多半在 await 之後才執行,
  // 那時直接呼叫 navigateTo / useRouter 可能已經沒有 Nuxt context。
  const router = useRouter()

  // 發送驗證碼。管道由呼叫端指定(目前一律 sms,見 store 的 verificationChannels)。
  const onApiAuthPasswordResetRequest = async (verificationChannel) => {
    const { mobilePhone } = verify.value.apiData
    const { config, status, data } = await apiAuthPasswordResetRequest({
      mobilePhone,
      verificationChannel,
    })

    verify.value.apiResult = null

    if (status === 200) {
      const { resetToken, expireAt, developmentVerificationCode } = data
      const expires = new Date(expireAt)
      const isValidExpires = !Number.isNaN(expires.getTime())

      verify.value.apiData.resetToken = resetToken

      // 後端只在 develop 模式回 developmentVerificationCode(正式環境不回、也不寄簡訊)→
      // 直接接,不必自己判斷環境。沒有值時補 null,與 apiDefault 的型別一致
      // (undefined 會讓 v-model 綁的輸入框變成非受控)。與 upgrade / 註冊那兩條流程同一套寫法。
      verify.value.apiData.verificationCode = developmentVerificationCode ?? null

      // 重送倒數的到期時間。重送成功會拿到新的值 → 倒數元件 watch 到就覆蓋重算。
      //
      // ⚠️ 這裡吃的是 expireAt(token 到期),不是「可重送時間」——
      // 規格寫 60 秒冷卻,但 200 沒有對應的欄位(upgrade 那條流程回的是 resendAvailableAt)。
      // 後端補了欄位就改吃那個,見 .claude/rules/member-forget-pending.md。
      verify.value.countdownData.expires = expireAt

      // 步驟 2 的 URL 不帶這些值,重整 / 換頁要靠 cookie 還原。
      // 效期跟隨後端給的 expireAt,時間到瀏覽器自動清掉,不必自己排程;
      // 值無效時退為 session cookie。
      //
      // expireAt 也一起寫進值裡:cookie 的 expires 讀不回來,而倒數元件需要這個
      // 絕對到期時間才能在 SSR(首屏)就算出剩餘秒數。
      //
      // verificationCode 寫的是「此刻 store 裡的值」—— 正式環境是 null(碼要使用者
      // 自己輸入,離開步驟 1 前由 onSaveVerify 補寫);develop 模式則是後端回的測試碼,
      // 一起寫進去,發完碼就重整也能接著走。
      onSetCookie(
        FORGETRESET,
        {
          mobilePhone,
          resetToken,
          expireAt,
          verificationCode: verify.value.apiData.verificationCode,
        },
        isValidExpires ? { expires } : {}
      )
    } else if (status === 400 || status === 404 || status === 429) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗。
      //
      // 發送限制(60 秒冷卻、手機每日與 IP 每小時上限)也走這裡 —— swagger 這兩支
      // 只列 200 / 400,超限是回 400 帶 message,沒有獨立的 429。429 一起收在這個
      // 分支是保險:真的收到就當可預期錯誤顯示,不掉進通用錯誤彈窗。
      //
      // 不寫進 apiResult:那是給「整頁換成超限呈現」用的,這條流程沒有那個版面,
      // 寫進去只會讓輸入表單被取代掉,使用者連改號碼都沒得改。
      const { message } = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // 驗證碼 + 新密碼一起送出。成功即完成:後端會撤銷該會員的登入 session(requireRelogin),
  // 所以完成頁請使用者重新登入,這裡不寫任何登入狀態。
  const onApiAuthPasswordResetConfirm = async () => {
    const { mobilePhone, verificationCode, resetToken } = verify.value.apiData
    const { newPassword, confirmPassword } = resetPassword.value.apiData
    const { config, status, data } = await apiAuthPasswordResetConfirm({
      mobilePhone,
      verificationCode,
      resetToken,
      newPassword,
      confirmPassword,
    })

    resetPassword.value.apiResult = null

    if (status === 200) {
      onResetCompleted()
    } else if (status === 400 || status === 404) {
      const { message } = data

      resetPassword.value.apiResult = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })

      // 驗證碼類的錯誤(帶 failedAttempts / remainingAttempts)在這一頁沒有欄位可以改 →
      // 導回步驟 1 重新輸入。密碼格式錯誤則留在本頁,使用者當場就能改。
      //
      // ⚠️ 用「有沒有帶次數」判斷是暫時的:swagger 的 400 有 code 欄位但沒列舉值,
      // 實際看到 code 之後改成比對 code 會更準。
      if (data?.failedAttempts != null || data?.remainingAttempts != null) {
        onBackToVerify()
      }
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // 離開步驟 1 前把輸入的驗證碼補寫進同一支 cookie。
  //
  // 為什麼要補寫:confirm 要驗證碼,但它是在「發送之後」才輸入的,request 當下寫不到;
  // 而步驟 2 重整時 store 會清空,只有 cookie 留得住。效期沿用原本的 expireAt
  // (cookie 的 expires 讀不回來,所以當初就把它寫進值裡)。
  const onSaveVerify = () => {
    const { mobilePhone, verificationCode, resetToken } = verify.value.apiData
    const saved = onGetCookie(FORGETRESET) ?? {}
    const expires = new Date(saved.expireAt)
    const isValidExpires = !Number.isNaN(expires.getTime())

    onSetCookie(
      FORGETRESET,
      { mobilePhone, resetToken, verificationCode, expireAt: saved.expireAt ?? null },
      isValidExpires ? { expires } : {}
    )
  }

  // 完成的統一出口:寫完成頁的進入憑證 → 清掉沿路的 cookie,避免返回 / 重整又把流程撐起來。
  const onResetCompleted = () => {
    const completeExpires = new Date(Date.now() + memberForget.completeExpiresMinutes * 60 * 1000)

    onSetCookie(FORGETCOMPLETE, true, { expires: completeExpires })
    onClearCookie(FORGETRESET)
  }

  // 驗證碼錯誤的統一出口:清掉這一輪的 token(它已經作廢)並退回步驟 1。
  // 已定案的行為 —— 驗證碼在步驟 1 輸入,錯了就回那裡改。
  const onBackToVerify = () => {
    verify.value.apiData.resetToken = null
    verify.value.apiData.verificationCode = null
    verify.value.countdownData.expires = null

    onClearCookie(FORGETRESET)

    router.replace({
      name: 'member-forget',
    })
  }

  // cookie 基礎設定與加解密工具,與 upgrade 那條流程同一套寫法
  // (各流程各自持有,不共用 —— 共用的是規則不是實例)。
  const onCookie = (key, options = {}) =>
    useCookie(key, {
      path: '/',
      sameSite: 'lax',
      secure: !import.meta.dev,
      ...options,
    })

  // 存:加密後寫入。value 傳 null / undefined 等同清除。
  const onSetCookie = (key, value, options = {}) => {
    if (value == null) {
      onCookie(key).value = null
      return
    }

    onCookie(key, options).value = enCrypto(value)
  }

  // 取:解密並還原成原本的型別。無值 / 竄改一律回 null,並順手清掉壞掉的 cookie。
  const onGetCookie = (key) => {
    const raw = onCookie(key).value

    if (!raw) return null

    const data = deCrypto(raw)

    if (!data) {
      onCookie(key).value = null
      return null
    }

    return data
  }

  // 清除:可一次帶多個 key
  const onClearCookie = (...keys) => {
    keys.forEach((key) => {
      onCookie(key).value = null
    })
  }

  const reset = {
    onVerify() {
      verify.value.apiData = { ...memberForget.apiDefault.verify }
      verify.value.countdownData.expires = null

      // apiResult 也要一起清:store 是單例,上一次進頁面留下的結果會被這次沿用
      verify.value.apiResult = null
    },
    onResetPassword() {
      resetPassword.value.apiData = { ...memberForget.apiDefault.resetPassword }
      resetPassword.value.apiResult = null
    },
  }

  return {
    onApiAuthPasswordResetRequest,
    onApiAuthPasswordResetConfirm,
    onSaveVerify,
    onSetCookie,
    onGetCookie,
    onClearCookie,
    reset,
  }
}
