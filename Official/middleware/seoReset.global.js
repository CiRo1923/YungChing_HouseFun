// client 換頁時,在「進入新頁之前」清空全站 SEO,避免上一頁殘留到下一頁。
// 為什麼放這裡而不是頁面 onUnmounted:Suspense 導航下,離開頁的 onUnmounted 會晚於
// 進入頁的 onSetSeo 才觸發,反而把新頁剛設好的 seo 清掉 → Header 變空。middleware 在
// 元件渲染前跑,清空順序正確(先清、再由新頁 onApiBuyXxx 設值)。
// 僅 client,且跳過初次 hydration:SSR 的 project.seo 由 middleware/buySeo 預抓,
// 初次 hydration 若清掉會與 server 不一致(hydration mismatch)。
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const nuxtApp = useNuxtApp()

  if (nuxtApp.isHydrating) return

  const project = useProjectStore(nuxtApp.$pinia)

  project.seo = { h1: '' }
})
