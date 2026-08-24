// 【外掛範例】為除錯面板注入「額外的網路 / API 攔截」——完全不必動 dev-debug-panel.client.js。
//
// 啟用方式:把本檔複製到 plugins/ 頂層(例:plugins/dev-debug-panel.myapi.client.js)即自動生效。
// 目前放在子資料夾 plugins/dev-debug-panel/ 內,Nuxt 不會自動註冊,只作為範本。
//
// 原理:核心(dev-debug-panel.core.js)init 時會在 window.__extDbg 開放註冊點;
// 這裡用「順序安全」方式註冊 extension——不論本檔比核心早或晚執行都能生效。
export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return

  const use = (fn) => {
    if (window.__extDbg)
      window.__extDbg.use(fn) // 核心已就緒 → 直接執行
    else (window.__extDbgExt = window.__extDbgExt || []).push(fn) // 尚未 → 排隊,核心 init 時處理
  }

  use((ctx) => {
    // ── 範例 A:手動記錄一筆請求(自訂 client / GraphQL / SSE / WebSocket 訊息…)
    //    const r = ctx.recordRequest({ method: 'POST', url: '/graphql', type: 'graphql', reqBody: query })
    //    doRequest().then((data) => r.done(200, data)).catch((err) => r.fail(err))

    // ── 範例 B:掛「具 .interceptors 的自訂 client」(單一或 { a, b } 多個)
    //    import('@js/_api/.config.js').then((mod) => ctx.hookInterceptors(mod))

    // ── 範例 C:延到頁面掛載後才掛(client 延遲建立時)
    //    ctx.onMounted(() => { /* ctx.recordRequest / ctx.hookInterceptors ... */ })

    // ctx 可用:recordRequest / hookInterceptors / onMounted /
    //           nets, logs, afterUpdate, nowStr, clip, headersToObject, bodyToText, nextId
    void ctx
  })
})
