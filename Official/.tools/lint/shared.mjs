// 規則之間共用的小工具。
//
// 放這裡而不是放 lint-core.mjs,是為了讓 rules-global.mjs(全站規範)
// 不必反過來 import CSS 規則那支 —— 否則兩邊會形成循環相依。
//
// 專案的目錄位置全部集中在 project-config.mjs,這裡只轉出去 —— 規則檔案不必知道
// 那些常數是從哪一支來的,換專案時也只有 project-config.mjs 要改。

import fs from 'node:fs'
import path from 'node:path'
/* 設定整包取進來,一項一項轉出去 —— **不要逐項 named import**。
 *
 * 逐項寫的話,來源改了一個設定項的名字(或新增一項而某個專案的設定檔還沒有),
 * 拿到這套工具的專案會在**模組解析階段**就失敗:
 * `SyntaxError: does not provide an export named …`,一行程式碼都還沒執行。
 *
 * 那個失敗會讓整套檢查一條都跑不了 —— 包括「設定檔少了什麼」那一條規則
 * (configItem)自己,而錯誤訊息看不出是設定檔的問題,
 * 看到的人只知道工具壞了。
 *
 * 整包取值不會這樣:缺的那一項拿到 undefined,名字先記下來,
 * 由前提檢查那一層講出「設定檔缺少哪幾項」。
 */
import * as projectConfig from './project-config.mjs'

/** 這個專案的設定檔少了哪幾項 —— 由前提檢查讀它 */
export const MISSING_CONFIG_ITEMS = []

const configOf = (name) => {
  if (!(name in projectConfig)) MISSING_CONFIG_ITEMS.push(name)

  return projectConfig[name]
}

export const PROJECT_FRAMEWORK = configOf('PROJECT_FRAMEWORK')
export const VIEWS_DIR = configOf('VIEWS_DIR')
export const VIEW_RESOURCE_DEPTH = configOf('VIEW_RESOURCE_DEPTH')
export const STORE_DIR = configOf('STORE_DIR')
export const ACTIONS_DIR_NAME = configOf('ACTIONS_DIR_NAME')
export const MODULE_CSS_DIR_NAME = configOf('MODULE_CSS_DIR_NAME')
export const API_DIR = configOf('API_DIR')
export const API_SPEC_DIR = configOf('API_SPEC_DIR')
export const COMPONENTS_DIR = configOf('COMPONENTS_DIR')
export const IMPORT_ORDER_GROUPS = configOf('IMPORT_ORDER_GROUPS')
export const COMPONENT_DIRS = configOf('COMPONENT_DIRS')
export const COMPONENT_FOLDERS = configOf('COMPONENT_FOLDERS')
export const VIEW_UNDERSCORE_FOLDERS = configOf('VIEW_UNDERSCORE_FOLDERS')
export const VIEW_COMPONENT_MARKERS = configOf('VIEW_COMPONENT_MARKERS')
export const POPUP_DIR_NAME = configOf('POPUP_DIR_NAME')
export const CSS_MODULES_DIR = configOf('CSS_MODULES_DIR')
export const SHARED_MODULE_VARIABLES = configOf('SHARED_MODULE_VARIABLES')
export const COLOR_CSS_DIR = configOf('COLOR_CSS_DIR')
export const BREAKPOINTS = configOf('BREAKPOINTS')
export const BREAKPOINT_SCREENS = configOf('BREAKPOINT_SCREENS')
export const SRC_DIR = configOf('SRC_DIR')
export const SKIP_DIRS = configOf('SKIP_DIRS')
export const STORE_SETUP_CALLS = configOf('STORE_SETUP_CALLS')
export const STORE_INSTANCE_FILE = configOf('STORE_INSTANCE_FILE')
export const STANDALONE_STORES = configOf('STANDALONE_STORES')
export const STANDALONE_APIS = configOf('STANDALONE_APIS')
export const SHARED_API_FILE = configOf('SHARED_API_FILE')
export const API_NAMING_IGNORED_SEGMENTS = configOf('API_NAMING_IGNORED_SEGMENTS')
export const PARALLEL_AWAIT_HELPER = configOf('PARALLEL_AWAIT_HELPER')
export const FORM_GROUP_VALIDATOR = configOf('FORM_GROUP_VALIDATOR')
export const POPUP_TAGS = configOf('POPUP_TAGS')
export const BUILTIN_POPUP_IDS = configOf('BUILTIN_POPUP_IDS')
export const DEEP_CLONE_HELPER = configOf('DEEP_CLONE_HELPER')
export const PROJECT_NAMES = configOf('PROJECT_NAMES')
export const SOURCE_PROJECT_NAME = configOf('SOURCE_PROJECT_NAME')
export const COLOR_CSS_PREFIX = configOf('COLOR_CSS_PREFIX')
export const COLOR_HUE_SOURCE = configOf('COLOR_HUE_SOURCE')
export const COLOR_HUES = configOf('COLOR_HUES')
export const COLOR_NAME_SEPARATOR = configOf('COLOR_NAME_SEPARATOR')
export const COLOR_RGB_SUFFIX = configOf('COLOR_RGB_SUFFIX')
export const COLOR_SUFFIX_PICK = configOf('COLOR_SUFFIX_PICK')
export const STYLE_CONFIG_FILES = configOf('STYLE_CONFIG_FILES')
export const TAILWIND_THEME_OVERRIDES = configOf('TAILWIND_THEME_OVERRIDES')
export const SCANNABLE_EXTENSIONS = configOf('SCANNABLE_EXTENSIONS')
export const SCANNABLE_RE = configOf('SCANNABLE_RE')
export const PROJECT_DOCS_DIR = configOf('PROJECT_DOCS_DIR')
export const GENERATED_FILES = configOf('GENERATED_FILES')
export const VENDOR_DIRS = configOf('VENDOR_DIRS')
export const CONVENTION_RULES_DIR = configOf('CONVENTION_RULES_DIR')
export const CONVENTION_SKILLS_DIR = configOf('CONVENTION_SKILLS_DIR')
export const CONVENTION_DOCS_DIR = configOf('CONVENTION_DOCS_DIR')
export const FRAMEWORKS = configOf('FRAMEWORKS')
export const IS_FILE_BASED_ROUTING = configOf('IS_FILE_BASED_ROUTING')
export const IS_SRC_PROJECT_ROOT = configOf('IS_SRC_PROJECT_ROOT')
export const SRC_PREFIX = configOf('SRC_PREFIX')
export const TOOLING_PREFIXES = configOf('TOOLING_PREFIXES')
export const SCAN_TARGETS = configOf('SCAN_TARGETS')
export const PROJECT_NAME_SCOPE = configOf('PROJECT_NAME_SCOPE')
export const ABSOLUTE_PATH_SCOPE = configOf('ABSOLUTE_PATH_SCOPE')
export const WRITING_STYLE_SCOPE = configOf('WRITING_STYLE_SCOPE')
export const BUILD_CONFIG_FILES = configOf('BUILD_CONFIG_FILES')
export const PROJECT_CONFIG_FILES = configOf('PROJECT_CONFIG_FILES')
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

