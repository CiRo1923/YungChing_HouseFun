import {
  apiGetMemberNotificationsSummary,
  apiGetMemberNotifications,
  apiPostMemberPasswordChange,
} from '@js/_api/member/center.js'

// 會員中心各頁的行為。auth 三支在同層的 useProjectActions.js。
export default () => {
  const memberCenter = useMemberCenterStore()
  const { noticeSummary, price, match, communityNew, communityPrice, actualPrice, password } =
    storeToRefs(memberCenter)
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
  // 所以這裡不接 400,交給頁面判斷。
  const onApiPostMemberPasswordChange = async () => {
    const { config, status, data } = await apiPostMemberPasswordChange(password.value.apiData)

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
    onNoticeSummary,
  }
}
