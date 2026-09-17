// 換頁時顯示全站遮罩:進入新頁時打開,新頁準備好之後關上。
//
// 用 Nuxt 的換頁生命週期而不是 router 守衛,開與關才會成對 ——
// 守衛只看得到「導航開始」,關的時機得由每一頁自己負責,
// 而漏掉一頁不會報錯,只會讓那一頁的遮罩一直蓋著。
//
// **只涵蓋「換到另一頁」。** 同一頁只換 query(翻頁、排序)時頁面元件不會重建,
// 這兩個時機都不會觸發 —— 那種情況的遮罩由該頁自己的 useAsyncData 狀態驅動,
// 因為只有它知道重取有沒有完成。
export default defineNuxtPlugin((nuxtApp) => {
  const { onIsLoading } = useCommonActions()

  nuxtApp.hook('page:start', () => onIsLoading(true))
  nuxtApp.hook('page:finish', () => onIsLoading(false))
})
