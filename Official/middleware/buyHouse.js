// 物件明細在頁面元件建立之前就取好。
//
// H1 由共用的頁首輸出,而頁首的渲染早於頁面的 setup —— 資料放在頁面裡取的話,
// 伺服器送出的 HTML 裡那個 H1 整個不會出現(v-if 不成立),搜尋引擎拿到的是一份沒有 H1 的頁面。
// 換頁守衛跑在頁面元件建立之前,所以這裡寫進 store 的 seo,頁首渲染時就讀得到。
//
// 掛在明細頁上而不是全站:這一支只服務這一頁。
export default defineNuxtRouteMiddleware(async (to) => {
  const { onApiGetBuyHouseHfid } = useBuyHouseActions()

  // 傳 to 而不是讓 action 自己取 —— 守衛跑在導航完成之前,
  // 那時 useRoute() 還是上一頁,取到的會是上一筆物件。
  await onApiGetBuyHouseHfid(to)
})
