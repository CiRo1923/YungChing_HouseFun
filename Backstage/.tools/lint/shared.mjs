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
  CONVENTION_RULES_DIR,
  CONVENTION_SKILLS_DIR,
  PROJECT_DOCS_DIR,
  SCANNABLE_RE,
  SRC_PREFIX,
  TOOLING_PREFIXES,
  VIEWS_DIR,
} from './project-config.mjs'

export {
  ABSOLUTE_PATH_SCOPE,
  ACTIONS_DIR_NAME,
  API_DIR,
  BUILD_CONFIG_FILES,
  COLOR_CSS_DIR,
  COMPONENTS_DIR,
  COMPONENT_DIRS,
  COMPONENT_FOLDERS,
  CONVENTION_RULES_DIR,
  CONVENTION_SKILLS_DIR,
  CSS_MODULES_DIR,
  PARALLEL_AWAIT_HELPER,
  PROJECT_CONFIG_FILES,
  PROJECT_DOCS_DIR,
  PROJECT_NAME_PATTERNS,
  PROJECT_NAME_SCOPE,
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
    : /* 原始碼就放在專案根時,反過來認:不在規範系統、也不在專案文件那幾個目錄
         底下的,就是原始碼。前綴是空的,正面比對永遠不成立,
         一整批規則會靜靜地不再檢查任何東西。 */
      !TOOLING_PREFIXES.some((prefix) => rel.startsWith(prefix)) && !isProjectDocs(rel)

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

/**
 * 專案自己的文件目錄底下的檔案 —— 每一條規則都不檢查。
 *
 * 那一層放的是寫給這個專案的內容(規格、對照表、會議紀錄那類),
 * 提到專案名稱、貼一段實際路徑、引用一段不合規範的範例程式碼都是正常的。
 * 拿規則去檢查只會產生整片誤報,而誤報多到一個程度,整份清單就被當成雜訊略過。
 *
 * 判斷只寫在這裡一份,全專案掃描與單檔檢查都呼叫它 ——
 * 兩處各寫一次的話,會出現「整批掃描跳過、但存檔時照樣報」這種說不通的落差。
 */
export const isProjectDocs = (rel) => rel === PROJECT_DOCS_DIR || rel.startsWith(`${PROJECT_DOCS_DIR}/`)

/**
 * 取出 markdown 檔頭 `---` 之間的欄位。
 *
 * 只認 `key: value` 這種一行一組的寫法,不解析巢狀結構 ——
 * 規範檔的檔頭只放幾個單層欄位,用完整的 YAML 解析器是多餘的相依。
 */
const frontMatterOf = (text) => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!m) return {}

  const fields = {}

  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^(\w[\w-]*)\s*:\s*(.*)$/.exec(line)
    if (kv) fields[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '')
  }

  return fields
}

/**
 * 跨規則的共同前提有哪幾份 —— 依 `priority` 由小到大排序。
 *
 * 每一份自己在檔頭宣告 `priority`(順位)與 `summary`(一句話說明),
 * 所以新增一份規則檔就會自動出現在提醒裡,不必再去別處補一行。
 * 清單另外維護一份的話,新增的規則不會報錯,只是從此沒有人看得到它。
 *
 * 沒有宣告 `priority` 的排在最後,`summary` 缺了就退回用標題。
 */
export const listConventionRules = (root) => {
  const dir = path.join(root, ...CONVENTION_RULES_DIR.split('/'))
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const text = fs.readFileSync(path.join(dir, name), 'utf8')
      const fields = frontMatterOf(text)
      const title = /^#\s+(.+)$/m.exec(text)?.[1]?.trim() ?? name

      return {
        file: `${CONVENTION_RULES_DIR}/${name}`,
        title,
        summary: fields.summary || title,
        priority: Number(fields.priority) || Number.MAX_SAFE_INTEGER,
      }
    })
    .sort((a, b) => a.priority - b.priority || a.file.localeCompare(b.file))
}

/**
 * 各類程式的寫法規範有哪幾份 —— 一個資料夾一份。
 *
 * 名稱取資料夾名,一句話說明取檔頭 `summary`(沒有就用資料夾名)。
 * 跟共同前提那份一樣,清單從目錄長出來,新增一份就自動出現。
 */
export const listConventionSkills = (root) => {
  const dir = path.join(root, ...CONVENTION_SKILLS_DIR.split('/'))
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const file = path.join(dir, e.name, 'SKILL.md')
      const fields = fs.existsSync(file) ? frontMatterOf(fs.readFileSync(file, 'utf8')) : {}

      return { name: e.name, summary: fields.summary || '' }
    })
    .filter((s) => fs.existsSync(path.join(dir, s.name, 'SKILL.md')))
    .sort((a, b) => a.name.localeCompare(b.name))
}

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
    if (SKIP_DIR.test(rel) || isProjectDocs(rel)) return []
    return entry.isDirectory() ? listFiles(root, rel) : isScannable(next) ? [next] : []
  })
}
