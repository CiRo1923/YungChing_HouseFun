import {
  apiAuthEmailUpgradeVerificationCode,
  apiAuthEmailUpgradeVerificationCodeVerify,
  apiAuthEmailUpgradeMobileCheck,
  apiAuthEmailUpgradeMobileVerificationCode,
} from '@js/_api/member/upgrade.js'
import { enCrypto, deCryptoJSON } from '@js/_crypto/index.js'
import { EMAILVALUE, EMAILVERIFY, EMAILVERIFYTOKEN, EXCEEDED, PHONE } from '@js/_storage.js'

export default () => {
  const memberUpgrade = useMemberUpgradeStore()
  const { email, emailVerify, phone, phoneVerify } = storeToRefs(memberUpgrade)
  const { onApiError, onAlert } = usePopupActions()

  const onApiAuthEmailUpgradeVerificationCode = async () => {
    const { apiData } = email.value
    const { config, status, data } = await apiAuthEmailUpgradeVerificationCode(apiData)

    email.value.apiResult = null

    // 重送會換一組全新的驗證碼 → 上一組的驗證結果(含 remainingAttempts)一併作廢,
    // 不清的話畫面會拿舊的「錯誤達 5 次」去判斷新驗證碼,顯示成已失效。
    emailVerify.value.apiResult = null

    // 各狀態互斥處理:以 else if 串接,新增狀態只要插一段,不必再維護「排除清單」
    // (排除清單與 === 判斷是兩套邏輯,漏改就會互相覆蓋成死碼)。
    if (status === 200) {
      const { challengeToken, resendAvailableAt } = data
      const expires = new Date(resendAvailableAt)
      const isValidExpires = !Number.isNaN(expires.getTime())

      // 本次流程直接用 store;cookie 則是為了重整 / 換頁後還原(下一頁驗證要帶 challengeToken,
      // 但 URL 不帶)。cookie 效期跟隨 resendAvailableAt,時間到瀏覽器自動清掉,不必自己排程;
      // 值無效時退為 session cookie(關瀏覽器即失效)。
      emailVerify.value.apiData.challengeToken = challengeToken

      // 重送倒數的到期時間。重送成功會拿到新的值 → 倒數元件 watch 到就覆蓋重算
      emailVerify.value.countdownData.expires = resendAvailableAt

      // 驗證通過才寫 cookie:驗證碼需要 email
      onSetCookie(EMAILVALUE, email.value.apiData.email)

      // resendAvailableAt 也一起寫進值裡:cookie 的 expires 讀不回來,而倒數元件需要這個
      // 絕對到期時間才能在 SSR(首屏)就算出剩餘秒數,不必等 client 掛載後才補算
      onSetCookie(
        EMAILVERIFY,
        { challengeToken, resendAvailableAt },
        isValidExpires ? { expires } : {}
      )

      // 發得出去就代表已解鎖(改用其他 email、或後端的鎖已過期)→ 清掉超限紀錄,
      // 否則 cookie 還在,回上一頁 / 重整會被 middleware 擋回去看到「已達上限」
      onClearCookie(EXCEEDED)
    } else if (status === 400 || status === 404) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗
      const { message } = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status === 429) {
      // 太頻繁 → 不彈窗,交回頁面自行呈現(例如接上重送倒數)
      email.value.apiResult = data

      // 發送次數已達上限 → 寫 cookie,讓重整 / 換頁 / 返回都還原得回「已超限」狀態。
      // 效期用後端給的 unlockAt(解鎖時間),時間到瀏覽器自動清掉,不必自己判斷何時解除;
      // 值無效時退為 session cookie(關瀏覽器即失效)。
      const unlockAt = new Date(data.unlockAt)
      const isValidUnlockAt = !Number.isNaN(unlockAt.getTime())

      onSetCookie(EXCEEDED, data, isValidUnlockAt ? { expires: unlockAt } : {})

      // 已超限就沒有可續用的驗證流程 → 一併清掉 email 與 challengeToken(重送倒數的
      // 到期時間就存在 EMAILVERIFY 裡,一起消失),避免下次進頁面又用舊資料把驗證畫面撐起來。
      onClearCookie(EMAILVALUE, EMAILVERIFY)
    } else {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiAuthEmailUpgradeVerificationCodeVerify = async () => {
    const { apiData } = emailVerify.value
    const { config, status, data } = await apiAuthEmailUpgradeVerificationCodeVerify(apiData)

    emailVerify.value.apiResult = null

    if (status === 200) {
      // 驗證通過會拿到 upgradeToken:後續 mobile/* 要放進 header X-Upgrade-Token。
      // 本次流程直接用 store;cookie 則是為了重整 / 換頁後還原(下一頁 URL 不帶這個值)。
      // cookie 效期跟隨 expiresAt(token 的失效時間),時間到瀏覽器自動清掉,不必自己排程;
      // 值無效時退為 session cookie(關瀏覽器即失效)。
      const { upgradeToken, expiresAt } = data
      const expires = new Date(expiresAt)
      const isValidExpires = !Number.isNaN(expires.getTime())

      phone.value.token = upgradeToken

      onSetCookie(EMAILVERIFYTOKEN, upgradeToken, isValidExpires ? { expires } : {})
    } else if (status === 400) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗
      const { message } = data

      emailVerify.value.apiResult = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiAuthEmailUpgradeMobileCheck = async () => {
    const { apiData } = phone.value
    const { config, status, data } = await apiAuthEmailUpgradeMobileCheck(
      apiData,
      onUpgradeTokenConfig()
    )

    phone.value.apiResult = null

    if (status === 400 || status === 404 || status === 409) {
      // 後端有給明確原因的可預期錯誤(格式不符 / 查無資料 / 號碼已被使用)→
      // 只顯示 message,不套用通用錯誤彈窗
      const { message } = data

      phone.value.apiResult = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiAuthEmailUpgradeMobileVerificationCode = async () => {
    const { apiData } = phone.value
    const { config, status, data } = await apiAuthEmailUpgradeMobileVerificationCode(
      apiData,
      onUpgradeTokenConfig()
    )

    phone.value.apiResult = null

    if (status === 200) {
      // 驗證時要帶回 verificationToken;expiresAt 是驗證碼的失效時間,供重送倒數用
      const { verificationToken, expiresAt } = data

      phoneVerify.value.apiData.verificationToken = verificationToken

      // 重送成功會拿到新的值 → 倒數元件 watch 到就覆蓋重算
      phoneVerify.value.countdownData.expires = expiresAt

      // 發得出去才寫 cookie:下一頁要顯示「驗證碼已發送至 09xx***xxx」,
      // 但 URL 不帶號碼 → 存 cookie 讓重整 / 換頁後還原得回來。
      onSetCookie(PHONE, apiData.mobilePhone)
    } else if (status === 400 || status === 404) {
      // 後端有給明確原因的可預期錯誤 → 只顯示 message,不套用通用錯誤彈窗
      const { message } = data

      phone.value.apiResult = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    } else if (status !== 200) {
      // 其餘皆為非預期錯誤 → 統一錯誤彈窗
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  // upgradeToken 走 header 不走 body,mobile 開頭的 API 都要帶。
  // 無值時整個 headers 省略,免得送出 X-Upgrade-Token: null 讓後端
  // 當成無效 token 而非未帶。
  const onUpgradeTokenConfig = () => {
    const { token } = phone.value

    return token ? { headers: { 'X-Upgrade-Token': token } } : {}
  }
  // cookie 基礎設定,與 member / buy 既有的 cookie 一致(不設 expires → session cookie,
  // 關瀏覽器即失效;SSR 讀得到,換頁 / 重整都還原得回來)。
  // key 由呼叫端傳入,不綁死單一用途 → 同一組工具可存多筆資料。
  const onCookie = (key, options = {}) =>
    useCookie(key, {
      path: '/',
      sameSite: 'lax',
      secure: !import.meta.dev,
      ...options,
    })

  // 存:一律 JSON 序列化後加密再寫入。value 傳 null / undefined 等同清除。
  // options 可覆寫效期等設定,例如 { expires: new Date(...) }。
  const onSetCookie = (key, value, options = {}) => {
    if (value == null) {
      onCookie(key).value = null
      return
    }

    onCookie(key, options).value = enCrypto(JSON.stringify(value))
  }

  // 取:解密還原為物件。無值 / 竄改 / 非 JSON 一律回 null,並順手清掉壞掉的 cookie。
  const onGetCookie = (key) => {
    const raw = onCookie(key).value

    if (!raw) return null

    const data = deCryptoJSON(raw)

    if (!data) {
      onCookie(key).value = null
      return null
    }

    return data
  }

  // 清除:可一次帶多個 key,例如 onClearCookie(EMAILVALUE, EMAILPHONE)
  const onClearCookie = (...keys) => {
    keys.forEach((key) => {
      onCookie(key).value = null
    })
  }

  const reset = {
    onEmail() {
      email.value.apiData = { ...memberUpgrade.apiDefault.email }
    },
    onEmailVerify() {
      emailVerify.value.apiData = { ...memberUpgrade.apiDefault.emailVerify }

      // apiResult 也要一起清:store 是單例,上一次進頁面留下的 remainingAttempts
      // 會被這次的畫面判斷沿用
      emailVerify.value.apiResult = null
    },
    onPhoneVerify() {
      phoneVerify.value.apiData = { ...memberUpgrade.apiDefault.phoneVerify }

      // apiResult 也要一起清:store 是單例,上一次進頁面留下的 remainingAttempts
      // 會被這次的畫面判斷沿用
      phoneVerify.value.apiResult = null
    },
    onPhone() {
      phone.value.apiData = { ...memberUpgrade.apiDefault.phone }

      // token 一併清掉:store 是單例,重設後才由頁面從 EMAILVERIFYTOKEN cookie 還原,
      // 避免上一輪的舊 token 殘留下來被當成這次的
      phone.value.token = null
    },
  }

  return {
    onApiAuthEmailUpgradeVerificationCode,
    onApiAuthEmailUpgradeVerificationCodeVerify,
    onApiAuthEmailUpgradeMobileCheck,
    onApiAuthEmailUpgradeMobileVerificationCode,
    onSetCookie,
    onGetCookie,
    onClearCookie,
    reset,
  }
}
