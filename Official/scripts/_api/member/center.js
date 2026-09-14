import { fetchApi } from '@js/_api/member/.config.js'

// 會員中心各頁的 api。auth 三支在 scripts/_api/member/common.js,那幾支是登入狀態本身,
// 每一頁都要用,不屬於會員中心的哪一頁。
//
// 通知總覽五個分頁的未讀數、保留天數、自動已讀秒數與可用通道,一次回齊。
export const apiGetMemberNotificationsSummary = async (data) =>
  await fetchApi.get(`member/notifications/summary`, data)
