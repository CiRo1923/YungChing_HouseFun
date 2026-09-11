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
  SKIP_DIRS,
  SRC_PREFIX,
  TOOLING_PREFIXES,
  VIEW_RESOURCE_DEPTH,
  VIEWS_DIR,
} from './project-config.mjs'

export {
  ABSOLUTE_PATH_SCOPE,
  ACTIONS_DIR_NAME,
  API_DIR,
  BREAKPOINTS,
  BUILD_CONFIG_FILES,
  COLOR_CSS_DIR,
  COMPONENTS_DIR,
  COMPONENT_DIRS,
  COMPONENT_FOLDERS,
  CONVENTION_RULES_DIR,
  CONVENTION_SKILLS_DIR,
  CSS_MODULES_DIR,
  IMPORT_ORDER_GROUPS,
  PARALLEL_AWAIT_HELPER,
  WRITING_STYLE_SCOPE,
  PROJECT_CONFIG_FILES,
  PROJECT_DOCS_DIR,
  PROJECT_NAMES,
  PROJECT_NAME_SCOPE,
  SCANNABLE_EXTENSIONS,
  SCANNABLE_RE,
  SCAN_TARGETS,
  SHARED_API_FILE,
  SHARED_MODULE_VARIABLES,
  SKIP_DIRS,
  SOURCE_PROJECT_NAME,
  STYLE_CONFIG_FILES,
  SRC_DIR,
  STANDALONE_APIS,
  STANDALONE_STORES,
  STORE_DIR,
  TAILWIND_THEME_OVERRIDES,
  TOOLING_PREFIXES,
  VIEW_RESOURCE_DEPTH,
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
 * level 預設 error —— 規則沒指定就是要擋的。要放行的那條自己用 warnOf,
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
 * 用在「有更好的寫法,但現在這樣寫不算錯」的規則:原生 fetch(能用,只是繞過共用實例)。
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
 * 把配對到的區段換成等長空白。
 *
 * 換成空白而不是刪掉,行號與欄位都不會跑掉 —— 違規要指到正確的那一行,
 * 刪掉之後行號就對不上原始檔案了。
 */
const maskBy = (text, re) => text.replace(re, (m) => m.replace(/[^\n]/g, ' '))

/**
 * 遮蔽 CSS 註解。
 *
 * 兩種用途:一是註解掉的程式碼是死的,拿規範去檢查它沒有意義,而且會讓人
 * 以為某一行有問題,打開檔案才發現那一段根本沒有作用;二是找大括號的配對時,
 * 註解裡的括號不能算數 —— 一段註解裡寫了左大括號而沒有右大括號的話,
 * 整份檔案的巢狀層數會從那裡開始算錯。
 *
 * 需要讀註解的檢查不要用這個(豁免標記、色票的色相分類標籤、
 * 文字寫法那幾條檢查的正是註解本身)。
 */
export const maskCssComments = (text) => maskBy(text, /\/\*[\s\S]*?\*\//g)

/** 遮蔽 template 的 HTML 註解 */
export const maskHtmlComments = (text) => maskBy(text, /<!--[\s\S]*?-->/g)

/**
 * 這份檔案有沒有標某一條規則的豁免。
 *
 * 標記的形狀是 `lint-<規則>-exempt: 理由`,而且**一定要寫在註解裡** ——
 * CSS 的區塊註解、JS 的行註解、HTML 的註解都算。整份檔案跳過那一條檢查。
 *
 * **只認註解裡的那一份,是因為程式碼本身也會寫出這串字。**
 * 定義比對式的那一行(`const XXX_EXEMPT_RE = /lint-xxx-exempt/`)就含有它 ——
 * 只看「整份文字有沒有出現」的話,定義規則的那支檔案永遠豁免自己,
 * 於是那條規則對它完全失效,而且不會有任何徵兆。
 *
 * 判斷方式是看標記前面有沒有註解起頭。跨行註解中間、又不是以 `*` 起頭的那種行
 * 會被判成不在註解裡 —— 那個方向是「照常檢查」,看到的人自己判斷得出來;
 * 反過來誤放行才危險,漏掉的違規不會有人發現。
 *
 * 判準收在這裡一份 —— 每條規則各寫一次的話,改了一處忘了另一處,
 * 那幾條的豁免行為就開始不一樣,而不一樣的那天不會有人通知你。
 */
export const hasExemptMark = (text, name) => {
  const markRe = new RegExp(`lint-${name}-exempt`)

  return text.split('\n').some((line) => {
    const at = line.search(markRe)
    if (at === -1) return false

    const before = line.slice(0, at)

    return /\/\/|\/\*|<!--/.test(before) || /^\s*\*/.test(before)
  })
}

/**
 * 頁面資源資料夾 —— 每一筆是 `{ name, abs }`(資源名與它的絕對路徑)。
 *
 * 「資源」是一個功能單位(會員、點數、廣告),api 檔名與 store 檔名都要對得上它。
 * 資源在第幾層由設定的 VIEW_RESOURCE_DEPTH 決定:有的專案資源直接放第一層,
 * 有的第一層是分類層、資源在它底下。
 *
 * **名稱與路徑一起回傳,是為了讓走訪深度的邏輯只有這一份。** 規則要嘛問
 * 「有哪些資源」,要嘛問「某個資源的檔案放在哪」—— 後者自己拼路徑的話,
 * 分類層的專案會拼出一個不存在的目錄,那條規則就整條靜默失效
 * (不會報錯,只是永遠找不到檔案,看起來像全部通過)。
 *
 * 動態讀取而不是寫死清單 —— 寫死的話新增資料夾時規則不會跟著更新,
 * 而且不會有人發現。找不到頁面目錄時回傳 null,由呼叫端跳過檢查(不亂猜)。
 *
 * 底線開頭的資料夾不算資源 —— 那是放元件的地方,不是功能單位。
 */
export const listViewResources = (root) => {
  const abs = path.join(root, ...VIEWS_DIR.split('/'))
  if (!fs.existsSync(abs)) return null

  const foldersAt = (dir, depth) => {
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('_'))

    if (depth <= 1) return entries.map((e) => ({ name: e.name, abs: path.join(dir, e.name) }))

    return entries.flatMap((e) => foldersAt(path.join(dir, e.name), depth - 1))
  }

  return foldersAt(abs, VIEW_RESOURCE_DEPTH)
}

/** 有哪些頁面資源(只要名字);找不到頁面目錄時回 null */
export const listViewFolders = (root) => {
  const resources = listViewResources(root)
  return resources && new Set(resources.map((r) => r.name))
}

/**
 * 某一個資源資料夾的絕對路徑;沒有這個資源就回 null。
 *
 * 規則要讀「某個資源底下有哪些頁面」時走這裡,不要自己把資源名接在頁面目錄後面 ——
 * 第一層是分類層的專案,那樣拼出來的路徑不存在。
 */
export const viewResourceDirOf = (root, name) =>
  listViewResources(root)?.find((r) => r.name === name)?.abs ?? null

/**
 * 頁面目錄的第一層,是分類層還是資源層。
 *
 * 判準是「第一層的資料夾底下有沒有直接放 .vue」:
 *   有  → 那一層就是資源(一個功能單位一個資料夾,裡面放它的頁面)
 *   沒有 → 那一層只是分類,資源在更底下
 *
 * 回傳建議的深度;判斷不出來(目錄不存在、第一層沒有資料夾)時回 null。
 *
 * 這是給前提檢查用的 —— VIEW_RESOURCE_DEPTH 設錯的話,每一支 api 與 store
 * 都會被報「對不上資料夾」,那一整片訊息說的其實是同一件事:這一項設錯了。
 */
export const detectViewResourceDepth = (root) => {
  const abs = path.join(root, ...VIEWS_DIR.split('/'))
  if (!fs.existsSync(abs)) return null

  const firstLevel = fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))

  if (!firstLevel.length) return null

  const hasOwnPages = firstLevel.filter((e) =>
    fs.readdirSync(path.join(abs, e.name)).some((name) => name.endsWith('.vue'))
  )

  return hasOwnPages.length ? 1 : 2
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

/**
 * 走訪時要跳過的目錄。
 *
 * 清單在 project-config.mjs —— 各專案的建置產物叫什麼不一樣(Nuxt 是 .output,
 * Next 是 .next),寫死在這裡的話,漏掉的那一種會被當成原始碼整包掃進來。
 */
const SKIP_DIR = new RegExp(
  `(^|/)(${SKIP_DIRS.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(/|$)`
)

/**
 * 專案自己的文件目錄底下的檔案 —— 每一條規則都不檢查。
 *
 * 兩個理由:
 *
 * 一、**那一層有自己的檢查工具**(連結有效、側欄一致、排版慣例那些)。
 *     兩套工具掃同一層的話,判準會各自演化 —— 同一份文件被兩邊報不同的東西,
 *     而修好一邊另一邊還在報。文件的事歸文件的工具管。
 *
 * 二、那一層放的是寫給這個專案的內容(規格、對照表、會議紀錄那類),
 *     提到專案名稱、貼一段實際路徑、引用一段不合規範的範例程式碼都是正常的。
 *     拿程式碼的規則去檢查只會產生整片誤報。
 *
 * 那裡用什麼格式寫也不受限制 —— 排除是整層的,與副檔名無關。
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