/**
 * 所有 import 寫法:具名匯入、整包匯入、動態 import。
 *
 * **放在這裡是因為有兩條規則要用**(哪些檔案不可以 import api、
 * 相對路徑該不該改成 alias)。各自寫一份的話,多認一種寫法時只會改到其中一邊 ——
 * 另一條從此漏掉那種寫法,而漏掉不會報錯,只是那種 import 再也不被檢查。
 *
 * 比對式帶 g,用之前要注意 lastIndex(用 matchAll 或每次重新建立)。
 */
export const IMPORT_RE =
  /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g

/**
 * 箭頭函式的宣告:`const 名字 = (參數) => {`。
 *
 * **放在這裡是因為有兩條規則要用**(頁面包裝 action 的命名、action 自己的形狀)。
 * 兩邊各寫一份的話,函式的寫法多一種變化時只會補到其中一邊。
 */
export const ARROW_FN_RE = /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g

/** 遮蔽 template 的 HTML 註解 */
export const maskHtmlComments = (text) => maskBy(text, /<!--[\s\S]*?-->/g)

/**
 * 遮蔽 `//` 開頭的行註解。
 *
 * 在引號裡的不算 —— 網址的 `https://` 也長這樣,遮下去會把那一行後半段
 * (常常還有別的程式碼)一起吃掉。
 */
const maskLineComments = (text) =>
  text
    .split('\n')
    .map((line) => {
      const at = line.indexOf('//')
      if (at === -1 || isInsideString(line, at)) return line

      return line.slice(0, at) + ' '.repeat(line.length - at)
    })
    .join('\n')

/**
 * 遮蔽這種檔案裡的每一種註解。
 *
 * 註解是寫給人讀的,裡面**舉例寫出一段不合規範的程式碼是正常的** ——
 * 「這裡不要寫成 `text-sm`」這句說明本身就含有那個名字。拿規則去檢查它,
 * 報出來的那一筆沒有人能修:照著改等於把說明改壞。
 *
 * 一次處理三種註解,依副檔名決定要遮哪幾種:
 *
 *   `/* *\/`      樣式與程式共用的區塊註解,一律遮
 *   `//`          程式的行註解
 *   `<!-- -->`    畫面區段的註解
 *
 * 先遮區塊再遮行 —— 反過來的話,區塊註解裡如果有 `//`,
 * 那一行後半段會先被當成行註解處理,區塊的結尾就找不到了。
 *
 * 需要讀註解的檢查不要用這個(豁免標記、色票的色相分類標籤、
 * 文字寫法那幾條檢查的正是註解本身)。
 */
export const maskComments = (rel, text) => {
  let out = maskCssComments(text)

  if (/\.(vue|html)$/i.test(rel)) out = maskHtmlComments(out)
  if (/\.(vue|js|mjs|cjs|ts)$/i.test(rel)) out = maskLineComments(out)

  return out
}

/**
 * 取出 .vue 的畫面區段(`<template>` 裡面那一段)與它在整份檔案裡的位置。
 *
 * 位置要一起回傳 —— 違規的行號是對整份檔案算的,只拿內容的話,
 * 報出來的行號會少掉畫面區段前面那幾行。
 *
 * 沒有畫面區段(純邏輯的 .vue、或根本不是 .vue)時回 null。
 */
export const templateRangeOf = (text) => {
  const start = text.search(/<template[^>]*>/)
  if (start === -1) return null

  const openEnd = text.indexOf('>', start) + 1
  const close = text.lastIndexOf('</template>')
  if (close === -1) return null

  return { body: text.slice(openEnd, close), offset: openEnd }
}

/**
 * 把畫面區段的內容遮成空白,只留裡面的註解。
 *
 * 畫面上的文字是內容本身(標題、按鈕上的字、給使用者看的提示),
 * 那裡出現什麼符號由設計與文案決定;寫在那裡的**註解**則是給接手的人讀的,
 * 與程式碼旁邊的註解沒有兩樣,該守的規矩一樣要守。
 *
 * 遮成等長空白而不是刪掉,行號與欄位都不會跑掉 ——
 * 違規要指到正確的那一行,刪掉之後行號就對不上原始檔案了。
 */
export const maskTemplateContent = (text) => {
  const tpl = templateRangeOf(text)
  if (!tpl) return text

  let kept = ''
  let last = 0

  for (const m of tpl.body.matchAll(/<!--[\s\S]*?-->/g)) {
    kept += tpl.body.slice(last, m.index).replace(/[^\n]/g, ' ') + m[0]
    last = m.index + m[0].length
  }

  kept += tpl.body.slice(last).replace(/[^\n]/g, ' ')

  return text.slice(0, tpl.offset) + kept + text.slice(tpl.offset + tpl.body.length)
}

/**
 * 這個位置在不在字串裡。
 *
 * 用來分辨「程式碼寫出來的資料」與「寫給人讀的註解」——
 * 前者一定包在引號裡,後者不是。兩種用途都走這一份:
 * 裝飾符號那條要分辨「印出來的訊息」與「註解」,
 * 豁免標記要分辨「寫成資料的那串字」與「真的在宣告豁免」。
 *
 * 只看同一行:跨行的模板字串會被判成不在字串裡,那個方向是「多報一筆」,
 * 看到的人自己判斷得出來;反過來放行才危險 —— 漏掉的違規不會有人發現。
 *
 * 跳脫過的引號(`\'`)不算開頭或結尾,否則一句 `don\'t` 會把後面整行
 * 都算成字串外,那一行的符號就全部漏掉。
 */
