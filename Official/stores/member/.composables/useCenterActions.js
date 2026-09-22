import {
  apiGetMemberNotificationsSummary,
  apiGetMemberNotifications,
  apiPostMemberPasswordChange,
  apiGetMemberProfile,
  apiPutMemberProfile,
  apiGetMemberMessages,
  apiDeleteMemberMessages,
  apiGetMemberSubscriptionsBuyObjects,
  apiDeleteMemberSubscriptionsBuyObjects,
  apiPostMemberCompareBuyObjectsItems,
} from '@js/_api/member/center.js'

// 會員中心各頁的行為。auth 三支在同層的 useProjectActions.js。
export default () => {
  const memberCenter = useMemberCenterStore()
  const {
    noticeSummary,
    price,
    match,
    communityNew,
    communityPrice,
    actualPrice,
    password,
    account,
    message,
    houseSubscribe,
  } = storeToRefs(memberCenter)
  const { onApiError } = usePopupActions()

  const onApiGetMemberNotificationsSummary = async () => {
    const { config, status, data } = await apiGetMemberNotificationsSummary()

    if (status !== 200) {
      onApiError(config, status, data)

      return { config, status, data }
    }

    noticeSummary.value.data = data

    return { config, status, data }
  }

  // 五個分頁打的是同一支 api,差別在送出的 category 與寫進哪一層。
  // 不共用一個 action —— 共用的話五頁就共用同一份清單,換一頁回來畫面會是別頁的內容。
  const onApiGetMemberNotificationsPrice = async () => {
    const { config, status, data } = await apiGetMemberNotifications(price.value.apiData)

    if (status !== 200) {
      onApiError(config, status, data)

      return { config, status, data }
    }

    price.value.data = data

    return { config, status, data }
  }

  const onApiGetMemberNotificationsMatch = async () => {
    const { config, status, data } = await apiGetMemberNotifications(match.value.apiData)

    if (status !== 200) {
      onApiError(config, status, data)

      return { config, status, data }
    }

    match.value.data = data

    return { config, status, data }
  }

  const onApiGetMemberNotificationsCommunityNew = async () => {
    const { config, status, data } = await apiGetMemberNotifications(communityNew.value.apiData)

    if (status !== 200) {
      onApiError(config, status, data)

      return { config, status, data }
    }

    communityNew.value.data = data

    return { config, status, data }
  }

  const onApiGetMemberNotificationsCommunityPrice = async () => {
    const { config, status, data } = await apiGetMemberNotifications(communityPrice.value.apiData)

    if (status !== 200) {
      onApiError(config, status, data)

      return { config, status, data }
    }

    communityPrice.value.data = data

    return { config, status, data }
  }

  const onApiGetMemberNotificationsActualPrice = async () => {
    const { config, status, data } = await apiGetMemberNotifications(actualPrice.value.apiData)

    if (status !== 200) {
      onApiError(config, status, data)

      return { config, status, data }
    }

    actualPrice.value.data = data

    return { config, status, data }
  }

  // 既有密碼錯誤這類 400 是可預期的,訊息要顯示在欄位下方而不是彈窗(見 C203-1 的驗證規則),
  // 所以留在 apiResult 讓欄位自己讀,不在這裡彈窗。
  const onApiPostMemberPasswordChange = async () => {
    const { config, status, data } = await apiPostMemberPasswordChange(password.value.apiData)

    password.value.apiResult = status === 400 ? data : null

    if (status !== 200 && status !== 400) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // 取回來的姓名與 E-Mail 直接填進 apiData —— 進到頁面時表單要帶著既有資料。
  const onApiGetMemberProfile = async () => {
    const { config, status, data } = await apiGetMemberProfile()

    if (status !== 200) {
      onApiError(config, status, data)

      return { config, status, data }
    }

    account.value.data = data
    account.value.apiData.lastName = data.lastName
    account.value.apiData.firstName = data.firstName
    account.value.apiData.email = data.email

    return { config, status, data }
  }

  // 400 的訊息沒有對應到哪一個欄位,由頁面用彈窗顯示。
  const onApiPutMemberProfile = async () => {
    const { config, status, data } = await apiPutMemberProfile(account.value.apiData)

    if (status !== 200 && status !== 400) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiGetMemberMessages = async () => {
    const { config, status, data } = await apiGetMemberMessages(message.value.apiData)

    if (status !== 200) {
      onApiError(config, status, data)

      return { config, status, data }
    }

    message.value.data = data

    return { config, status, data }
  }

  // 一次刪一筆或多筆都走這支,ids 由呼叫端決定。刪完由呼叫端重取清單 ——
  // 刪掉最後一筆時頁碼可能要往前退,那是頁面才知道的事。
  const onApiDeleteMemberMessages = async (ids) => {
    const { config, status, data } = await apiDeleteMemberMessages({ ids })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  const onApiGetMemberSubscriptionsBuyObjects = async () => {
    const { config, status, data } = await apiGetMemberSubscriptionsBuyObjects(
      houseSubscribe.value.apiData
    )

    if (status !== 200) {
      onApiError(config, status, data)

      return { config, status, data }
    }

    houseSubscribe.value.data = data

    return { config, status, data }
  }

  // 一次刪一筆或多筆都走這支,ids 由呼叫端決定。刪完由呼叫端重取清單 ——
  // 刪掉最後一筆時頁碼可能要往前退,那是頁面才知道的事。
  const onApiDeleteMemberSubscriptionsBuyObjects = async (ids) => {
    const { config, status, data } = await apiDeleteMemberSubscriptionsBuyObjects({ ids })

    if (status !== 200) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // 加進物件比一比。超過上限、或那一筆不能比較時後端回 400,訊息由呼叫端顯示。
  const onApiPostMemberCompareBuyObjectsItems = async (ids) => {
    const { config, status, data } = await apiPostMemberCompareBuyObjectsItems({ ids })

    if (status !== 200 && status !== 400) {
      onApiError(config, status, data)
    }

    return { config, status, data }
  }

  // 五個通知分頁共用同一份未讀數:SSR 取過之後 client 不重打,換分頁時重取。
  const onNoticeSummary = async () =>
    await callOnce('member-notice-summary', onApiGetMemberNotificationsSummary, {
      mode: 'navigation',
    })

  return {
    onApiGetMemberNotificationsSummary,
    onApiGetMemberNotificationsPrice,
    onApiGetMemberNotificationsMatch,
    onApiGetMemberNotificationsCommunityNew,
    onApiGetMemberNotificationsCommunityPrice,
    onApiGetMemberNotificationsActualPrice,
    onApiPostMemberPasswordChange,
    onApiGetMemberProfile,
    onApiPutMemberProfile,
    onApiGetMemberMessages,
    onApiDeleteMemberMessages,
    onApiGetMemberSubscriptionsBuyObjects,
    onApiDeleteMemberSubscriptionsBuyObjects,
    onApiPostMemberCompareBuyObjectsItems,
    onNoticeSummary,
  }
}
