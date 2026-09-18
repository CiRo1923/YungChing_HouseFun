import { fetchApi } from '@js/_api/member/.config.js'

// 會員中心各頁的 api。auth 三支在 scripts/_api/member/common.js,那幾支是登入狀態本身,
// 每一頁都要用,不屬於會員中心的哪一頁。
//
// 通知總覽五個分頁的未讀數、保留天數、自動已讀秒數與可用通道,一次回齊。
export const apiGetMemberNotificationsSummary = async (data) =>
  await fetchApi.get(`member/notifications/summary`, data)

// 通知清單。五個分頁共用這一支,要哪一類由 category 決定。
export const apiGetMemberNotifications = async (data) =>
  await fetchApi.get(`member/notifications`, data)

// 修改密碼。驗既有密碼、新密碼與再次輸入,成功後後端要求重新登入。
export const apiPostMemberPasswordChange = async (data) =>
  await fetchApi.post(`member/password/change`, data)
