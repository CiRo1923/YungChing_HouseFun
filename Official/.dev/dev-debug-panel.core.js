// 開發用浮動 Console / Network / Element / Application 面板 —— 框架無關「共用核心」。
// 顯示在頁面右下角,查看 console 訊息、網路請求、DOM/CSS、storage,並可裝置模擬(iframe)。
//
// 本檔零框架依賴(純 DOM / shadow DOM),供 Vue / Nuxt / 純 HTML 共用。以具名匯出提供:
//   import { initDevDebugPanel } from '.../dev-debug-panel.core.js'
//   initDevDebugPanel(options)
// options:
//   enabled        {boolean}   是否啟用(各環境自帶 dev 判斷,如 import.meta.dev / import.meta.env.DEV)
//   router         {object?}   有 beforeEach(fn(to,from)) 的路由物件(Vue/Nuxt);未給則自動用 History API 偵測換頁
//   serverNets     {array?}    SSR 期間攔到的網路紀錄(標記為 server / SRV);Nuxt 可從 useState 帶入
//   loadApiClients {fn?}       回傳 Promise<物件>,物件的值若有 .interceptors 會被掛上攔截(專案自訂 HTTP client)
//   onMounted      {fn?}       (cb)=>void,決定何時執行 loadApiClients(Nuxt 用 app:mounted);未給則於 DOM ready 後執行
// window.fetch / XHR / $fetch(ofetch)/ 資源載入 / WebSocket 皆自動攔截,無需設定。
// 裝置模擬 iframe 內(URL hash 帶 #__extua=)會於 app 讀取前 spoof navigator 並自動不掛面板。
// 裝置模擬預設(常用尺寸 + UA 種類 mobile/android/tablet);desktop 不模擬。
// 用 iframe 以裝置寬度載入本頁(CSS @media 才正確),iframe URL 帶 #__extua=<種類>,
// iframe 內本模組會於 app 讀取前 spoof navigator.userAgent。
const UA_SPOOF = {
  mobile:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  android:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  tablet:
    'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
}
const EXT_DEVICES = [
  { id: 'desktop', group: '', label: '🖥 Desktop', w: 0, h: 0, ua: '' },
  { id: 'm320', group: 'Mobile', label: 'iPhone', w: 320, h: 568, ua: 'mobile' },
  { id: 'm375', group: 'Mobile', label: 'iPhone SE', w: 375, h: 667, ua: 'mobile' },
  { id: 'm414', group: 'Mobile', label: 'iPhone XR', w: 414, h: 896, ua: 'mobile' },
  { id: 'm390', group: 'Mobile', label: 'iPhone 12 Pro', w: 390, h: 844, ua: 'mobile' },
  { id: 'm430', group: 'Mobile', label: 'iPhone 14 Pro Max', w: 430, h: 932, ua: 'mobile' },
  { id: 'sam360', group: 'Mobile', label: 'Galaxy S8+', w: 360, h: 740, ua: 'android' },
  { id: 'sam412', group: 'Mobile', label: 'Galaxy S20 Ultra', w: 412, h: 915, ua: 'android' },
  { id: 'pixel7', group: 'Mobile', label: 'Pixel 7', w: 412, h: 915, ua: 'android' },
  { id: 'tmini', group: 'Tablet', label: 'iPad Mini', w: 768, h: 1024, ua: 'tablet' },
  { id: 'tair', group: 'Tablet', label: 'iPad Air', w: 820, h: 1180, ua: 'tablet' },
  { id: 'tpro', group: 'Tablet', label: 'iPad Pro', w: 1024, h: 1366, ua: 'tablet' },
]

