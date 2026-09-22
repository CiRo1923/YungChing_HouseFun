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

// 帳號管理。手機是帳號,只能讀;可改的是姓氏、名字與 E-Mail。
export const apiGetMemberProfile = async (data) => await fetchApi.get(`member/profile`, data)

export const apiPutMemberProfile = async (data) => await fetchApi.put(`member/profile`, data)

// 留言紀錄。刪除收 ids 陣列,一次可刪多筆。
export const apiGetMemberMessages = async (data) => await fetchApi.get(`member/messages`, data)

export const apiDeleteMemberMessages = async (data) =>
  await fetchApi.delete(`member/messages`, data)

// 物件訂閱管理。訂閱的是物件降價通知,刪除同樣收 ids 陣列。
export const apiGetMemberSubscriptionsBuyObjects = async (data) =>
  await fetchApi.get(`member/subscriptions/buy-objects`, data)

export const apiDeleteMemberSubscriptionsBuyObjects = async (data) =>
  await fetchApi.delete(`member/subscriptions/buy-objects`, data)

// 加進物件比一比。一次可加多筆,上限由訂閱清單回的 compareLimit 給。
export const apiPostMemberCompareBuyObjectsItems = async (data) =>
  await fetchApi.post(`member/compare/buy-objects/items`, data)