export const isInsideString = (line, index) => {
  const quotes = { "'": 0, '"': 0, '`': 0 }

  for (let i = 0; i < index; i += 1) {
    const char = line[i]
    if (char === '\\') {
      i += 1
      continue
    }
    if (char in quotes) quotes[char] += 1
  }

  return Object.values(quotes).some((count) => count % 2 === 1)
}

/**
 * 這份檔案有沒有標某一條規則的豁免。
 *
 * 標記的形狀是 `lint-<規則>-exempt: 理由`,而且**一定要寫在註解裡** ——
 * CSS 的區塊註解、JS 的行註解、HTML 的註解都算。整份檔案跳過那一條檢查。
 *
 * **只認註解裡的那一份,是因為程式碼本身也會寫出這串字。**
 * 定義比對式的那一行(`const XXX_EXEMPT_RE = /lint-xxx-exempt/`)就含有它,
 * 驗證案例的內容裡也會整段寫出一個標記當作要檢查的資料 ——
 * 只看「整份文字有沒有出現」的話,定義規則的那支檔案永遠豁免自己,
 * 於是那條規則對它完全失效,而且不會有任何徵兆。
 *
 * 判斷要同時滿足兩件事:
 *
 *   標記前面有註解起頭   `//`、`/*`、`<!--`,或跨行註解裡以 `*` 起頭的那種行
 *   標記不在字串裡       在引號中的是資料,不是宣告
 *   標記不在範例區塊裡   說明文件舉例時會整段寫出一個標記,那是給人看的範例
 *
 * 少了那兩個條件的話,把一整個標記寫進字串
 * (`` const probe = `<!-- lint-xxx-exempt: … -->` ``)、
 * 或在說明文件裡舉一個標記當範例,都會被當成宣告 ——
 * 前面確實有註解的起頭,只是它屬於字串或範例的內容。
 * 那支檔案會整份被放行,而放行的當下沒有任何訊息:
 * 一份在說明「這條規則抓什麼」的文件,會因為舉了例子而讓自己不被那條規則檢查。
 *
 * 跨行註解中間、又不是以 `*` 起頭的那種行會被判成不在註解裡 ——
 * 那個方向是「照常檢查」,看到的人自己判斷得出來;
 * 反過來誤放行才危險,漏掉的違規不會有人發現。
 *
 * 判準收在這裡一份 —— 每條規則各寫一次的話,改了一處忘了另一處,
 * 那幾條的豁免行為就開始不一樣,而不一樣的那天不會有人通知你。
 */
