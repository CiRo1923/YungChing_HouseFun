import { apiAuthEmailUpgradeVerificationCode } from '@js/_api/member/upgrade.js'
import { enCrypto, deCryptoJSON } from '@js/_crypto/index.js'
import { EMAILVALUE, EMAILVERIFY } from '@js/_storage.js'

export default () => {
  const memberUpgrade = useMemberUpgradeStore()
  const { index, upgrade } = storeToRefs(memberUpgrade)
  const { onApiError, onAlert } = usePopupActions()

  const onApiAuthEmailUpgradeVerificationCode = async () => {
    const { config, status, data } = await apiAuthEmailUpgradeVerificationCode(index.value.apiData)

    if (status === 200) {
      const { challengeToken, resendAvailableAt } = data
      const expires = new Date(resendAvailableAt)

      // 本次流程直接用 store;cookie 則是為了重整 / 換頁後還原(下一頁驗證要帶 challengeToken,
      // 但 URL 不帶)。cookie 效期跟隨 resendAvailableAt,時間到瀏覽器自動清掉,不必自己排程;
      // 值無效時退為 session cookie(關瀏覽器即失效)。
      upgrade.value.emailVerify.apiData.challengeToken = challengeToken

      // 重送倒數的到期時間。重送成功會拿到新的值 → 倒數元件 watch 到就覆蓋重算
      upgrade.value.emailVerify.countdownData.expires = resendAvailableAt

      // 驗證通過才寫 cookie:驗證碼需要 email
      onSetCookie(EMAILVALUE, index.value.apiData.email)
      onSetCookie(EMAILVERIFY, challengeToken, Number.isNaN(expires.getTime()) ? {} : { expires })
    }

    if (status !== 200 && status !== 404) {
      onApiError(config, status, data)
    }

    if (status === 400 || status === 404) {
      const { message } = data

      onAlert({
        content: message,
        setClass: {
          main: 'pt:--w-460',
        },
      })
    }

    return { config, status, data }
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
    onIndex() {
      index.value.apiData = { ...memberUpgrade.apiDefault.index }
    },
    onEmailVerify() {
      upgrade.value.emailVerify.apiData = { ...memberUpgrade.apiDefault.upgrade.emailVerify }
    },
  }

  return {
    onApiAuthEmailUpgradeVerificationCode,
    onSetCookie,
    onGetCookie,
    onClearCookie,
    reset,
  }
}
