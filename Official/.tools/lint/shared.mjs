// 規則之間共用的小工具。
//
// 放這裡而不是放 lint-core.mjs,是為了讓 rules-global.mjs(全站規範)
// 不必反過來 import CSS 規則那支 —— 否則兩邊會形成循環相依。
//
// 專案的目錄位置全部集中在 project-config.mjs,這裡只轉出去 —— 規則檔案不必知道
// 那些常數是從哪一支來的,換專案時也只有 project-config.mjs 要改。

import fs from 'node:fs'
import path from 'node:path'
// re-export 不會在這支檔案的作用域產生綁定 —— 這裡自己要用到的常數必須另外 import
import {
  ACTIONS_DIR_NAME,
  COMPONENT_DIRS,
  COMPONENT_FOLDERS,
  SCANNABLE_RE,
  SRC_PREFIX,
  TOOLING_PREFIXES,
  VIEWS_DIR,
} from './project-config.mjs'

export {
  ACTIONS_DIR_NAME,
  API_DIR,
  BUILD_CONFIG_FILES,
  COLOR_CSS_DIR,
  COMPONENTS_DIR,
  COMPONENT_DIRS,
  COMPONENT_FOLDERS,
  CONVENTION_SCOPE,
  CSS_MODULES_DIR,
  PARALLEL_AWAIT_HELPER,
  PROJECT_CONFIG_FILES,
  PROJECT_NAME_PATTERNS,
  SCANNABLE_EXTENSIONS,
  SCANNABLE_RE,
  SCAN_TARGETS,
  SHARED_API_FILE,
  SHARED_MODULE_VARIABLES,
  SRC_DIR,
  STANDALONE_APIS,
  STANDALONE_STORES,
  STORE_DIR,
  TAILWIND_THEME_OVERRIDES,
  VIEWS_DIR,
} from './project-config.mjs'

/**
 * 統一的違規格式 —— 五層守門共用同一份輸出邏輯,靠的就是這個形狀。
 *
 *   file    相對專案根,一律 POSIX 斜線
 *   line    1-based
 *   rule    規則代號
 *   detail  人看得懂的一句話,要寫清楚「怎麼改」
 *   level   'error' 一律要改 | 'warn' 建議,不擋
 *
 * ⚠️ level 預設 error —— 規則沒指定就是要擋的。要放行的那條自己用 warnOf,
 *    這樣「忘了標」的結果是嚴格而不是靜默放過。
 */
export const issueOf = (rel, line, rule, detail, level = 'error') => ({
  file: rel,
  line,
  rule,
  detail,
  level,
})

/**
 * 建議級的違規 —— 印出來提醒,但不列入阻擋計數,pre-commit 也不會因它失敗。
 *
 * 用在「有更好的寫法,但現在這樣寫不算錯」的規則:原生 fetch(能用,只是繞過共用實例)、
 * 頁面直接 import api(能用,只是資料沒進 store)。
 */
export const warnOf = (rel, line, rule, detail) => issueOf(rel, line, rule, detail, 'warn')

export const isWarn = (issue) => issue.level === 'warn'

export const lineNoOf = (text, index) => text.slice(0, index).split('\n').length

/**
 * 從 `const x = () => {` 的左大括號往後配對,取出整個函式的內容。
 *
 * 用大括號配對而不是 regex —— 函式裡有巢狀區塊時 regex 抓不到正確的結尾。
 */
