// API 規範 —— 請求走共用的 onFetchApi,api 檔案要對得上專案資料夾。
//
// 與 CSS 規則分開的理由跟 rules-global.mjs 一樣:適用範圍不同(這裡看的是 .js / .vue
// 的請求寫法與 _api 的檔案歸屬),混在一起之後想加第四類規則就得整個重切。

import fs from 'node:fs'
import path from 'node:path'
import {
  API_DIR,
  API_NAMING_IGNORED_SEGMENTS,
  API_SPEC_DIR,
  SHARED_API_FILE,
  STANDALONE_APIS,
  VIEWS_DIR,
  bodyRangeOf,
  findNearFolder,
  hasExemptMark,
  isInSrc,
  issueOf,
  lineNoOf,
  listViewFolders,
  maskComments,
  registerScanCache,
  warnOf,
} from './shared.mjs'

/**
 * 暫時保留的獨立 api 檔案 —— 清單處理完就會清空。
 *
 * 清單與「共用那一支叫什麼」都定義在 project-config.mjs
 * (STANDALONE_APIS 與 SHARED_API_FILE)—— 每個專案的檔名不一樣,
 * 寫在規則裡的話,換一個專案就會把它自己的 api 報成違規。
 *
 * 不要再往那份清單加東西。對不上資料夾的 api 一律放共用的那一支;
 *    清單裡留著的是還沒決定歸屬的檔案(見 docs/待辦事項.md)。
 */
const ALLOWED_STANDALONE = new Set(STANDALONE_APIS)

/** onFetchApi 的來源;api 實例建在 .config.js */
const EXPORT_FILE = '.export.js'
const CONFIG_FILE = '.config.js'

const isApiFile = (rel) =>
  rel.startsWith(`${API_DIR}/`) && rel.endsWith('.js') && !path.basename(rel).startsWith('.')

// --- 規則 apiClient:不得使用 axios;原生請求是建議 --------------------------
//
// axios 一律擋掉 —— 專案已經有共用的 onFetchApi,再多一套請求庫等於兩種錯誤格式、
// 兩份攔截器,使用端得為它寫另一套判斷。
//
// 原生請求(fetch / XMLHttpRequest)只給建議:它能動,只是繞過了共用實例,
// 攔截器帶的共用參數不會生效。有它非用不可的場合(打外部服務、上傳進度),
// 所以不擋,但要讓寫的人知道自己繞過了什麼。

const AXIOS_RE = /(?:import|require)\b[^'"\n]*['"]axios['"]/g
/**
 * 原生請求的三種寫法:`new XMLHttpRequest`、`$fetch(`、原生 `fetch(`。
 *
 * 原生 `fetch(` 前面要求不是字元也不是點,才不會把共用實例的呼叫誤認成原生請求 ——
 * `onFetchApi(`、`fetchApi.get(`、`api.fetch(` 這幾種都是走共用實例,不該被提醒。
 * `window.fetch(` 是原生請求,由 `window.` 後面那個點以外的判斷擋不住,
 * 所以點的情況一律不算,寧可漏抓也不要對走共用實例的寫法誤報。
 */
const RAW_REQUEST_RE = /\bnew\s+XMLHttpRequest\b|\$fetch\s*\(|(?<![\w.$])fetch\s*\(/g

const checkApiClient = ({ rel, text }) => {
  if (!isInSrc(rel)) return []
  if (rel.endsWith(`${API_DIR}/${EXPORT_FILE}`)) return [] // 共用實作本身

  /* 有非用不可的理由時,在檔頭標 `lint-api-client-exempt: 理由` 放行整支。
     典型的情況是那支檔案打的根本不是產品的 api(開發用的除錯面板、
     只在本機跑的工具)—— 那些請求本來就不需要共用的攔截器與錯誤格式。

     沒有出口的話,那幾筆每一次檢查都會再印一遍,而且一筆都改不掉 ——
     一條一直報「改不了的東西」的規則,最後會連同真正該改的那幾筆一起被略過。
     理由寫在標記旁邊,看的人當場知道為什麼,不必去翻別的地方。 */
  if (hasExemptMark(text, 'api-client')) return []

  const issues = []

  for (const m of text.matchAll(AXIOS_RE)) {
    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'apiClient',
        `不得使用 axios —— 一律走 ${API_DIR}/${CONFIG_FILE} 匯出的實例(底層是共用的 onFetchApi)`
      )
    )
  }

  for (const m of text.matchAll(RAW_REQUEST_RE)) {
    issues.push(
      warnOf(
        rel,
        lineNoOf(text, m.index),
        'apiClient',
        `${m[0].trim()} 繞過了共用的 onFetchApi —— 攔截器帶的共用參數不會生效,錯誤格式也不一致;沒有非用不可的理由就改用 ${CONFIG_FILE} 的實例`
      )
    )
  }

  return issues
}