export const hasExemptMark = (text, name) => {
  const markRe = new RegExp(`lint-${name}-exempt`)

  /* 範例區塊(三個反引號圍起來的那一段)裡的是給人看的範例,不是宣告。
     圍欄那一行自己也算在內 —— 它本來就不會有標記,算進去只是少一個邊界情況。 */
  let inExample = false

  return text.split('\n').some((line) => {
    if (/^\s*```/.test(line)) {
      inExample = !inExample
      return false
    }
    if (inExample) return false

    const at = line.search(markRe)
    if (at === -1) return false

    // 在引號中的那一份是資料(例如驗證案例的內容),不是在宣告豁免
    if (isInsideString(line, at)) return false

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
 * 每一個資源資料夾底下再分的那一層,名字收成一份。
 *
 * **store 分層時,檔名對應的是這一層。** 一個資源大到要拆成好幾支 store 的時候
 * (買、租、會員各有好幾個畫面),store 會放進子資料夾,而檔名指的是那個資源
 * 底下的某一個畫面 —— 拿它去比對第一層的話一個都對不上,
 * 那種專案的每一支 store 都會被報「沒有對應的資料夾」。
 *
 * 只收資料夾名,不管它在哪一個資源底下 —— store 的子資料夾名不一定等於
 * 頁面的第一層(把認證相關的幾支聚成一個資料夾是常見的做法),
 * 綁著比對的話那種聚法就都成了違規,而它們其實都對得上某一個畫面。
 *
 * 底線開頭的不算 —— 那是放元件的地方,不是畫面。
 */
export const listViewSubFolders = (root) => {
  const resources = listViewResources(root)
  if (!resources) return null

  const names = new Set()

  for (const { abs } of resources) {
    for (const item of fs.readdirSync(abs, { withFileTypes: true })) {
      if (item.isDirectory() && !item.name.startsWith('_')) names.add(item.name)
    }
  }

  return names
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
 * 這支 css 是不是某個元件自己的樣式。
 *
 * **元件的樣式放在元件資料夾底下的那個子資料夾裡**(名稱見設定的
 * MODULE_CSS_DIR_NAME),與它的 .vue 在一起。一支元件要帶走的東西
 * (畫面、樣式、變數)在同一個資料夾,複製到別的專案時不會漏掉半邊,
 * 刪掉元件時也不會在別的目錄留下沒有人用的樣式。
 *
 * **這個判斷只看位置**,不看檔名 —— 一個模組拆幾支是那個模組自己的事
 * (版型一支、變數一支、子元件各一支都可以)。
 *
 * **但檔名不是完全自由的:變數檔一律以 `variables.css` 結尾。**
 * 那不是這裡管的,是載入順序那條規則(moduleOrder)靠這個名字認出
 * 「哪幾支是變數檔」—— 名字不對的話它會被當成版型檔,
 * 而「變數要先定義完、版型才取用」這件事對它就不再檢查。
 * 取用當下變數還沒定義,吃到的是空值,而畫面上只是那一段樣式沒有生效。
 */
export const isModuleCss = (rel) =>
  rel.endsWith('.css') &&
  rel.includes(`/${MODULE_CSS_DIR_NAME}/`) &&
  COMPONENT_DIRS.some((dir) => rel.startsWith(`${dir}/`))

/**
 * 這支 css 是不是跨模組共用的樣式。
 *
 * 有些變數兩個以上的模組都要用(表單的尺寸級距、日期選擇器也吃同一份)。
 * 那種東西不屬於任何一個元件 —— 放進其中一個元件的資料夾,
 * 另一個元件就得去 import 別人的檔案,而刪掉那個元件時會連帶弄壞它。
 * 所以共用的那幾支留在集中目錄。
 *
 * **與 isModuleCss 的界線:問「這支屬於哪一個元件」。**
 * 答得出來就放那個元件的資料夾,答不出來(兩個以上在用)才放集中目錄。
 * 兩種位置各有各的規則範圍:元件的樣式要檢查 class 前綴(它有 class),
 * 共用變數只檢查變數怎麼命名(它沒有 class)。
 */
export const isSharedCss = (rel) => rel.endsWith('.css') && rel.startsWith(`${CSS_MODULES_DIR}/`)

/**
 * 這支 css 是不是模組樣式(兩種位置都算)。
 *
 * 變數怎麼命名、尺寸值要不要分斷點這幾條,元件自己的樣式與跨模組共用的變數
 * 都要守 —— 那些判斷與「這支屬於哪一個元件」無關。
 *
 * **每條規則各寫一次「兩種位置」的話,加第三種位置時要改的地方散在各處**,
 * 而漏掉的那一條不會報錯,只是從此不再檢查那個位置。
 *
 * 只管元件自己那一種的規則(class 前綴)直接用 isModuleCss ——
 * 共用變數檔沒有 class,拿前綴去檢查它只會報一整片。
 */
export const isModuleStyle = (rel) => isModuleCss(rel) || isSharedCss(rel)

/**
 * 這支 css 屬於哪一個元件 —— 取樣式那一層外面的資料夾名。
 *
 * 元件的樣式收在元件資料夾底下的子資料夾裡,所以模組名是它的上一層:
 * 一個叫 mForm 的元件,它樣式資料夾裡的每一支 css 都屬於 mForm。
 *
 * 不在那種位置時回 null,由呼叫端跳過 ——
 * 推不出它屬於誰,猜一個的話會用錯的前綴去報一整片。
 */
export const moduleFolderOf = (rel) => {
  const segments = rel.split('/')
  const at = segments.lastIndexOf(MODULE_CSS_DIR_NAME)

  return at > 0 ? segments[at - 1] : null
}

/**
 * 變數的定義:`--x:` 與 `'--x':` 兩種形狀。
 *
 * 第二個捕獲是它的值(到分號或區塊結尾為止)。
 *
 * 三個地方問這一件事:哪些變數被定義過、某個變數裝的是長度還是顏色、
 * 以及「這個專案在來源的變數檔裡多加了什麼」。各寫一份比對式的話,
 * 多認一種寫法時只會改到其中一邊,而漏掉的那幾支從此不被算進去。
 */
export const VAR_DEFINE_RE = /(--[\w-]+)['"]?\s*:\s*([^;}]*)/g

/**
 * 讀一份封存下來的清單(來源產生、跟著複製出去的那種 json)。
 *
 * 檔案不在、或內容壞掉時一律回 null —— 呼叫端看到 null 就整條不比對。
 * 那是刻意的:還沒封存過的專案(剛接手的舊專案)一律報「每一項都不一致」
 * 只會讓人把整條規則關掉,而清單壞掉時報出來的每一筆也都是假的。
 *
 * 兩種清單都走這一份(共用規則的指紋、元件介面的名單)——
 * 各寫一次的話,其中一邊改了「壞掉時怎麼辦」,另一邊還是舊的,
 * 而兩條規則會在同一種情況下表現不一樣。
 */
export const readSealedJson = (root, relFile) => {
  const abs = path.join(root, ...relFile.split('/'))
  if (!fs.existsSync(abs)) return null

  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'))
  } catch {
    return null
  }
}

/** 寫一份封存清單,格式與上面那支讀的一致(尾端留一個換行,diff 才乾淨) */
export const writeSealedJson = (root, relFile, data) => {
  const abs = path.join(root, ...relFile.split('/'))

  fs.writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/** mForm → m-form;mDatePicker → m-date-picker */
export const toKebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * 方括號寫法同時有「長度」與「顏色」兩種版本的那幾個 utility。
 *
 *   text-[--gray-6b]   color        text-[16px]    font-size
 *   border-[--white]   border-color border-[2px]   border-width
 *   outline-[--white]  outline-color outline-[2px] outline-width
 *   ring-[--white]     ring-color   ring-[2px]     ring-width
 *
 * **值寫成變數時建置工具分不出是哪一種,一律當成顏色**,
 * 所以長度那一邊要在值前面標出型別(`text-[length:--x]`)。
 *
 * 這份名單有兩個地方在問:「這個值該不該標型別」,
 * 以及「同一個斷點下這兩個 class 是不是蓋掉同一個屬性」
 * (`text-[--紅色]` 與 `text-[18px]` 是兩個屬性,不是覆寫)。
 * 名單只有這一份 —— 兩邊各列一次的話,加了一個而另一邊沒加,
 * 那一個在其中一條規則裡會開始判錯,而兩種判錯都沒有徵兆。
 *
 * **`divide-` 不在名單裡。** 它只有顏色版本:`divide-[2px]` 產出的是
 * `border-color: 2px`(無效的值),標了 `divide-[length:--x]` 也一樣是
 * `border-color` —— 寬度要寫成 `divide-x-[2px]`,那是另一個 utility 名。
 * 放進來的話會報「這裡該標 length:」,而照著標了完全沒有作用。
 */
export const DUAL_TYPE_UTILITIES = new Set(['text', 'border', 'outline', 'ring'])

/**
 * 去掉 variant 前綴(`p:` / `m:` / `hover:` / `group-hover:` …),回傳 utility 本體。
 *
 * **只切方括號外的冒號** —— 值裡面也會有:`text-[length:--x]` 的型別提示、
 * `bg-[url(a:b)]` 的網址。連值一起切的話那個 class 會被切成 `--x]`,
 * 認不出 utility 是什麼,於是**照著規範標了型別的那些整批不被檢查**。
 *
 * 好幾條規則都要問「這個 class 的前綴到哪裡為止」:是不是 tailwind 的 utility、
 * 斷點有沒有蓋掉基底、該不該標型別。判準只有這一份 ——
 * 各寫一次的話,其中一邊修好了另一邊還是舊的,而兩種判錯都沒有徵兆。
 */
export const stripVariants = (cls) => {
  let depth = 0
  let last = 0

  for (let i = 0; i < cls.length; i += 1) {
    const c = cls[i]

    if (c === '[') depth += 1
    else if (c === ']') depth -= 1
    else if (c === ':' && depth === 0) last = i + 1
  }

  return cls.slice(last)
}

/** 去掉 variant 前綴與 `!` 重要標記,回傳 utility 本體 */
export const utilityBodyOf = (rawClass) =>
  stripVariants(rawClass.replace(/^!/, '')).replace(/^!/, '')

/**
 * utility 本體裡「名字」是哪一段 —— `px-[20px]` → `px`、`inset-x-0` → `inset-x`。
 *
 * 名字與值的交界靠值的開頭認:方括號、數字,或 `auto` / `full` / `px` / `screen`
 * 那幾個固定字。名字本身也含連字號(`inset-x`、`gap-y`),
 * 所以不能只切第一個連字號。
 *
 * 切不出來的回 null —— `flex`、`items-center` 那種沒有「值」的 utility。
 *
 * 兩條規則問這一段:「這兩個 class 是不是同一個屬性」與「這個值該不該標型別」。
 * 各寫一份比對式的話,名字帶連字號的那些會在其中一條裡開始切錯,而切錯沒有徵兆。
 */
export const utilityNameFrom = (body) =>
  body.match(/^(-?[a-z]+(?:-[a-z]+)*?)-(?:\[|\d|auto|full|px|screen)/)?.[1] ?? null

/** 畫面區段裡第一個帶前綴的靜態 class */
const COMPONENT_CLASS_RE = /class="([^"]*\bm-[a-z0-9-]+[^"]*)"/

/**
 * 這支元件自己的組件 class —— 畫面區段裡第一個帶前綴的靜態 class。
 *
 * 兩個地方問同一件事:「資料夾名對不對得上 class」要拿它比對資料夾推出的前綴,
 * 「這支樣式屬於哪一個元件」要拿 class 反查是哪一支元件 ——
 * 判斷收在這裡一份,各寫一次的話兩邊對「哪一個才是自己的 class」會開始不一樣。
 *
 * 只看畫面區段:程式那一側的字串裡也可能出現 class 名(設定物件、範例資料),
 * 那些不是這支元件掛在自己身上的。
 */
export const componentClassOf = (text) => {
  const range = templateRangeOf(text)
  if (!range) return null

  const scanned = maskHtmlComments(range.body)
  const line = COMPONENT_CLASS_RE.exec(scanned)
  if (!line) return null

  return /\bm-[a-z0-9-]+/.exec(line[1])?.[0] ?? null
}

/**
 * 資料夾名推出它的組件 class 前綴;推不出來回 null(不檢查)。
 *
 * 名字不是 `m` 開頭接大寫的話不是這套命名裡的模組 —— 猜一個的話,
 * 會拿錯的前綴去報一整片。
 *
 * 元件的 .vue 與它的樣式都靠這一份推算:樣式那側問「這支 css 屬於誰」,
 * 元件那側問「template 的 class 對不對得上資料夾」。兩邊各寫一份的話,
 * 會出現「css 過了但 template 沒過」這種自己打架的結果。
 */
export const classPrefixOf = (folderName) =>
  folderName && /^m[A-Z]/.test(folderName) ? toKebab(folderName) : null

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
 * 放行為的那一層在哪 —— 兩個設定值組出來的路徑。
 *
 * 組出來的結果收在這裡一份:兩條規則的訊息都要寫出這個位置,
 * 各組一次的話,兩個設定值的關係(誰在誰底下)就變成兩個地方各記一遍。
 */
export const ACTIONS_DIR_PATH = `${STORE_DIR}/${ACTIONS_DIR_NAME}`

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
 * 這個路徑(相對專案根)要不要檢查 —— 副檔名在範圍內,**而且不在跳過的目錄底下**。
 *
 * 給「自己拿到一串路徑」的那幾層用(對話提醒那層讀的是 git 列出來的改動)。
 * 整份掃描那一支走的是目錄樹,在進到資料夾之前就剪掉了,不必再問一次。
 *
 * **只問副檔名是不夠的。** 建置產物與靜態檔的副檔名與原始碼一樣,
 * 而那些不是人寫的,或是規則本來就管不到:`public/` 底下的東西
 * 吃不到專案的 css 變數(iframe 載進去的樣式),色碼只能寫死 ——
 * 那幾筆改不掉也標不掉,每次動到就報一次。
 *
 * **兩條路徑讀同一份判斷。** 各寫一次的話,同一份違規在全專案掃描是 0 筆、
 * 在存檔或送出訊息時卻報出來,而看到的人無從判斷哪一邊才對。
 */
export const isScannablePath = (rel) => isScannable(rel) && !SKIP_DIR.test(rel)

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
export const isProjectDocs = (rel) => isUnderAny(rel, [PROJECT_DOCS_DIR])

/**
 * 這支檔案在不在列出的那幾層底下 —— 比對的是從專案根算起的路徑。
 *
 * 比對路徑而不是資料夾名:名字比對會連帶跳過別處同名的資料夾,
 * 而那一處可能正是要檢查的。想排除兩個位置就列兩筆,範圍寫得出來也看得出來。
 *
 * 目錄本身與它底下的全部檔案都算。清單是空的時候一律回 false ——
 * 沒有填就是沒有要排除任何東西。
 */
export const isUnderAny = (rel, dirs) =>
  dirs.some((dir) => rel === dir || rel.startsWith(`${dir}/`))

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

/*
 * 同一支檔案在一次執行裡會被讀很多遍 —— 跨檔的索引各建各的,
 * 而規則自己的驗證每跑完一則案例就把索引全部清掉(專案裡的檔案剛被改寫,
 * 上一則建好的索引對下一則就是舊的)。清掉之後下一則又整份重掃。
 *
 * **但那幾百次重掃讀到的內容幾乎都一樣** —— 變的只有驗證自己寫出去的探測檔,
 * 專案本身那一百多支從頭到尾沒有動過。重讀一遍磁碟佔掉整趟執行的四分之三。
 *
 * 所以這裡記下「讀過的內容」與「列過的目錄」,用檔案的修改時間與大小認出它變了沒有。
 * 時間戳的精度在同一毫秒內連寫兩次時分不出來,所以寫檔的那一方
 * 要主動讓它失效(invalidateFileCache)—— 兩道一起才不會讀到上一則的內容。
 */
const contentCache = new Map()
const dirCache = new Map()

/**
 * 剛寫過這一支檔案,讓它與它所在目錄的快取失效。
 *
 * 目錄也要:新增一支檔案會改變那個目錄的清單,
 * 而只清內容的話,新建的檔案不會出現在掃描結果裡。
 */
export const invalidateFileCache = (abs) => {
  contentCache.delete(abs)
  dirCache.delete(path.dirname(abs))
}

/** 讀檔;內容沒變就用上一次讀到的。讀不到回 null */
export const readTextCached = (abs) => {
  let stat

  try {
    stat = fs.statSync(abs)
  } catch {
    return null
  }

  const hit = contentCache.get(abs)

  if (hit && hit.mtimeMs === stat.mtimeMs && hit.size === stat.size) return hit.text

  const text = fs.readFileSync(abs, 'utf8')

  contentCache.set(abs, { mtimeMs: stat.mtimeMs, size: stat.size, text })

  return text
}

/** 列目錄;那個目錄沒有增減檔案就用上一次列到的 */
const readdirCached = (abs) => {
  let stat

  try {
    stat = fs.statSync(abs)
  } catch {
    return []
  }

  const hit = dirCache.get(abs)

  if (hit && hit.mtimeMs === stat.mtimeMs) return hit.entries

  const entries = fs.readdirSync(abs, { withFileTypes: true })

  dirCache.set(abs, { mtimeMs: stat.mtimeMs, entries })

  return entries
}

/** 遞迴列出可檢查的檔案(絕對路徑) */
export const listFiles = (root, target) => {
  const abs = path.resolve(root, target)
  if (!fs.existsSync(abs)) return []
  if (fs.statSync(abs).isFile()) return isScannable(abs) ? [abs] : []

  return readdirCached(abs).flatMap((entry) => {
    const next = path.join(abs, entry.name)
    const rel = toRel(root, next)
    if (SKIP_DIR.test(rel) || isProjectDocs(rel)) return []
    return entry.isDirectory() ? listFiles(root, rel) : isScannable(next) ? [next] : []
  })
}

/*
 * 跨檔判斷用的索引(誰定義過這個 css 變數、誰從 apiDefault 還原)
 * 都是整份掃一次之後快取起來的 —— 每一支檔案各自掃全案的話會慢得離譜。
 *
 * 快取的前提是「這段期間磁碟上的檔案沒有變」。規則自己的驗證不是那樣:
 * 它一則一則把探測檔寫進專案再跑檢查,上一則建好的索引對下一則就是舊的,
 * 而舊索引的徵狀是「跨檔的那幾則案例莫名其妙地過或不過」。
 *
 * 所以每一份索引都在這裡登記自己怎麼清空,由寫檔的那一方統一呼叫。
 * 各自 export 一支清空函式的話,新增一份索引時不會有人記得去呼叫它。
 */
const scanCacheResets = []

/** 登記一份索引的清空方式;回傳值不使用,只是為了能寫在宣告旁邊 */
export const registerScanCache = (reset) => scanCacheResets.push(reset)

/** 清空全部跨檔索引 —— 專案裡的檔案在這個程序執行期間被改寫之後要呼叫 */
export const resetScanCaches = () => scanCacheResets.forEach((reset) => reset())

let storeIndexCache = null

registerScanCache(() => {
  storeIndexCache = null
})

/** const x = readonly(…) —— 但 readonly(ref(…)) 不算,那是真的會變的狀態 */
const READONLY_CONST_RE = /const\s+(\w+)\s*=\s*readonly\(\s*(?!ref\b)/g

/**
 * store 目錄的索引,兩件事一起建:
 *
 *   files     匯出名(use{名稱}Store / use{名稱}Actions)→ 它在哪一支檔案
 *   readonly  每一支檔案裡「唯讀常數」的名字
 *
 * 兩邊問的都是「這個名字在 store 那一側是什麼」,掃的是同一批檔案 ——
 * 各建一份的話,同一個專案會被走訪兩次,而且其中一份改了判準另一份不會跟著。
 *
 * 匯出名認兩種寫法:store 多半是具名匯出,actions 則常常是預設匯出、
 * 靠檔名自動注入出函式名。只認具名的話,actions 那一半永遠查不到。
 */
export const storeIndexOf = (root) => {
  if (storeIndexCache?.root === root) return storeIndexCache.index

  const files = new Map()
  const readonlyConsts = new Map()

  for (const abs of listFiles(root, STORE_DIR)) {
    if (!abs.endsWith('.js')) continue

    const rel = toRel(root, abs)
    const base = path.basename(rel, '.js')
    if (/^use[A-Z]/.test(base)) files.set(base, rel)

    try {
      const text = readTextCached(abs)

      for (const m of text.matchAll(/export\s+const\s+(use\w+)/g)) files.set(m[1], rel)

      const names = new Set([...text.matchAll(READONLY_CONST_RE)].map((m) => m[1]))
      if (names.size) readonlyConsts.set(rel, names)
    } catch {
      // 讀不到某一支就跳過,不要因此讓整條規則失效
    }
  }

  const index = { files, readonly: readonlyConsts }
  storeIndexCache = { root, index }

  return index
}

let transitionStyleCache = null

registerScanCache(() => {
  transitionStyleCache = null
})

/**
 * 打了 api 之後一律回傳的三件。
 *
 * api 那一層與 action 那一層問的是同一件事(這三件在不在),所以只留這一份 ——
 * 兩邊各寫一次的話,有一天其中一邊加了第四件,而另一邊的訊息還在說三件。
 *
 * 三件都要:少了 status 使用端得自己判斷成功失敗,少了 data 拿不到內容,
 * 少了 config 錯誤處理時不知道是打哪一支、帶了什麼參數。
 */
export const API_RETURN_FIELDS = ['config', 'status', 'data']

/**
 * 一層裡放「那一層的主資料」的兩個欄位名 —— 名字由 store 規範決定。
 *
 * 兩條規則都要問同一件事,所以只留這一份:一條要知道「哪些欄位裡的名字是
 * 後端給的」,另一條要知道「哪個欄位是主角、不必寫進 action 名字裡」。
 */
export const API_DATA_CONTAINERS = ['apiData', 'data']

/**
 * 轉場的那六個後綴 —— 畫面區段寫 `<Transition name="…">`,
 * 框架自動在名字後面接這幾個,樣式那一側定義的就是接好的名字。
 *
 * 它們不能收斂成模組前綴:名字與畫面區段寫的那個 name 是一組的,
 * 改了樣式這一側就對不上,而轉場失效不會報錯,只是動畫沒了。
 *
 * 後綴由框架定義,與專案無關,所以寫在這裡,不進專案設定。
 */
export const TRANSITION_SUFFIXES = [
  '-enter-from',
  '-enter-active',
  '-enter-to',
  '-leave-from',
  '-leave-active',
  '-leave-to',
]

/** 這個 class 是不是轉場的其中一個狀態 */
export const isTransitionClass = (cls) => TRANSITION_SUFFIXES.some((s) => cls.endsWith(s))

/* 後綴清單組出來的比對式 —— 清單改了這裡跟著改,不會有第二份要同步 */
const TRANSITION_CLASS_RE = new RegExp(
  `\\.([\\w-]+)(?:${TRANSITION_SUFFIXES.map((s) => s.replace(/-/g, '\\-')).join('|')})\\b`,
  'g'
)

/**
 * 這份樣式定義了哪幾組轉場 —— 回傳的是名字(不含後綴)。
 *
 * 判斷「元件自己寫了轉場」與「建立轉場名到檔案的索引」都問同一件事,
 * 所以只留這一份。
 */
export const transitionNamesInCss = (text) =>
  new Set([...maskCssComments(text).matchAll(TRANSITION_CLASS_RE)].map((m) => m[1]))

/**
 * 轉場名 → 定義它的樣式檔,掃全專案的 `.css` 建一份。
 *
 * 轉場的樣式常常收在一支共用檔案裡,由進入點一次載入,而不是跟著元件的資料夾走。
 * 那支檔案沒有一起複製過去的話,元件搬過去**不會報錯也不會少畫面** ——
 * 只是切換的當下沒有漸變,直接跳。要找原因得先想到「動畫是 css 在做的」,
 * 再想到那支 css 根本不在這個專案裡。
 *
 * 只掃 `.css`:定義在元件自己 `<style>` 裡的轉場本來就跟著元件走,不必列。
 *
 * 路徑是掃出來的,所以是那個專案自己的擺法 —— 目錄層數不同的專案
 * (有沒有 `src/` 那一層)各自算各自的,規則這一側不寫死。
 */
export const transitionStyleIndexOf = (root) => {
  if (transitionStyleCache?.root === root) return transitionStyleCache.index

  const index = new Map()

  for (const target of SCAN_TARGETS) {
    for (const abs of listFiles(root, target)) {
      if (!abs.endsWith('.css')) continue

      const rel = toRel(root, abs)

      try {
        for (const name of transitionNamesInCss(readTextCached(abs) ?? '')) {
          if (!index.has(name)) index.set(name, rel)
        }
      } catch {
        // 讀不到某一支就跳過,不要因此讓整條規則失效
      }
    }
  }

  transitionStyleCache = { root, index }

  return index
}

/**
 * 一支元件被自動註冊成什麼標籤名。
 *
 * 名字由「資料夾 + 檔名」接起來,`Index` 那一層不算:
 *
 *   <元件目錄>/mPopup/Index.vue      MPopup
 *   <元件目錄>/mForm/CheckBox.vue    MFormCheckBox
 *   <元件目錄>/common/mPopup/…       CommonMPopup
 *
 * 這一份與建置設定裡那一份是同一套規則,但沒有辦法共用 ——
 * 那一份是建置工具的設定(每個專案的建置工具還不一樣),這一份是檢查工具的。
 * 兩邊哪天不一致的話,這裡算出來的標籤名會對不上任何使用端,
 * 於是靠它的檢查一條都命中不了,而畫面上顯示通過。
 */
export const componentTagOf = (rel) => {
  const dir = COMPONENT_DIRS.find((one) => rel.startsWith(`${one}/`))
  if (!dir || !rel.endsWith('.vue')) return null

  const segments = rel
    .slice(dir.length + 1)
    .replace(/\.vue$/, '')
    .split('/')

  // 資料夾名就是它的名字,Index 不進標籤名
  if (segments.at(-1) === 'Index') segments.pop()
  if (!segments.length) return null

  /* 字母與數字以外的一律當成分隔:資料夾名可能帶連字號或底線(`my-thing`),
     只把首字轉大寫的話會留下那些符號,而標籤名裡不會有它們 ——
     算出來的名字對不上任何使用端,靠它的檢查從此一條都命中不了。 */
  const pascal = (one) =>
    one
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .replace(/(?:^|\s)([a-zA-Z0-9])/g, (_, char) => char.toUpperCase())
      .replace(/\s+/g, '')

  return segments.map(pascal).join('')
}

/** 一支 .vue 宣告了哪些事件;沒有 defineEmits 的回 null(那與「宣告了空的」不同) */
export const declaredEmitsOf = (text) => {
  const at = /defineEmits\s*\(\s*\[/.exec(text)
  if (!at) return null

  const body = text.slice(at.index + at[0].length)
  const end = body.indexOf(']')
  if (end < 0) return null

  return [...body.slice(0, end).matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
}

let componentEmitsCache = null

registerScanCache(() => {
  componentEmitsCache = null
})

/**
 * 全案的元件各自宣告了哪些事件 —— 標籤名對到那份清單。
 *
 * 只收「有寫 defineEmits」的那些。沒寫的元件不進這份索引,
 * 而不是記成空清單:那種元件把所有事件都往根元素透傳(fallthrough),
 * 使用端綁什麼都是正當的,記成空的會讓每一個綁定都變成違規。
 */
export const componentEmitsIndexOf = (root) => {
  if (componentEmitsCache?.root === root) return componentEmitsCache.index

  const index = new Map()

  for (const dir of COMPONENT_DIRS) {
    for (const abs of listFiles(root, dir)) {
      if (!abs.endsWith('.vue')) continue

      const tag = componentTagOf(toRel(root, abs))
      if (!tag || index.has(tag)) continue

      try {
        const emits = declaredEmitsOf(readTextCached(abs) ?? '')
        if (emits) index.set(tag, emits)
      } catch {
        // 讀不到某一支就跳過,不要因此讓整條規則失效
      }
    }
  }

  componentEmitsCache = { root, index }

  return index
}

let componentTagCache = null

registerScanCache(() => {
  componentTagCache = null
})

/**
 * 全案的標籤名 → 那支元件的資料夾。
 *
 * 「畫面上寫的這個標籤是誰」只能由這份索引回答,**不能從資料夾反推**:
 * 一個資料夾底下不只一支 .vue,而子檔各有自己的標籤名
 * (`mForm/` 底下的 `Radio.vue` 在畫面上是 `MFormRadio`,不是 `MForm`)。
 * 拿資料夾接上 `Index.vue` 去算的話,只還原得出母體那一個名字,
 * 用到子元件的每一支都會被判成「這個標籤不屬於任何相依」——
 * 而那全是誤報,清單其實是對的。
 *
 * 值是資料夾,因為要帶走的單位是整個資料夾,不是那一支檔案。
 *
 * 同名時第一支贏 —— 兩支算出同一個標籤的話,畫面上那個名字本來就有歧義,
 * 這裡挑哪一支都不會比較對。
 */
export const componentTagIndexOf = (root) => {
  if (componentTagCache?.root === root) return componentTagCache.index

  const index = new Map()

  for (const dir of COMPONENT_DIRS) {
    for (const abs of listFiles(root, dir)) {
      if (!abs.endsWith('.vue')) continue

      const rel = toRel(root, abs)
      const tag = componentTagOf(rel)

      if (tag && !index.has(tag)) index.set(tag, path.dirname(rel))
    }
  }

  componentTagCache = { root, index }

  return index
}

/**
 * 每一段 import 的起訖行 —— 一段 import 常常跨好幾行(具名匯入一行一個)。
 *
 * 用「以 import 開頭的行」當作一段的話,插入點會落在某一段的中間,
 * 那支檔案會整支壞掉 —— 語法錯誤,而且是自動修正造成的。
 */
const importBlocksOf = (lines) => {
  const blocks = []
  let start = -1
  let depth = 0

  lines.forEach((line, i) => {
    if (start === -1) {
      if (!/^\s*import\b/.test(line)) return
      start = i
      depth = 0
    }

    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length

    // 括號收完、而且這一行是整段的結尾(有 from '…' 或就是 import '…')
    if (depth <= 0 && /from\s*['"][^'"]+['"]|^\s*import\s*['"][^'"]+['"]/.test(line)) {
      blocks.push({ start, end: i })
      start = -1
      depth = 0
    }
  })

  return blocks
}

/**
 * 補上一支共用函式的 import —— 已經有就原樣回傳。
 *
 * 自動修正把某個寫法換成共用函式之後,那支函式一定要 import 得到,
 * 否則整支檔案會因為找不到它而壞掉 —— 比不修還糟。
 *
 * 三種情況:已經 import 過(不動)、同一支來源已經 import 別的東西
 * (加進那一行的大括號裡)、都沒有(放在最後一行 import 之後)。
 */
export const withNamedImport = (text, name, source) => {
  const lines = text.split('\n')
  const blocks = importBlocksOf(lines)
  const body = blocks.map((b) => lines.slice(b.start, b.end + 1).join('\n')).join('\n')

  if (new RegExp(`\\b${name}\\b`).test(body)) return text

  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const fromSource = new RegExp(`from\\s*['"]${escaped}['"]`)

  // 同一支來源已經 import 別的東西時,加進那一段的大括號裡
  const same = blocks.find((b) => {
    const text = lines.slice(b.start, b.end + 1).join('\n')
    return fromSource.test(text) && text.includes('{')
  })

  if (same) {
    const at = lines.slice(same.start, same.end + 1).findIndex((line) => line.includes('{'))
    const i = same.start + at
    lines[i] = lines[i].replace(/\{\s*/, `{ ${name}, `)
    return lines.join('\n')
  }

  const statement = `import { ${name} } from '${source}'`
  const last = blocks.at(-1)

  if (!last) {
    // 一行 import 都沒有的 .vue —— 放在 <script> 之後;連那個都沒有就不動
    const scriptLine = lines.findIndex((line) => /<script\b/.test(line))
    if (scriptLine === -1) return text
    lines.splice(scriptLine + 1, 0, statement)
  } else {
    lines.splice(last.end + 1, 0, statement)
  }

  return lines.join('\n')
}

/** 選擇器行裡的 class token(含 CSS escape 的 \-\- 寫法) */
const CLASS_TOKEN_RE = /\.((?:\\.|[\w-])+)/g

/**
 * 一支 css 的選擇器裡出現過哪些 class。
 *
 * 回傳 `[{ cls, line }]` —— class 名(escape 已還原)與它在第幾行。
 *
 * 只從**選擇器**取,三種東西一律不算:
 *
 *   宣告區塊裡的值    `opacity 0.3s,` 的 `.3s` 不是 class
 *   括號裡的續行      `linear-gradient(142.26deg,` 的 `.26deg` 也不是
 *   附加在自己後面的  `&.scrollbar` 是「同時掛著什麼」的條件,不是在定義它
 *
 * 兩個地方要問同一件事:模組 css 只能寫自己那組 class(看的是「這裡定義了誰」),
 * 以及元件寫的 class 有沒有對應的樣式(看的是「誰被定義過」)。
 * 各寫一份的話,其中一邊修了誤判、另一邊沒修,兩條規則就開始對同一份檔案講不同的話。
 */
export const selectorClassesOf = (raw) => {
  const text = maskCssComments(raw)
  const found = []

  let depth = 0
  let inDecl = false

  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim()
    const inValue = depth > 0

    depth += (line.match(/\(/g) ?? []).length - (line.match(/\)/g) ?? []).length
    if (depth < 0) depth = 0

    if (inValue) return

    if (inDecl) {
      if (line.endsWith(';') || line.endsWith('}')) inDecl = false
      return
    }

    if (!/[{,]\s*$/.test(line) || line.startsWith('@')) {
      if (line.includes(':') && !line.endsWith('{') && !line.endsWith(';')) inDecl = true
      return
    }

    for (const m of line.matchAll(CLASS_TOKEN_RE)) {
      const prev = m.index > 0 ? line[m.index - 1] : ''
      if (prev && !/[\s>+~,(]/.test(prev)) continue

      found.push({ cls: m[1].replace(/\\/g, ''), line: i + 1 })
    }
  })

  return found
}
