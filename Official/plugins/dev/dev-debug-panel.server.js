// 開發用:SSR 期間攔截自訂 HTTP client(onFetchApi)的 API,寫入 payload,
// 由 dev-debug-panel.client.js 讀出並標記為 server(僅 import.meta.dev 生效)。
// 換專案時依實際 client 調整 import 路徑或移除此檔。
//
// 註:.server 外掛只在 SSR / 整頁載入時執行。client 端換頁的 useAsyncData 在瀏覽器發出,
//     會被 client 外掛標記為 CLI;要看到 SRV 需整頁載入(F5)有 useAsyncData 的頁面。
const BODY_LIMIT = 20000
const clip = (t) => (t.length > BODY_LIMIT ? `${t.slice(0, BODY_LIMIT)}\n…(已截斷)` : t)

const bodyToText = (body) => {
  if (body == null || body === '') return ''
  if (typeof body === 'string') return clip(body)
  try {
    return clip(JSON.stringify(body))
  } catch {
    return '(非文字 body)'
  }
}

// 目前這個 SSR 請求的收集陣列。interceptor 為 singleton 只註冊一次,
// 但每個請求會在外掛 setup(具 Nuxt context)重新指到當次請求的 store。
let currentStore = null

const registerInterceptors = (api) => {
  if (!api?.interceptors || api.__dbgHookedSrv) return
  api.__dbgHookedSrv = true

  api.interceptors.request.use((cfg) => {
    if (!currentStore) return cfg
    const entry = {
      source: 'server',
      type: 'api',
      cat: 'fetchxhr',
      method: cfg.method,
      url: cfg.url,
      reqHeaders: cfg.headers,
      reqBody: bodyToText(cfg.body),
      status: '…',
      ok: null,
      ms: null,
      time: '',
      body: null,
      __start: Date.now(),
    }
    if (cfg.config) cfg.config.__dbgEntry = entry
    currentStore.value.push(entry)
    return cfg
  })

  const finish = (res, ok) => {
    const entry = res?.config?.__dbgEntry
    if (!entry) return res
    entry.status = res.status ?? (ok ? 200 : 'ERR')
    entry.ok = ok
    entry.ms = entry.__start ? Date.now() - entry.__start : null
    delete entry.__start
    try {
      entry.body = clip(typeof res.data === 'string' ? res.data : JSON.stringify(res.data))
    } catch {
      entry.body = '（無法序列化回應)'
    }
    if (!ok && res.message && res.data == null) entry.body = String(res.message)
    return res
  }

  api.interceptors.response.use(
    (res) => finish(res, !res?.isError && res?.status >= 200 && res?.status < 300),
    (err) => finish(err, false)
  )
}

export default defineNuxtPlugin(async (nuxtApp) => {
  if (!import.meta.dev) return

  // 在具 Nuxt context 的 setup 取得當次請求 store;interceptor 之後推到這裡。
  currentStore = useState('__extDbgNet', () => [])

  // await import 讓 interceptor 於頁面 setup(useAsyncData)之前完成註冊,避免漏抓。
  // 用 runWithContext 保留 context,避免 .config.js 頂層 useRuntimeConfig() 在 context 外執行。
  // 自動掃描所有 _api/**/.config.js(import.meta.glob 由 Vite 靜態展開,新增檔案免改此處);
  // registerInterceptors 只認帶 .interceptors 的值,其餘匯出(version 等)自動略過。
  const modules = import.meta.glob('@js/_api/**/.config.js')
  await Promise.all(
    Object.values(modules).map(async (load) => {
      try {
        const mod = await nuxtApp.runWithContext(() => load())
        Object.values(mod).forEach(registerInterceptors)
      } catch {
        /* 專案無此 client 或載入失敗 */
      }
    })
  )
})
