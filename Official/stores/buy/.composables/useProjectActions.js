import {
  apiAuthTokenExchange,
  apiAuthMe,
  apiAuthLogout,
  apiMessages,
  apiMessagesVerifyCode,
  apiMessagesResendCode,
} from '@js/_api/buy/common.js'

import { onFormatDate } from '@js/_prototype.js'
import { BUYACCESSDATA, BUYCHANNEL } from '@js/_storage.js'
import { enCrypto, deCrypto, enCryptoShort, deCryptoShort } from '@js/.crypto/index.js'

export default () => {
  const project = useProjectStore()
  const { serverTime } = storeToRefs(project)
  const { onApiGetCommonServerTime } = useProjectActions()
  const memberProjct = useMemberProjectStore()
  const { authToken, userData } = storeToRefs(memberProjct)
  const { onApiAuthToken, onSetAuthTokenCookie, onReset } = useMemberProjectActions()
  const buyProject = useBuyProjectStore()
  const { channel, access, message, countdownData, apiVerifyCodeData, cottonCandyCheckbox } =
    storeToRefs(buyProject)

  // 頻道判斷:區域找房 / 捷運找房(原在 useListActions,移至此)
  const isChannelRegion = computed(() => channel.value === 'region')
  const isChannelMrt = computed(() => channel.value === 'mrt')

  // 頻道持久化:列表頁 channel 隨 URL 而定;明細頁 URL 只有 hfid,reload 後拿不到 channel。
  // 用「session cookie」(不設 expires / maxAge)→ 關瀏覽器即清除(仿 sessionStorage),
  // 但 SSR 讀得到:明細頁在 server 端就能還原 channel、直接輸出正確 HTML,不會 client 端閃跳。
  const onChannelCookie = () =>
    useCookie(BUYCHANNEL, {
      path: '/',
      sameSite: 'lax',
      secure: !import.meta.dev,
    })

  // channel 一改變即寫入(加密)。
  const onSaveChannel = () => {
    if (channel.value) onChannelCookie().value = enCryptoShort(channel.value)
  }
  // 讀回並還原 channel(明細頁用,SSR / client 皆可);無值 / 非法值不動,回傳當前 channel。
  const onRestoreChannel = () => {
    const value = deCryptoShort(onChannelCookie().value)
    if (value === 'region' || value === 'mrt') channel.value = value

    return channel.value
  }

  const { onPromise, onCustom, onApiError, onApiPromise } = usePopupActions()
  const { onLogin } = useBuyPopupActions()

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
  const onApiAuthMe = async () => {
    const { config, status, data } = await apiAuthMe()

    if (status === 200) {
      userData.value = data
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiAuthLogout = async () => {
    const { config, status, data } = await apiAuthLogout()

    if (status === 200) {
      onReset()
      reset.onAccess()
      onClearCookies()
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // accessData 存 cookie (SSR / client 皆可讀)。cookie 效期由 onSetAccessDataCookie 依 token 帶入。
  const onAccessDataCookie = (options = {}) =>
    useCookie(BUYACCESSDATA, {
      path: '/',
      sameSite: 'lax',
      secure: !import.meta.dev,
      ...options,
    })

  // 存:加密後寫入 cookie,cookie 效期跟隨 token 的 expiresAt(無效時退為 session cookie)。
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
    // accessData 過期只清自己;authToken(30 天)是否走 SSO 由呼叫端分開判斷。
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

  const onApiMessages = async (isReplaceMessage) => {
    const { config, status, data } = await apiMessages(message.value.apiData)

    if (status === 200 || status === 201) {
      const { verificationToken, developmentVerificationCode, verificationExpiresAt } = data

      if (isReplaceMessage) {
        message.value.data = data
      }

      countdownData.value.expires = verificationExpiresAt
      apiVerifyCodeData.value.verificationToken = verificationToken
      apiVerifyCodeData.value.verificationCode = developmentVerificationCode
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiMessagesVerifyCode = async () => {
    const { config, status, data } = await apiMessagesVerifyCode(apiVerifyCodeData.value)

    if (status === 200) {
      message.value.data = data // 如果沒有驗證過會需要驗證驗證完會回傳棉花糖資訊
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onApiMessagesResendCode = async () => {
    const { config, status, data } = await apiMessagesResendCode({
      verificationToken: apiVerifyCodeData.value.verificationToken,
    })

    if (status === 200) {
      const { verificationToken, developmentVerificationCode, verificationExpiresAt } = data

      //重新發送驗證碼 所以資料再更新一次
      countdownData.value.expires = verificationExpiresAt
      apiVerifyCodeData.value.verificationToken = verificationToken
      apiVerifyCodeData.value.verificationCode = developmentVerificationCode
    } else {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }
  const onPopupLogin = async () => {
    const { isSure } = await onLogin()

    if (!isSure) return

    onApiPromise('open')

    const { status } = await onApiAuthToken({
      channel: 'buy',
    })

    let result = null

    if (status === 200) {
      await onApiAuthTokenExchange()
      result = await onApiAuthMe()
    }

    onApiPromise('close')

    return result
  }
  const onPopupVerifyCode = async () => {
    onPromise('open')
    const { status, data } = await onApiMessages(true)
    await onApiGetCommonServerTime()
    onPromise('close')

    if (status === 201) {
      const { cottonCandy, success, message, reason } = data
      const hasCottonCandy = cottonCandy.items?.length !== 0
      const isVerifyCode = reason === 'VerificationRequired'
      const isDuplicate = reason === 'DuplicateWithin20Minutes'

      if (success) {
        if (!reason) {
          if (!hasCottonCandy) {
            await onPopupMessageSucess()
          }

          if (hasCottonCandy) {
            await onPopupCottonCandy()
          }
        }

        if (isVerifyCode) {
          await onCustom({
            id: 'popupVerifyCode',
            title: '留言驗證',
            btns: [
              {
                label: '送出留言',
                type: 'sure',
                isClose: false,
              },
            ],
          })
        }
      } else {
        onCustom({
          id: 'popupMessageFailed',
          title: isDuplicate ? '已留過言' : '留言失敗',
          data: message,
          btns: 'alert',
        })
      }
    }

    // if (status === 200) {
    //   await onPopupCottonCandy()
    // }
  }
  const onPopupCottonCandy = async () => {
    await onCustom({
      id: 'popupCottonCandy',
      title: '預約留言已送出，仲介將會儘速與您聯繫',
      btns: [
        {
          label: '下次再留',
          type: 'cancel',
        },
        {
          label: '一起預約',
          type: 'sure',
          isClose: false,
        },
      ],
    })
  }
  const onPopupMessageSucess = async () => {
    const isMember = message.value.data?.isMember ?? false

    await onCustom({
      id: 'popupMessageSuccess',
      title: '留言成功',
      btns: isMember
        ? 'alert'
        : [
            {
              id: 'cancel',
              label: '關閉',
              class: '--border-gray-e5 --text-gray-666',
              type: 'cancel',
              isClose: true,
            },
            {
              id: 'sure',
              label: '立即註冊',
              class: '--bg-orange-f74c --text-white',
              type: 'sure',
              isClose: true,
            },
          ],
    })
  }
  const reset = {
    onAccess() {
      access.value.data = null
    },
    onMessage() {
      message.value.apiData = { ...buyProject.apiDefault.message }
      apiVerifyCodeData.value = { ...buyProject.apiDefault.verifyCode }
      cottonCandyCheckbox.value = []
    },
  }
  const onSearchParams = (path) => {
    const headers = useRequestHeaders(['host'])
    const domain = import.meta.server ? headers.host : window.location.host
    const url = new URL(path, `https://${domain}`)

    return url.searchParams.size !== 0 ? Object.fromEntries(url.searchParams) : null
  }

  return {
    isChannelRegion,
    isChannelMrt,
    onSaveChannel,
    onRestoreChannel,
    onApiAuthTokenExchange,
    onApiAuthMe,
    onApiAuthLogout,
    onSetAccessDataCookie,
    onGetAccessDataCookie,
    onRestoreAccessData,
    onClearCookies,
    onApiMessages,
    onApiMessagesVerifyCode,
    onApiMessagesResendCode,
    onPopupLogin,
    onPopupVerifyCode,
    onPopupCottonCandy,
    onPopupMessageSucess,
    onSearchParams,
    reset,
  }
}
