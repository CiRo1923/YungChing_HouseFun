export const useCommonStore = defineStore('common', () => {
  /* 一開始就是載入中。

    從 false 起頭的話,第一批資料還沒回來的那一段時間畫面是空的 ——
    使用者看到的是「這一頁沒有東西」,然後內容才突然出現。
    從 true 起頭則是先看到載入中,資料到了才換成內容。

    **關掉它由 plugins/pageLoading.client.js 負責**,不必每一頁自己關:
    那支掛在 Nuxt 的換頁生命週期上,page:finish 在頁面(含 await)完成之後觸發,
    首次進站的 hydration 也會走到那裡。

    代價是 JS 沒有跑起來的時候遮罩不會消失 —— 伺服器端產出的畫面就帶著它,
    而關閉的那一段在瀏覽器端。這種時候使用者看到的是一直轉,不是空白畫面。 */
  const isLoading = ref(true)
  const device = ref('p')

  return {
    isLoading,
    device,
  }
})
