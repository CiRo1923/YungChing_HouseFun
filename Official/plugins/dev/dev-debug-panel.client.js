// 【Nuxt 進入點】放在 plugins/ 頂層 → Nuxt 自動註冊,無需設定;僅 import.meta.dev 生效。
// 功能在 ./dev-debug-panel.core.js(三環境共用核心)。core 與本檔同層,但已於 nuxt.config 的
// ignore 排除,不會被 Nuxt 當 plugin 自動註冊(避免弄壞具名匯出);本檔以動態 import 明確載入。
// 換專案時通常只改本檔的 options(router / serverNets / loadApiClients);核心不動。
export default defineNuxtPlugin(async (nuxtApp) => {
  if (!import.meta.dev) return

  // composable 需在 await 之前呼叫(await 後會失去 Nuxt context)
  const router = useRouter()
  let serverNets = []
  try {
    serverNets = useState('__extDbgNet', () => []).value // dev-debug-panel.server.js 於 SSR 寫入
  } catch {
    /* ignore */
  }

  const { initDevDebugPanel } = await import('./dev-debug-panel.core.js')
  initDevDebugPanel({
    enabled: true,
    router, // 換頁偵測(未給則核心自動用 History API)
    serverNets, // SSR 期間攔到的網路紀錄(標記為 SRV)
    // 專案自訂 HTTP client(ofetch 包裝):runWithContext 保留 context;延到 app:mounted 才載入
    loadApiClients: () => nuxtApp.runWithContext(() => import('@js/_api/.config.js')),
    onMounted: (cb) => nuxtApp.hook('app:mounted', cb),
  })
})
