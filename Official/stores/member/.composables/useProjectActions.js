import { apiAuthToken, apiAuthHandoffToken } from '@js/_api/member/common.js'

import { onFormatDate } from '@js/_prototype.js'
import { AUTHTOKEN } from '@js/_storage.js'
import { enCrypto, deCrypto } from '@js/.crypto/index.js'

export default () => {
  const project = useProjectStore()
  const { serverTime } = storeToRefs(project)
  const { onApiGetCommonServerTime } = useProjectActions()
  const memberProject = useMemberProjectStore()
  const { authToken, userData, login } = storeToRefs(memberProject)
  const buyProject = useBuyProjectStore()
  const { access } = storeToRefs(buyProject)
  const { onApiError } = usePopupActions()

  const onApiAuthToken = async ({ channel, deviceId, rememberMe = true }) => {
    const { config, status, data } = await apiAuthToken({
      channel,
      deviceId,
      rememberMe,
      ...login.value.auth.apiData,
    })

    if (status === 200) {
      authToken.value = data
      onSetAuthTokenCookie(data)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiAuthHandoffToken = async (channel) => {
    const { config, status, data } = await apiAuthHandoffToken({
      channel,
    })

    if (status === 200) {
      const { encryptedToken } = data

      authToken.value.longToken = encryptedToken
      onSetAuthTokenCookie(authToken.value)
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // authToken 存 cookie (SSR / client 皆可讀)。cookie 效期由 onSetAuthTokenCookie 依 token 帶入。
  const onAuthTokenCookie = (options = {}) =>
    useCookie(AUTHTOKEN, {
      path: '/',
      sameSite: 'lax',
      secure: !import.meta.dev,
      ...options,
    })

  // 存:加密後寫入 cookie,cookie 效期跟隨 token 的 expiresAt(無效時退為 session cookie)。
  const onSetAuthTokenCookie = (data) => {
    if (data == null) {
      onAuthTokenCookie().value = null
      return
    }

    const expires = new Date(data.expiresAt)
    const options = Number.isNaN(expires.getTime()) ? {} : { expires }

    // 不自己 JSON.stringify:enCrypto 內部已依型別序列化
    onAuthTokenCookie(options).value = enCrypto(data)
  }

  // 取:讀 cookie 解密還原為物件;無值 / 解析失敗 / 已過期皆回傳 null。
  // 效期以後端 serverTime 為準(不信任 client 系統時間)。
  const onGetAuthTokenCookie = async () => {
    const raw = onAuthTokenCookie().value

    console.log(raw)

    if (!raw) return null

    const data = deCrypto(raw)
    // 竄改 / 解不出 → 清掉 cookie。
    if (!data) {
      onSetAuthTokenCookie(null)
      return null
    }

    // 每次都取最新 server time:換頁 / 重新判斷時效需以當下時間為準。
    await onApiGetCommonServerTime()

    const serverFull = serverTime.value?.full
    const expiresFull = data.expiresAt ? onFormatDate(data.expiresAt, 'YYYY-MM-DD hh:mm:ss') : null

    // 皆為零補位的 'YYYY-MM-DD hh:mm:ss',字典序即時間序 → expires <= server 視為過期,清掉 cookie。
    if (serverFull && expiresFull && expiresFull <= serverFull) {
      onSetAuthTokenCookie(null)
      return null
    }

    return data
  }

  // 還原:從 cookie 取回 authToken 寫回 store(SSR / 重新整理後 store 是空的才需要)。
  const onRestoreAuthToken = async () => {
    const cached = await onGetAuthTokenCookie()
    if (cached) authToken.value = cached

    console.log(cached)

    return cached
  }

  const onReset = () => {
    authToken.value = null
    access.value.data = null
    userData.value = null
    login.value.auth.apiData.account = null
    login.value.auth.apiData.password = null
    login.value.verify.apiData.account = null
    login.value.verify.apiData.code = null
  }

  return {
    onApiAuthToken,
    onApiAuthHandoffToken,
    onSetAuthTokenCookie,
    onGetAuthTokenCookie,
    onRestoreAuthToken,
    onReset,
  }
}
