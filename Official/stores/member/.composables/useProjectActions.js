import { apiAuthTokenExchange, apiAuthMe, apiAuthLogout } from '@js/_api/member/common.js'

import { onFormatDate } from '@js/_prototype.js'
import { MEMBERACCESSDATA } from '@js/_storage.js'
import { enCrypto, deCrypto } from '@js/.crypto/index.js'

// 會員中心(Member BFF)的 auth 三支,形狀與 buy 那條線一致:
//   token/exchange  用 Member Auth 的 handoff token 換這個服務的 bearer token
//   me              取會員資料
//   logout          撤銷 Member Auth 的全域 session(其他頻道的 token 也會一起失效)
export default () => {
  const project = useProjectStore()
  const { serverTime } = storeToRefs(project)
  const { onApiGetCommonServerTime } = useProjectActions()
  const memberCenter = useMemberCenterStore()
  const { access } = storeToRefs(memberCenter)
  const memberAuthProject = useMemberAuthProjectStore()
  const { authToken, userData } = storeToRefs(memberAuthProject)
  const { onSetAuthTokenCookie, onReset: onMemberAuthReset } = useMemberAuthProjectActions()
  const { onApiError } = usePopupActions()

  const onApiAuthTokenExchange = async () => {
    const { config, status, data } = await apiAuthTokenExchange({
      encryptedToken: authToken.value.longToken,
    })

    if (status === 200) {
      access.value.data = data
      onSetAccessDataCookie(data)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // 會員資料寫回 memberAuth 的 userData:那是「誰登入了」的單一來源,
  // header 的登入狀態與 buy 頻道都讀它,不另外複製一份。
  const onApiAuthMe = async () => {
    const { config, status, data } = await apiAuthMe()

    if (status === 200) {
      userData.value = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // 登出成功後把登入狀態清乾淨:store 與 cookie 都要,否則重整又會被還原回來。
  const onApiAuthLogout = async () => {
    const { config, status, data } = await apiAuthLogout()

    if (status === 200) {
      onMemberAuthReset()
      onReset()
      onClearCookies()
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // accessData 存 cookie(SSR / client 皆可讀)。效期由 onSetAccessDataCookie 依 token 帶入。
  const onAccessDataCookie = (options = {}) =>
    useCookie(MEMBERACCESSDATA, {
      path: '/',
      sameSite: 'lax',
      secure: !import.meta.dev,
      ...options,
    })

  // 存:加密後寫入,效期跟隨 token 的 expiresAt(無效時退為 session cookie)。
  const onSetAccessDataCookie = (data) => {
    if (data == null) {
      onAccessDataCookie().value = null
      return
    }

    const expires = new Date(data.expiresAt)
    const options = Number.isNaN(expires.getTime()) ? {} : { expires }

    // 不自己 JSON.stringify:enCrypto 內部已依型別序列化
    onAccessDataCookie(options).value = enCrypto(data)
  }

  // 取:讀 cookie 解密還原為物件;無值 / 解析失敗 / 已過期皆回傳 null。
  // 效期以後端 serverTime 為準(不信任 client 系統時間)。
  const onGetAccessDataCookie = async () => {
    const raw = onAccessDataCookie().value

    if (!raw) return null

    const data = deCrypto(raw)

    // 竄改 / 解不出 → 清掉 cookie。
    if (!data) {
      onSetAccessDataCookie(null)
      return null
    }

    // 每次都取最新 server time:換頁 / 重新判斷時效需以當下時間為準。
    await onApiGetCommonServerTime()

    const serverFull = serverTime.value?.full
    const expiresFull = data.expiresAt ? onFormatDate(data.expiresAt, 'YYYY-MM-DD hh:mm:ss') : null

    // 皆為零補位的 'YYYY-MM-DD hh:mm:ss',字典序即時間序 → expires <= server 視為過期,清掉 cookie。
    if (serverFull && expiresFull && expiresFull <= serverFull) {
      onSetAccessDataCookie(null)
      return null
    }

    return data
  }

  // 還原:從 cookie 取回 accessData 寫回 store(SSR / 重新整理後 store 是空的才需要)。
  const onRestoreAccessData = async () => {
    const cached = await onGetAccessDataCookie()

    if (cached) access.value.data = cached

    return cached
  }

  // 清除目前用到的所有 cookie(authToken / accessData)。
  const onClearCookies = () => {
    onSetAuthTokenCookie(null)
    onSetAccessDataCookie(null)
  }

  const onReset = () => {
    access.value.data = null
  }

  return {
    onApiAuthTokenExchange,
    onApiAuthMe,
    onApiAuthLogout,
    onSetAccessDataCookie,
    onGetAccessDataCookie,
    onRestoreAccessData,
    onClearCookies,
    onReset,
  }
}
