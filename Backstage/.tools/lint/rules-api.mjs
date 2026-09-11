// API 規範 —— 請求走共用的 onFetchApi,api 檔案要對得上專案資料夾。
//
// 與 CSS 規則分開的理由跟 rules-global.mjs 一樣:適用範圍不同(這裡看的是 .js / .vue
// 的請求寫法與 _api 的檔案歸屬),混在一起之後想加第四類規則就得整個重切。

import path from 'node:path'
import {
  API_DIR,
  SHARED_API_FILE,
  STANDALONE_APIS,
  VIEWS_DIR,
  bodyRangeOf,
  findNearFolder,
  isInSrc,
  issueOf,
  lineNoOf,
  listViewFolders,
  warnOf,
} from './shared.mjs'

/**
 * 暫時保留的獨立 api 檔案 —— 清單處理完就會清空。
 *
 * 清單與「共用那一支叫什麼」都定義在 project-config.mjs
 * (STANDALONE_APIS 與 SHARED_API_FILE)—— 每個專案的檔名不一樣,
 * 寫在規則裡的話,換一個專案就會把它自己的 api 報成違規。
 *
 * ⚠️ 不要再往那份清單加東西。對不上資料夾的 api 一律放共用的那一支;
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

const checkApiScope = ({ rel, root }) => {
  if (!isApiFile(rel)) return []

  const folders = listViewFolders(root)
  if (!folders) return []

  const name = path.basename(rel, '.js')
  if (folders.has(name) || name === SHARED_API_FILE || ALLOWED_STANDALONE.has(name)) return []

  const near = findNearFolder(folders, name)

  return [
    issueOf(
      rel,
      1,
      'apiScope',
      near
        ? `檔名 ${name}.js 對不上資料夾 —— ${VIEWS_DIR} 底下是 ${near}/,兩邊要一致(改檔名或改資料夾名)`
        : `檔名 ${name}.js 在 ${VIEWS_DIR} 底下沒有對應的資料夾 —— api 依資料夾切分,對不上的一律搬進 ${SHARED_API_FILE}.js`
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
        `api 檔案不要自己呼叫 onFetchApi —— 實例只建在 ${CONFIG_FILE} 一支,否則攔截器要各設一次,漏掉不會報錯`
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
        `請求要用 ${API_DIR}/${CONFIG_FILE} 匯出的實例 —— import 它再呼叫,不要自建`
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
// ⚠️ 比對是**大小寫不敏感**的:endpoint 全小寫的複合字要怎麼拆(petphoto →
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
 * ⚠️ 中間不得跨過另一個 `export` —— 沒有這道限制的話,
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
const segmentsOf = (endpoint) =>
  endpoint
    .split('?')[0]
    .split('/')
    .map((s) => s.replace(/\$\{\s*([^}]*)\s*\}/g, '$1').replace(/[{}]/g, ''))
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
 * ⚠️ 一定要認 `=> (` 的括號:沒有它的話 `=> fetchApi.get(\`item/${id}\`)`
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

export const API_CHECKS = [
  checkApiClient,
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
}

export const API_RULE_HINT = {
  apiClient: `axios 一律不用;原生請求能用但會繞過 ${CONFIG_FILE} 的攔截器`,
  apiScope: `${API_DIR} 的檔名要對得上 ${VIEWS_DIR} 的第一層,對不上的放 ${SHARED_API_FILE}.js`,
  apiSource: `實例只建在 ${CONFIG_FILE} 一支,api 檔案 import 它即可`,
  apiNaming: 'api + Method + endpoint 各段(method 寫在前面,GET 也要寫)',
  apiReturn: `一律回 { ${RETURN_FIELDS.join(', ')} }`,
}