// --- 規則 apiScope:api 檔案要對得上專案資料夾 --------------------------------
//
// 對不上資料夾的一律放 project.js —— 不要再開新的獨立檔案。
// 同一支 api 被多個頁面共用時,共用的是「呼叫它的 action」,那寫在各自的
// use*Actions 裡;api 檔案本身仍然只放一份。

/**
 * 這一支 api 屬於哪一個資源 —— 要拿去對照頁面資料夾的那個名字。
 *
 * 三種擺法:
 *
 *   扁平       `_api/member.js`        → 資源是檔名 `member`
 *   服務分層   `_api/buy/house.js`     → 資源是資料夾 `buy`
 *   單純分類   `_api/群組/member.js`    → 資源仍是檔名 `member`
 *
 * **分出前兩者的是「那一層有沒有自己的 .config.js」。**
 * api 目錄再分一層的理由,是那個服務有自己的連線設定(各自的 baseURL 與 token)——
 * 有 .config.js 就是一個服務,底下的檔案是它的功能分檔(house / list / common),
 * 那些檔名是功能不是資源,拿去對照頁面資料夾的話每一支都會被報「對不上」。
 *
 * 沒有 .config.js 的資料夾只是把檔案分類收好,資源仍然是檔名。
 * 用「有沒有連線設定」判斷而不是「有沒有分層」,才分得出這兩種 ——
 * 只看有沒有資料夾的話,任何一層資料夾都會被當成服務。
 */
const apiResourceOf = (rel, root) => {
  const parts = rel.slice(`${API_DIR}/`.length).split('/')
  if (parts.length === 1) return path.basename(parts[0], '.js')

  const ownConfig = path.join(root, ...API_DIR.split('/'), parts[0], CONFIG_FILE)

  return fs.existsSync(ownConfig) ? parts[0] : path.basename(parts.at(-1), '.js')
}

/**
 * api 的資料夾結構,是不是一路對得上頁面的資料夾結構。
 *
 * `_api/buy/list.js` 對 `<頁面目錄>/buy/list/` —— 整段路徑都在,那就沒有對不上的問題。
 *
 * 這是「單一服務、api 依頻道分資料夾」那種擺法:整個專案只有一份連線設定,
 * 資料夾純粹是把檔案收好。沒有這一段的話,那種專案只剩兩條路 ——
 * 補一支沒有作用的 .config.js 讓規則以為那是服務,或把每一支檔名塞進例外清單,
 * 兩種都是為了讓規則過而改程式碼,而不是程式碼真的有問題。
 */
const mirrorsViewPath = (rel, root) => {
  const parts = rel.slice(`${API_DIR}/`.length).split('/')
  if (parts.length === 1) return false

  const segments = [...parts.slice(0, -1), path.basename(parts.at(-1), '.js')]

  return fs.existsSync(path.join(root, ...VIEWS_DIR.split('/'), ...segments))
}

const checkApiScope = ({ rel, root }) => {
  if (!isApiFile(rel)) return []

  const folders = listViewFolders(root)
  if (!folders) return []

  if (mirrorsViewPath(rel, root)) return []

  const name = apiResourceOf(rel, root)
  if (folders.has(name) || name === SHARED_API_FILE || ALLOWED_STANDALONE.has(name)) return []

  const near = findNearFolder(folders, name)

  /* 多層時對不上的是那個服務資料夾,不是檔名 —— 訊息要指到實際要改的東西,
     說「檔名 buy.js」會讓人去找一支不存在的檔案。 */
  const where = name === path.basename(rel, '.js') ? `檔名 ${name}.js` : `資料夾 ${name}/`

  return [
    issueOf(
      rel,
      1,
      'apiScope',
      near
        ? `${where} 對不上資料夾 —— ${VIEWS_DIR} 底下是 ${near}/,兩邊要一致(改這裡或改資料夾名)`
        : `${where} 在 ${VIEWS_DIR} 底下沒有對應的資料夾 —— api 依資料夾切分,對不上的一律搬進 ${SHARED_API_FILE}.js`
    ),
  ]
}