export const bodyRangeOf = (text, start) => {
  let depth = 0

  for (let i = start; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1
    else if (text[i] === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }

  return text.slice(start)
}

export const toRel = (root, abs) => path.relative(root, abs).split(path.sep).join('/')

/**
 * 頁面資料夾的第一層名稱。
 *
 * 動態讀取而不是寫死清單 —— 寫死的話新增資料夾時規則不會跟著更新,
 * 而且不會有人發現。找不到目錄時回傳 null,由呼叫端跳過檢查(不亂猜)。
 */
export const listViewFolders = (root) => {
  const abs = path.join(root, ...VIEWS_DIR.split('/'))
  if (!fs.existsSync(abs)) return null

  return new Set(
    fs
      .readdirSync(abs, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  )
}

/** 單複數 / 大小寫對不上是最常見的情況,把接近的名字指出來比只說「找不到」有用 */
export const findNearFolder = (folders, name) => {
  const normalize = (v) => v.toLowerCase().replace(/s$/, '')
  return [...folders].find((f) => normalize(f) === normalize(name))
}

/**
 * 這個檔案是不是原始碼(相對專案根的路徑)。
 *
 * 多條規則都只看原始碼,不看規範工具與說明文件自己那幾支。原始碼根目錄叫什麼
 * 由 project-config.mjs 決定,所以判斷收在這裡一份 —— 各規則各自寫死前綴的話,
 * 換一個目錄名的專案就得逐支翻出來改,漏掉哪一支,那條規則從此不再檢查任何東西。
 */
export const isInSrc = (rel) =>
  SRC_PREFIX
    ? rel.startsWith(SRC_PREFIX)
    : /* 原始碼就放在專案根時,反過來認:不在規範系統那幾個目錄底下的就是原始碼。
         前綴是空的,正面比對永遠不成立,一整批規則會靜靜地不再檢查任何東西。 */
      !TOOLING_PREFIXES.some((prefix) => rel.startsWith(prefix))

/**
 * 這個 .vue 是元件還是頁面。
 *
 * 元件被頁面放進畫面裡,自己不是一個網址;頁面對應一個網址。
 * 兩者的規範不同(元件完全不能自己去要資料,頁面則是不建議),所以要分得出來。
 *
 * 兩種都算元件:
 *   1. 只放元件的目錄底下(共用元件、容器、版型)
 *   2. 頁面目錄底下、但在底線開頭那幾個資料夾裡 —— 那是「這裡面不是頁面」的慣例
 *
 * 目錄與資料夾名都定義在 project-config.mjs,這裡不寫死 ——
 * 每個專案的擺法不一樣,寫死之後換一個專案就會把頁面當成元件(或反過來)。
 */
export const isComponentFile = (rel) => {
  if (!rel.endsWith('.vue')) return false
  if (COMPONENT_DIRS.some((dir) => rel.startsWith(`${dir}/`))) return true

  return COMPONENT_FOLDERS.some((folder) => rel.includes(`/${folder}/`))
}

/**
 * 這個檔案是不是放行為(actions)的那個子資料夾底下的檔案。
 *
 * 判斷方式是「路徑裡有沒有那個子資料夾」,不比對固定前綴 ——
 * 前綴比對在巢狀資料夾下會失準,把 actions 誤判成 store。
 *
 * 子資料夾叫什麼由 project-config.mjs 決定,所以判斷收在這裡一份 ——
 * 多個規則都要問這個問題,各自寫死名稱的話,換一個命名的專案只會有部分規則跟著改,
 * 其餘幾條靜靜地不再命中任何檔案。
 */
export const isInActionsDir = (rel) => rel.includes(`/${ACTIONS_DIR_NAME}/`)

/**
 * 存檔時記下「這個檔案還有違規」的清單檔位置(相對專案根)。
 *
 * 這是存檔守門與對話提醒之間的唯一接點:存檔那層把檔名寫進去,
 * 對話那層讀出來重新檢查,修好了才移除。兩層各寫一次路徑的話,
 * 改了一邊就完全接不上 —— 而且不會報錯,只會變成「存檔的違規再也不進對話」。
 */
export const PENDING_CACHE_FILE = 'node_modules/.cache/cssGuard/pending.json'

const SKIP_DIR = /(^|\/)(node_modules|\.git|dist|build|public)(\/|$)/

// 副檔名範圍定義在 project-config.mjs,五層守門共用同一份
export const isScannable = (abs) => SCANNABLE_RE.test(abs)

/** 遞迴列出可檢查的檔案(絕對路徑) */
export const listFiles = (root, target) => {
  const abs = path.resolve(root, target)
  if (!fs.existsSync(abs)) return []
  if (fs.statSync(abs).isFile()) return isScannable(abs) ? [abs] : []

  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(abs, entry.name)
    const rel = toRel(root, next)
    if (SKIP_DIR.test(rel)) return []
    return entry.isDirectory() ? listFiles(root, rel) : isScannable(next) ? [next] : []
  })
}