// 若本頁載入在裝置模擬 iframe 內(URL hash 帶 #__extua=mobile|android|tablet),
// 於 app 讀取前先 spoof navigator,並標記 __EXT_EMU__ 讓 plugin body 早退(不掛面板)。
;(() => {
  if (typeof window === 'undefined') return
  try {
    const m = /(?:^|[#&])__extua=(mobile|android|tablet)/.exec(window.location.hash || '')
    if (!m) return
    const type = m[1]
    window.__EXT_EMU__ = type
    const def = (k, v) => {
      try {
        Object.defineProperty(navigator, k, { get: () => v, configurable: true })
      } catch {
        /* ignore */
      }
    }
    def('userAgent', UA_SPOOF[type])
    def('platform', type === 'tablet' ? 'iPad' : type === 'android' ? 'Linux armv8l' : 'iPhone')
    def('maxTouchPoints', 5)
    def('vendor', type === 'android' ? 'Google Inc.' : 'Apple Computer, Inc.')
    def('userAgentData', undefined)
    try {
      if (!('ontouchstart' in window)) window.ontouchstart = null
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
})()

export function initDevDebugPanel(options = {}) {
  if (!options.enabled) return
  if (typeof window === 'undefined' || window.__extDebugPanel) return
  if (window.__EXT_EMU__) return // 裝置模擬 iframe 內:只覆寫 UA(已於上方完成),不掛面板 / 不攔截
  window.__extDebugPanel = true

  const MAX = 400
  const BODY_LIMIT = 200000
  const logs = []
  const nets = []

  // UI 狀態存 sessionStorage,整頁重整(F5)後還原,避免又回到預設 Console 分頁
  const UI_KEY = '__extDbgUI'
  const loadUI = () => {
    try {
      return JSON.parse(sessionStorage.getItem(UI_KEY)) || {}
    } catch {
      return {}
    }
  }
  const ui = loadUI()

  let activeTab = ['network', 'element', 'storage'].includes(ui.activeTab)
    ? ui.activeTab
    : 'console'
  let onlyProblems = !!ui.onlyProblems
  let preserveLog = !!ui.preserveLog
  let filterText = ui.filterText || ''
  let netId = 0
  let picking = false
  let inspectEl = null
  let inspectView = ui.inspectView === 'computed' ? 'computed' : 'css'
  const treeExpanded = new Set() // Element 分頁:已展開的 DOM 節點
  const srcExpanded = new Set() // 原始碼:已展開內容的 style / script 節點
  const srcCollapsed = new Set() // 原始碼:被收合(隱藏子節點)的元素 tag
  let srcAnchor = null // 收合/展開時的錨點 { node, viewTop },重繪後把該行拉回原本視窗位置(不跳走)
  let srcAnchorLine = null // 重繪過程中對應到 srcAnchor.node 的行元素
  const FORCE_STATES = ['hover', 'focus', 'active', 'focus-within', 'focus-visible', 'target']
  // 強制套用的元素狀態(:hover 等)——每個元素各自記憶:切到別的元素會移除當前套用,
  // 切回原元素則還原它先前勾選的狀態。
  let forcedByEl = new WeakMap()
  const EMPTY_FORCED = new Set()
  const curForced = () => (inspectEl && forcedByEl.get(inspectEl)) || EMPTY_FORCED
  const ensureForced = () => {
    let s = forcedByEl.get(inspectEl)
    if (!s) {
      s = new Set()
      forcedByEl.set(inspectEl, s)
    }
    return s
  }
  let forcedEls = [] // 目前被標記 data-dev-force 的元素(選取元素 + 其祖先)
  let forceStyleEl = null
  // Element 視圖:'element'(左 HTML + 右 CSS 分割)/ 'tree'(樹狀)。舊值 source/css 一律歸到 element。
  let elementView = ui.elementView === 'tree' ? 'tree' : 'element'
  let srcEditNode = null // 原始碼:正在就地編輯 HTML 的節點
  let scrollSrcToSel = false // 切到「元素」視圖時,是否要捲到選取元素(只在切換當下捲一次)
  // 元素視圖:左側 HTML 佔比(其餘給右側 CSS),預設 3/5;夾在 0.2~0.8
  let elSplitRatio =
    typeof ui.elSplit === 'number' && ui.elSplit >= 0.2 && ui.elSplit <= 0.8 ? ui.elSplit : 0.6
  let elLeftScrollTop = 0 // 元素視圖左側 HTML 的捲動位置(重繪後還原,點選元素不跳走)
  let forceOpen = !!ui.forceOpen // CSS 面板「強制狀態」區塊是否展開(預設收合)
  let cssPos = ['left', 'bottom'].includes(ui.cssPos) ? ui.cssPos : 'right' // 元素視圖 CSS 面板位置:右/左/下
  let deviceId = EXT_DEVICES.some((d) => d.id === ui.device) ? ui.device : 'desktop' // 裝置模擬
  let deviceIframe = null // 裝置模擬中的 iframe(同源,可跨框選取 / 檢查);desktop 時為 null
  // 面板拖曳位置以「距右 / 距下」記錄(null=CSS 預設右下),讓縮放時右下邊固定(往左上長)
  let panelRight = typeof ui.panelRight === 'number' ? ui.panelRight : null
  let panelBottom = typeof ui.panelBottom === 'number' ? ui.panelBottom : null
  let netFilter = ui.netFilter || 'all' // Network 類型篩選
  let storageView = ['session', 'cookie'].includes(ui.storageView) ? ui.storageView : 'local' // Storage 子分頁

  const refs = {}

  const saveUI = () => {
    try {
      sessionStorage.setItem(
        UI_KEY,
        JSON.stringify({
          activeTab,
          inspectView,
          elementView,
          elSplit: elSplitRatio,
          forceOpen,
          cssPos,
          device: deviceId,
          panelRight,
          panelBottom,
          netFilter,
          storageView,
          onlyProblems,
          preserveLog,
          filterText,
          open: refs.panel ? !refs.panel.hidden : false,
        })
      )
    } catch {
      /* ignore */
    }
  }

  const nowStr = () => new Date().toTimeString().slice(0, 8)
  const trim = (arr) => {
    if (arr.length > MAX) arr.splice(0, arr.length - MAX)
  }
  const clip = (t) => (t.length > BODY_LIMIT ? `${t.slice(0, BODY_LIMIT)}\n…(已截斷)` : t)
  const el = (tag, cls) => {
    const d = document.createElement(tag)
    if (cls) d.className = cls
    return d
  }

  const fmt = (args) =>
    args
      .map((a) => {
        if (a instanceof Error) return a.stack || a.message
        if (typeof a === 'object' && a !== null) {
          try {
            return JSON.stringify(a)
          } catch {
            return String(a)
          }
        }
        return String(a)
      })
      .join(' ')

  const headersToObject = (h) => {
    const out = {}
    if (!h) return out
    try {
      if (typeof Headers !== 'undefined' && h instanceof Headers) h.forEach((v, k) => (out[k] = v))
      else if (Array.isArray(h)) h.forEach(([k, v]) => (out[k] = v))
      else Object.assign(out, h)
    } catch {
      /* ignore */
    }
    return out
  }

  const bodyToText = (body) => {
    if (body == null || body === '') return ''
    if (typeof body === 'string') return clip(body)
    if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams)
      return body.toString()
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      const parts = []
      body.forEach((v, k) => parts.push(`${k}=${typeof v === 'string' ? v : '(file)'}`))
      return parts.join('&')
    }
    return '(非文字 body)'
  }

  // ---- 攔截 console ----
  const levels = ['log', 'info', 'warn', 'error', 'debug']
  const originalConsole = {}
  levels.forEach((lv) => {
    originalConsole[lv] = console[lv] ? console[lv].bind(console) : () => {}
    console[lv] = (...args) => {
      originalConsole[lv](...args)
      logs.push({ level: lv, text: fmt(args), time: nowStr(), raw: args })
      trim(logs)
      afterUpdate()
    }
  })

  window.addEventListener('error', (e) => {
    const where = e.filename ? ` @ ${e.filename}:${e.lineno}:${e.colno}` : ''
    logs.push({ level: 'error', text: `${e.message}${where}`, time: nowStr() })
    trim(logs)
    afterUpdate()
  })
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason?.stack || e.reason?.message || String(e.reason)
    logs.push({ level: 'error', text: `UnhandledRejection: ${reason}`, time: nowStr() })
    trim(logs)
    afterUpdate()
  })
  // 資源載入失敗統一記錄:同一個網址可能由 capture error(無狀態碼)與 PerformanceObserver
  // (有 responseStatus,如 404)兩路各觸發一次,這裡以 url 去重;若後到的那次帶了狀態碼,
  // 就補寫回既有那筆,確保 Console 顯示得到「(404)」這類錯誤代碼。
  const resErrLogged = new Map()
  const logResourceError = (url, tag, status) => {
    if (!url) return
    const code = status ? ` (${status})` : ''
    const existing = resErrLogged.get(url)
    if (existing) {
      if (status && !/\(\d+\)/.test(existing.text)) {
        existing.text = `資源載入失敗${code} <${tag || 'resource'}>: ${url}`
        afterUpdate()
      }
      return
    }
    const entry = {
      level: 'error',
      text: `資源載入失敗${code} <${tag || 'resource'}>: ${url}`,
      time: nowStr(),
    }
    resErrLogged.set(url, entry)
    logs.push(entry)
    trim(logs)
    afterUpdate()
  }
  // 資源載入失敗(<img>/<script>/<link>/<audio> 等)的 error 事件「不會冒泡」,
  // 上面冒泡階段的 listener 抓不到,必須用 capture(第三參數 true)才收得到。
  // 此路徑拿不到 HTTP 狀態碼(事件不提供),狀態碼改由 addResourceEntry 補上。
  window.addEventListener(
    'error',
    (e) => {
      const t = e.target
      if (!t || t === window || !t.tagName) return // 這是 JS 執行期錯誤,交給上面的冒泡 listener
      logResourceError(t.src || t.href || '', t.tagName.toLowerCase(), '')
    },
    true
  )

  // 複製 response 讀取內容(僅文字類),不影響原本呼叫端消費 body
  const captureFetchBody = (entry, res) => {
    const ct = res.headers.get('content-type') || ''
    entry.bodyCt = ct
    if (!/json|text|xml|javascript|urlencoded/i.test(ct)) {
      entry.body = `（${ct || '未知型別'},不顯示內容)`
      return
    }
    res
      .clone()
      .text()
      .then((t) => {
        entry.body = clip(t)
        afterUpdate()
      })
      .catch(() => {
        entry.body = '（無法讀取回應內容)'
      })
  }

  // ---- 攔截 fetch ----
  // 專案 API client(onFetchApi)以 fetcher = fetch 發送,只要本 patch 早於 client 建立即可全數捕捉。
  const _fetch = window.fetch
  if (_fetch) {
    window.fetch = async (...args) => {
      const [input, init] = args
      const url = typeof input === 'string' ? input : (input?.url ?? String(input))
      const method = (init?.method || input?.method || 'GET').toUpperCase()
      const start = performance.now()
      const entry = {
        id: ++netId,
        source: 'client',
        type: 'fetch',
        cat: 'fetchxhr',
        method,
        url,
        reqHeaders: headersToObject(init?.headers),
        reqBody: bodyToText(init?.body),
        status: '…',
        ok: null,
        ms: null,
        time: nowStr(),
        body: null,
      }
      nets.push(entry)
      trim(nets)
      afterUpdate()

      try {
        const res = await _fetch(...args)
        entry.status = res.status
        entry.ok = res.ok
        entry.ms = Math.round(performance.now() - start)
        captureFetchBody(entry, res)
        afterUpdate()
        return res
      } catch (err) {
        entry.status = 'ERR'
        entry.ok = false
        entry.ms = Math.round(performance.now() - start)
        entry.error = String(err)
        afterUpdate()
        throw err
      }
    }
  }

  // ---- 攔截 XHR ----
  const XHR = window.XMLHttpRequest
  if (XHR) {
    const open = XHR.prototype.open
    const send = XHR.prototype.send
    const setHeader = XHR.prototype.setRequestHeader
    XHR.prototype.open = function (method, url, ...rest) {
      this.__dbg = { method: (method || 'GET').toUpperCase(), url: String(url), reqHeaders: {} }
      return open.call(this, method, url, ...rest)
    }
    XHR.prototype.setRequestHeader = function (name, value) {
      if (this.__dbg) this.__dbg.reqHeaders[name] = value
      return setHeader.call(this, name, value)
    }
    XHR.prototype.send = function (body) {
      const info = this.__dbg
      if (info) {
        const start = performance.now()
        const entry = {
          id: ++netId,
          source: 'client',
          type: 'xhr',
          cat: 'fetchxhr',
          method: info.method,
          url: info.url,
          reqHeaders: info.reqHeaders,
          reqBody: bodyToText(body),
          status: '…',
          ok: null,
          ms: null,
          time: nowStr(),
          body: null,
        }
        nets.push(entry)
        trim(nets)
        afterUpdate()
        this.addEventListener('loadend', () => {
          entry.status = this.status || 'ERR'
          entry.ok = this.status >= 200 && this.status < 400
          entry.ms = Math.round(performance.now() - start)
          try {
            const rt = this.responseType
            if (rt === '' || rt === 'text') {
              entry.body = clip(this.responseText || '')
            } else if (rt === 'json') {
              entry.body = JSON.stringify(this.response)
            } else {
              entry.body = `（responseType=${rt},不顯示內容)`
            }
          } catch {
            entry.body = '（無法讀取回應內容)'
          }
          afterUpdate()
        })
      }
      return send.call(this, body)
    }
  }

  // ---- 補捉其他資源載入(CSS / JS / 圖片 / 字型 / 媒體 …,含動態 append),供 Network 分類 ----
  const categorizeResource = (name, initiatorType) => {
    const url = name || ''
    const ext = ((url.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase()
    // 先用副檔名判斷具體資產類型:字型 / 圖片 / 影音 / wasm / manifest。
    // 這些常由 CSS 觸發(@font-face、background-image),initiatorType 會是 'css',
    // 若先判 initiatorType==='css' 會把字型 / 背景圖誤歸成 css,故副檔名優先。
    if (ext === 'wasm') return 'wasm'
    if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) return 'font'
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'ico', 'bmp'].includes(ext))
      return 'img'
    if (['mp4', 'webm', 'ogv', 'mp3', 'wav', 'm4a', 'mov', 'oga'].includes(ext)) return 'media'
    if (ext === 'webmanifest' || /manifest\.json$/i.test(url)) return 'manifest'
    // 再用副檔名 / initiatorType 判斷 css / js;最後才用 initiatorType 補圖片(無副檔名時)
    if (initiatorType === 'css' || ext === 'css') return 'css'
    if (initiatorType === 'script' || ext === 'js' || ext === 'mjs') return 'js'
    if (initiatorType === 'img') return 'img'
    return 'other'
  }
  const addResourceEntry = (e) => {
    const it = e.initiatorType
    if (it === 'fetch' || it === 'xmlhttprequest') return // 已由 fetch / XHR 攔截,避免重複
    const status =
      typeof e.responseStatus === 'number' && e.responseStatus > 0 ? e.responseStatus : ''
    nets.push({
      id: ++netId,
      source: 'client',
      type: 'resource',
      cat: categorizeResource(e.name, it),
      method: 'GET',
      url: e.name,
      initiator: it,
      status: status || '200',
      ok: status ? status >= 200 && status < 400 : true,
      ms: Math.round(e.duration) || null,
      time: nowStr(),
      body: `(資源載入:${it || 'resource'},無回應內容)`,
    })
    trim(nets)
    // 失敗(4xx/5xx)且有拿到狀態碼時,補進 Console 錯誤清單並帶上錯誤代碼(如 404)。
    if (status && !(status >= 200 && status < 400)) {
      logResourceError(e.name, categorizeResource(e.name, it), status)
    }
  }
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      performance.getEntriesByType('navigation').forEach((e) => {
        nets.push({
          id: ++netId,
          source: 'client',
          type: 'resource',
          cat: 'doc',
          method: 'GET',
          url: e.name,
          status: '200',
          ok: true,
          ms: Math.round(e.duration) || null,
          time: nowStr(),
          body: '(文件 navigation)',
        })
      })
    } catch {
      /* ignore */
    }
    try {
      const po = new PerformanceObserver((list) => {
        list.getEntries().forEach(addResourceEntry)
        afterUpdate()
      })
      po.observe({ type: 'resource', buffered: true })
    } catch {
      /* ignore */
    }
  }

  // ---- 攔截 WebSocket(通訊端)----
  const _WS = window.WebSocket
  if (_WS) {
    const WrappedWS = function (url, protocols) {
      const ws = protocols !== undefined ? new _WS(url, protocols) : new _WS(url)
      const entry = {
        id: ++netId,
        source: 'client',
        type: 'ws',
        cat: 'ws',
        method: 'WS',
        url: String(url),
        status: '連線中',
        ok: null,
        ms: null,
        time: nowStr(),
        body: null,
      }
      nets.push(entry)
      trim(nets)
      afterUpdate()
      ws.addEventListener('open', () => {
        entry.status = 'open'
        entry.ok = true
        afterUpdate()
      })
      ws.addEventListener('close', () => {
        entry.status = 'closed'
        if (entry.ok == null) entry.ok = false
        afterUpdate()
      })
      ws.addEventListener('error', () => {
        entry.status = 'error'
        entry.ok = false
        afterUpdate()
      })
      return ws
    }
    WrappedWS.prototype = _WS.prototype
    WrappedWS.CONNECTING = _WS.CONNECTING
    WrappedWS.OPEN = _WS.OPEN
    WrappedWS.CLOSING = _WS.CLOSING
    WrappedWS.CLOSED = _WS.CLOSED
    window.WebSocket = WrappedWS
  }

  // ---- 讓「面板自身的點擊」不觸發專案 document click 監聽(如下拉 outside-click 收合) ----
  // 專案下拉用 document capture click 偵測外部點擊來收合;點面板(shadow host)會被當成外部而收掉。
  // 包裝 document 的 click 監聽:凡點擊路徑經過本面板 host 者,app 的 click 監聽一律略過。
  // 不影響面板 shadow 內的按鈕(事件仍會傳到它們);需在 app 註冊監聽前先套用(本檔於 head 先執行)。
  const __clickWrapMap = new WeakMap()
  const __origAdd = document.addEventListener.bind(document)
  const __origRemove = document.removeEventListener.bind(document)
  document.addEventListener = function (type, listener, opts) {
    if (type === 'click' && typeof listener === 'function') {
      let wrapped = __clickWrapMap.get(listener)
      if (!wrapped) {
        wrapped = function (e) {
          const host = refs.host || document.getElementById('ext-debug-host')
          if (host && typeof e.composedPath === 'function' && e.composedPath().includes(host)) {
            return
          }
          return listener.apply(this, arguments)
        }
        __clickWrapMap.set(listener, wrapped)
      }
      return __origAdd(type, wrapped, opts)
    }
    return __origAdd(type, listener, opts)
  }
  document.removeEventListener = function (type, listener, opts) {
    if (type === 'click' && typeof listener === 'function') {
      const wrapped = __clickWrapMap.get(listener)
      if (wrapped) return __origRemove(type, wrapped, opts)
    }
    return __origRemove(type, listener, opts)
  }

  // ---- 攔截 $fetch(ofetch)----
  // Nuxt useAsyncData / useFetch 走 $fetch,ofetch 於啟動時已抓走原生 fetch 參考,
  // window.fetch 的 patch 攔不到,需另外包裝 globalThis.$fetch。
  const recordOfetch = (request, opts, run) => {
    const url = typeof request === 'string' ? request : (request?.url ?? String(request))
    const method = (opts?.method || request?.method || 'GET').toUpperCase()
    const start = performance.now()
    const entry = {
      id: ++netId,
      source: 'client',
      type: '$fetch',
      cat: 'fetchxhr',
      method,
      url,
      reqHeaders: headersToObject(opts?.headers),
      reqBody: bodyToText(opts?.body),
      status: '…',
      ok: null,
      ms: null,
      time: nowStr(),
      body: null,
    }
    nets.push(entry)
    trim(nets)
    afterUpdate()

    return run().then(
      (data) => {
        entry.status = 200
        entry.ok = true
        entry.ms = Math.round(performance.now() - start)
        try {
          entry.body = clip(typeof data === 'string' ? data : JSON.stringify(data))
        } catch {
          entry.body = '（無法序列化回應)'
        }
        afterUpdate()
        return data
      },
      (err) => {
        entry.status = err?.statusCode || err?.response?.status || 'ERR'
        entry.ok = false
        entry.ms = Math.round(performance.now() - start)
        entry.error = String(err)
        try {
          entry.body = err?.data ? JSON.stringify(err.data) : String(err?.message || err)
        } catch {
          /* ignore */
        }
        afterUpdate()
        throw err
      }
    )
  }

  const wrapOfetch = () => {
    const orig = globalThis.$fetch
    if (typeof orig !== 'function' || orig.__dbgWrapped) return false

    const wrapped = (request, opts) => recordOfetch(request, opts, () => orig(request, opts))
    Object.assign(wrapped, orig)
    wrapped.__dbgWrapped = true
    if (typeof orig.raw === 'function') {
      const rawOrig = orig.raw.bind(orig)
      wrapped.raw = (request, opts) => recordOfetch(request, opts, () => rawOrig(request, opts))
    }

    globalThis.$fetch = wrapped
    try {
      window.$fetch = wrapped
    } catch {
      /* ignore */
    }
    return true
  }

  // $fetch 由 Nuxt 核心在 plugin 前建立,通常已存在;若尚未就緒則稍後重試
  if (!wrapOfetch()) setTimeout(wrapOfetch, 0)

  // ---- 專案自訂 HTTP client 攔截(由 options.loadApiClients 提供)----
  // 有些專案的 API 走自訂 client(如 ofetch 包裝),於模組載入時就抓走原生 fetch,
  // window.fetch / $fetch 的 patch 攔不到;此處對「回傳物件中具 .interceptors 的值」通用掛攔截。
  const hookApiClientInterceptors = (mod) => {
    if (!mod) return
    Object.values(mod).forEach((api) => {
      if (!api || !api.interceptors || api.__dbgHooked) return
      api.__dbgHooked = true

      api.interceptors.request.use((cfg) => {
        const entry = {
          id: ++netId,
          source: 'client',
          type: 'api',
          cat: 'fetchxhr',
          method: cfg.method,
          url: cfg.url,
          reqHeaders: cfg.headers,
          reqBody: bodyToText(cfg.body),
          status: '…',
          ok: null,
          ms: null,
          time: nowStr(),
          body: null,
        }
        entry.__start = performance.now()
        if (cfg.config) cfg.config.__dbgEntry = entry
        nets.push(entry)
        trim(nets)
        afterUpdate()
        return cfg
      })

      const finish = (res, ok) => {
        const entry = res?.config?.__dbgEntry
        if (!entry) return res
        entry.status = res.status ?? (ok ? 200 : 'ERR')
        entry.ok = ok
        entry.ms = Math.round(performance.now() - entry.__start)
        try {
          entry.body = clip(typeof res.data === 'string' ? res.data : JSON.stringify(res.data))
        } catch {
          entry.body = '（無法序列化回應)'
        }
        if (!ok && res.message && res.data == null) entry.body = String(res.message)
        afterUpdate()
        return res
      }

      api.interceptors.response.use(
        (res) => finish(res, !res?.isError && res?.status >= 200 && res?.status < 300),
        (err) => finish(err, false)
      )
    })
  }
  if (typeof options.loadApiClients === 'function') {
    const runApiHook = () => {
      Promise.resolve()
        .then(() => options.loadApiClients())
        .then(hookApiClientInterceptors)
        .catch(() => {})
    }
    // 掛載時機:優先 options.onMounted(Nuxt:app:mounted);否則 DOM ready 後
    if (typeof options.onMounted === 'function') options.onMounted(runApiHook)
    else if (document.readyState !== 'loading') setTimeout(runApiHook, 0)
    else window.addEventListener('DOMContentLoaded', runApiHook, { once: true })
  }

  // ---- 外掛(extensions):讓各專案注入「額外的網路 / API 攔截」,核心不必改 ----
  // extension = (ctx) => {...};可由 options.extensions 傳入,或其他檔案呼叫
  // window.__extDbg.use(fn)(不必動進入點 client.js)。ctx 提供內部 API。
  const extCtx = {
    nets,
    logs,
    nowStr,
    clip,
    trim,
    headersToObject,
    bodyToText,
    afterUpdate: (...a) => afterUpdate(...a), // 用包裝:afterUpdate 於後方定義,直接引用會 TDZ
    nextId: () => ++netId,
    // 記錄一筆請求,回傳 { entry, done, fail };適合手動攔截自訂 client / GraphQL / WS 等
    recordRequest(info = {}) {
      const entry = {
        id: ++netId,
        source: info.source || 'client',
        type: info.type || 'ext',
        cat: info.cat || 'fetchxhr',
        method: (info.method || 'GET').toUpperCase(),
        url: info.url || '',
        reqHeaders: info.reqHeaders || {},
        reqBody: bodyToText(info.reqBody),
        status: '…',
        ok: null,
        ms: null,
        time: nowStr(),
        body: null,
        __start: performance.now(),
      }
      nets.push(entry)
      trim(nets)
      afterUpdate()
      return {
        entry,
        done(status, body, ok) {
          entry.status = status
          entry.ok = ok !== undefined ? ok : status >= 200 && status < 400
          entry.ms = Math.round(performance.now() - entry.__start)
          if (body !== undefined) {
            try {
              entry.body = clip(typeof body === 'string' ? body : JSON.stringify(body))
            } catch {
              entry.body = '（無法序列化回應)'
            }
          }
          afterUpdate()
        },
        fail(err, status) {
          entry.status = status || 'ERR'
          entry.ok = false
          entry.ms = Math.round(performance.now() - entry.__start)
          entry.error = String(err)
          afterUpdate()
        },
      }
    },
    // 掛「具 .interceptors 的 client(單一或多個)」的通用攔截(同 loadApiClients 內部邏輯)
    hookInterceptors: (modOrClient) =>
      hookApiClientInterceptors(
        modOrClient && modOrClient.interceptors ? { _: modOrClient } : modOrClient
      ),
    // 需延到頁面掛載後才執行(某些自訂 client 延遲建立)
    onMounted:
      typeof options.onMounted === 'function'
        ? options.onMounted
        : (cb) => {
            if (document.readyState !== 'loading') setTimeout(cb, 0)
            else window.addEventListener('DOMContentLoaded', cb, { once: true })
          },
  }
  const runExtension = (fn) => {
    try {
      if (typeof fn === 'function') fn(extCtx)
    } catch (err) {
      logs.push({
        level: 'error',
        text: `dev-debug-panel extension error: ${err}`,
        time: nowStr(),
      })
    }
  }
  // 全域註冊點:其他檔案不必改 client.js,即可 window.__extDbg.use(ctx => {...}) 加外掛;
  // 於核心 init 前排入 window.__extDbgExt 佇列者,一併處理。
  const extQueue = Array.isArray(window.__extDbgExt) ? window.__extDbgExt : []
  window.__extDbg = { use: runExtension, ctx: extCtx }
  // 初始外掛延到同步 init 之後再跑(此時 afterUpdate 等已定義,避免 TDZ)
  Promise.resolve().then(() => {
    ;(options.extensions || []).forEach(runExtension)
    extQueue.forEach(runExtension)
  })

  // ---- SSR 期間攔到的網路紀錄(標記為 server / SRV)----
  if (Array.isArray(options.serverNets)) {
    options.serverNets.forEach((e) =>
      nets.push({ ...e, id: ++netId, source: 'server', cat: e.cat || 'fetchxhr' })
    )
  }

  // ---- 換頁偵測:有 router 用 router.beforeEach;否則用 History API 後備 ----
  // 未勾保留時清空舊頁紀錄;勾保留時插入換頁分隔線。
  let firstNav = !!(options.router && typeof options.router.beforeEach === 'function') // router 需跳過初次(hydration)
  const onNav = (toPath, fromPath, toFull) => {
    if (firstNav) {
      firstNav = false
      afterUpdate()
      return
    }
    if (toPath === fromPath) {
      afterUpdate()
      return
    }
    if (preserveLog) {
      nets.push({ id: ++netId, type: 'nav', url: toFull, time: nowStr() })
      trim(nets)
    } else {
      logs.length = 0
      nets.length = 0
    }
    afterUpdate()
  }
  if (options.router && typeof options.router.beforeEach === 'function') {
    options.router.beforeEach((to, from) => onNav(to.path, from.path, to.fullPath))
  } else {
    let lastPath = location.pathname
    const fire = () => {
      const p = location.pathname
      onNav(p, lastPath, location.pathname + location.search + location.hash)
      lastPath = p
    }
    const wrapHistory = (name) => {
      const orig = history[name]
      if (typeof orig !== 'function' || orig.__dbgWrapped) return
      const wrapped = function (...args) {
        const r = orig.apply(this, args)
        fire()
        return r
      }
      wrapped.__dbgWrapped = true
      history[name] = wrapped
    }
    wrapHistory('pushState')
    wrapHistory('replaceState')
    window.addEventListener('popstate', fire)
    window.addEventListener('hashchange', fire)
  }

  // ---- JSON 樹(Array 顯示 Array 格式、Object 顯示 Object 格式) ----
  const valueLeaf = (value) => {
    const span = el('span', 'jv')
    if (value === null) {
      span.classList.add('t-null')
      span.textContent = 'null'
    } else if (typeof value === 'string') {
      span.classList.add('t-string')
      span.textContent = `"${value}"`
    } else if (typeof value === 'number') {
      span.classList.add('t-number')
      span.textContent = String(value)
    } else if (typeof value === 'boolean') {
      span.classList.add('t-boolean')
      span.textContent = String(value)
    } else {
      span.textContent = String(value)
    }
    return span
  }

  const jsonNode = (value, keyLabel, path, entry) => {
    const isArr = Array.isArray(value)
    const isObj = value !== null && typeof value === 'object'
    const wrap = el('div', 'jn')

    if (!isObj) {
      const leaf = el('div', 'jn-leaf')
      if (keyLabel !== null) {
        const k = el('span', 'jk')
        k.textContent = keyLabel
        leaf.append(k, document.createTextNode(': '))
      }
      leaf.appendChild(valueLeaf(value))
      wrap.appendChild(leaf)
      return wrap
    }

    const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value)
    const expanded = entry.__expanded.has(path)
    const head = el('div', 'jn-head')
    const toggle = el('span', 'jn-toggle')
    toggle.textContent = expanded ? '▾' : '▸'
    head.appendChild(toggle)
    if (keyLabel !== null) {
      const k = el('span', 'jk')
      k.textContent = keyLabel
      head.append(k, document.createTextNode(': '))
    }
    const tag = el('span', 'jt')
    tag.textContent = isArr ? `Array(${entries.length}) ` : `Object `
    head.appendChild(tag)
    const brace = el('span', 'jb')
    brace.textContent = expanded ? (isArr ? '[' : '{') : isArr ? '[ … ]' : '{ … }'
    head.appendChild(brace)
    head.addEventListener('click', () => {
      if (entry.__expanded.has(path)) entry.__expanded.delete(path)
      else entry.__expanded.add(path)
      renderList()
    })
    wrap.appendChild(head)

    if (expanded) {
      const kids = el('div', 'jn-kids')
      entries.forEach(([k, v]) => {
        kids.appendChild(jsonNode(v, isArr ? `[${k}]` : k, `${path}.${k}`, entry))
      })
      wrap.appendChild(kids)
      const close = el('div', 'jn-close')
      close.textContent = isArr ? ']' : '}'
      wrap.appendChild(close)
    }
    return wrap
  }

  const buildResponseView = (entry) => {
    if (entry.body == null) {
      const p = el('div', 'raw')
      p.textContent = '（讀取中或無內容)'
      return p
    }
    let parsed
    try {
      parsed = JSON.parse(entry.body)
    } catch {
      const p = el('div', 'raw')
      p.textContent = entry.body
      return p
    }
    if (!entry.__expanded) entry.__expanded = new Set(['root'])
    return jsonNode(parsed, null, 'root', entry)
  }

  const buildDetail = (entry) => {
    if (!entry.__expanded) entry.__expanded = new Set(['root'])
    const d = el('div', 'detail')

    // Request
    const reqH = el('div', 'sec-h')
    reqH.textContent = 'Request'
    d.appendChild(reqH)
    const reqLine = el('div', 'raw')
    reqLine.textContent = `${entry.method} ${entry.url}`
    d.appendChild(reqLine)
    if (entry.reqHeaders && Object.keys(entry.reqHeaders).length) {
      const rh = el('div', 'raw dim')
      rh.textContent = `headers: ${JSON.stringify(entry.reqHeaders)}`
      d.appendChild(rh)
    }
    if (entry.reqBody) {
      const rb = el('div', 'raw dim')
      rb.textContent = `body: ${entry.reqBody}`
      d.appendChild(rb)
    }

    // Response
    const respH = el('div', 'sec-h')
    respH.textContent = 'Response'
    const copy = el('button', 'copy')
    copy.textContent = '複製'
    copy.addEventListener('click', (e) => {
      e.stopPropagation()
      const text = entry.body == null ? '' : entry.body
      navigator.clipboard?.writeText(text).then(
        () => {
          copy.textContent = '已複製'
          setTimeout(() => (copy.textContent = '複製'), 1200)
        },
        () => (copy.textContent = '複製失敗')
      )
    })
    respH.appendChild(copy)
    d.appendChild(respH)
    d.appendChild(buildResponseView(entry))
    return d
  }

  // ---- Inspect(點選頁面元素看結構 / 樣式,面板內簡易版 F12) ----
  const INSPECT_PROPS = [
    'display',
    'position',
    'width',
    'height',
    'padding',
    'margin',
    'border',
    'color',
    'background-color',
    'font-size',
    'font-weight',
    'line-height',
    'border-radius',
    'box-shadow',
    'z-index',
    'opacity',
    'flex-direction',
    'justify-content',
    'align-items',
    'gap',
    'grid-template-columns',
  ]
  // 判斷是否為 Tailwind utility class(含變體 / 任意值 / 常見 utility 前綴)
  const isTailwindUtil = (c) => {
    if (/[:[\]/%]/.test(c)) return true // hover: / md: / w-[..] / bg-black/50 等
    return /^-?(?:p[xytblr]?|m[xytblr]?|w|h|min|max|size|gap|space|inset|top|bottom|left|right|z|order|col|row|grid|flex|basis|grow|shrink|justify|items|content|self|place|text|font|leading|tracking|whitespace|break|truncate|bg|from|via|to|border|rounded|ring|shadow|opacity|divide|outline|cursor|select|pointer|overflow|object|aspect|transition|duration|delay|ease|animate|transform|translate|rotate|scale|skew|origin|blur|backdrop|fill|stroke|sr|block|inline|hidden|table|contents|float|clear|static|fixed|absolute|relative|sticky|visible|invisible|antialiased|uppercase|lowercase|capitalize|italic|underline|container)(?:-.*)?$/.test(
      c
    )
  }
  // 保留語意 class:l-* / m-* 一律留;其餘只要不是 Tailwind utility 也留
  const keepClass = (c) => /^(?:l|m)-/.test(c) || !isTailwindUtil(c)
  const buildSelectorPath = (node) => {
    const parts = []
    let e = node
    let depth = 0
    while (e && e.nodeType === 1 && depth < 6) {
      let s = e.tagName.toLowerCase()
      if (e.id) s += `#${e.id}`
      const kept = e.classList
        ? [...e.classList].filter((c) => keepClass(c) && !c.startsWith('--'))
        : []
      if (kept.length) s += `.${kept.join('.')}`
      parts.unshift(s)
      e = e.parentElement
      depth++
    }
    return parts.join(' > ')
  }
  // 收集命中該元素的 CSS 規則(掃所有 styleSheets,以 element.matches 比對 selector)
  const safeMatches = (element, selector) => {
    try {
      // matches 不支援 pseudo-element(::before / ::after / ::placeholder …),先移除再比對
      const cleaned = selector.replace(/::[\w-]+(\([^)]*\))?/g, '').trim()
      return cleaned ? element.matches(cleaned) : false
    } catch {
      return false
    }
  }
  // 估算 CSS specificity(a=id, b=class/attr/pseudo-class, c=element/pseudo-element)
  // :where() 貢獻 0;:is()/:not()/:has() 本身不計但保留括號內容一起算(近似,足供排序)
  const specificity = (selector) => {
    let s = selector.replace(/:where\([^)]*\)/gi, '')
    s = s.replace(/:(?:is|not|has|matches)\(/gi, '(')
    const ids = (s.match(/#(?:\\.|[\w-])+/g) || []).length
    const pseudoEl = (s.match(/::[\w-]+|:(?:before|after|first-line|first-letter)\b/gi) || [])
      .length
    const s2 = s.replace(/::[\w-]+|:(?:before|after|first-line|first-letter)\b/gi, ' ')
    const classes = (s2.match(/\.(?:\\.|[\w-])+/g) || []).length
    const attrs = (s2.match(/\[[^\]]+\]/g) || []).length
    const pseudoCls = (s2.match(/:[\w-]+(?:\([^)]*\))?/g) || []).length
    const s3 = s2.replace(/#(?:\\.|[\w-])+|\.(?:\\.|[\w-])+|\[[^\]]+\]|:[\w-]+(?:\([^)]*\))?/g, ' ')
    const els = (s3.match(/[a-zA-Z][\w-]*/g) || []).length
    const a = ids
    const b = classes + attrs + pseudoCls
    const c = els + pseudoEl
    return { a, b, c, score: a * 1e6 + b * 1e3 + c }
  }
  const collectMatchedRules = (element) => {
    const out = []
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.selectorText && rule.style) {
          // 單一規則可能有多個逗號分隔 selector,只留命中的
          const matchesForced = (s) => {
            if (safeMatches(element, s)) return true
            if (!curForced().size) return false
            let base = s
            for (const st of curForced()) base = base.replace(forceRe(st), '')
            return base !== s && safeMatches(element, base.trim() || '*')
          }
          const hit = rule.selectorText
            .split(',')
            .map((s) => s.trim())
            .filter(matchesForced)
          if (hit.length) {
            const specs = hit.map(specificity)
            const spec = specs.reduce((m, x) => (x.score >= m.score ? x : m), specs[0])
            // 顯示完整 selector 群組(含未命中的逗號選擇器),排序用命中的最高 specificity
            out.push({ selector: rule.selectorText, style: rule.style, spec })
          }
        } else if (rule.media && rule.cssRules) {
          // @media:只在當前條件成立時納入
          let ok = true
          try {
            ok = winOf(element).matchMedia(rule.conditionText || rule.media.mediaText).matches
          } catch {
            /* ignore */
          }
          if (ok) walk(rule.cssRules)
        } else if (rule.cssRules) {
          // @supports / @layer / @container 等:往內遞迴
          walk(rule.cssRules)
        }
      }
    }
    for (const sheet of Array.from(docOf(element).styleSheets)) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue // 跨網域樣式表無法讀取,略過
      }
      if (rules) walk(rules)
    }
    return out
  }
  // ---- 強制元素狀態(:hover / :focus …,類 DevTools force state) ----
  const forceRe = (st) => new RegExp(`:${st}(?![\\w-])`, 'g')
  const rewriteForcedSel = (sel) => {
    let out = sel
    for (const st of curForced()) out = out.replace(forceRe(st), `[data-dev-force~="${st}"]`)
    return out
  }
  const clearForced = () => {
    forcedEls.forEach((e) => e.removeAttribute('data-dev-force'))
    forcedEls = []
    if (forceStyleEl) forceStyleEl.textContent = ''
  }
  // 完整清除:移除套用中的強制狀態 + 忘掉所有元素的勾選記錄(捲軸移動 / 最小化時使用)
  const clearForcedAll = () => {
    clearForced()
    forcedByEl = new WeakMap()
  }
  // 是否有任何強制狀態正在套用(頁面被改動中)
  const hasForcedApplied = () => !!(forceStyleEl && forceStyleEl.textContent)
  const applyForcedStates = () => {
    // 強制樣式要注入到「選取元素所屬的 document」(裝置模擬時為 iframe)
    const fdoc = docOf(inspectEl)
    if (!forceStyleEl || forceStyleEl.ownerDocument !== fdoc) {
      if (forceStyleEl) forceStyleEl.remove()
      forceStyleEl = fdoc.createElement('style')
      forceStyleEl.id = 'ext-force-style'
      fdoc.head.appendChild(forceStyleEl)
    }
    forcedEls.forEach((e) => e.removeAttribute('data-dev-force'))
    forcedEls = []
    const states = curForced()
    if (!inspectEl || states.size === 0) {
      forceStyleEl.textContent = ''
      return
    }
    // 選取元素「與其祖先」都標記,讓 group-hover(祖先 :hover)等也能觸發
    const forceVal = [...states].join(' ')
    for (let e = inspectEl; e && e.nodeType === 1; e = e.parentElement) {
      e.setAttribute('data-dev-force', forceVal)
      forcedEls.push(e)
    }
    const parts = []
    const walk = (rules, media) => {
      for (const rule of rules) {
        if (rule.selectorText && rule.style) {
          rule.selectorText
            .split(',')
            .map((s) => s.trim())
            .forEach((sel) => {
              let hasForced = false
              let base = sel
              for (const st of states) {
                if (forceRe(st).test(sel)) hasForced = true
                base = base.replace(forceRe(st), '')
              }
              if (!hasForced || !safeMatches(inspectEl, base.trim() || '*')) return
              const css = `${rewriteForcedSel(sel)}{${rule.style.cssText}}`
              parts.push(media ? `@media ${media}{${css}}` : css)
            })
        } else if (rule.media && rule.cssRules) {
          walk(rule.cssRules, rule.conditionText || rule.media.mediaText)
        } else if (rule.cssRules) {
          walk(rule.cssRules, media)
        }
      }
    }
    for (const sheet of Array.from(fdoc.styleSheets)) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      if (rules) walk(rules, null)
    }
    forceStyleEl.textContent = parts.join('\n')
    fdoc.head.appendChild(forceStyleEl) // 移到最後,提高覆蓋優先
  }
  // 將 var(--x[, fallback]) 依「該元素」的 computed 值解析成真實值(遞迴處理巢狀 var)
  const resolveVars = (value, elm, depth = 0) => {
    if (depth > 6 || !/var\(/.test(value)) return value
    const cs = csOf(elm)
    const out = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (m, name, fb) => {
      const v = cs.getPropertyValue(name).trim()
      return v || (fb != null ? fb.trim() : m)
    })
    return out !== value ? resolveVars(out, elm, depth + 1) : out
  }
  // 跨框輔助:元素可能在裝置 iframe 內,樣式 / computed / 座標要用它自己的 document / window
  const docOf = (elm) => (elm && elm.ownerDocument) || document
  const winOf = (elm) => docOf(elm).defaultView || window
  const csOf = (elm) => winOf(elm).getComputedStyle(elm)
  // 檢查對象的 document:裝置模擬時為 iframe 內文件,否則為主頁(供原始碼 / 樹狀取根節點)
  const emuDoc = () => {
    try {
      return (deviceIframe && deviceIframe.contentDocument) || document
    } catch {
      return document
    }
  }
  const positionOverlay = (node) => {
    if (!refs.overlay) return
    let r = node.getBoundingClientRect()
    // iframe 內元素:座標相對 iframe viewport,需換算到主頁(加 iframe 位移並乘上縮放比)
    if (node.ownerDocument !== document && deviceIframe) {
      const fr = deviceIframe.getBoundingClientRect()
      const scale = deviceIframe.offsetWidth ? fr.width / deviceIframe.offsetWidth : 1
      r = {
        left: fr.left + r.left * scale,
        top: fr.top + r.top * scale,
        width: r.width * scale,
        height: r.height * scale,
      }
    }
    Object.assign(refs.overlay.style, {
      display: 'block',
      left: `${r.left}px`,
      top: `${r.top}px`,
      width: `${r.width}px`,
      height: `${r.height}px`,
    })
  }
  const hideOverlay = () => {
    if (refs.overlay) refs.overlay.style.display = 'none'
  }
  // 面板本身在 shadow DOM,其事件於 document 層會 retarget 成 host,略過不攔
  const isOwnUI = (t) => t === refs.host || t === refs.overlay || t === deviceIframe
  // 裝置 iframe 的 contentWindow(同源才拿得到);拿不到回 null
  const deviceIframeWin = () => {
    try {
      return deviceIframe && deviceIframe.contentWindow ? deviceIframe.contentWindow : null
    } catch {
      return null
    }
  }
  // 模擬時只允許選取 iframe(模擬框)內的元素;非模擬時整頁皆可選
  const inPickScope = (t) => {
    if (!deviceIframe) return true
    try {
      return !!t && t.ownerDocument === deviceIframe.contentDocument
    } catch {
      return false
    }
  }
  const onInspectMove = (e) => {
    const t = e.target
    if (!t || isOwnUI(t)) return
    if (!inPickScope(t)) {
      hideOverlay() // 移出模擬框即隱藏藍框
      return
    }
    positionOverlay(t)
  }
  const onInspectPick = (e) => {
    const t = e.target
    if (isOwnUI(t) || !inPickScope(t)) return
    e.preventDefault()
    e.stopImmediatePropagation() // 攔在 window,不讓 document 層(如下拉 outside-click)收到此點擊
    inspectEl = t
    elementView = 'element' // 選到即切到「元素」視圖(左 HTML + 右 CSS)
    scrollSrcToSel = true // 左側 HTML 聚焦到選取元素
    inlineEdits.delete(t)
    stopPicking() // 選到即定住:停止跟隨滑鼠,藍框鎖定此元素
    positionOverlay(t)
    addLockWatch() // 之後點畫面任一處或視窗捲動即取消
    saveUI()
    renderList()
  }
  const syncInspectBtn = () => {
    if (refs.inspectBtn) refs.inspectBtn.classList.toggle('active', picking)
  }
  const startPicking = () => {
    if (picking) return
    removeLockWatch()
    picking = true
    // 掛在 window(capture 早於 document),搭配 onInspectPick 的 stopImmediatePropagation,
    // 讓點擊在到達 document 前被攔下,不觸發專案自身的 outside-click / 下拉收合等邏輯。
    window.addEventListener('mousemove', onInspectMove, true)
    window.addEventListener('click', onInspectPick, true)
    // 裝置模擬:同時掛到 iframe 視窗,才能選取模擬畫面內的元素(同源)
    const iw = deviceIframeWin()
    if (iw) {
      iw.addEventListener('mousemove', onInspectMove, true)
      iw.addEventListener('click', onInspectPick, true)
    }
    syncInspectBtn()
  }
  const stopPicking = () => {
    if (!picking) return
    picking = false
    window.removeEventListener('mousemove', onInspectMove, true)
    window.removeEventListener('click', onInspectPick, true)
    const iw = deviceIframeWin()
    if (iw) {
      iw.removeEventListener('mousemove', onInspectMove, true)
      iw.removeEventListener('click', onInspectPick, true)
    }
    syncInspectBtn()
  }
  // 選定後的「點畫面任一處 / 捲動 → 取消」監聽
  const onLockedClick = (e) => {
    if (isOwnUI(e.target)) return // 點面板本身不取消
    clearInspect()
    renderList()
  }
  const onLockedScroll = (e) => {
    if (e && isOwnUI(e.target)) return // 捲動面板內部不取消
    clearInspect()
    renderList()
  }
  const addLockWatch = () => {
    document.addEventListener('click', onLockedClick, true)
    window.addEventListener('scroll', onLockedScroll, true)
  }
  const removeLockWatch = () => {
    document.removeEventListener('click', onLockedClick, true)
    window.removeEventListener('scroll', onLockedScroll, true)
  }
  // 取消選取:停止跟隨 + 移除鎖定監聽 + 清掉藍框與面板內容
  const clearInspect = () => {
    stopPicking()
    removeLockWatch()
    clearForced()
    inspectEl = null
    hideOverlay()
  }
  // 暫停(離開 Element 分頁):停止跟隨與高亮,但保留選取與樹展開狀態
  const suspendInspect = () => {
    stopPicking()
    removeLockWatch()
    clearForced()
    hideOverlay()
  }
  const renderComputed = (elm) => {
    const cs = csOf(elm)
    INSPECT_PROPS.forEach((p) => {
      const v = cs.getPropertyValue(p)
      if (!v) return
      const row = el('div', 'krow')
      const k = el('span', 'k')
      k.textContent = p
      const val = el('span', 'v')
      val.textContent = v
      row.append(k, val)
      refs.body.appendChild(row)
    })
  }
  const disabledDecls = new WeakMap() // rule.style -> Map(prop -> value含!important)
  const addingRule = new WeakSet() // 正在新增宣告的 rule.style
  const parseVal = (raw) => {
    const bang = /!important\s*$/i.test(raw)
    return { value: raw.replace(/!important\s*$/i, '').trim(), priority: bang ? 'important' : '' }
  }
  // element.style {} 行內樣式區塊(置於 CSS 面板最上方,樣式同其他規則)
  // 解析 cssText 成 [{prop,value}](頂層 ; 分隔,忽略 () 與字串內的 ;)
  // 用以正確取得含 var 的 shorthand 值(逐項 longhand getPropertyValue 會是空的)
  const parseDecls = (cssText) => {
    const out = []
    let depth = 0
    let str = null
    let buf = ''
    for (const ch of cssText || '') {
      if (str) {
        buf += ch
        if (ch === str) str = null
        continue
      }
      if (ch === '"' || ch === "'") {
        str = ch
        buf += ch
        continue
      }
      if (ch === '(') depth++
      else if (ch === ')') depth--
      if (ch === ';' && depth === 0) {
        if (buf.trim()) out.push(buf.trim())
        buf = ''
        continue
      }
      buf += ch
    }
    if (buf.trim()) out.push(buf.trim())
    return out
      .map((d) => {
        const i = d.indexOf(':')
        return i < 0 ? null : { prop: d.slice(0, i).trim(), value: d.slice(i + 1).trim() }
      })
      .filter((x) => x && x.prop)
  }
  const renderInlineBlock = (elm, isWinner) => {
    const items = getInline(elm)
    const box = el('div', 'css-rule')
    const sel = el('div', 'css-sel')
    sel.textContent = 'element.style {'
    box.appendChild(sel)
    items.forEach((item) => {
      const p = item.prop.trim()
      const ov = item.on && p && isWinner && !isWinner(p, `inline:${p}`)
      const decl = el('div', `css-decl${item.on ? '' : ' off'}${ov ? ' ov' : ''}`)
      const cb = el('input', 'style-cb')
      cb.type = 'checkbox'
      cb.checked = item.on
      cb.addEventListener('change', () => {
        item.on = cb.checked
        applyInline(elm)
        renderList()
      })
      const pin = el('span', 'css-prop')
      pin.contentEditable = 'true'
      pin.textContent = item.prop
      pin.addEventListener('blur', () => {
        item.prop = pin.textContent.trim()
        applyInline(elm)
      })
      const vin = el('span', 'css-val')
      vin.contentEditable = 'true'
      vin.textContent = item.value
      vin.addEventListener('blur', () => {
        item.value = vin.textContent.trim()
        applyInline(elm)
      })
      decl.append(
        cb,
        mkSpan('css-punct', ' '),
        pin,
        mkSpan('css-punct', ': '),
        vin,
        mkSpan('css-punct', ';')
      )
      if (/var\(/.test(item.value)) {
        const rTrim = resolveVars(item.value, elm).trim()
        if (rTrim && rTrim !== item.value.trim()) {
          const ann = el('span', 'css-varval')
          ann.textContent = ` → ${rTrim}`
          decl.append(ann)
        }
      }
      box.appendChild(decl)
    })
    const closeRow = el('div', 'css-close-row')
    const close = el('span', 'css-sel')
    close.textContent = '}'
    const plus = el('button', 'style-plus css-plus')
    plus.textContent = '+'
    plus.title = '新增樣式'
    plus.addEventListener('click', () => {
      items.push({ prop: '', value: '', on: true })
      renderList()
    })
    closeRow.append(close, plus)
    box.appendChild(closeRow)
    refs.body.appendChild(box)
  }
  const renderCssRules = (elm) => {
    // 分級(顯示順序):0 自定義 CSS > 1 Tailwind > 2 純 tag > 3 通用(*, ::before, ::after)
    const isBase = (sel) =>
      sel
        .split(',')
        .map((s) => s.trim())
        .every((s) => /^(\*|::?[\w-]+)$/.test(s))
    const hasTwVar = (style) => {
      for (let i = 0; i < style.length; i++) if (style[i].startsWith('--tw-')) return true
      return false
    }
    const classifyRule = (r) => {
      const sel = r.selector
      if (isBase(sel)) return 3
      if (hasTwVar(r.style)) return 1 // 宣告含 Tailwind --tw-* 變數 → 歸 Tailwind
      const classes = [...sel.matchAll(/\.((?:\\.|[\w-])+)/g)].map((m) => m[1])
      if (classes.length) return classes.some((c) => keepClass(c)) ? 0 : 1
      if (/#[\w-]/.test(sel)) return 0 // id 視為自定義
      return 2 // 純 tag / 元素選擇器
    }
    const collected = collectMatchedRules(elm) // 原始碼順序

    // 刪除線依「真實 cascade」判定各屬性勝出者:!important > specificity > 原始碼順序(較後者勝)
    const winner = new Map() // prop -> { imp, spec, idx, key }
    const better = (a, b) =>
      a.imp !== b.imp ? a.imp : a.spec !== b.spec ? a.spec > b.spec : a.idx >= b.idx
    const consider = (prop, value, spec, idx, key) => {
      const cand = { imp: /!important/i.test(value), spec, idx, key }
      const cur = winner.get(prop)
      if (!cur || better(cand, cur)) winner.set(prop, cand)
    }
    getInline(elm)
      .filter((it) => it.on && it.prop.trim())
      .forEach((it) =>
        consider(it.prop.trim(), it.value, Infinity, Infinity, `inline:${it.prop.trim()}`)
      )
    collected.forEach((r, idx) =>
      parseDecls(r.style.cssText).forEach((d) =>
        consider(d.prop, d.value, r.spec.score, idx, `${idx}:${d.prop}`)
      )
    )
    const isWinner = (prop, key) => {
      const w = winner.get(prop)
      return !w || w.key === key
    }

    renderInlineBlock(elm, isWinner) // element.style {} 置頂

    // 顯示順序:分級 rank,同級維持原始碼順序;保留原始碼 idx 供勝出判定
    // 排除 CSS 自訂變數(--* / --tw-*):宣告不顯示,只含 --* 的規則(如 Tailwind * reset)整條隱藏
    const isCustomProp = (p) => p.startsWith('--')
    // 多重選擇器依「頂層逗號」斷行(避開 :not()/[attr] 等括號內的逗號)
    const splitSelectors = (s) => {
      const out = []
      let depth = 0
      let str = null
      let buf = ''
      for (const ch of s) {
        if (str) {
          buf += ch
          if (ch === str) str = null
          continue
        }
        if (ch === '"' || ch === "'") {
          str = ch
          buf += ch
          continue
        }
        if (ch === '(' || ch === '[') depth++
        else if (ch === ')' || ch === ']') depth--
        if (ch === ',' && depth === 0) {
          if (buf.trim()) out.push(buf.trim())
          buf = ''
          continue
        }
        buf += ch
      }
      if (buf.trim()) out.push(buf.trim())
      return out
    }
    const ruleHasVisible = (style) => {
      if (addingRule.has(style)) return true
      if (parseDecls(style.cssText).some((d) => !isCustomProp(d.prop))) return true
      const dis = disabledDecls.get(style)
      return dis ? [...dis.keys()].some((p) => !isCustomProp(p)) : false
    }
    const matched = collected
      .map((r, idx) => ({ r, idx, rank: classifyRule(r) }))
      .filter(({ r }) => ruleHasVisible(r.style))
      .sort((a, b) => a.rank - b.rank || a.idx - b.idx)
    const cnt = el('div', 'insp-sec')
    cnt.textContent = `${matched.length} 條(可勾選 / 編輯 / + 新增)`
    refs.body.appendChild(cnt)
    if (!matched.length) {
      const e = el('div', 'raw dim')
      e.textContent = '(無;或樣式表跨網域無法讀取)'
      refs.body.appendChild(e)
      return
    }
    matched.forEach(({ r, idx }) => {
      try {
        const { selector, style } = r
        const box = el('div', 'css-rule')
        const sel = el('div', 'css-sel')
        sel.textContent = `${splitSelectors(selector).join(',\n')} {`
        box.appendChild(sel)

        const declRow = (prop, rawVal, on, overridden) => {
          const decl = el('div', `css-decl${on ? '' : ' off'}${overridden ? ' ov' : ''}`)
          const cb = el('input', 'style-cb')
          cb.type = 'checkbox'
          cb.checked = on
          cb.addEventListener('change', () => {
            let dis = disabledDecls.get(style)
            if (!dis) {
              dis = new Map()
              disabledDecls.set(style, dis)
            }
            try {
              if (cb.checked) {
                const saved = dis.get(prop)
                dis.delete(prop)
                const pv = parseVal(saved != null ? saved : rawVal)
                style.setProperty(prop, pv.value, pv.priority)
              } else {
                dis.set(prop, rawVal)
                style.removeProperty(prop)
              }
            } catch {
              /* 唯讀樣式表略過 */
            }
            renderList()
          })
          const pin = el('span', 'css-prop')
          pin.contentEditable = 'true'
          pin.textContent = prop
          const vin = el('span', 'css-val')
          vin.contentEditable = 'true'
          vin.textContent = rawVal
          const resolved = /var\(/.test(rawVal) ? resolveVars(rawVal, elm) : rawVal
          let sw = null
          if (
            typeof CSS !== 'undefined' &&
            CSS.supports &&
            CSS.supports('color', resolved.trim())
          ) {
            sw = el('span', 'css-swatch')
            sw.style.background = resolved.trim()
            sw.title = resolved.trim()
          }
          const applyEdit = () => {
            const np = pin.textContent.trim()
            const nvRaw = vin.textContent.trim()
            try {
              if (on) {
                if (np !== prop) style.removeProperty(prop)
                if (np) {
                  const pv = parseVal(nvRaw)
                  style.setProperty(np, pv.value, pv.priority)
                }
              } else {
                const dis = disabledDecls.get(style)
                if (dis) {
                  dis.delete(prop)
                  if (np) dis.set(np, nvRaw)
                }
              }
            } catch {
              /* ignore */
            }
            renderList()
          }
          pin.addEventListener('blur', applyEdit)
          vin.addEventListener('blur', applyEdit)
          decl.append(cb, mkSpan('css-punct', ' '), pin, mkSpan('css-punct', ': '))
          if (sw) decl.append(sw)
          decl.append(vin, mkSpan('css-punct', ';'))
          // 值用到 css 變數:補上解析後的真實值 + hover 顯示各變數
          if (/var\(/.test(rawVal)) {
            const rTrim = resolved.trim()
            if (rTrim && rTrim !== rawVal.trim()) {
              const ann = el('span', 'css-varval')
              ann.textContent = ` → ${rTrim}`
              decl.append(ann)
            }
            const varNames = [
              ...new Set([...rawVal.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1])),
            ]
            if (varNames.length) {
              const cs2 = csOf(elm)
              vin.title = varNames
                .map(
                  (n) => `${n}: ${resolveVars(cs2.getPropertyValue(n), elm).trim() || '(未定義)'}`
                )
                .join('\n')
            }
          }
          box.appendChild(decl)
        }

        parseDecls(style.cssText)
          .filter(({ prop }) => !isCustomProp(prop)) // 排除 --* 自訂變數
          .forEach(({ prop, value }) => {
            declRow(prop, value, true, !isWinner(prop, `${idx}:${prop}`)) // 非勝出者 → 覆蓋刪除線
          })
        const dis = disabledDecls.get(style)
        if (dis) dis.forEach((v, p) => !isCustomProp(p) && declRow(p, v, false, false))

        // 新增中的空白宣告
        if (addingRule.has(style)) {
          const decl = el('div', 'css-decl')
          const cb = el('input', 'style-cb')
          cb.type = 'checkbox'
          cb.checked = true
          cb.disabled = true
          const pin = el('span', 'css-prop')
          pin.contentEditable = 'true'
          const vin = el('span', 'css-val')
          vin.contentEditable = 'true'
          const commit = () => {
            const np = pin.textContent.trim()
            const pv = parseVal(vin.textContent.trim())
            addingRule.delete(style)
            if (np) {
              try {
                style.setProperty(np, pv.value, pv.priority)
              } catch {
                /* ignore */
              }
            }
            renderList()
          }
          vin.addEventListener('blur', commit)
          pin.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              vin.focus()
            }
          })
          decl.append(
            cb,
            mkSpan('css-punct', ' '),
            pin,
            mkSpan('css-punct', ': '),
            vin,
            mkSpan('css-punct', ';')
          )
          box.appendChild(decl)
          setTimeout(() => pin.focus(), 0)
        }

        // 關閉括號 + 紅色 + 新增鈕
        const closeRow = el('div', 'css-close-row')
        const close = el('span', 'css-sel')
        close.textContent = '}'
        const plus = el('button', 'style-plus css-plus')
        plus.textContent = '+'
        plus.title = '新增樣式'
        plus.addEventListener('click', () => {
          addingRule.add(style)
          renderList()
        })
        closeRow.append(close, plus)
        box.appendChild(closeRow)
        refs.body.appendChild(box)
      } catch (err) {
        const e = el('div', 'raw dim')
        e.textContent = `(此規則無法顯示:${err && err.message})`
        refs.body.appendChild(e)
      }
    })
  }
  // ---- Element:整頁 DOM 樹 ----
  const isSkipped = (node) =>
    node === refs.host ||
    node === refs.overlay ||
    (node.id && (node.id === 'ext-debug-host' || node.id === 'ext-force-style'))
  const tagLabel = (node) => {
    let s = node.tagName.toLowerCase()
    if (node.id) s += `#${node.id}`
    if (node.classList && node.classList.length) {
      const cls = [...node.classList].filter((c) => !c.startsWith('--')).slice(0, 3)
      if (cls.length) s += `.${cls.join('.')}`
    }
    return s
  }
  const renderTreeNode = (node, depth) => {
    const kids = [...node.children].filter((c) => !isSkipped(c))
    const hasKids = kids.length > 0
    const open = treeExpanded.has(node)
    const wrap = el('div', 'tnode')
    const row = el('div', 'trow')
    if (node === inspectEl) row.classList.add('sel')
    row.style.paddingLeft = `${4 + depth * 12}px`
    const toggle = el('span', 'ttoggle')
    toggle.textContent = hasKids ? (open ? '▾' : '▸') : '·'
    if (hasKids) {
      toggle.addEventListener('click', (ev) => {
        ev.stopPropagation()
        if (treeExpanded.has(node)) treeExpanded.delete(node)
        else treeExpanded.add(node)
        renderList()
      })
    }
    const tag = el('span', 'ttag')
    tag.textContent = tagLabel(node)
    row.append(toggle, tag)
    row.addEventListener('click', () => {
      inspectEl = node
      elementView = 'element'
      scrollSrcToSel = true // 切到元素視圖時左側 HTML 聚焦此節點
      inlineEdits.delete(node)
      positionOverlay(node)
      saveUI()
      renderList()
    })
    row.addEventListener('mouseenter', () => {
      if (!picking) positionOverlay(node)
    })
    wrap.append(row)
    if (hasKids && open) kids.forEach((c) => wrap.append(renderTreeNode(c, depth + 1)))
    return wrap
  }
  // 行內樣式編輯器狀態(保留被停用的項目):Element -> [{prop, value, on}]
  const inlineEdits = new WeakMap()
  const seedInline = (elm) => {
    const items = parseDecls(elm.style.cssText).map((d) => ({
      prop: d.prop,
      value: d.value,
      on: true,
    }))
    inlineEdits.set(elm, items)
    return items
  }
  const getInline = (elm) => inlineEdits.get(elm) || seedInline(elm)
  const applyInline = (elm) => {
    elm.style.cssText = getInline(elm)
      .filter((i) => i.on && i.prop.trim())
      .map((i) => `${i.prop}: ${i.value}`)
      .join('; ')
  }

  // 明細:DOM 路徑 / 子分頁(CSS 樣式 / Computed 樣式)
  const renderDetail = (elm) => {
    applyForcedStates() // 依目前勾選,把強制狀態套到此元素

    const pathH = el('div', 'insp-sec')
    pathH.textContent = 'DOM 路徑'
    refs.body.appendChild(pathH)
    const path = el('div', 'insp-path')
    path.textContent = buildSelectorPath(elm)
    refs.body.appendChild(path)

    // 強制元素狀態(:hover 等)— 可展開 / 收合
    const fH = el('div', 'insp-sec insp-sec-toggle')
    // 收合時若有勾選中的狀態,於標題顯示數量提示,避免忘記還開著
    const activeMark = curForced().size ? ` ·已套用 ${curForced().size}` : ''
    fH.textContent = `${forceOpen ? '▾' : '▸'} 強制狀態${forceOpen ? '' : activeMark}`
    fH.addEventListener('click', () => {
      forceOpen = !forceOpen
      saveUI()
      renderList()
    })
    refs.body.appendChild(fH)
    const fbar = el('div', 'force-states')
    if (!forceOpen) fbar.style.display = 'none'
    FORCE_STATES.forEach((st) => {
      const lab = el('label', 'force-item')
      const cb = el('input')
      cb.type = 'checkbox'
      cb.checked = curForced().has(st)
      cb.addEventListener('change', () => {
        if (cb.checked) ensureForced().add(st)
        else forcedByEl.get(inspectEl)?.delete(st)
        applyForcedStates()
        renderList() // 重繪讓規則列表反映強制狀態
      })
      lab.append(cb, document.createTextNode(` :${st}`))
      fbar.append(lab)
    })
    refs.body.appendChild(fbar)

    // style / script / link:顯示內容或來源(含動態 append 的)
    const tn = elm.tagName
    if (tn === 'STYLE' || tn === 'SCRIPT' || tn === 'LINK') {
      const h = el('div', 'insp-sec')
      h.textContent =
        tn === 'LINK' ? '來源 (link)' : tn === 'SCRIPT' ? '來源 / 內容 (script)' : '內容 (style)'
      refs.body.appendChild(h)
      const box = el('div', 'raw')
      if (tn === 'LINK') {
        box.textContent = `rel=${elm.rel || elm.getAttribute('rel') || ''}\nhref=${elm.href || elm.getAttribute('href') || ''}`
      } else if (tn === 'SCRIPT') {
        const src = elm.src || elm.getAttribute('src')
        box.textContent = src ? `src=${src}` : elm.textContent ? clip(elm.textContent) : '(空)'
      } else {
        box.textContent = elm.textContent ? clip(elm.textContent) : '(空)'
      }
      refs.body.appendChild(box)
    }

    const subbar = el('div', 'insp-subtabs')
    const mkTab = (key, label) => {
      const b = el('button', 'subtab')
      b.textContent = label
      if (inspectView === key) b.classList.add('active')
      b.addEventListener('click', () => {
        inspectView = key
        saveUI()
        renderList()
      })
      return b
    }
    subbar.append(mkTab('css', 'CSS 樣式'), mkTab('computed', 'Computed 樣式'))
    refs.body.appendChild(subbar)

    if (inspectView === 'computed') renderComputed(elm)
    else renderCssRules(elm)
  }
  // ---- 原始碼視圖:把整個 <html> 縮排序列化,完全攤開 ----
  const HTML_VOID = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ])
  const mkSpan = (cls, text) => {
    const s = el('span', cls)
    s.textContent = text
    return s
  }
  // 原始碼右鍵選單
  const closeCtxMenu = () => {
    if (refs.ctxMenu) {
      refs.ctxMenu.remove()
      refs.ctxMenu = null
    }
  }
  const showCtxMenu = (x, y, node) => {
    closeCtxMenu()
    const backdrop = el('div', 'ctxbackdrop')
    backdrop.addEventListener('mousedown', closeCtxMenu)
    backdrop.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      closeCtxMenu()
    })
    const menu = el('div', 'ctxmenu')
    menu.style.left = `${x}px`
    menu.style.top = `${y}px`
    menu.addEventListener('mousedown', (e) => e.stopPropagation())
    const item = (label, fn) => {
      const b = el('div', 'ctxitem')
      b.textContent = label
      b.addEventListener('click', () => {
        closeCtxMenu()
        fn()
      })
      return b
    }
    menu.append(
      item('編輯 HTML', () => {
        srcEditNode = node
        renderList()
      }),
      item('複製 outerHTML', () => navigator.clipboard?.writeText(node.outerHTML)),
      item('刪除節點', () => {
        node.remove()
        renderList()
      })
    )
    backdrop.appendChild(menu)
    refs.panel.appendChild(backdrop) // 掛在面板內,避免被 .wrap 的 z-index 壓在後面
    refs.ctxMenu = backdrop
  }
  const renderSource = () => {
    const bar = el('div', 'sec-h')
    bar.textContent = '完整 HTML(已展開,略過面板自身)'
    refs.body.appendChild(bar)
    const pre = el('div', 'htmlsrc')
    const plain = []
    const MAX_LINES = 6000
    let truncated = false
    let selLine = null // 選取元素對應的第一行(供高亮 + 捲動聚焦)
    srcAnchorLine = null // 本次重繪對應錨點節點的行
    const addLine = (ind, spans, plainText, node, toggle) => {
      if (plain.length >= MAX_LINES) {
        truncated = true
        return
      }
      const d = el('div', 'h-line')
      d.style.paddingLeft = `${ind * 12}px`
      d.append(toggle || mkSpan('h-arrow', '')) // 保留展開箭頭欄位(無 toggle 者為空白佔位,對齊)
      spans.forEach((s) => d.append(s))
      if (node && node === inspectEl) {
        d.classList.add('sel') // 標記目前選取的元素
        if (!selLine) selLine = d // 記住第一行(開始標籤),供捲動聚焦
      }
      if (node && srcAnchor && node === srcAnchor.node && !srcAnchorLine) srcAnchorLine = d
      if (node) {
        d.classList.add('h-hover')
        d.addEventListener('mouseenter', () => {
          if (!picking) positionOverlay(node)
        })
        d.addEventListener('click', () => {
          // 已在「元素」視圖:點左側 HTML 行只重選 + 刷新右側 CSS,不捲動(使用者當下就在看這行)
          inspectEl = node
          elementView = 'element'
          inlineEdits.delete(node)
          positionOverlay(node)
          saveUI()
          renderList()
        })
        d.addEventListener('contextmenu', (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          showCtxMenu(ev.clientX, ev.clientY, node)
        })
      }
      pre.append(d)
      plain.push('  '.repeat(ind) + plainText)
    }
    const build = (node, indent) => {
      if (plain.length >= MAX_LINES) {
        truncated = true
        return
      }
      if (node.nodeType === 3) {
        const t = node.nodeValue.replace(/\s+/g, ' ').trim()
        if (t) addLine(indent, [mkSpan('h-text', t)], t, node.parentElement)
        return
      }
      if (node.nodeType === 8) {
        const c = node.nodeValue.trim()
        if (c) addLine(indent, [mkSpan('h-comment', `<!-- ${c} -->`)], `<!-- ${c} -->`)
        return
      }
      if (node.nodeType !== 1 || isSkipped(node)) return
      // 就地編輯:此節點以 textarea 取代
      if (node === srcEditNode) {
        const box = el('div')
        box.style.paddingLeft = `${indent * 12}px`
        const ta = el('textarea', 'html-edit')
        ta.value = node.outerHTML
        const btns = el('div', 'st-addbar')
        const apply = el('button', 'btn')
        apply.textContent = '套用'
        apply.addEventListener('click', () => {
          try {
            node.outerHTML = ta.value
          } catch {
            /* ignore */
          }
          srcEditNode = null
          renderList()
        })
        const cancel = el('button', 'btn')
        cancel.textContent = '取消'
        cancel.addEventListener('click', () => {
          srcEditNode = null
          renderList()
        })
        btns.append(apply, cancel)
        box.append(ta, btns)
        pre.append(box)
        return
      }
      const tag = node.tagName.toLowerCase()
      const openSpans = [mkSpan('h-punct', '<'), mkSpan('h-tag', tag)]
      let openPlain = `<${tag}`
      for (const a of node.attributes) {
        openSpans.push(
          mkSpan('h-punct', ' '),
          mkSpan('h-attr', a.name),
          mkSpan('h-punct', '="'),
          mkSpan('h-val', a.value),
          mkSpan('h-punct', '"')
        )
        openPlain += ` ${a.name}="${a.value}"`
      }
      if (HTML_VOID.has(tag)) {
        openSpans.push(mkSpan('h-punct', '>'))
        addLine(indent, openSpans, `${openPlain}>`, node)
        return
      }
      // style / script:內容收合成一行(避免超大 style 撐爆行數、截斷後面的 #app);
      // 完整內容可用「複製(完整 HTML)」取得。
      if ((tag === 'style' || tag === 'script') && node.textContent.trim()) {
        const contentLines = node.textContent.replace(/\s+$/, '').split('\n')
        if (srcExpanded.has(node)) {
          openSpans.push(mkSpan('h-punct', '>'))
          const col = mkSpan('h-comment', ' (收合) ')
          col.classList.add('src-toggle')
          col.addEventListener('click', (ev) => {
            ev.stopPropagation()
            srcExpanded.delete(node)
            renderList()
          })
          openSpans.push(col)
          addLine(indent, openSpans, `${openPlain}>`, node)
          const CAP = 800
          contentLines.slice(0, CAP).forEach((l) => addLine(indent + 1, [mkSpan('h-text', l)], l))
          if (contentLines.length > CAP) {
            addLine(
              indent + 1,
              [mkSpan('h-comment', `…還有 ${contentLines.length - CAP} 行(複製取得完整)…`)],
              ''
            )
          }
          addLine(
            indent,
            [mkSpan('h-punct', '</'), mkSpan('h-tag', tag), mkSpan('h-punct', '>')],
            `</${tag}>`,
            node
          )
        } else {
          openSpans.push(mkSpan('h-punct', '>'))
          const toggle = mkSpan(
            'h-comment',
            ` …(${contentLines.length} 行內容,點此展開 / 複製取得完整)… `
          )
          toggle.classList.add('src-toggle')
          toggle.addEventListener('click', (ev) => {
            ev.stopPropagation()
            srcExpanded.add(node)
            renderList()
          })
          openSpans.push(
            toggle,
            mkSpan('h-punct', '</'),
            mkSpan('h-tag', tag),
            mkSpan('h-punct', '>')
          )
          addLine(indent, openSpans, `${openPlain}>…(${contentLines.length} 行)…</${tag}>`, node)
        }
        return
      }
      const kids = [...node.childNodes].filter(
        (n) => n.nodeType === 1 || n.nodeType === 8 || (n.nodeType === 3 && n.nodeValue.trim())
      )
      if (!kids.length) {
        openSpans.push(
          mkSpan('h-punct', '>'),
          mkSpan('h-punct', '</'),
          mkSpan('h-tag', tag),
          mkSpan('h-punct', '>')
        )
        addLine(indent, openSpans, `${openPlain}></${tag}>`, node)
        return
      }
      // 有子節點:加 ▶/▼ 展開收合箭頭;收合時把子節點藏起、開始標籤後接「…</tag>」
      const collapsed = srcCollapsed.has(node)
      // 同一字形,收合時用 CSS 旋轉 -90°(指向右),保證展開 / 收合大小一致
      const arrow = mkSpan(`h-arrow tog${collapsed ? ' collapsed' : ''}`, '▼')
      arrow.addEventListener('click', (ev) => {
        ev.stopPropagation()
        // 記錄此行目前在左側面板的視窗位置,重繪後拉回同位置,避免收合/展開時畫面跳走
        const lineEl = ev.currentTarget.closest('.h-line')
        const pane = lineEl && lineEl.closest('.el-pane')
        srcAnchor =
          pane && lineEl
            ? {
                node,
                viewTop: lineEl.getBoundingClientRect().top - pane.getBoundingClientRect().top,
              }
            : null
        if (srcCollapsed.has(node)) srcCollapsed.delete(node)
        else srcCollapsed.add(node)
        renderList()
      })
      if (collapsed) {
        openSpans.push(
          mkSpan('h-punct', '>'),
          mkSpan('h-ellipsis', '…'),
          mkSpan('h-punct', '</'),
          mkSpan('h-tag', tag),
          mkSpan('h-punct', '>')
        )
        addLine(indent, openSpans, `${openPlain}>…</${tag}>`, node, arrow)
        return
      }
      openSpans.push(mkSpan('h-punct', '>'))
      addLine(indent, openSpans, `${openPlain}>`, node, arrow)
      kids.forEach((k) => build(k, indent + 1))
      addLine(
        indent,
        [mkSpan('h-punct', '</'), mkSpan('h-tag', tag), mkSpan('h-punct', '>')],
        `</${tag}>`,
        node
      )
    }
    const srcRoot = emuDoc().documentElement
    if (srcRoot) build(srcRoot, 0)
    if (truncated) {
      const d = el('div', 'raw dim')
      d.textContent = `…(超過 ${MAX_LINES} 行,已截斷)`
      pre.append(d)
    }

    const prettyText = plain.join('\n')
    // 完整、原樣的渲染後 HTML(含 Vue 輸出;排除面板自身)
    const fullHtml = () => {
      try {
        const clone = emuDoc().documentElement.cloneNode(true)
        clone
          .querySelectorAll('#ext-debug-host, #ext-debug-overlay, #ext-force-style')
          .forEach((n) => n.remove())
        return `<!DOCTYPE html>\n${clone.outerHTML}`
      } catch {
        return prettyText
      }
    }
    const copy = el('button', 'copy')
    copy.textContent = '複製(完整 HTML)'
    copy.addEventListener('click', (e) => {
      e.stopPropagation()
      navigator.clipboard?.writeText(fullHtml()).then(
        () => {
          copy.textContent = '已複製'
          setTimeout(() => (copy.textContent = '複製(完整 HTML)'), 1200)
        },
        () => (copy.textContent = '複製失敗')
      )
    })
    bar.appendChild(copy)
    refs.body.appendChild(pre)
    // 只在剛切到原始碼視圖時捲一次到選取元素(避免每次重繪都硬把畫面拉回去)
    if (scrollSrcToSel && selLine) {
      scrollSrcToSel = false
      requestAnimationFrame(() => selLine.scrollIntoView({ block: 'center' }))
    }
  }
  const renderElement = () => {
    // 視圖切換:元素(左 HTML + 右 CSS)/ 樹狀
    const viewbar = el('div', 'netcats')
    const mkView = (key, label) => {
      const b = el('button', 'netcat')
      b.textContent = label
      if (elementView === key) b.classList.add('active')
      b.addEventListener('click', () => {
        if (key === 'element' && inspectEl) scrollSrcToSel = true // 切到元素 → 左側 HTML 聚焦選取元素
        elementView = key
        saveUI()
        renderList()
      })
      return b
    }
    viewbar.append(mkView('element', '元素'), mkView('tree', '樹狀'))
    // 只在「元素」視圖顯示:靠最右邊三個 icon,一鍵直達 CSS 面板位置(左 / 下 / 右)。
    // 用同一組 SVG(相同外框,只塗滿 CSS 面板所在區塊)確保三顆視覺一致。
    if (elementView === 'element') {
      const dock = el('div', 'el-dock')
      // 三顆同一組:相同外框(rect),只差分割線位置(參考 SugarFun Prototype dev-debug-panel.js)
      const svgBox =
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">RECT</svg>'
      const ICON = {
        left: svgBox.replace(
          'RECT',
          '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/>'
        ),
        right: svgBox.replace(
          'RECT',
          '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="15" y1="4" x2="15" y2="20"/>'
        ),
        bottom: svgBox.replace(
          'RECT',
          '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="14" x2="21" y2="14"/>'
        ),
      }
      const mkPos = (pos, label) => {
        const b = el('button', 'netcat el-iconbtn')
        b.innerHTML = ICON[pos]
        b.title = label
        if (cssPos === pos) b.classList.add('active')
        b.addEventListener('click', () => {
          cssPos = pos
          saveUI()
          renderList()
        })
        return b
      }
      dock.append(
        mkPos('left', 'CSS 靠左'),
        mkPos('right', 'CSS 靠右'),
        mkPos('bottom', 'CSS 靠下')
      )
      viewbar.append(dock)
    }
    refs.body.appendChild(viewbar)

    // ---- 元素:HTML(可折行)+ CSS 分割,位置右/左(水平)或下(垂直),分隔線可拖曳調整大小 ----
    if (elementView === 'element') {
      refs.body.classList.add('body-split')
      const vertical = cssPos === 'bottom'
      const split = el('div', vertical ? 'el-split el-split-v' : 'el-split')
      const htmlPane = el('div', 'el-pane el-html')
      const cssPane = el('div', 'el-pane el-css')
      const divider = el('div', vertical ? 'el-divider el-divider-h' : 'el-divider')
      // elSplitRatio 一律代表「HTML 面板」的佔比,其餘給 CSS
      htmlPane.style.flex = `${elSplitRatio} 1 0`
      cssPane.style.flex = `${1 - elSplitRatio} 1 0`
      // 排列:右=HTML|CSS;左=CSS|HTML;下=HTML/CSS(直向)
      if (cssPos === 'left') split.append(cssPane, divider, htmlPane)
      else split.append(htmlPane, divider, cssPane)
      refs.body.appendChild(split)

      // 借用既有 renderSource / renderDetail:暫時把 refs.body 指到對應面板,畫完還原
      const wantScrollToSel = scrollSrcToSel // renderSource 會把它清掉,先記下
      const realBody = refs.body
      refs.body = htmlPane
      renderSource()
      refs.body = cssPane
      if (inspectEl && inspectEl.isConnected) {
        positionOverlay(inspectEl)
        renderDetail(inspectEl)
      } else {
        const e = el('div', 'empty')
        e.textContent = '（用上方箭頭選取,或在 HTML 點一個元素看樣式)'
        cssPane.appendChild(e)
      }
      refs.body = realBody
      // 保留 HTML 捲動位置:點選元素只更新 CSS 與高亮,畫面不跳走;
      // 只有「切到元素視圖 / 用箭頭或樹狀選取」(wantScrollToSel)才主動捲到選取元素。
      htmlPane.addEventListener('scroll', () => {
        elLeftScrollTop = htmlPane.scrollTop
      })
      if (srcAnchor && srcAnchorLine) {
        // 收合/展開:把錨點行拉回原本視窗位置(不跳走)
        const curTop =
          srcAnchorLine.getBoundingClientRect().top - htmlPane.getBoundingClientRect().top
        htmlPane.scrollTop += curTop - srcAnchor.viewTop
      } else if (!wantScrollToSel) {
        htmlPane.scrollTop = elLeftScrollTop
      }
      srcAnchor = null // 用過即清,避免影響後續一般重繪

      // 拖曳分隔線:依位置換算 HTML 佔比(下=用高度,左=從右往左量,右=從左往右量),夾 0.2~0.8,放開存檔
      divider.addEventListener('mousedown', (ev) => {
        ev.preventDefault()
        const rect = split.getBoundingClientRect()
        const onMove = (e) => {
          let frac
          if (cssPos === 'bottom') frac = (e.clientY - rect.top) / rect.height
          else if (cssPos === 'left') frac = (rect.right - e.clientX) / rect.width
          else frac = (e.clientX - rect.left) / rect.width
          frac = Math.max(0.2, Math.min(0.8, frac))
          elSplitRatio = frac
          htmlPane.style.flex = `${frac} 1 0`
          cssPane.style.flex = `${1 - frac} 1 0`
        }
        const onUp = () => {
          window.removeEventListener('mousemove', onMove, true)
          window.removeEventListener('mouseup', onUp, true)
          saveUI()
        }
        window.addEventListener('mousemove', onMove, true)
        window.addEventListener('mouseup', onUp, true)
      })
      return
    }

    // 樹狀
    const hint = el('div', 'raw dim')
    hint.textContent = picking
      ? '選取中:移動滑鼠預覽,點一下選定(Esc 或再按箭頭取消)'
      : '點樹狀節點看元素(HTML + CSS);或按上方箭頭到畫面上點選'
    refs.body.appendChild(hint)

    // DOM 樹:從 <html> 起(含 head / body),預設展開這三層
    const root = emuDoc().documentElement
    if (root && treeExpanded.size === 0) {
      treeExpanded.add(root)
      if (emuDoc().head) treeExpanded.add(emuDoc().head)
      if (emuDoc().body) treeExpanded.add(emuDoc().body)
    }
    const treeWrap = el('div', 'tree')
    if (root) treeWrap.append(renderTreeNode(root, 0))
    refs.body.appendChild(treeWrap)
  }

  // ---- 清單渲染 ----
  const matchFilter = (text) => !filterText || text.toLowerCase().includes(filterText)

  // ---- 值渲染(仿 Chrome DevTools:物件/陣列可展開、DOM 顯示為 <tag>、函式顯示 ƒ)----
  const valClass = (v) => {
    if (v === null || v === undefined) return 't-null'
    const t = typeof v
    if (t === 'string') return 't-string'
    if (t === 'number' || t === 'bigint') return 't-number'
    if (t === 'boolean') return 't-boolean'
    if (t === 'function') return 't-func'
    return ''
  }
  const domLabel = (v) => {
    let s = v.tagName ? v.tagName.toLowerCase() : String(v.nodeName || 'node').toLowerCase()
    if (v.id) s += `#${v.id}`
    if (v.classList && v.classList.length) s += `.${[...v.classList].slice(0, 3).join('.')}`
    return `<${s}>`
  }
  const valPreview = (v, inKey) => {
    if (v === null) return 'null'
    if (v === undefined) return 'undefined'
    const t = typeof v
    if (t === 'string') return inKey ? v : `"${v}"`
    if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v)
    if (t === 'function') return `ƒ ${v.name || ''}()`
    if (typeof Element !== 'undefined' && v instanceof Element) return domLabel(v)
    if (v instanceof Error) return v.stack || `${v.name}: ${v.message}`
    if (Array.isArray(v)) return `Array(${v.length})`
    const ctor = v.constructor && v.constructor.name
    return ctor && ctor !== 'Object' ? `${ctor} {…}` : '{…}'
  }
  const isExpandable = (v) =>
    v !== null &&
    typeof v === 'object' &&
    !(typeof Element !== 'undefined' && v instanceof Element) &&
    !(v instanceof Error)
  const buildValue = (value, path, entry) => {
    if (!isExpandable(value)) {
      const s = el('span', `cval ${valClass(value)}`)
      s.textContent = valPreview(value)
      return s
    }
    const box = el('div', 'cval-obj')
    const head = el('div', 'cval-head')
    const expanded = entry.__exp && entry.__exp.has(path)
    const tog = el('span', 'cval-tog')
    tog.textContent = expanded ? '▾' : '▸'
    const prev = el('span', 'cval-prev')
    prev.textContent = valPreview(value)
    head.append(tog, prev)
    head.addEventListener('click', () => {
      if (!entry.__exp) entry.__exp = new Set()
      if (entry.__exp.has(path)) entry.__exp.delete(path)
      else entry.__exp.add(path)
      renderList()
    })
    box.appendChild(head)
    if (expanded) {
      const kids = el('div', 'cval-kids')
      let keys = []
      try {
        keys = Array.isArray(value) ? value.map((_, i) => String(i)) : Object.keys(value)
      } catch {
        /* ignore */
      }
      keys.slice(0, 1000).forEach((k) => {
        const kr = el('div', 'cval-row')
        const kEl = el('span', 'cval-key')
        kEl.textContent = k
        kr.append(kEl, document.createTextNode(': '))
        let child
        try {
          child = value[k]
        } catch (err) {
          child = `(取值錯誤: ${err && err.message})`
        }
        kr.appendChild(buildValue(child, `${path}.${k}`, entry))
        kids.appendChild(kr)
      })
      box.appendChild(kids)
    }
    return box
  }

  const renderConsole = () => {
    const rows = logs.filter(
      (l) =>
        (!onlyProblems || l.level === 'error' || l.level === 'warn') &&
        matchFilter(`${l.level} ${l.text}`)
    )
    if (!rows.length) {
      const e = el('div', 'empty')
      e.textContent = '（沒有訊息）'
      refs.body.appendChild(e)
      return
    }
    rows.forEach((l) => {
      const row = el('div', `row lv-${l.level}`)
      const t = el('span', 't')
      t.textContent = l.time
      const lv = el('span', 'lv')
      lv.textContent = l.level
      const msg = el('span', 'msg')
      // 有原始值(console.* / REPL 結果)→ 逐一渲染,物件可展開;否則純文字
      if (Array.isArray(l.raw) && l.raw.length) {
        l.raw.forEach((v, i) => {
          if (i) msg.append(document.createTextNode(' '))
          msg.appendChild(buildValue(v, `${l.time}-${i}`, l))
        })
      } else {
        msg.textContent = l.text
      }
      row.append(t, lv, msg)
      refs.body.appendChild(row)
    })
  }

  const NET_CATS = [
    { key: 'all', label: '全部' },
    { key: 'fetchxhr', label: 'Fetch/XHR' },
    { key: 'doc', label: '文件' },
    { key: 'css', label: 'CSS' },
    { key: 'js', label: 'JS' },
    { key: 'font', label: '字型' },
    { key: 'img', label: '圖片' },
    { key: 'media', label: '媒體' },
    { key: 'manifest', label: '資訊清單' },
    { key: 'ws', label: '通訊端' },
    { key: 'wasm', label: 'Wasm' },
    { key: 'other', label: '其他' },
  ]
  const CAT_LABEL = {
    fetchxhr: 'XHR',
    doc: 'DOC',
    css: 'CSS',
    js: 'JS',
    font: 'FONT',
    img: 'IMG',
    media: 'MEDIA',
    manifest: 'MANIFEST',
    ws: 'WS',
    wasm: 'WASM',
    other: 'OTHER',
  }
  const renderNetwork = () => {
    // 類型篩選列
    const cats = el('div', 'netcats')
    NET_CATS.forEach((c) => {
      const b = el('button', 'netcat')
      if (netFilter === c.key) b.classList.add('active')
      b.textContent = c.label
      b.addEventListener('click', () => {
        netFilter = c.key
        saveUI()
        renderList()
      })
      cats.appendChild(b)
    })
    refs.body.appendChild(cats)

    const rows = nets.filter((n) => {
      if (n.type === 'nav') return netFilter === 'all' && !onlyProblems && matchFilter(n.url)
      return (
        (netFilter === 'all' || n.cat === netFilter) &&
        (!onlyProblems || n.ok === false) &&
        matchFilter(`${n.source || ''} ${n.method} ${n.status} ${n.url}`)
      )
    })
    if (!rows.length) {
      const e = el('div', 'empty')
      e.textContent = '（沒有符合的請求;點任一列可展開看回傳資料）'
      refs.body.appendChild(e)
      return
    }
    rows.forEach((n) => {
      try {
        if (n.type === 'nav') {
          const nav = el('div', 'navdiv')
          nav.textContent = `↻ 換頁 ${n.url}  ${n.time}`
          refs.body.appendChild(nav)
          return
        }
        const cls = n.ok === false ? 'bad' : n.ok === true ? 'good' : 'pending'
        const row = el('div', `row net ${cls}`)
        const arrow = el('span', 'arrow')
        arrow.textContent = n.__open ? '▾' : '▸'
        const ctag = el('span', `ctag c-${n.cat || 'other'}`)
        ctag.textContent = CAT_LABEL[n.cat] || 'OTHER'
        const m = el('span', 'm')
        m.textContent = n.method
        const s = el('span', 's')
        s.textContent = n.status
        const ms = el('span', 'ms')
        ms.textContent = n.ms == null ? '' : `${n.ms}ms`
        const url = el('span', 'url')
        url.textContent = n.url
        url.title = n.url
        // SSR 期間攔到的 API 標記為 SRV(來自 dev-debug-panel.server.js 的 payload);其餘為 CLI。
        if (n.source === 'server') {
          const src = el('span', 'src server')
          src.textContent = 'SRV'
          row.append(arrow, ctag, src, m, s, ms, url)
        } else {
          row.append(arrow, ctag, m, s, ms, url)
        }
        row.addEventListener('click', () => {
          n.__open = !n.__open
          renderList()
        })
        refs.body.appendChild(row)
        if (n.__open) refs.body.appendChild(buildDetail(n))
      } catch (err) {
        const bad = el('div', 'row lv-error')
        bad.textContent = `row error (${n && n.url}): ${err && err.message}`
        refs.body.appendChild(bad)
      }
    })
  }

  // ---- Storage(本機 / 工作階段 / Cookie)----
  const STORAGE_TABS = [
    { key: 'local', label: '本機儲存空間' },
    { key: 'session', label: '工作階段儲存空間' },
    { key: 'cookie', label: 'Cookie' },
  ]
  const readCookies = () =>
    document.cookie
      ? document.cookie
          .split(';')
          .map((s) => {
            const i = s.indexOf('=')
            const k = (i < 0 ? s : s.slice(0, i)).trim()
            const v = i < 0 ? '' : s.slice(i + 1).trim()
            let dv = v
            try {
              dv = decodeURIComponent(v)
            } catch {
              /* keep raw */
            }
            return [k, dv]
          })
          .filter(([k]) => k)
      : []
  const renderStorage = () => {
    // 子分頁
    const bar = el('div', 'netcats')
    STORAGE_TABS.forEach((t) => {
      const b = el('button', 'netcat')
      if (storageView === t.key) b.classList.add('active')
      b.textContent = t.label
      b.addEventListener('click', () => {
        storageView = t.key
        saveUI()
        renderList()
      })
      bar.appendChild(b)
    })
    refs.body.appendChild(bar)

    const isCookie = storageView === 'cookie'
    const store = isCookie ? null : storageView === 'session' ? sessionStorage : localStorage
    const setEntry = (k, v) => {
      if (isCookie) document.cookie = `${k}=${encodeURIComponent(v)}; path=/`
      else store.setItem(k, v)
    }
    const delEntry = (k) => {
      if (isCookie) document.cookie = `${k}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      else store.removeItem(k)
    }

    // 新增 / 全部清除
    const addbar = el('div', 'st-addbar')
    const keyIn = el('input', 'st-in')
    keyIn.placeholder = 'key'
    const valIn = el('input', 'st-in')
    valIn.placeholder = 'value'
    const addBtn = el('button', 'btn')
    addBtn.textContent = '新增'
    addBtn.addEventListener('click', () => {
      const k = keyIn.value.trim()
      if (!k) return
      setEntry(k, valIn.value)
      renderList()
    })
    const clearBtn = el('button', 'btn')
    clearBtn.textContent = '全部清除'
    clearBtn.addEventListener('click', () => {
      if (isCookie) readCookies().forEach(([k]) => delEntry(k))
      else store.clear()
      renderList()
    })
    addbar.append(keyIn, valIn, addBtn, clearBtn)
    refs.body.appendChild(addbar)

    // 列出
    let entries = []
    try {
      if (isCookie) entries = readCookies()
      else
        for (let i = 0; i < store.length; i++)
          entries.push([store.key(i), store.getItem(store.key(i))])
    } catch (err) {
      const e = el('div', 'raw dim')
      e.textContent = `無法讀取:${err && err.message}`
      refs.body.appendChild(e)
      return
    }
    if (!entries.length) {
      const e = el('div', 'empty')
      e.textContent = '(空)'
      refs.body.appendChild(e)
      return
    }
    entries.forEach(([k, v]) => {
      const row = el('div', 'st-row')
      const kk = el('span', 'st-key')
      kk.textContent = k
      kk.title = k
      const vv = el('input', 'st-val')
      vv.value = v
      vv.addEventListener('change', () => setEntry(k, vv.value))
      const del = el('button', 'st-del')
      del.textContent = '刪除'
      del.addEventListener('click', () => {
        delEntry(k)
        renderList()
      })
      row.append(kk, vv, del)
      refs.body.appendChild(row)
    })
    if (isCookie) {
      const note = el('div', 'raw dim')
      note.textContent = '註:HttpOnly cookie 無法透過 document.cookie 讀取/修改'
      refs.body.appendChild(note)
    }
  }

  const renderList = () => {
    if (!refs.body) return
    const isElement = activeTab === 'element'
    const atBottom = refs.body.scrollHeight - refs.body.scrollTop - refs.body.clientHeight < 40
    const prevScroll = refs.body.scrollTop
    refs.body.textContent = ''
    refs.body.classList.remove('body-split') // 只有「元素」分割視圖會再加回來
    try {
      if (activeTab === 'console') renderConsole()
      else if (isElement) renderElement()
      else if (activeTab === 'storage') renderStorage()
      else renderNetwork()
    } catch (err) {
      const e = el('div', 'row lv-error')
      e.textContent = `render error: ${err && err.stack ? err.stack : err}`
      refs.body.appendChild(e)
    }
    // Console:貼底時跟著捲到最新(串流);
    // Element/CSS:一律從頂端顯示(避免沿用樹狀/原始碼的捲動位置而看似捲到底);
    // 其餘(Element/樹狀、原始碼、Network):保留原捲動位置。
    if (activeTab === 'console') {
      if (atBottom) refs.body.scrollTop = refs.body.scrollHeight
    } else if (activeTab === 'element' && elementView === 'element') {
      // 分割視圖:外層 body 不捲動(左右面板各自內部捲動),不需還原
    } else {
      refs.body.scrollTop = prevScroll
    }
  }

  const errorCount = () => logs.filter((l) => l.level === 'error').length
  // 資源(img/script/css…)載入失敗已改由 capture error listener 記進 Console(errorCount),
  // 這裡排除 type==='resource',避免同一筆在 badge 被計兩次;fetch/XHR 失敗仍計入。
  const failedCount = () => nets.filter((n) => n.ok === false && n.type !== 'resource').length

  const updateBadges = () => {
    if (!refs.tabConsole) return
    refs.tabConsole.textContent = `Console (${logs.length})`
    refs.tabNetwork.textContent = `Network (${nets.filter((n) => n.type !== 'nav').length})`
    const errs = errorCount() + failedCount()
    refs.badge.textContent = errs > 0 ? String(errs) : ''
    refs.badge.style.display = errs > 0 ? 'inline-block' : 'none'
  }

  // 同步更新:每次資料變動立即 updateBadges + renderList(畫進隱藏面板成本極低)。
  const afterUpdate = () => {
    if (!refs.body) return
    updateBadges()
    // Console / Network:隨事件重繪。
    // Element(元素分割 / 樹狀)與 Storage:不隨事件重繪,避免拖曳比例、面板捲動位置、
    // 編輯中的輸入被沖掉;需要最新 DOM 時切分頁或重選元素即會刷新。
    const auto = activeTab === 'console' || activeTab === 'network'
    if (auto) renderList()
  }

  const mount = () => {
    // 清掉任何殘留的舊面板(HMR / 重複掛載),避免內容畫到看不見的舊 body
    document.querySelectorAll('#ext-debug-host').forEach((h) => h.remove())
    const host = el('div')
    host.id = 'ext-debug-host'
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; font-family: Menlo, Consolas, monospace; }
        /* 面板內捲軸樣式(僅作用於 shadow DOM,不影響頁面本身) */
        * { scrollbar-width: thin; scrollbar-color: #3a4048 transparent; }
        *::-webkit-scrollbar { width: 10px; height: 10px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: #3a4048; border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
        *::-webkit-scrollbar-thumb:hover { background: #525b66; border: 2px solid transparent; background-clip: padding-box; }
        *::-webkit-scrollbar-corner { background: transparent; }
        .wrap { position: fixed; right: 12px; bottom: 12px; z-index: 2147483647; }
        #launch {
          width: 44px; height: 44px; border-radius: 999px; border: 0; cursor: pointer;
          background: #2f3338; color: #fff; font-size: 20px; line-height: 44px;
          box-shadow: 0 3px 10px rgb(0 0 0 / 35%); position: relative;
        }
        #badge {
          position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px;
          padding: 0 4px; border-radius: 999px; background: #e5484d; color: #fff;
          font-size: 11px; line-height: 18px; text-align: center; font-weight: 700;
        }
        #panel {
          position: fixed; right: 12px; bottom: 64px; width: 760px; max-width: calc(100vw - 24px);
          height: 480px; max-height: calc(100vh - 90px); min-width: 320px; min-height: 200px;
          display: flex; flex-direction: column; resize: both;
          background: #1e2126; color: #e6e6e6; border-radius: 8px; overflow: hidden;
          box-shadow: 0 8px 28px rgb(0 0 0 / 45%); border: 1px solid #33383f;
          /* direction:rtl 讓 resize 拉桿移到「左下角」(面板靠右,往左拉放大);內容維持 ltr */
          direction: rtl;
        }
        #panel > * { direction: ltr; }
        /* display:flex 會蓋過 [hidden] 的 display:none,需明確讓 hidden 生效(收起/最小化) */
        #panel[hidden] { display: none; }
        .head { display: flex; align-items: center; gap: 4px; padding: 6px 6px 4px; background: #171a1e; }
        .head2 { display: flex; align-items: center; gap: 8px; padding: 0 6px 6px; background: #171a1e; border-bottom: 1px solid #33383f; }
        .tab { flex: 0 0 auto; padding: 5px 10px; border-radius: 5px; border: 0; cursor: pointer; background: transparent; color: #9aa0a6; font-size: 12px; }
        .tab.active { background: #2f3338; color: #fff; }
        .spacer { flex: 1 1 auto; }
        .btn { padding: 5px 8px; border-radius: 5px; border: 0; cursor: pointer; background: #2f3338; color: #cfd3d7; font-size: 12px; }
        .chk { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #9aa0a6; cursor: pointer; padding: 0 4px; }
        .dev-sel { flex: 0 0 auto; max-width: 170px; padding: 2px 20px 2px 6px; border: 1px solid #33383f; border-radius: 4px; background-color: #12151a; color: #e6e6e6; font-size: 11px; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23cfd3d7' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 6px center; }
        .dev-sel:focus { outline: 1px solid #8ab4f8; }
        .filter { padding: 6px; border-bottom: 1px solid #33383f; background: #171a1e; }
        .filter input { width: 100%; padding: 5px 8px; border-radius: 5px; border: 1px solid #33383f; background: #12151a; color: #e6e6e6; font-size: 12px; }
        .body { flex: 1 1 auto; overflow: auto; padding: 0 4px 4px; font-size: 12px; }
        .row { display: flex; gap: 6px; padding: 3px 4px; border-bottom: 1px solid #26292e; white-space: pre-wrap; word-break: break-all; align-items: baseline; }
        .row .t { color: #6b7178; flex: 0 0 auto; }
        .row .lv { flex: 0 0 auto; text-transform: uppercase; font-size: 10px; opacity: .8; }
        .row .msg { flex: 1 1 auto; }
        .lv-error { color: #ff8a8a; background: rgb(229 72 77 / 12%); }
        .lv-warn { color: #ffd479; background: rgb(255 200 60 / 8%); }
        .lv-debug { color: #9aa0a6; }
        .netcats { position: sticky; top: 0; z-index: 3; display: flex; flex-wrap: nowrap; gap: 4px; padding: 6px 4px; margin: 0 -4px 4px; background: #1e2126; border-bottom: 1px solid #33383f; overflow-x: auto; }
        .netcat { flex: 0 0 auto; white-space: nowrap; padding: 2px 8px; border: 0; border-radius: 10px; cursor: pointer; background: #2f3338; color: #9aa0a6; font-size: 11px; }
        .netcat.active { background: #8ab4f8; color: #12151a; }
        .ctag { flex: 0 0 auto; min-width: 42px; text-align: center; padding: 0 4px; border-radius: 3px; font-size: 9px; font-weight: 700; background: #33383f; color: #cfd3d7; }
        .ctag.c-fetchxhr { background: #24405f; color: #8ab4f8; }
        .ctag.c-doc { background: #4a3f5f; color: #c3a6ff; }
        .ctag.c-css { background: #2d4a4a; color: #7ee2d0; }
        .ctag.c-js { background: #5a4f24; color: #ffd479; }
        .ctag.c-font { background: #4a3a2d; color: #ffb454; }
        .ctag.c-img { background: #2d4a33; color: #7ee2a8; }
        .ctag.c-media { background: #3a2d4a; color: #d0a6ff; }
        .ctag.c-manifest { background: #3f3a24; color: #d4c37e; }
        .ctag.c-ws { background: #24405f; color: #6ec6ff; }
        .ctag.c-wasm { background: #4a2d3a; color: #ff9db1; }
        .row.net { cursor: pointer; }
        .row.net .arrow { flex: 0 0 12px; color: #6b7178; }
        .row.net .src { flex: 0 0 30px; font-size: 10px; font-weight: 700; color: #ffb454; }
        .row.net .m { flex: 0 0 44px; color: #8ab4f8; }
        .row.net .s { flex: 0 0 42px; }
        .row.net .ms { flex: 0 0 52px; color: #6b7178; }
        .row.net .url { flex: 1 1 auto; color: #cfd3d7; }
        .row.net.bad .s { color: #ff8a8a; font-weight: 700; }
        .row.net.good .s { color: #7ee2a8; }
        .row.net.pending .s { color: #ffd479; }
        .navdiv { margin: 6px 2px; padding: 3px 6px; border-top: 1px dashed #4a5763; color: #8ab4f8; font-size: 11px; background: rgb(138 180 248 / 8%); }
        .detail { margin: 0 4px 6px; padding: 6px 8px; background: #12151a; border-radius: 4px; overflow-x: auto; font-size: 11px; }
        .sec-h { display: flex; align-items: center; gap: 8px; color: #9aa0a6; font-size: 10px; text-transform: uppercase; margin: 4px 0 2px; }
        .copy { margin-left: auto; padding: 2px 8px; border: 0; border-radius: 4px; cursor: pointer; background: #2f3338; color: #cfd3d7; font-size: 11px; }
        .raw { white-space: pre-wrap; word-break: break-all; color: #cfe3d0; }
        .raw.dim { color: #8a9198; }
        .jn { padding-left: 12px; }
        .jn-head { cursor: pointer; }
        .jn-toggle { display: inline-block; width: 12px; margin-left: -12px; color: #6b7178; }
        .jn-close { color: #9aa0a6; }
        .jk { color: #c3a6ff; }
        .jt { color: #6b7178; }
        .jb { color: #9aa0a6; }
        .jv.t-string { color: #7ee2a8; }
        .jv.t-number { color: #8ab4f8; }
        .jv.t-boolean { color: #ff9db1; }
        .jv.t-null { color: #6b7178; }
        .btn.icon { display: inline-flex; align-items: center; justify-content: center; padding: 4px 7px; }
        .btn.icon svg { display: block; }
        .btn.icon.active { background: #8ab4f8; color: #12151a; }
        .insp-subtabs { display: flex; flex-wrap: nowrap; gap: 4px; margin: 8px 0 4px; overflow-x: auto; }
        .subtab { flex: 0 0 auto; white-space: nowrap; padding: 2px 8px; border: 0; border-radius: 10px; cursor: pointer; background: #2f3338; color: #9aa0a6; font-size: 11px; }
        .subtab.active { background: #8ab4f8; color: #12151a; }
        .insp-path { color: #8ab4f8; word-break: break-all; padding: 2px 4px; }
        .force-states { display: flex; flex-wrap: wrap; gap: 4px 12px; padding: 2px 4px 4px; }
        .force-item { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #cfd3d7; cursor: pointer; }
        .html-edit { width: 100%; min-height: 120px; box-sizing: border-box; padding: 6px; border: 1px solid #33383f; border-radius: 4px; background: #12151a; color: #e6e6e6; font-family: Menlo, Consolas, monospace; font-size: 11px; white-space: pre; }
        .style-list { padding: 2px 4px; font-size: 11px; }
        .style-item { padding: 1px 0; line-height: 1.6; word-break: break-all; }
        .style-item.off .style-prop, .style-item.off .style-val, .style-item.off .style-punct { text-decoration: line-through; opacity: 0.5; }
        .style-cb { margin: 0 6px 0 0; vertical-align: middle; }
        .style-prop { color: #c3a6ff; outline: none; }
        .style-val { color: #7ee2a8; outline: none; }
        .style-punct { color: #9aa0a6; }
        .style-prop:focus, .style-val:focus { background: #12151a; border-radius: 2px; padding: 0 2px; }
        .style-head { display: flex; align-items: center; }
        .style-head .style-plus { margin-left: auto; }
        .style-plus { border: 0; border-radius: 3px; background: #2f3338; color: #cfd3d7; cursor: pointer; padding: 0 10px; font-size: 14px; line-height: 1.4; }
        .style-plus:hover { background: #3f4650; }
        .insp-sec { color: #9aa0a6; font-size: 10px; text-transform: uppercase; margin: 6px 0 2px; }
        .insp-sec-toggle { cursor: pointer; user-select: none; }
        .insp-sec-toggle:hover { color: #cfd3d7; }
        .krow { display: flex; gap: 8px; padding: 2px 4px; border-bottom: 1px solid #26292e; }
        .krow .k { flex: 0 0 130px; color: #c3a6ff; }
        .krow .v { flex: 1 1 auto; color: #cfe3d0; word-break: break-all; }
        .css-rule { margin: 4px 0; padding: 4px 6px; background: #12151a; border-radius: 4px; }
        .css-sel { color: #ffd479; white-space: pre-wrap; word-break: break-all; }
        .css-spec { color: #6b7178; font-size: 10px; }
        .css-decl { padding-left: 12px; white-space: pre-wrap; word-break: break-all; line-height: 1.7; }
        .css-decl.off { text-decoration: line-through; opacity: 0.5; }
        .css-decl.ov .css-prop, .css-decl.ov .css-val, .css-decl.ov .css-punct { text-decoration: line-through; opacity: 0.6; }
        .css-punct { color: #9aa0a6; }
        .css-prop { color: #c3a6ff; outline: none; }
        .css-val { color: #7ee2a8; outline: none; }
        .css-varval { color: #6b7178; font-style: italic; }
        .css-prop:focus, .css-val:focus { background: #12151a; border-radius: 2px; }
        .style-cb { margin: 0 4px 0 0; vertical-align: middle; }
        .css-close-row { display: flex; align-items: center; }
        .css-plus { margin-left: auto; background: transparent; color: #ff6b6b; }
        .css-plus:hover { background: #3f4650; }
        .css-swatch { display: inline-block; width: 10px; height: 10px; margin-right: 4px; border: 1px solid #555; border-radius: 2px; vertical-align: middle; }
        .tree { font-size: 11px; line-height: 1.7; }
        .trow { display: flex; align-items: baseline; gap: 4px; cursor: pointer; white-space: nowrap; }
        .trow:hover { background: rgb(138 180 248 / 10%); }
        .trow.sel { background: rgb(138 180 248 / 22%); }
        .ttoggle { display: inline-block; width: 12px; flex: 0 0 12px; color: #6b7178; }
        .ttag { color: #8ab4f8; }
        .trow.sel .ttag { color: #fff; }
        .htmlsrc { overflow-x: auto; font-size: 11px; padding: 4px 2px; }
        .h-line { white-space: pre-wrap; overflow-wrap: anywhere; }
        .h-arrow { display: inline-block; width: 12px; flex: 0 0 12px; text-align: center; color: #9aa0a6; user-select: none; }
        .h-arrow.tog { cursor: pointer; }
        .h-arrow.collapsed { transform: rotate(-90deg); }
        .h-arrow.tog:hover { color: #e6e6e6; }
        .h-ellipsis { color: #9aa0a6; }
        .h-hover { cursor: pointer; }
        .h-hover:hover { background: rgb(138 180 248 / 12%); }
        .h-line.sel { background: rgb(138 180 248 / 22%); box-shadow: inset 2px 0 0 #8ab4f8; }
        /* 元素分割視圖:body 改為 flex 直向,左右面板各自內部捲動 */
        .body.body-split { display: flex; flex-direction: column; overflow: hidden; padding: 0 4px 4px; }
        .body.body-split .netcats { flex: 0 0 auto; }
        .el-split { flex: 1 1 auto; display: flex; min-height: 0; min-width: 0; }
        .el-split-v { flex-direction: column; }
        .el-pane { overflow: auto; min-width: 0; min-height: 0; }
        .el-html .htmlsrc { overflow-x: hidden; }
        .el-css { padding: 0 2px; }
        .el-divider { flex: 0 0 6px; cursor: col-resize; background: #33383f; border-radius: 3px; }
        .el-divider-h { cursor: row-resize; }
        .el-divider:hover { background: #8ab4f8; }
        .el-dock { margin-left: auto; display: flex; gap: 4px; flex: 0 0 auto; }
        .el-iconbtn { display: inline-flex; align-items: center; justify-content: center; padding: 3px 6px; }
        .el-iconbtn svg { display: block; }
        .h-tag { color: #8ab4f8; }
        .h-attr { color: #ffd479; }
        .h-val { color: #7ee2a8; }
        .h-punct { color: #9aa0a6; }
        .h-text { color: #cfe3d0; }
        .h-comment { color: #6b7178; font-style: italic; }
        .src-toggle { cursor: pointer; text-decoration: underline; color: #8ab4f8; }
        .ctxbackdrop { position: fixed; inset: 0; z-index: 10; }
        .ctxmenu { position: fixed; min-width: 130px; background: #2f3338; border: 1px solid #4a5763; border-radius: 6px; padding: 4px; box-shadow: 0 4px 14px rgb(0 0 0 / 45%); }
        .ctxitem { padding: 5px 10px; font-size: 12px; color: #e6e6e6; cursor: pointer; border-radius: 4px; white-space: nowrap; }
        .ctxitem:hover { background: #3f4650; }
        .st-addbar { display: flex; gap: 4px; padding: 6px 2px; }
        .st-in { flex: 1 1 auto; min-width: 0; padding: 3px 6px; border: 1px solid #33383f; border-radius: 4px; background: #12151a; color: #e6e6e6; font-size: 11px; }
        .st-row { display: flex; gap: 6px; align-items: center; padding: 3px 2px; border-bottom: 1px solid #26292e; }
        .st-key { flex: 0 0 34%; color: #c3a6ff; word-break: break-all; font-size: 11px; }
        .st-val { flex: 1 1 auto; min-width: 0; padding: 2px 6px; border: 1px solid #33383f; border-radius: 4px; background: #12151a; color: #cfe3d0; font-size: 11px; }
        .st-del { flex: 0 0 auto; padding: 2px 8px; border: 0; border-radius: 4px; cursor: pointer; background: #3a2d33; color: #ff8a8a; font-size: 11px; }
        .empty { color: #6b7178; padding: 10px; text-align: center; }
        .repl { flex: 0 0 auto; display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-top: 1px solid #33383f; background: #171a1e; }
        .repl-prompt { color: #7ee2a8; font-weight: 700; }
        .repl input { flex: 1 1 auto; min-width: 0; padding: 4px 6px; border: 1px solid #33383f; border-radius: 4px; background: #12151a; color: #e6e6e6; font-size: 12px; font-family: Menlo, Consolas, monospace; outline: none; }
        .repl input:focus { border-color: #4a5763; }
        .row.lv-input .msg { color: #8ab4f8; }
        .cval { white-space: pre-wrap; word-break: break-all; }
        .cval.t-string { color: #7ee2a8; }
        .cval.t-number { color: #8ab4f8; }
        .cval.t-boolean { color: #ff9db1; }
        .cval.t-null { color: #9aa0a6; }
        .cval.t-func { color: #c3a6ff; font-style: italic; }
        .cval-obj { display: inline-block; vertical-align: top; }
        .cval-head { cursor: pointer; color: #cfe3d0; }
        .cval-tog { display: inline-block; width: 12px; color: #6b7178; }
        .cval-prev { color: #9aa0a6; }
        .cval-kids { padding-left: 16px; border-left: 1px solid #2a2f36; margin-left: 5px; }
        .cval-row { line-height: 1.6; }
        .cval-key { color: #c3a6ff; }
      </style>
      <div class="wrap">
        <button id="launch" title="開發除錯面板">🐞<span id="badge"></span></button>
        <div id="panel" hidden>
          <div class="head">
            <select class="dev-sel" id="deviceSel" title="裝置模擬(iframe 以裝置寬度載入)"></select>
            <label class="chk"><input type="checkbox" id="preserveChk" /> 保留紀錄</label>
            <label class="chk"><input type="checkbox" id="onlyChk" /> 只看問題</label>
            <span class="spacer"></span>
            <button class="btn icon" id="reloadBtn" title="重新整理整頁(F5)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
            </button>
            <button class="btn icon" id="inspectBtn" title="選取元素檢查(再按一次關閉)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 12.586 19 19"/><path d="M3.688 3.037a.497.497 0 0 0-.651.651l6.5 16a.5.5 0 0 0 .947-.062l1.569-6.083a2 2 0 0 1 1.448-1.479l6.124-1.579a.5.5 0 0 0 .063-.947z"/></svg>
            </button>
            <button class="btn" id="clearBtn">清除</button>
            <button class="btn icon" id="resetSizeBtn" title="還原面板大小與位置">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="12" height="12" rx="1"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/></svg>
            </button>
            <button class="btn" id="minBtn" title="收起(點瓢蟲再打開)">—</button>
          </div>
          <div class="head2">
            <button class="tab" id="tabElement">Element</button>
            <button class="tab active" id="tabConsole">Console (0)</button>
            <button class="tab" id="tabNetwork">Network (0)</button>
            <button class="tab" id="tabStorage">Application</button>
          </div>
          <div class="filter"><input id="filterInput" type="text" placeholder="過濾關鍵字(url / 方法 / 狀態 / 訊息)" /></div>
          <div class="body" id="body"></div>
          <div class="repl" id="repl" hidden>
            <span class="repl-prompt">›</span>
            <input id="replInput" type="text" spellcheck="false" autocomplete="off" placeholder="輸入 JS 按 Enter 執行(全域範圍;↑↓ 查歷史)" />
          </div>
        </div>
      </div>
    `
    document.body.appendChild(host)

    refs.panel = shadow.getElementById('panel')
    refs.body = shadow.getElementById('body')
    refs.tabElement = shadow.getElementById('tabElement')
    refs.tabConsole = shadow.getElementById('tabConsole')
    refs.tabNetwork = shadow.getElementById('tabNetwork')
    refs.tabStorage = shadow.getElementById('tabStorage')
    refs.badge = shadow.getElementById('badge')
    refs.inspectBtn = shadow.getElementById('inspectBtn')
    refs.host = host

    // Inspect 高亮框(light DOM,pointer-events:none,z-index 略低於面板)
    const overlay = el('div')
    overlay.id = 'ext-debug-overlay'
    overlay.style.cssText =
      'position:fixed;z-index:2147483646;pointer-events:none;display:none;border:1px solid #8ab4f8;background:rgb(138 180 248 / 18%);box-shadow:0 0 0 1px rgb(138 180 248 / 40%);'
    document.body.appendChild(overlay)
    refs.overlay = overlay

    const launch = shadow.getElementById('launch')
    const onlyChk = shadow.getElementById('onlyChk')
    const preserveChk = shadow.getElementById('preserveChk')
    const filterInput = shadow.getElementById('filterInput')

    // ---- 裝置模擬:用 iframe 以裝置寬度載入本頁(CSS @media 正確),UA 由 iframe 內模組覆寫 ----
    const deviceSel = shadow.getElementById('deviceSel')
    const fillDeviceSelect = (sel) => {
      const groups = {}
      EXT_DEVICES.forEach((d) => {
        const o = document.createElement('option')
        o.value = d.id
        if (!d.group) {
          o.textContent = d.label
          sel.appendChild(o)
          return
        }
        o.textContent = `${d.label} (${d.w} × ${d.h})`
        if (!groups[d.group]) {
          groups[d.group] = document.createElement('optgroup')
          groups[d.group].label = d.group
          sel.appendChild(groups[d.group])
        }
        groups[d.group].appendChild(o)
      })
    }
    fillDeviceSelect(deviceSel)

    if (!document.getElementById('ext-device-style')) {
      const st = document.createElement('style')
      st.id = 'ext-device-style'
      st.textContent =
        '#ext-device-frame{position:fixed;inset:0;z-index:2147483640;background:#0b0d10;display:none;flex-direction:column;align-items:flex-start;gap:10px;padding:16px;overflow:auto;}' +
        '#ext-device-frame .bar{display:flex;align-items:center;gap:10px;color:#cfd3d7;font:12px Menlo,Consolas,monospace;flex:0 0 auto;}' +
        "#ext-device-frame .bar select{height:24px;box-sizing:border-box;color:#e6e6e6;border:1px solid #33383f;border-radius:4px;font:12px Menlo,Consolas,monospace;padding:0 20px 0 6px;cursor:pointer;appearance:none;-webkit-appearance:none;background:#12151a url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23cfd3d7' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") no-repeat right 6px center;}" +
        '#ext-device-frame .bar .dim{color:#9aa0a6;}' +
        '#ext-device-frame .bar .cls{height:24px;width:24px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #3a4048;border-radius:5px;background:#2f3338;color:#e6e6e6;cursor:pointer;padding:0;line-height:0;}' +
        '#ext-device-frame .wrap{transform-origin:top left;box-shadow:0 0 0 1px #33383f;flex:0 0 auto;}' +
        '#ext-device-frame iframe{background:#fff;border:0;display:block;}'
      document.head.appendChild(st)
    }
    const devFrame = document.createElement('div')
    devFrame.id = 'ext-device-frame'
    const devBar = document.createElement('div')
    devBar.className = 'bar'
    const devFrameSel = document.createElement('select') // 外框上方也能下拉切換裝置
    devFrameSel.title = '切換裝置'
    fillDeviceSelect(devFrameSel)
    const devDim = document.createElement('span')
    devDim.className = 'dim'
    const devClose = document.createElement('button')
    devClose.className = 'cls'
    devClose.title = '關閉裝置模擬'
    devClose.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'
    devClose.addEventListener('click', () => setDevice('desktop'))
    devBar.append(devFrameSel, devDim, devClose)
    const devWrap = document.createElement('div') // 只縮放這層(bar 不縮),並設縮放後尺寸讓版面正確
    devWrap.className = 'wrap'
    const devIframe = document.createElement('iframe')
    devWrap.append(devIframe)
    devFrame.append(devBar, devWrap)
    document.body.appendChild(devFrame)

    const curDevice = () => EXT_DEVICES.find((d) => d.id === deviceId)
    const layoutDeviceFrame = () => {
      const d = curDevice()
      if (!d || d.id === 'desktop') return
      devIframe.style.width = d.w + 'px'
      devIframe.style.height = d.h + 'px'
      // scale 只影響視覺,不改 layout box;故 wrap 的 width/height 也設成縮放後尺寸,版面才正確
      const scale = Math.min(1, (window.innerWidth - 32) / d.w, (window.innerHeight - 72) / d.h)
      devWrap.style.transform = `scale(${scale})`
      devWrap.style.width = d.w * scale + 'px'
      devWrap.style.height = d.h * scale + 'px'
      const uaName = d.ua === 'tablet' ? 'iPad' : d.ua === 'android' ? 'Android' : 'iPhone'
      devDim.textContent = `${d.w} × ${d.h} · ${uaName}`
    }
    // iframe 載入完成:舊選取(屬於前一個文件)失效;若正在選取則重新掛到新 iframe 視窗
    devIframe.addEventListener('load', () => {
      const wasPicking = picking
      clearInspect()
      if (wasPicking) startPicking()
      if (activeTab === 'element') renderList() // 原始碼 / 樹狀改抓新 iframe 文件
    })
    const applyDevice = () => {
      const d = curDevice()
      const on = !!d && d.id !== 'desktop'
      deviceSel.value = deviceId
      devFrameSel.value = deviceId
      if (!on) {
        deviceIframe = null
        clearInspect() // 舊選取可能在 iframe 內,先取消
        devFrame.style.display = 'none'
        if (devIframe.src && !devIframe.src.startsWith('about:')) devIframe.src = 'about:blank'
        devIframe.removeAttribute('data-src')
        window.removeEventListener('resize', layoutDeviceFrame)
        return
      }
      deviceIframe = devIframe
      // hash 帶裝置種類(#__extua=mobile|android|tablet);切換裝置(尺寸 / UA 不同)必重載 iframe
      const target = `${location.origin}${location.pathname}${location.search}#__extua=${d.ua}`
      if (devIframe.getAttribute('data-src') !== target) {
        clearInspect() // 切裝置前先取消舊選取
        devIframe.setAttribute('data-src', target)
        devIframe.src = target
      }
      devFrame.style.display = 'flex'
      layoutDeviceFrame()
      window.addEventListener('resize', layoutDeviceFrame)
    }
    const setDevice = (id) => {
      deviceId = id
      saveUI()
      applyDevice()
    }
    deviceSel.addEventListener('change', () => setDevice(deviceSel.value))
    devFrameSel.addEventListener('change', () => setDevice(devFrameSel.value))

    // ---- 面板可拖曳(拖 head 空白處),以「距右 / 距下」定位,讓縮放時右下固定、往左上長 ----
    const headEl = shadow.querySelector('.head')
    const clampRB = (r, b) => [
      Math.max(0, Math.min(r, window.innerWidth - refs.panel.offsetWidth)),
      Math.max(0, Math.min(b, window.innerHeight - refs.panel.offsetHeight)),
    ]
    const applyPanelPos = () => {
      if (panelRight == null || panelBottom == null || refs.panel.hidden) return
      const [r, b] = clampRB(panelRight, panelBottom)
      Object.assign(refs.panel.style, {
        right: `${r}px`,
        bottom: `${b}px`,
        left: 'auto',
        top: 'auto',
      })
    }
    headEl.style.cursor = 'move'
    let dragging = false
    let sx = 0
    let sy = 0
    let or = 0
    let ob = 0
    headEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || e.target.closest('button, select, input, label')) return // 控制項不觸發拖曳
      const rect = refs.panel.getBoundingClientRect()
      or = window.innerWidth - rect.right // 起始「距右」
      ob = window.innerHeight - rect.bottom // 起始「距下」
      sx = e.clientX
      sy = e.clientY
      Object.assign(refs.panel.style, {
        right: `${or}px`,
        bottom: `${ob}px`,
        left: 'auto',
        top: 'auto',
      })
      dragging = true
      e.preventDefault()
    })
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return
      // 滑鼠往右 → 距右變小;往下 → 距下變小
      const [r, b] = clampRB(or - (e.clientX - sx), ob - (e.clientY - sy))
      refs.panel.style.right = `${r}px`
      refs.panel.style.bottom = `${b}px`
    })
    window.addEventListener('mouseup', () => {
      if (!dragging) return
      dragging = false
      panelRight = parseInt(refs.panel.style.right, 10)
      panelBottom = parseInt(refs.panel.style.bottom, 10)
      saveUI()
    })
    window.addEventListener('resize', applyPanelPos) // 視窗縮放時夾回範圍內

    // 還原面板大小與位置:清掉拖曳 / 縮放的 inline 樣式,回到 CSS 預設(右下 760×480)
    shadow.getElementById('resetSizeBtn').addEventListener('click', () => {
      ;['width', 'height', 'left', 'top', 'right', 'bottom'].forEach((p) => {
        refs.panel.style[p] = ''
      })
      panelRight = null
      panelBottom = null
      saveUI()
    })

    launch.addEventListener('click', () => {
      refs.panel.hidden = !refs.panel.hidden
      if (refs.panel.hidden) {
        stopPicking()
        hideOverlay()
        clearForcedAll() // 最小化即清除強制狀態(頁面還原、記錄清空)
      } else {
        renderList()
        applyPanelPos()
      }
      saveUI()
    })
    shadow.getElementById('clearBtn').addEventListener('click', () => {
      if (activeTab === 'console') logs.length = 0
      else if (activeTab === 'element') {
        inspectEl = null
        hideOverlay()
      } else if (activeTab === 'network') nets.length = 0
      // storage 有自己的「全部清除」,此鈕不動作
      updateBadges()
      renderList()
    })

    // Reload:整頁重新整理
    shadow.getElementById('reloadBtn').addEventListener('click', () => location.reload())

    // 選取箭頭:切到 Element 分頁並切換選取模式
    refs.inspectBtn.addEventListener('click', () => {
      if (activeTab !== 'element') setTab('element')
      if (picking) clearInspect()
      else startPicking()
      renderList()
    })

    // 收起:整個面板收掉,點瓢蟲再打開
    shadow.getElementById('minBtn').addEventListener('click', () => {
      refs.panel.hidden = true
      stopPicking()
      hideOverlay()
      clearForcedAll() // 最小化即清除強制狀態(頁面還原、記錄清空)
      saveUI()
    })

    onlyChk.addEventListener('change', () => {
      onlyProblems = onlyChk.checked
      renderList()
      saveUI()
    })
    preserveChk.addEventListener('change', () => {
      preserveLog = preserveChk.checked
      saveUI()
    })
    filterInput.addEventListener('input', () => {
      filterText = filterInput.value.trim().toLowerCase()
      renderList()
      saveUI()
    })

    const setTab = (tab) => {
      activeTab = tab
      refs.tabElement.classList.toggle('active', tab === 'element')
      refs.tabConsole.classList.toggle('active', tab === 'console')
      refs.tabNetwork.classList.toggle('active', tab === 'network')
      refs.tabStorage.classList.toggle('active', tab === 'storage')
      if (tab !== 'element') suspendInspect() // 離開 Element:停止跟隨與高亮,保留選取
      if (refs.repl) refs.repl.hidden = tab !== 'console' // REPL 只在 Console 分頁顯示
      renderList()
      saveUI()
    }
    refs.tabElement.addEventListener('click', () => setTab('element'))
    refs.tabConsole.addEventListener('click', () => setTab('console'))
    refs.tabNetwork.addEventListener('click', () => setTab('network'))
    refs.tabStorage.addEventListener('click', () => setTab('storage'))

    // ---- Console REPL:輸入任意 JS 按 Enter 執行,把指令與結果印回 console ----
    refs.repl = shadow.getElementById('repl')
    const replInput = shadow.getElementById('replInput')
    const replHistory = []
    let replHistIdx = -1
    const pushLog = (level, text, raw) => {
      logs.push({ level, text, time: nowStr(), raw })
      trim(logs)
      afterUpdate()
    }
    let lastReplResult // $_ = 上一次結果
    const runRepl = (code) => {
      pushLog('input', `› ${code}`)
      let result
      let isErr = false
      try {
        // new Function → 全域範圍執行,並注入 DevTools 常用 helper:$0(選取元素)/ $ / $$ / $_
        const runner = new Function(
          '$0',
          '$_',
          '__code',
          'const $ = (s) => document.querySelector(s);' +
            'const $$ = (s) => Array.from(document.querySelectorAll(s));' +
            'return eval(__code)'
        )
        result = runner(inspectEl, lastReplResult, code)
      } catch (err) {
        result = err
        isErr = true
      }
      if (!isErr && result && typeof result.then === 'function') {
        pushLog('result', 'Promise { <pending> }')
        result.then(
          (v) => {
            lastReplResult = v
            pushLog('result', valPreview(v), [v])
          },
          (e) => pushLog('error', `↩ ${e && e.stack ? e.stack : e}`)
        )
        return
      }
      if (isErr) {
        pushLog('error', String(result && result.stack ? result.stack : result))
      } else {
        lastReplResult = result
        pushLog('result', valPreview(result), [result])
      }
    }
    if (replInput) {
      replInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const code = replInput.value
          if (!code.trim()) return
          replHistory.push(code)
          replHistIdx = replHistory.length
          replInput.value = ''
          runRepl(code)
        } else if (e.key === 'ArrowUp') {
          if (!replHistory.length) return
          e.preventDefault()
          replHistIdx = Math.max(0, replHistIdx - 1)
          replInput.value = replHistory[replHistIdx] ?? ''
        } else if (e.key === 'ArrowDown') {
          if (!replHistory.length) return
          e.preventDefault()
          replHistIdx = Math.min(replHistory.length, replHistIdx + 1)
          replInput.value = replHistory[replHistIdx] ?? ''
        }
      })
    }

    // Esc 取消選取;F5 整頁重載;Ctrl+F12 開關面板(留 F12 給瀏覽器原生 DevTools)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && picking) {
        clearInspect()
        renderList()
      } else if (e.key === 'F5') {
        e.preventDefault()
        location.reload()
      } else if (e.key === 'F12' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        refs.panel.hidden = !refs.panel.hidden
        if (refs.panel.hidden) {
          stopPicking()
          hideOverlay()
          clearForcedAll() // 最小化即清除強制狀態(頁面還原、記錄清空)
        } else {
          renderList()
          applyPanelPos()
        }
        saveUI()
      }
    })

    // 點畫面(面板外)即隱藏藍框並清除強制狀態(選取模式中由 onInspectPick 處理,不干擾)
    window.addEventListener(
      'click',
      (e) => {
        if (picking || isOwnUI(e.target)) return
        hideOverlay()
        if (hasForcedApplied()) {
          clearForcedAll()
          if (!refs.panel.hidden) renderList() // 更新 checkbox 取消勾選
        }
      },
      true
    )

    // 捲軸移動即清除強制狀態(不論用哪種方式選取;捲動面板內部不算)
    window.addEventListener(
      'scroll',
      (e) => {
        if (e && isOwnUI(e.target)) return
        if (hasForcedApplied()) {
          clearForcedAll()
          if (!refs.panel.hidden) renderList() // 更新 checkbox 取消勾選
        }
      },
      true
    )

    // 依 sessionStorage 還原 UI 狀態(分頁 / 勾選 / 過濾 / 開關)
    onlyChk.checked = onlyProblems
    preserveChk.checked = preserveLog
    filterInput.value = filterText
    refs.tabElement.classList.toggle('active', activeTab === 'element')
    refs.tabConsole.classList.toggle('active', activeTab === 'console')
    refs.tabNetwork.classList.toggle('active', activeTab === 'network')
    refs.tabStorage.classList.toggle('active', activeTab === 'storage')
    if (refs.repl) refs.repl.hidden = activeTab !== 'console'
    if (ui.open) refs.panel.hidden = false
    updateBadges()
    renderList()
    applyDevice() // 還原裝置模擬(desktop 則不顯示外框)
    applyPanelPos() // 還原面板拖曳位置

    // App 內容多在面板掛載後才由框架渲染(F5 首載時 #app 尚空,或換頁換元件),
    // 監看 #app 內容變動,debounce 後重繪「元素」視圖,避免原始碼 / 樹狀一直停在空的 <div id="app">。
    const watchTarget = document.getElementById('app') || document.body
    let refreshTimer = null
    const refreshElementSoon = () => {
      if (refreshTimer) return
      refreshTimer = setTimeout(() => {
        refreshTimer = null
        if (
          refs.panel.hidden || // 面板收起
          activeTab !== 'element' || // 非元素分頁
          picking || // 選取中(移動滑鼠預覽,勿重繪)
          srcEditNode || // 正在就地編輯 HTML
          deviceIframe // 裝置模擬:源碼取自 iframe,由其 load 事件處理
        )
          return
        renderList()
      }, 500)
    }
    try {
      new MutationObserver(refreshElementSoon).observe(watchTarget, {
        childList: true,
        subtree: true,
      })
    } catch {
      /* ignore */
    }
  }

  if (document.body) {
    mount()
  } else {
    window.addEventListener('DOMContentLoaded', mount, { once: true })
  }
}
