import { apiGetMemberNotificationsSummary } from '@js/_api/member/center.js'

// 會員中心各頁的行為。auth 三支在同層的 useProjectActions.js。
export default () => {
  const memberCenter = useMemberCenterStore()
  const { noticeSummary } = storeToRefs(memberCenter)
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

  return {
    onApiGetMemberNotificationsSummary,
  }
}