// --- 規則 apiSource:api 檔案要用 .config.js 的實例 ---------------------------
//
// 每支 api 各自 onFetchApi() 的話會有多個實例,攔截器要各設一次,
// 漏掉一支不會報錯,只會在某個頁面靜靜地少帶參數。

const checkApiSource = ({ rel, text }) => {
  if (!isApiFile(rel)) return []

  const issues = []

  if (/\bonFetchApi\s*\(/.test(text)) {
    issues.push(
      issueOf(
        rel,
        lineNoOf(text, text.search(/\bonFetchApi\s*\(/)),
        'apiSource',
        `api 檔案不要自己呼叫 onFetchApi —— 實例建在 ${CONFIG_FILE},api 檔案 import 它;每支各建一個的話,攔截器要各設一次,漏掉不會報錯`
      )
    )
  }

  const hasConfigImport = new RegExp(`from\\s+['"][^'"]*${CONFIG_FILE.replace('.', '\\.')}['"]`).test(
    text
  )

  if (!hasConfigImport && /\bfetchApi\b/.test(text)) {
    issues.push(
      issueOf(
        rel,
        1,
        'apiSource',
        `請求要用 ${CONFIG_FILE} 匯出的實例 —— import 它再呼叫,不要自建`
      )
    )
  }

  return issues
}

// --- 規則 apiNaming:函式名要對得上 method 與 endpoint ------------------------
//
//   api + Method + endpoint 各段(PascalCase)
//
//   get    activity/list        →  apiGetActivityList
//   post   member/info/update   →  apiPostMemberInfoUpdate
//   get    voucher/item/{id}    →  apiGetVoucherItemID
//   delete member/pet/{id}      →  apiDeleteMemberPetID
//
// **method 放前面** —— 第一眼就知道這支是查詢還是寫入。GET 也要寫出來,
// 不寫的話看到 apiMemberPet 分不出是查詢還是新增。
//
// 路徑參數 {id} 一律寫成大寫 **ID**(不是 Id)—— 這一段是大小寫敏感的。
//
// 比對是**大小寫不敏感**的:endpoint 全小寫的複合字要怎麼拆(petphoto →
//    PetPhoto)需要語意判斷,工具推不出來。這裡只驗「段落有沒有對上、method
//    有沒有寫在前面」,拆法交給人。

/**
 * 一支 api 的定義:匯出的名字、用的 method、endpoint。
 *
 * 名字與請求之間允許換行 —— 路徑長一點的時候,會被格式化成兩行:
 *
 *   export const apiGetVoucherForceBookDetailID = (data) =>
 *     fetchApi.get('voucher/forcebook/detail/{id}', data)
 *
 * 中間不得跨過另一個 `export` —— 沒有這道限制的話,
 *    「一支不打 api 的匯出」後面接著「一支打 api 的匯出」時,
 *    比對會從前面那支開始,一路吃到後面那支的請求,
 *    把前面那支誤判成打了後面那支的 endpoint。
 */
/**
 * 一支 api 的匯出:名稱、method、endpoint。
 *
 * 名稱用 `[\w$]+` 而不是 `\w+` —— `$` 在 JS 識別字裡是合法字元,
 * 有人用它代替 endpoint 裡的底線(`questionnaire/q3_1` 寫成 `…Q3$1`)。
 * 只認 `\w` 的話,名稱會在 `$` 那裡斷掉,接著比對不到等號,
 * **整支 api 會被跳過** —— 不是報錯,是從此不檢查,而且看起來像通過。
 *
 * 中間允許換行(路徑長的時候會被格式化成兩行),但不得跨過另一個 export ——
 * 少了那道條件,前一支不打 api 的匯出會一路吃到後面的請求,造成誤判。
 */
const API_EXPORT_RE =
  /export\s+const\s+([\w$]+)\s*=(?:(?!\bexport\b)[\s\S])*?fetchApi\.(\w+)\s*\(\s*['"`]([^'"`]+)['"`]/g

/**
 * endpoint 各段(去掉 query 與路徑參數的包裝),用來組期望的名字。
 *
 * 路徑參數兩種寫法都要認 —— `voucher/item/{id}` 與 `` `voucher/item/${id}` ``。
 * 少認 template literal 那種的話,每一支用它的 api 都會被誤報成命名不對,
 * 而建議名還會長出 `$id` 這種東西。
 */
/**
 * 去掉端點裡的 `api` 字樣 —— 函式名本來就以 api 開頭,端點再帶一次是重複的。
 *
 *   apiAD    →  AD       (整支叫 apiGetADSearch,不是 apiGetApiADSearch)
 *   api      →  (整段拿掉)
 *   apiary   →  apiary   (那是一個完整的字,不是前綴)
 *
 * 只在 `api` 後面接大寫字母或數字時才當成前綴 —— 後面接小寫的話,
 * 那是某個字的開頭(apiary、apis),剝掉會把端點切成看不懂的東西。
 */
const stripApiWord = (segment) => {
  if (segment.toLowerCase() === 'api') return ''

  const m = /^api(?=[A-Z0-9])(.*)$/.exec(segment)
  return m ? m[1] : segment
}

/**
 * 連字號與底線接起來的段落,轉成一個駝峰字。
 *
 *   verification-code  →  verificationCode
 *   q3_1               →  q31
 *
 * **兩種分詞符號同一種處理。** 端點用哪一種是後端的事,函式名一律接成駝峰 ——
 * 「連字號要轉、底線不轉」的話,寫的人每次都得先看那一段是哪一種符號,
 * 而兩種在畫面上長得很像。
 *
 * 連字號在識別字裡不合法,原樣留著的話期望名會長出 `Verification-code`
 * 這種東西 —— 不管怎麼命名都對不上,那幾支會永遠紅著。
 */
const camelOf = (segment) =>
  segment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('')

/**
 * 端點裡不計入函式名的那幾段 —— 由設定列出(API_NAMING_IGNORED_SEGMENTS)。
 *
 * 典型是固定前綴:所有端點都帶的版本段或服務名(`api/v1/buy/list` 的 `v1`)。
 * 不排掉的話,每一支的期望名都多出那一段,而那一段每一支都一樣。
 *
 * **插值不自動排除,要排的話把變數名列進設定。** 工具分不出這兩種:
 *
 *   `${version}`  固定前綴,不是端點語意 —— 要排
 *   `${id}`       路徑參數,是端點的一段(`apiGetVoucherItemID` 的 ID)—— 不能排
 *
 * 兩者形狀一模一樣,差別只在「值從哪裡來」,而那要看 import 才知道。
 * 自動排除所有插值的話,路徑參數會整批從函式名裡消失 ——
 * 那種誤判比多一段 Version 嚴重得多,所以這裡不猜,一律交給設定。
 */
const isIgnoredSegment = (cleaned) =>
  API_NAMING_IGNORED_SEGMENTS.some((s) => s.toLowerCase() === cleaned.toLowerCase())

const segmentsOf = (endpoint) =>
  endpoint
    .split('?')[0]
    .split('/')
    .map((seg) => {
      const cleaned = seg.replace(/\$\{\s*([^}]*)\s*\}/g, '$1').replace(/[{}]/g, '')
      return isIgnoredSegment(cleaned) ? '' : camelOf(stripApiWord(cleaned))
    })
    .filter(Boolean)

/** 期望的函式名(全小寫,只用來比對) */
const expectedNameOf = (endpoint, method) =>
  `api${method}${segmentsOf(endpoint).join('')}`.toLowerCase()

/** 給人看的建議名 —— {id} 那段固定大寫 ID,其餘首字大寫 */
const suggestNameOf = (endpoint, method) =>
  `api${method.charAt(0).toUpperCase()}${method.slice(1)}` +
  segmentsOf(endpoint)
    .map((s) => (s.toLowerCase() === 'id' ? 'ID' : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('')

/** path 裡的 id 參數(`{id}` 與 `${id}` 都算)—— 函式名對應的那一段要寫成大寫 ID */
const hasIdParam = (endpoint) => /\$?\{\s*id\s*\}/i.test(endpoint)

const checkApiNaming = ({ rel, text }) => {
  if (!isApiFile(rel)) return []

  const issues = []

  for (const m of text.matchAll(API_EXPORT_RE)) {
    const [, name, method, endpoint] = m

    if (!/^api[A-Z]/.test(name)) {
      issues.push(
        issueOf(
          rel,
          lineNoOf(text, m.index),
          'apiNaming',
          `${name} 要以 api 開頭 —— 命名為 api + Method + endpoint 各段`
        )
      )
      continue
    }

    if (name.toLowerCase() === expectedNameOf(endpoint, method)) {
      // 段落都對上了,再單獨驗 {id} 那一段 —— 這一段大小寫敏感,一律大寫 ID
      if (hasIdParam(endpoint) && !name.includes('ID')) {
        issues.push(
          issueOf(
            rel,
            lineNoOf(text, m.index),
            'apiNaming',
            `${name} 的路徑參數要寫成大寫 ID(不是 Id)—— ${method} ${endpoint}`
          )
        )
      }

      continue
    }

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'apiNaming',
        `${name} 對不上 ${method} ${endpoint} —— 建議 ${suggestNameOf(endpoint, method)}(method 寫在前面;複合字依語意拆,例如 petphoto → PetPhoto)`
      )
    )
  }

  return issues
}

// --- 規則 apiReturn:每支 api 都要回 { config, status, data } -----------------
//
// 三個欄位是使用端的共同契約:status 判成敗、data 拿內容、config 回頭看送了什麼。
// 少一個,使用端就得為這一支寫特例 —— 而那個特例通常是在出事的時候才被發現。
//
// 直接 `=> fetchApi.get(...)` 的不驗 —— 那是把共用實例的回傳原封送出去,
// 形狀由 .export.js 決定,本來就是三件齊全的。
//
// 要驗的是**自己組了一份回傳**的:`=> ({ status, data })`。那種寫法一旦少一欄,
// 使用端就得為這一支寫特例 —— 而那個特例通常是在出事的時候才被發現。

const RETURN_FIELDS = ['config', 'status', 'data']

/**
 * export const apiX = (...) => ({ … })  ← 自己組物件回傳的那種
 *
 * 一定要認 `=> (` 的括號:沒有它的話 `=> fetchApi.get(\`item/${id}\`)`
 *    裡的 ${id} 會被當成物件字面值,每一支帶路徑參數的 api 都會被誤報。
 */
const API_OBJECT_RETURN_RE = /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\(\s*\{/g

const checkApiReturn = ({ rel, text }) => {
  if (!isApiFile(rel)) return []

  const issues = []

  for (const m of text.matchAll(API_OBJECT_RETURN_RE)) {
    const [, name] = m
    const body = bodyRangeOf(text, text.indexOf('{', m.index + m[0].length - 1))

    const missing = RETURN_FIELDS.filter((f) => !new RegExp(`\\b${f}\\b`).test(body))
    if (!missing.length) continue

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'apiReturn',
        `${name} 少了 ${missing.join(' / ')} —— 每支 api 一律回 { ${RETURN_FIELDS.join(', ')} },使用端才不必為某一支寫特例`
      )
    )
  }

  return issues
}

// --- 規則 apiTryCatch:api 不要自己包 try/catch ------------------------------
//
// 共用實例已經統一處理錯誤,失敗也會轉成 { config, status, data } 回來 ——
// 使用端靠 status 判斷成功與否。
//
// 再包一層 try/catch 會把錯誤吞在裡面:catch 那一段回傳的東西通常沒有 status,
// 使用端的判斷就失效了,而畫面上看起來只是「這一支永遠成功」。

const TRY_RE = /\btry\s*\{/g

const checkApiTryCatch = ({ rel, text: raw }) => {
  if (!isApiFile(rel)) return []

  const text = maskComments(rel, raw)

  return [...text.matchAll(TRY_RE)].map((m) =>
    issueOf(
      rel,
      lineNoOf(text, m.index),
      'apiTryCatch',
      `api 不要自己包 try/catch —— ${EXPORT_FILE} 已經把失敗也轉成 { ${RETURN_FIELDS.join(', ')} },` +
        `再包一層會把錯誤吞掉,使用端的 status 判斷就失效了,而畫面上看起來只是這一支永遠成功`
    )
  )
}

// --- 規則 apiPathParam:動態網址用 {key} 模板 --------------------------------
//
// 路徑上的參數寫成 `{id}`,呼叫端帶一個扁平物件進來 ——
// 共用實例會把 {id} 換成值,並且把用過的那個 key 從 query / body 裡排除。
//
// 用樣板字串自己拼的話,那一段不經過替換:那個值只出現在網址上,
// 而它原本也在參數物件裡,於是同一個值被送兩次(一次在路徑、一次在 query)。
// 更麻煩的是 endpoint 從此不是一個固定字串,對照 api 文件時搜不到它。

/** fetchApi.get(`…${…}…`) —— 端點用樣板字串拼出來的那種 */
const TEMPLATE_ENDPOINT_RE = /fetchApi\.\w+\s*\(\s*`([^`]*\$\{[^`]*)`/g

const checkApiPathParam = ({ rel, text: raw }) => {
  if (!isApiFile(rel)) return []

  const text = maskComments(rel, raw)

  return [...text.matchAll(TEMPLATE_ENDPOINT_RE)].map((m) =>
    issueOf(
      rel,
      lineNoOf(text, m.index),
      'apiPathParam',
      `端點 ${m[1]} 是拼出來的 —— 路徑參數寫成 {key} 模板,值由呼叫端帶在參數物件裡;` +
        `自己拼的話那個值不會從 query / body 排除,同一個值會被送兩次,端點也不再是一個搜得到的固定字串`
    )
  )
}

// --- 規則 customField:前端自己掛的欄位要加底線 ------------------------------
//
// api 回來的資料上再掛前端自己要用的屬性(展開狀態、算好的金額)時,
// 名字前面加一個底線,與後端給的欄位分開。
//
// 不加的話有兩種後果,而且都不會報錯:下一個人看到那個 key 會當成後端給的,
// 去翻 api 文件卻找不到;後端哪天真的加了同名欄位,前端寫的那一份會被蓋掉。
//
// **「這個名字是不是後端給的」靠 api 規格文件認**(設定的 API_SPEC_DIR)——
// 沒有那份文件就分不出來,規則整條略過。文件過期的徵狀是「後端新加的欄位
// 被要求加底線」,那時要重新匯出文件,不是照著加。

/** api 回來的資料放在層裡的這兩個欄位 —— 名字由 store 規範決定 */
const API_DATA_CONTAINERS = ['apiData', 'data']

/** <容器>.<路徑>.<key> = —— 取最後那一段 key,那是這次要掛上去的名字 */
const CONTAINER_ASSIGN_RE = new RegExp(
  `\\.(?:${API_DATA_CONTAINERS.join('|')})((?:\\.[A-Za-z_$][\\w$]*)+)\\s*=(?!=)`,
  'g'
)

let apiFieldCache = null

registerScanCache(() => {
  apiFieldCache = null
})

/**
 * 規格文件裡出現過的每一個欄位名。
 *
 * 整份走過一遍收 properties 的 key,不分是哪一支 api 的 ——
 * 這條要回答的只是「後端的世界裡有沒有這個名字」,不是「這一支 api 回不回它」。
 * 對得更細的話,要先知道這個變數是哪一支 api 的回傳,而那是跨好幾層的推斷。
 */
export const apiFieldNamesOf = (spec) => {
  const names = new Set()

  const walk = (node) => {
    if (!node || typeof node !== 'object') return

    /* 兩種來源都算:回傳與請求主體的欄位寫在 properties,網址上的參數
       (query 與路徑參數)寫在 parameters 的 name。這條問的是
       「後端的世界裡有沒有這個名字」,兩邊都是後端定義的。

       少收 parameters 那一半的話,那些參數會被當成前端自己掛上去的,
       而照著加底線之後那支 api 就送不出去了 —— 後端收不到它要的參數。 */
    if (node.properties) Object.keys(node.properties).forEach((key) => names.add(key))

    if (Array.isArray(node.parameters)) {
      for (const param of node.parameters) {
        if (param?.name) names.add(param.name)
      }
    }

    Object.values(node).forEach(walk)
  }

  walk(spec)

  return names
}

/**
 * 規格文件那個資料夾底下每一份 json 的欄位名,合起來算一份索引。
 *
 * 沒有設定、資料夾不在、裡面一份 json 都沒有,都回 null —— 沒有比對基準,
 * 那條規則整條略過(前提清單會講出這件事)。
 */
export const specFieldsIn = (dir) => {
  let files = []

  try {
    files = fs.readdirSync(dir).filter((name) => name.toLowerCase().endsWith('.json'))
  } catch {
    return null // 資料夾不在
  }

  const names = new Set()

  for (const name of files) {
    try {
      for (const field of apiFieldNamesOf(JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')))) {
        names.add(field)
      }
    } catch {
      // 某一份壞掉或不是規格文件就跳過它,不要因此讓整條規則失效
    }
  }

  return names.size ? names : null
}

const specFieldsOf = (root) => {
  if (apiFieldCache?.root === root) return apiFieldCache.names
  if (!API_SPEC_DIR) return null

  const names = specFieldsIn(path.join(root, API_SPEC_DIR))

  apiFieldCache = { root, names }

  return names
}

const checkCustomField = ({ rel, text, root }) => {
  if (!isInSrc(rel) || !/\.(vue|js)$/.test(rel)) return []

  /* 檔頭標 `lint-custom-field-exempt: 理由` 放行整支。
     `data` 是個很通用的名字,第三方套件的事件物件也用它(編輯器的貼上事件
     就是 `e.data.dataValue`)—— 那是別人的介面,改名等於改壞,
     而規則分不出「store 的那一層」與「剛好也叫 data 的東西」。

     沒有出口的話,那幾筆每次都再印一遍而且一筆都改不掉,
     而一條一直報「改不了的東西」的規則,最後會連同真正該改的一起被略過。 */
  if (hasExemptMark(text, 'custom-field')) return []

  const fields = specFieldsOf(root)
  if (!fields?.size) return []

  const issues = []
  const seen = new Set()

  for (const m of text.matchAll(CONTAINER_ASSIGN_RE)) {
    const key = m[1].split('.').pop()

    if (key.startsWith('_') || fields.has(key) || seen.has(key)) continue
    seen.add(key)

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'customField',
        `${key} 不在 api 規格文件裡 —— 前端自己掛上去的欄位名前面加一個底線(_${key}),` +
          `與後端給的欄位分開;下一個人才不會拿它去翻 api 文件,後端加了同名欄位時也不會蓋掉。` +
          `這其實是後端給的欄位的話,代表 ${API_SPEC_DIR} 該重新匯出了`
      )
    )
  }

  return issues
}

export const API_CHECKS = [
  checkApiClient,
  checkApiTryCatch,
  checkApiPathParam,
  checkCustomField,
  checkApiScope,
  checkApiSource,
  checkApiNaming,
  checkApiReturn,
]

export const API_RULE_TITLE = {
  apiClient: '使用了 axios 或原生請求',
  apiScope: 'api 檔案對不上專案資料夾',
  apiSource: 'api 實例的來源不對',
  apiNaming: 'api 函式的命名',
  apiReturn: 'api 的回傳形狀',
  apiTryCatch: 'api 自己包了 try/catch',
  apiPathParam: '動態網址用拼接,不是 {key} 模板',
  customField: '前端自己掛的欄位沒有加底線',
}

export const API_RULE_HINT = {
  apiClient: `axios 一律不用;原生請求能用但會繞過 ${CONFIG_FILE} 的攔截器`,
  apiScope: `${API_DIR} 的檔名要對得上 ${VIEWS_DIR} 的第一層,對不上的放 ${SHARED_API_FILE}.js`,
  apiSource: `實例建在 ${CONFIG_FILE}(api 目錄再分層時,每一層各自一支),api 檔案 import 它即可`,
  apiNaming: 'api + Method + endpoint 各段(method 寫在前面,GET 也要寫)',
  apiTryCatch: `錯誤由 ${EXPORT_FILE} 統一處理,api 自己包會把它吞掉`,
  apiPathParam: '路徑參數寫成 {key},值由呼叫端帶在參數物件裡',
  customField:
    '規格文件裡沒有這個欄位名 —— 前端自己掛的加底線;真的是後端給的就重新匯出那份文件',
  apiReturn: `一律回 { ${RETURN_FIELDS.join(', ')} }`,
}
