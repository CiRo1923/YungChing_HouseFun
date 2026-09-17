// 換頁時顯示全站遮罩:進入新頁時打開,新頁準備好之後關上。
//
// 用 Nuxt 的換頁生命週期而不是 router 守衛,開與關才會成對 ——
// 守衛只看得到「導航開始」,關的時機得由每一頁自己負責,
// 而漏掉一頁不會報錯,只會讓那一頁的遮罩一直蓋著。
//
// page:start 在頁面的 setup 開始時觸發,page:finish 在它(含 await)完成之後,
// 所以頁面取資料的那段時間都在遮罩底下。
export default defineNuxtPlugin((nuxtApp) => {
  const { onIsLoading } = useCommonActions()

  nuxtApp.hook('page:start', () => onIsLoading(true))
  nuxtApp.hook('page:finish', () => onIsLoading(false))
})
