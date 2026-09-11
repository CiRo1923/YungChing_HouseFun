// CSS 規範的判斷邏輯。五層守門(dev server / 編輯器存檔 / AI 寫檔 / 對話 / commit)
// 全部呼叫這裡的 lintFile,判斷只寫一份。
//
//   規則 color      顏色一律用色票變數,不得硬寫色碼
//   規則 colorFile  色票檔自身的命名 / 排序 / 分組歸屬
//   規則 moduleVar  模組的級距覆寫必須寫在 ***Variables.css
//
// 新增規則 = 寫一個 check 函式並加進 CHECKS。每條規則都要在 self-test.mjs 補
// 「違規要抓到」與「合法寫法不誤報」兩個案例,否則規則改壞了不會有人知道。

import fs from 'node:fs'
import path from 'node:path'
import {
  baseNameOf,
  bodyOf,
  buildColorCss,
  COLOR_CSS_PREFIX,
  COLOR_NAME_SEPARATOR,
  channelOfColorCss,
  expectedSuffix,
  hexOf,
  hueOf,
  HUE_LIST_TEXT,
  isColorCssPath,
  isRgbVar,
  isSorted,
  isSuffixNamingChecked,
  LEGACY_RGB_HINT,
  namingStyleOf,
  varIndexOf,
  withAlpha,
  loadDefinedColorVars,
  parseColorCss,
  SHARED_COLOR_CSS_PATH,
  sortDecls,
} from './color-order.mjs'
import { API_CHECKS, API_RULE_HINT, API_RULE_TITLE } from './rules-api.mjs'
import {
  CODE_CHECKS,
  CODE_RULE_HINT,
  CODE_RULE_TITLE,
  objectBodyAfter,
  styleConfigPathOf,
  tailwindThemeOf,
  topLevelKeysOf,
} from './rules-code.mjs'

// 存檔時的自動排序 —— 判斷與修正都在 rules-code.mjs,這裡只轉出去
export { onSortComposables, onSortImports } from './rules-code.mjs'

// 存檔時把進入頁面要拿的資料包成一起發出 —— 判斷與修正都在 rules-page.mjs
export { onWrapMountedCalls } from './rules-page.mjs'
import { GLOBAL_CHECKS, GLOBAL_RULE_HINT, GLOBAL_RULE_TITLE } from './rules-global.mjs'
import { PAGE_CHECKS, PAGE_RULE_HINT, PAGE_RULE_TITLE } from './rules-page.mjs'
import { STORE_CHECKS, STORE_RULE_HINT, STORE_RULE_TITLE } from './rules-store.mjs'
import {
  BREAKPOINTS,
  COLOR_CSS_DIR,
  COMPONENTS_DIR,
  CSS_MODULES_DIR,
  SHARED_MODULE_VARIABLES,
  TAILWIND_THEME_OVERRIDES,
  isInSrc,
  isProjectDocs,
  hasExemptMark,
  issueOf,
  lineNoOf,
  toRel,
} from './shared.mjs'

const MODULES_PREFIX = `${CSS_MODULES_DIR}/`

// 走訪與共用工具都在 shared.mjs —— 全站規範那支也要用,擺這裡會變成循環相依
// isWarn 也轉出去 —— 「哪些違規只是建議、不擋」的判斷五層守門共用同一份,
// 各層自己比對 level 字串的話,level 一旦增加新的值,各層的行為就開始不一致
// 「有哪些共同前提、有哪些寫法規範」也從這裡轉出 —— 那兩份清單由目錄長出來,
// 對話層才不必自己維護一份會過時的副本
export {
  PENDING_CACHE_FILE,
  SCAN_TARGETS,
  isScannable,
  isWarn,
  listConventionRules,
  listConventionSkills,
  listFiles,
  toRel,
} from './shared.mjs'


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
 * 註解掉的程式碼是死的 —— 它不會產生任何樣式,拿規範去檢查它沒有意義,
 * 而且會讓人以為某一行有問題,打開檔案才發現那一段根本沒有作用。
 *
 * 需要讀註解的檢查不要用這個(豁免標記、色票的色相分類標籤、
 * 文字寫法那幾條檢查的正是註解本身)。
 */
const maskCssComments = (text) => maskBy(text, /\/\*[\s\S]*?\*\//g)

/** 遮蔽 template 的 HTML 註解 */
const maskHtmlComments = (text) => maskBy(text, /<!--[\s\S]*?-->/g)

/** .vue 的 <style> 區塊範圍(不含標籤);非 .vue 回傳整份 */
const styleRanges = (text, isVue) => {
  if (!isVue) return [{ start: 0, end: text.length }]

  const ranges = []
  for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const start = m.index + m[0].indexOf('>') + 1
    ranges.push({ start, end: start + m[1].length })
  }
  return ranges
}

// --- 規則 color:硬寫色碼 ----------------------------------------------------
//
// 掃描範圍與既有的 PreToolUse hook 一致:
//   .css  → 全文
//   .vue  → <style> 區塊,外加 template 的 tailwind arbitrary value(text-[#333])
//
// 不抓:色票檔本身、hexToRgb() 那行(色票的 -rgb 定義寫法)、
//       JS 物件內的顏色(送往 LINE Flex 等外部平台,CSS 變數在那裡無效)。

const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/
const RGB_NUM_RE = /\brgba?\(\s*[\d.]/
const ARBITRARY_HEX_RE = /-\[#(?:[0-9a-fA-F]{3,8})\]/g

const checkLiteralColor = ({ rel, text, isVue, definedVars }) => {
  if (isColorCssPath(rel)) return []
  if (!/\.(css|vue)$/i.test(rel)) return [] // .js 的色值多半是送外部平台用的,不在此限

  const issues = []

  const hintOf = (hex) => {
    const known = definedVars?.get(hex.toLowerCase())?.find((v) => !v.isRgb)
    return known ? ` —— 色票已有 var(${known.name})` : ' —— 請先到色票檔建立變數再改用 var(--xxx)'
  }

  for (const { start, end } of styleRanges(text, isVue)) {
    const seg = maskCssComments(text.slice(start, end))
    const base = lineNoOf(text, start)

    seg.split('\n').forEach((raw, i) => {
      /*
       * hexToRgb() 是已廢除的寫法,但不自動轉 —— 轉過去要決定新變數叫什麼、
       * 放哪一支色票,那是判斷題。報出來讓人決定,回「修正」或「好」再處理。
       */
      if (/hexToRgb\s*\(/.test(raw)) {
        issues.push(
          issueOf(rel, base + i, 'color', `hexToRgb() 已不使用 —— ${LEGACY_RGB_HINT}`)
        )
        return
      }

      const hex = raw.match(HEX_RE)
      if (hex) {
        issues.push(issueOf(rel, base + i, 'color', `硬寫色碼 ${hex[0]}${hintOf(hex[0])}`))
        return
      }

      if (RGB_NUM_RE.test(raw)) {
        issues.push(issueOf(rel, base + i, 'color', `rgb/rgba 直接寫數值 —— ${LEGACY_RGB_HINT}`))
      }
    })
  }

  // template 的 arbitrary value:text-[#333] / bg-[#fff]
  if (isVue) {
    const templateEnd = text.search(/<style\b/i)
    const scope = maskHtmlComments(templateEnd === -1 ? text : text.slice(0, templateEnd))

    for (const m of scope.matchAll(ARBITRARY_HEX_RE)) {
      const hex = m[0].slice(m[0].indexOf('#'), -1)
      issues.push(
        issueOf(
          rel,
          lineNoOf(text, m.index),
          'color',
          `tailwind arbitrary value 硬寫色碼 ${m[0]}${hintOf(hex)}`
        )
      )
    }
  }

  return issues
}

// --- 規則 colorFile:色票檔自身 ----------------------------------------------

/** 色票的值就是一個色碼:3、4、6 或 8 碼,前面一個 # */
const PURE_HEX_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

const checkColorFile = ({ rel, text }) => {
  if (!isColorCssPath(rel)) return []

  const parsed = parseColorCss(text)
  if (!parsed) return [issueOf(rel, 1, 'colorFile', '解析不出 :root 區塊,排序與命名檢查已跳過')]

  const issues = []

  /*
   * 同一份色票只能用一種命名方式,不能混。
   *
   * 兩種方式的分類來源不同:帶色相的名字是人做過的判斷(`#c09648` 寫 gold 就歸金),
   * 語意名只能從色值算(色相環上那是橘)。混在一起的話,同一份檔案裡有一半的色
   * 依人的判斷分類、另一半依色值分類,排出來的順序沒有一致的依據 ——
   * 讀的人看到金和橘夾雜,不知道該照哪一種去放新的顏色。
   *
   * 這一條要自己報:專案設定成 value 時,帶色相的那一批完全不會被其他檢查碰到,
   * 混用就成了看不見的狀態。
   */
  const { hued, semantic } = namingStyleOf(parsed.decls)

  if (hued > 0 && semantic > 0) {
    const majority = hued >= semantic ? '帶色相的名字' : '語意名'
    issues.push(
      issueOf(
        rel,
        1,
        'colorFile',
        `這份色票混了兩種命名方式(帶色相的名字 ${hued} 個、語意名 ${semantic} 個)——一份色票只能用一種,大宗是${majority},另一批要跟著改`
      )
    )
  }

  /*
   * 色票裡的 -rgb 衍生變數與 hexToRgb() 是那條廢除鏈的源頭。
   *
   * 不自動轉 —— 要先知道每一個衍生變數被用在哪幾種透明度,才能決定要建幾個
   * 8 碼變數、各自叫什麼。那是判斷題,報出來讓人決定。
   */
  for (const d of parsed.decls) {
    if (isRgbVar(d.name) || /hexToRgb\s*\(/.test(d.value)) {
      issues.push(
        issueOf(rel, d.line, 'colorFile', `${d.name} 是已廢除的 rgb 衍生變數 —— ${LEGACY_RGB_HINT}`)
      )
      continue
    }

    /*
     * 色票的值只能是一個色碼,不能是 rgba()、var() 或任何函式。
     *
     * 這不只是寫法偏好 —— 取碼命名是從色碼算出來的,值不是色碼的話那個計算
     * 得不到結果,於是**整筆的命名檢查都會被跳過**。也就是說,值寫成 rgba()
     * 之後,那一筆連名字對不對都不再有人看,而畫面上顯示的是通過。
     */
    if (!PURE_HEX_RE.test(d.value.trim())) {
      issues.push(
        issueOf(
          rel,
          d.line,
          'colorFile',
          `${d.name} 的值不是單純的色碼(${d.value.trim()})—— 色票只放色碼,${LEGACY_RGB_HINT}`
        )
      )
    }
  }

  for (const d of parsed.decls) {
    /*
     * 色相從色值算的專案不檢查命名 —— 那些專案的變數叫 --title-color 這類語意名,
     * 名字本來就不帶色相。拿「色相 + 取碼」的規則去對,會是每一個變數各報一次,
     * 而那一百多筆訊息說的是同一件事:這條規則不適用於這個專案。
     *
     * 排序仍然照跑(色相從色值算得出來),所以「彩虹順序、每類由淺到深」不受影響。
     */
    if (!isSuffixNamingChecked) continue

    const hue = hueOf(d.name, d.value)

    if (hue === null) {
      issues.push(
        issueOf(
          rel,
          d.line,
          'colorFile',
          `${d.name} 認不出色相前綴 —— 命名為「色相 + 取碼」,色相限 ${HUE_LIST_TEXT}`
        )
      )
      continue
    }

    // --white / --black 是語意名,沒有取碼後綴
    const body = bodyOf(d.name)
    if (body === hue) continue

    const suffix = body.slice(hue.length + COLOR_NAME_SEPARATOR.length)
    const expected = expectedSuffix(d.value)
    if (!expected || suffix === expected) continue

    const shown = hexOf(d.value) ? `#${hexOf(d.value)}` : d.value

    /*
     * 取碼不一致分兩種,嚴重程度差很多:
     *
     * 長度相同 —— 多半是為了避開同色系撞碼而微調取碼位置,規範允許,
     *   所以只給建議值,不斷定是錯的。
     * 長度不同 —— 形狀跟命名規則對不上(例如規則算出四碼,實際是語意名或
     *   多了分隔符)。這種不是微調,要講出來。
     *
     * 兩種分開判斷是必要的:合成一條「長度相同才報」的話,整個形狀對不上的專案
     * 會一筆都不報,看起來像是全部通過 —— 專案的色票命名慣例與設定不同時,
     * 正確的做法是調整 COLOR_SUFFIX_PICK,而不是讓檢查安靜地失效。
     */
    if (suffix.length === expected.length) {
      issues.push(
        issueOf(
          rel,
          d.line,
          'colorFile',
          `${d.name} 的取碼建議為 --${hue}${COLOR_NAME_SEPARATOR}${expected}(${shown});若為避開同色系撞碼而微調則可忽略`
        )
      )
      continue
    }

    issues.push(
      issueOf(
        rel,
        d.line,
        'colorFile',
        `${d.name} 的取碼形狀與命名規則對不上(${shown} 應為 --${hue}${COLOR_NAME_SEPARATOR}${expected});專案的取碼慣例不同時改 project-config.mjs 的 COLOR_SUFFIX_PICK`
      )
    )
  }

  if (!isSorted(text)) {
    issues.push(
      issueOf(rel, 1, 'colorFile', '排序不符規則(彩虹 + 每類由淺到深)—— 存檔或 npm run sort:color 會自動修正')
    )
  }

  return issues
}

/**
 * 跨檔比對:分組色票與共用色票撞到同一個色值。
 *
 * 只警告不自動搬 —— 搬動會牽動使用端,那是人要決定的事。
 * 這是跨檔案的檢查,不放在 lintFile 裡(單檔看不到全貌),由呼叫端自行決定何時執行。
 */
export const checkSharedColors = (root) => {
  const issues = []

  /* 色票檔的載入只有一份實作(color-order.mjs 的 loadDefinedColorVars)——
     「哪些檔案算色票檔」的判斷各寫一次的話,改了一處另一處不會跟著變。 */
  const defined = loadDefinedColorVars(root)

  for (const [hex, all] of defined) {
    /* -rgb 是同一個色值的衍生寫法,不是另一個定義 ——
       算進來的話,同一支檔案裡的一組基礎變數與它的 -rgb 會被當成「兩處定義」。 */
    const list = all.filter((v) => !v.isRgb)

    const files = [...new Set(list.map((v) => v.file))]
    if (files.length < 2) continue

    const inShared = files.includes(SHARED_COLOR_CSS_PATH)
    const channels = files.filter((f) => f !== SHARED_COLOR_CSS_PATH)

    for (const file of channels) {
      const entry = list.find((v) => v.file === file)
      issues.push(
        issueOf(
          file,
          entry.line ?? 1,
          'colorFile',
          inShared
            ? `${entry.name}(${hex})與共用色票重複 —— 共用色票已有同色值,改用共用變數`
            : `${entry.name}(${hex})被兩個以上分組使用 —— 收進 ${SHARED_COLOR_CSS_PATH}`
        )
      )
    }
  }

  return issues
}

// --- 規則 tailwind:components 的 template 不寫 utility class ----------------
//
// 共用元件目錄底下的 .vue,template 的 class 只能用組件自身 class 與 --modifier,
// 樣式寫進 CSS 模組目錄。沒有自己 class 的 div / span 要補一個。
// 兩個目錄的實際位置由 project-config.mjs 決定,這裡不寫死。
//
// 判定採「已知清單」而非反向排除 —— 寧可漏抓罕見 utility,
//    也不要把 m-form / --px-15 這類專案自訂 class 誤報成違規。

const TW_EXACT = new Set([
  'flex', 'grid', 'block', 'inline', 'inline-block', 'inline-flex', 'inline-grid',
  'hidden', 'contents', 'table', 'flow-root', 'list-item',
  'absolute', 'relative', 'fixed', 'sticky', 'static',
  'truncate', 'italic', 'underline', 'overline', 'uppercase', 'lowercase', 'capitalize',
  'invisible', 'visible', 'collapse', 'isolate', 'grow', 'shrink',
  'antialiased', 'subpixel-antialiased', 'sr-only', 'not-sr-only',
  'container', 'group', 'peer',
  'border', 'rounded', 'shadow', 'ring', 'outline',
  'filter', 'blur', 'transition', 'transform', 'appearance-none', 'resize',
  'overflow-hidden', 'overflow-auto', 'overflow-visible', 'overflow-scroll',
])

const TW_PREFIX = [
  'w-', 'h-', 'min-w-', 'max-w-', 'min-h-', 'max-h-', 'size-',
  'p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-', 'ps-', 'pe-',
  'm-', 'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-', 'ms-', 'me-',
  'text-', 'bg-', 'border-', 'rounded-', 'shadow-', 'ring-', 'outline-',
  'gap-', 'gap-x-', 'gap-y-', 'space-x-', 'space-y-', 'divide-',
  'items-', 'justify-', 'content-', 'self-', 'place-', 'order-',
  'flex-', 'basis-', 'grow-', 'shrink-', 'col-', 'row-', 'grid-',
  'top-', 'right-', 'bottom-', 'left-', 'inset-', 'z-',
  'opacity-', 'overflow-', 'object-', 'aspect-',
  'font-', 'leading-', 'tracking-', 'align-', 'whitespace-', 'break-',
  'list-', 'indent-', 'decoration-', 'underline-',
  'transition-', 'duration-', 'delay-', 'ease-', 'animate-',
  'translate-', 'rotate-', 'scale-', 'skew-', 'origin-',
  'cursor-', 'pointer-events-', 'select-', 'touch-', 'will-change-',
  'fill-', 'stroke-', 'backdrop-',
  'blur-', 'brightness-', 'contrast-', 'grayscale-', 'invert-', 'saturate-', 'sepia-',
  'drop-shadow-', 'accent-', 'caret-', 'placeholder-',
  'from-', 'via-', 'to-', 'float-', 'clear-', 'box-', 'table-',
  'caption-', 'border-spacing-',
]

/**
 * 專案自訂 class:`m-` 開頭的組件 class、`--` 開頭的 modifier / 狀態,
 * 以及 `j` 開頭純給 JS 抓的 hook class(不帶樣式)。
 *
 * `is-*` / `has-*` 這種裸前綴不算合法 —— 狀態一律寫成 `--active` / `--has-label`。
 */
const isProjectClass = (name) =>
  name.startsWith('--') || /^m-[a-z]/.test(name) || /^j[A-Z]/.test(name)

/** 去掉 variant 前綴(p: / t: / m: / hover: / group-hover: …),回傳 utility 本體 */
const stripVariants = (cls) => {
  // arbitrary value 內可能含冒號(例如 bg-[url(a:b)]),只切中括號外的冒號
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

const isTailwindUtility = (rawClass) => {
  const body = stripVariants(rawClass.replace(/^!/, '')).replace(/^!/, '')
  if (!body) return false
  if (isProjectClass(body)) return false
  if (TW_EXACT.has(body)) return true
  return TW_PREFIX.some((p) => body.startsWith(p))
}

/** 取出 .vue 的 <template> 區段(含位移,回報行號要用) */
const extractTemplate = (text) => {
  const start = text.search(/<template[^>]*>/)
  if (start === -1) return null

  const openEnd = text.indexOf('>', start) + 1
  const close = text.lastIndexOf('</template>')
  if (close === -1) return null

  return { body: text.slice(openEnd, close), offset: openEnd }
}

const checkTailwindInComponents = ({ rel, text }) => {
  if (!rel.startsWith(`${COMPONENTS_DIR}/`) || !rel.endsWith('.vue')) return []

  const tpl = extractTemplate(text)
  if (!tpl) return []

  // 被 <!-- --> 註解掉的 template 是死程式碼,裡面的 class 不算違規。
  // 用等長空白取代而不是刪除,行號才不會跑掉。
  const body = tpl.body.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))

  const issues = []
  const seen = new Set()

  const attrRe = /(?::|v-bind:)?class\s*=\s*"([^"]*)"|(?::|v-bind:)?class\s*=\s*'([^']*)'/g

  for (const m of body.matchAll(attrRe)) {
    const raw = m[1] ?? m[2] ?? ''
    const isDynamic = /^(?::|v-bind:)/.test(m[0].trimStart())

    // 動態綁定只取引號包住的字面 class,其餘(變數、三元運算)無法靜態判讀
    const candidates = isDynamic ? [...raw.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]) : [raw]

    for (const chunk of candidates) {
      for (const cls of chunk.split(/\s+/)) {
        if (!cls || !isTailwindUtility(cls) || seen.has(cls)) continue
        seen.add(cls)

        issues.push(
          issueOf(
            rel,
            lineNoOf(text, tpl.offset + m.index),
            'tailwind',
            `template 使用 tailwind class ${cls} —— 樣式搬進 ${CSS_MODULES_DIR}/,template 只留組件 class 與 --modifier`
          )
        )
      }
    }
  }

  return issues
}

// --- 規則 theme:用到被整組覆寫掉、實際不存在的 tailwind class ----------------
//
// tailwind 的 theme 設定分兩種寫法:寫在 `extend` 底下是「補充」,內建的值都還在;
// 直接寫在 `theme` 底下是「整組覆寫」—— 那一類的內建值會全部消失。
// 消失之後寫那些 class 不會報錯,但產不出任何 CSS,樣式就是沒有效果,而且很難查。
//
// 哪幾類被覆寫、覆寫後還剩哪些值,都定義在 project-config.mjs 的
// TAILWIND_THEME_OVERRIDES —— 那是每個專案各不相同的東西,寫在這裡的話,
// 換一個專案就會提醒實際上存在的 class,整批誤報。

/** 一類覆寫對應的比對式;沒有列出任何消失的值就回 null(那一類不檢查) */
const deadPatternOf = ({ prefix, dead }) => {
  if (!dead?.length) return null

  const values = dead.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')

  // 沒有 prefix 的是斷點,寫法是「斷點:class」,所以結尾是冒號
  return prefix
    ? `(?<![\\w-])${prefix}(?:${values})(?![\\w-])`
    : `(?<![\\w-])(?:${values}):`
}

/* 帶上設定裡的鍵名(screens / fontSize / boxShadow …)—— 訊息要寫出它,
   看到提醒的人才知道要去 tailwind 設定裡看哪一項。 */
const THEME_GROUPS = Object.entries(TAILWIND_THEME_OVERRIDES)
  .map(([key, group]) => ({ ...group, key }))
  .filter((g) => deadPatternOf(g))

const DEAD_RE = THEME_GROUPS.length
  ? new RegExp(THEME_GROUPS.map(deadPatternOf).join('|'), 'g')
  : null

/** 命中的是哪一類 —— 訊息要寫出那一類還剩哪些值可用 */
const groupOfHit = (hit) =>
  THEME_GROUPS.find((g) => (g.prefix ? hit.startsWith(g.prefix) : hit.endsWith(':')))

/**
 * 「這一類還剩哪些值可用」直接從專案的 tailwind 設定讀出來,不另外維護一份 ——
 * 抄一份就要人工同步,而忘了同步不會報錯,只會讓這句提示開始講錯話
 * (指著一個已經改掉的名字叫人去用)。
 */
const DEAD_REASON = (hit, root) => {
  const group = groupOfHit(hit)
  if (!group) return `${hit} 不存在`

  const available = tailwindThemeOf(root)[group.key] ?? []
  const hint = available.length ? `,可用的是 ${available.join(' / ')}` : ''

  return `${group.label} ${hit} 不存在(${group.key} 已整組覆寫${hint})`
}

/** .vue 的 <script> 換成等長空白 —— 那裡的字串不是 class,行號要保持不變 */
const maskScript = (text) =>
  text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (m) => m.replace(/[^\n]/g, ' '))

const checkDeadThemeClass = ({ rel, text, isVue, root }) => {
  // 設定裡沒有任何整組覆寫時這條不檢查 —— 那種專案的內建 class 全部都還在
  if (!DEAD_RE || !isInSrc(rel)) return []

  const scope = isVue ? maskScript(text) : text
  const issues = []
  const seen = new Set()

  for (const m of scope.matchAll(DEAD_RE)) {
    if (seen.has(m[0])) continue
    seen.add(m[0])

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'theme',
        `${DEAD_REASON(m[0], root)} —— 寫了不報錯但產不出任何 CSS`
      )
    )
  }

  return issues
}

// --- 規則 moduleOrder:模組 css 的引入順序 ------------------------------------
//
// 變數要全部先定義完,版型才取用 —— Variables 檔一律排在版型檔之前。
// 順序錯的話,版型取用當下變數還沒定義,吃到的是空值。

/**
 * 「這行 import 指到 CSS 模組目錄」的判斷。
 *
 * 認的是模組目錄的最後一層資料夾名(例如設定為 `src/assets/css/_modules` 時
 * 認的是 `_modules/`),不比對完整路徑 —— import 多半寫成 alias 或相對路徑,
 * 兩種寫法都不會出現完整的目錄路徑。
 *
 * 資料夾名從設定算出來,不寫死 —— 寫死之後,模組放在別的資料夾名的專案,
 * 這條會完全不再命中任何檔案,而且不會有任何徵兆。
 */
const MODULES_DIR_LEAF = CSS_MODULES_DIR.split('/').pop()
const MODULE_IMPORT_RE = new RegExp(
  `import\\s+['"]([^'"]*${MODULES_DIR_LEAF}\\/[^'"]+\\.css)['"]`,
  'g'
)

const checkModuleImportOrder = ({ rel, text, isVue }) => {
  if (!isVue) return []

  const imports = [...text.matchAll(MODULE_IMPORT_RE)].map((m) => ({
    path: m[1],
    isVariables: /variables\.css$/i.test(m[1]),
    line: lineNoOf(text, m.index),
  }))

  if (imports.length < 2) return []

  const issues = []
  const lastVariables = imports.findLastIndex((i) => i.isVariables)
  const firstLayout = imports.findIndex((i) => !i.isVariables)

  if (firstLayout !== -1 && lastVariables > firstLayout) {
    const offender = imports[lastVariables]
    issues.push(
      issueOf(
        rel,
        offender.line,
        'moduleOrder',
        `${offender.path} 是變數檔,卻排在版型檔 ${imports[firstLayout].path} 後面 —— 變數要全部先定義完,版型才取用`
      )
    )
  }

  return issues
}

// --- 規則 moduleVar:級距覆寫要寫在 Variables 檔 -----------------------------
//
// 同一屬性出現兩個以上不同值的覆寫 class(&.--px-24 與 &.--px-15)即為一組級距,
// 必須定義在對應的 ***Variables.css。單一值不成級距,可留在模組 css。
//
// 只有「值是數字」的才算級距 —— &.--range-start / &.--range-end 這種
//    狀態 modifier 長得跟級距一模一樣(同前綴、兩個值),但它們是狀態不是尺寸,
//    搬進 Variables.css 沒有任何意義。

const OVERRIDE_CLASS_RE = /&\.(?:[a-z]{1,2}\\:)?\\-\\-([a-z]+)-([\w]+)\s*[,{]/g

/** 級距值一律是數字(24 / 1.5 / 10px);start、end、top 這種是狀態,不是級距 */
const isScaleValue = (value) => /^\d/.test(value)

const isVariablesFile = (rel) => /variables\.css$/i.test(rel)

const checkModuleVariables = ({ rel, text: raw }) => {
  if (!rel.startsWith(MODULES_PREFIX) || !rel.endsWith('.css')) return []
  if (isVariablesFile(rel)) return []

  const text = maskCssComments(raw)
  const found = new Map()

  for (const m of text.matchAll(OVERRIDE_CLASS_RE)) {
    const [, prop, value] = m
    if (!isScaleValue(value)) continue
    if (!found.has(prop)) found.set(prop, new Map())
    if (!found.get(prop).has(value)) found.get(prop).set(value, lineNoOf(text, m.index))
  }

  const base = path.basename(rel, '.css')
  const target = `${base}Variables.css`

  return [...found.entries()]
    .filter(([, values]) => values.size >= 2)
    .map(([prop, values]) => {
      const [firstLine] = [...values.values()]
      return issueOf(
        rel,
        firstLine,
        'moduleVar',
        `--${prop}-* 有 ${values.size} 個級距值(${[...values.keys()].join(' / ')})—— 級距組要搬到 ${target};跨模組共用則放 ${SHARED_MODULE_VARIABLES}`
      )
    })
}

// --- 規則 variable:模組變數的命名與斷點 -------------------------------------
//
// 命名   -w / -h / -p / -m / -border / -text-size,不要 -width / -height / -padding
// 斷點   有 -pc-X 就必須有 -tablet-X 與 -mobile-X —— 漏一個,那個斷點會靜靜讀不到值

/**
 * 命名一律對齊 tailwind utility 的名字 —— 那是專案裡本來就在用的詞彙,
 * 不必再記第二套。左邊是「看到就要改」的寫法,右邊是 tailwind 的說法。
 */
const SHORT_OF = {
  width: 'w',
  height: 'h',
  padding: 'p',
  margin: 'm',
  radius: 'rounded',
  'border-radius': 'rounded',
  'font-size': 'text-size',
  fontsize: 'text-size',
  'line-height': 'leading',
  lineheight: 'leading',
  'letter-spacing': 'tracking',
  'z-index': 'z',
  zindex: 'z',
  background: 'bg',
  'background-color': 'bg-color',
  bgcolor: 'bg-color',
  text: 'text-size',
}

const LONG_NAME_RE = new RegExp(
  `(--[\\w-]*?)-(${Object.keys(SHORT_OF).sort((a, b) => b.length - a.length).join('|')})(?![\\w-])\\s*:`,
  'g'
)

const checkVariableNaming = ({ rel, text: raw }) => {
  if (!rel.startsWith(MODULES_PREFIX)) return []

  const text = maskCssComments(raw)
  const issues = []

  for (const m of text.matchAll(LONG_NAME_RE)) {
    issues.push(
      issueOf(
        rel,
        lineNoOf(text, m.index),
        'variable',
        `${m[1]}-${m[2]} 要改成 ${m[1]}-${SHORT_OF[m[2]]}(命名對齊 tailwind utility 的說法)`
      )
    )
  }

  return issues
}

/**
 * 級距不得用 sm / md / lg 這種尺寸縮寫 —— 一律用實際數值。
 *
 * `--size-md` 看不出到底多大,要翻到 Variables 檔才知道;而且加一個中間值時
 * 整組都得重新命名(sm / md / lg 之間塞不進東西)。`--size-24` 直接讀得出來。
 *
 * 這份清單是**這件事唯一的判準**,兩個地方都用它:
 * 模組 css 的變數與 modifier 命名(下面 checkTShirtSizing),
 * 以及 tailwind theme 自己定義的值(checkThemeNaming)。
 * 各寫一份的話,補了一個縮寫到其中一邊,另一邊就開始放行它。
 */
const T_SHIRT_SIZE = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', '2xl', '3xl']

const T_SHIRT_CLASS_RE = new RegExp(
  `&\\.(?:[a-z]{1,2}\\\\:)?\\\\-\\\\-([a-z-]+)-(${T_SHIRT_SIZE.join('|')})(?![\\w-])`,
  'g'
)

const T_SHIRT_VAR_RE = new RegExp(
  `(--[\\w-]*?)-(${T_SHIRT_SIZE.join('|')})(?![\\w-])\\s*:`,
  'g'
)

const checkTShirtSizing = ({ rel, text: raw }) => {
  if (!rel.startsWith(MODULES_PREFIX)) return []

  const text = maskCssComments(raw)
  const issues = []
  const seen = new Set()

  const add = (index, name) => {
    if (seen.has(name)) return
    seen.add(name)

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, index),
        'variable',
        `${name} 用了 sm / md / lg 這類尺寸縮寫 —— 改用實際數值(例如 --px-24),看到名字就知道多大,之後要加中間值也不必整組改名`
      )
    )
  }

  for (const m of text.matchAll(T_SHIRT_CLASS_RE)) add(m.index, `--${m[1]}-${m[2]}`)
  for (const m of text.matchAll(T_SHIRT_VAR_RE)) add(m.index, `${m[1]}-${m[2]}`)

  return issues
}

// --- 規則 themeNaming:tailwind theme 自己定義的值也不用 sm / md / lg --------
//
// 這條與上面那條(模組 css 的變數命名)是同一件事,只是換一個地方 ——
// 判準共用同一份 T_SHIRT_SIZE,不另外列一份。
//
// theme 底下是整組覆寫,那一類的內建值會全部消失,專案自己重新定義一套。
// 重新定義的時候又寫成 sm / md / lg 的話,等於把剛拿掉的問題原樣搬回來:
//
//   看到 `shadow-md` 仍然不知道那是多深的陰影,要翻設定檔;
//   要在 sm 與 md 之間加一階時,整組都得改名,連帶每一個使用端;
//   而且它跟 tailwind 內建的同名值長得一模一樣,
//   接手的人分不出這是專案自訂的還是內建的。
//
// 改用說得出用途的名字(content / default)或實際數值。
//
// 這條檢查的是**設定檔本身**,不是使用端 —— 所以它只在掃到那支設定檔時跑。


/**
 * 這一份內容裡,theme 各類直接定義了哪些值。
 *
 * **解析的是傳進來的 text,不是磁碟上的檔案。** 兩者不一定相同 ——
 * AI 寫檔那一層檢查的是「即將寫入的內容」,檔案本身還沒變;
 * 去讀磁碟的話會拿到舊的內容,這次新增的違規就擋不下來。
 *
 * 涵蓋兩種擺法:設定檔裡直接寫(`theme: { boxShadow: { … } }`),
 * 或另外一支檔案匯出再 import 進去(`export const boxShadow = { … }`)。
 */
const themeGroupsInText = (text) => {
  const found = {}

  // 設定檔本身:theme 直接底下的(extend 是補充,不算整組覆寫)
  const themeBody = objectBodyAfter(text, 'theme')

  if (themeBody !== null) {
    const extendBody = objectBodyAfter(themeBody, 'extend')
    const overrideBody = extendBody === null ? themeBody : themeBody.replace(extendBody, '')

    for (const group of topLevelKeysOf(overrideBody)) {
      if (group === 'extend') continue

      const body = objectBodyAfter(overrideBody, group)
      if (body !== null) found[group] = { values: topLevelKeysOf(body), scope: overrideBody }
    }
  }

  // 值定義在別的檔案:export const <類別> = { … }
  for (const m of text.matchAll(/export\s+const\s+(\w+)\s*=\s*\{/g)) {
    const group = m[1]
    if (!(group in TAILWIND_THEME_OVERRIDES)) continue

    const body = objectBodyAfter(text, group)
    if (body !== null) found[group] = { values: topLevelKeysOf(body), scope: body }
  }

  return found
}

/**
 * 這條只看**專案根目錄的設定檔**(路徑裡沒有斜線)。
 *
 * 建置工具的設定一律擺在專案根;theme 的值另外拆一支檔案時也放在旁邊。
 * 不限範圍的話,原始碼裡任何一個剛好叫 `theme` 的物件都會被檢查 ——
 * 那是別的東西,報出來只會是噪音。
 */
const isRootConfigFile = (rel) => !rel.includes('/') && /\.(js|mjs|cjs|ts)$/i.test(rel)

const checkThemeNaming = ({ rel, text, root }) => {
  if (!isRootConfigFile(rel)) return []

  /* 專案沒有樣式設定檔時整條跳過 —— 那種專案沒有 theme 可言。
     前提缺了會由 preflight 說出來,不會安靜地顯示通過。 */
  if (!styleConfigPathOf(root)) return []
  if (hasExemptMark(text, 'theme-naming')) return []

  const issues = []

  for (const [group, { values }] of Object.entries(themeGroupsInText(text))) {
    for (const value of values) {
      if (!T_SHIRT_SIZE.includes(value.toLowerCase())) continue

      /* 行號要指到那個名字本身。先縮到它所屬那一類的區塊再找 ——
         直接全文搜的話,screens 裡的 sm 會在 fontSize 的區塊命中,
         提醒就指到不相干的一行。 */
      const groupStart = new RegExp(`\\b${group}\\s*[:=]\\s*\\{`).exec(text)
      const from = groupStart ? groupStart.index : 0
      const hit = new RegExp(
        `['"]?\\b${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b['"]?\\s*:`
      ).exec(text.slice(from))

      issues.push(
        issueOf(
          rel,
          lineNoOf(text, hit ? from + hit.index : from),
          'themeNaming',
          `${group} 定義了 ${value} —— theme 是整組覆寫,重新定義的值不要再用 sm / md / lg 這類尺寸縮寫;` +
            `改用說得出用途的名字(例如 content / default)或實際數值,看到 class 就知道是什麼,之後加中間值也不必整組改名`
        )
      )
    }
  }

  return issues
}

/**
 * 斷點成套:`--x-pc-px` 存在時,`--x-tablet-px` 與 `--x-mobile-px` 也要有。
 *
 * 只看同一支檔案 —— 跨檔補齊的情況存在,但那本來就該寫在一起,
 * 分散在兩支檔案時要調某個斷點得逐一確認有沒有漏。
 */
/**
 * 斷點清單來自設定 —— 每個專案的斷點不一樣,後台那類根本不做響應式。
 *
 * 設成空陣列時這兩條斷點規則整條略過。寫死的話,不做響應式的專案會被要求
 * 把每一個尺寸值都拆成三份,補出幾百個永遠相同的值。
 */
const BREAKPOINT_ALT = BREAKPOINTS.join('|')

const BREAKPOINT_VAR_RE = new RegExp(`(--[\\w-]*?)-(${BREAKPOINT_ALT})-([\\w-]+)\\s*:`, 'g')


/**
 * 專案裡到底有沒有在用斷點變數 —— 拿來檢查 BREAKPOINTS 設定是不是填錯了。
 *
 * 「是不是後台」工具看不出來,那是業務上的說法;看得出來的是
 * 「CSS 模組裡有沒有 `--x-pc-w` 這種名字」,這是事實。
 *
 * 只偵測得了一個方向:設定填了斷點、專案卻一個都沒用到。
 * 反方向(設定留空、專案其實有分斷點)偵測不出來 —— 設定留空時
 * 連斷點叫什麼都不知道,無從比對。不過那個方向不會被忽略:
 * 那些檔案本來就會被「尺寸值要分斷點」報一整片,一眼就看得到。
 */
/** CSS 模組底下有沒有任何一支檔案符合條件 */
const someModuleCss = (root, test) => {
  const dir = path.join(root, ...CSS_MODULES_DIR.split('/'))
  if (!fs.existsSync(dir)) return false

  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)

      if (entry.isDirectory()) {
        if (walk(full)) return true
        continue
      }
      if (!entry.name.endsWith('.css')) continue
      if (test(fs.readFileSync(full, 'utf8'))) return true
    }

    return false
  }

  return walk(dir)
}

export const hasBreakpointVars = (root) => {
  if (!BREAKPOINTS.length) return false

  return someModuleCss(root, (text) => {
    BREAKPOINT_VAR_RE.lastIndex = 0
    return BREAKPOINT_VAR_RE.test(text)
  })
}

/**
 * 專案有沒有寫響應式樣式。
 *
 * 看的是 `@screen 斷點` 與寬度相關的 `@media` —— 那兩種是響應式的直接證據,
 * 而且與斷點**叫什麼名字無關**,所以斷點設定留空時照樣判斷得出來。
 *
 * 這正是反方向的偵測:設定留空、專案其實有做響應式時,靠變數名比對不出來
 * (留空時連斷點叫什麼都不知道),但這裡看得到。
 *
 * 列印與配色偏好那類 `@media` 不算 —— 它們與螢幕寬度無關,
 * 不做響應式的專案照樣會用到。
 */
const RESPONSIVE_RE = /@screen\s+[\w-]|@media[^{]*\b(?:min|max)-width\b/

export const hasResponsiveStyles = (root) => someModuleCss(root, (text) => RESPONSIVE_RE.test(text))

const checkBreakpointSet = ({ rel, text: raw }) => {
  if (!BREAKPOINTS.length) return []

  // 豁免標記寫在註解裡,所以要先判斷,再把註解遮掉
  if (!rel.startsWith(MODULES_PREFIX) || hasExemptMark(raw, 'breakpoint')) return []

  const text = maskCssComments(raw)
  const groups = new Map()

  for (const m of text.matchAll(BREAKPOINT_VAR_RE)) {
    const key = `${m[1]}|${m[3]}`
    if (!groups.has(key)) groups.set(key, { found: new Set(), line: lineNoOf(text, m.index) })
    groups.get(key).found.add(m[2])
  }

  const issues = []

  for (const [key, { found, line }] of groups) {
    const missing = BREAKPOINTS.filter((b) => !found.has(b))
    if (!missing.length) continue

    const [prefix, suffix] = key.split('|')
    issues.push(
      issueOf(
        rel,
        line,
        'variable',
        `${prefix}-*-${suffix} 缺少 ${missing.map((b) => `${prefix}-${b}-${suffix}`).join(' / ')} —— 斷點要成套,漏一個那個斷點會讀不到值(例外請標 /* lint-breakpoint-exempt: 理由 */)`
      )
    )
  }

  return issues
}

/**
 * 「該分斷點卻沒分」—— checkBreakpointSet 的另一半。
 *
 * 那條只在已經寫了 `-pc-` 時要求補齊另外兩份;這條負責判斷「這個變數本來就該分」。
 *
 * 判定看的是**值**,不是名字:
 *
 *   要分斷點  帶長度單位而且不是 0 —— 15px / 1.5rem / 50% / 10vw / 100vh
 *   不用分    顏色(var(--色票) / hex / transparent / inherit)
 *             0 / auto / none / 100%(滿版一律用 w-full,不繞變數)
 *             無單位數字 —— z-index、line-height 的比例值、font-weight
 *             指向別的變數(`var(…)`)—— 那是斷點對應或狀態切換,不是原始值
 *
 * 只看 Variables 檔的 `:root` 區塊 —— modifier 的具體值(`&.--px-24 { --x-px: 24px }`)
 * 由 `@screen` 段落各自對應,本來就不必在名字裡帶斷點。
 */
const SIZE_VALUE_RE = /^-?\d*\.?\d+(px|rem|em|vw|vh|%)$/

const NEUTRAL_VALUE = new Set(['0', '0px', 'auto', 'none', 'inherit', 'initial', 'transparent', '100%'])

const checkBreakpointNeeded = ({ rel, text: raw }) => {
  if (!rel.startsWith(MODULES_PREFIX) || !/variables\.css$/i.test(rel)) return []

  // 豁免標記寫在註解裡,所以要先判斷,再把註解遮掉
  if (hasExemptMark(raw, 'breakpoint')) return []

  const text = maskCssComments(raw)
  const root = text.match(/:root\s*\{([\s\S]*?)\n\}/)
  if (!root) return []

  const baseLine = lineNoOf(text, root.index)
  const issues = []

  root[1].split(/\r?\n/).forEach((raw, i) => {
    const m = raw.trim().match(/^(--[\w-]+)\s*:\s*([^;]+);/)
    if (!m) return

    const [, name, value] = m

    if (new RegExp(`-(${BREAKPOINT_ALT})-`).test(name)) return // 已經分了
    if (value.includes('var(')) return // 指向別的變數
    if (NEUTRAL_VALUE.has(value.trim())) return
    if (!SIZE_VALUE_RE.test(value.trim())) return

    issues.push(
      issueOf(
        rel,
        baseLine + i,
        'variable',
        `${name}: ${value.trim()} 是尺寸值卻沒有分斷點 —— 拆成 ${name.replace(/^--/, '--')}(中性)加上 -pc- / -tablet- / -mobile- 三份;三個斷點值相同也要拆(例外請標 /* lint-breakpoint-exempt: 理由 */)`
      )
    )
  })

  return issues
}

// --- 規則 moduleScope:模組 css 只能寫自己的 class ----------------------------
//
// `_modules/mForm/**` 底下的選擇器只能是 `m-form` 開頭的 class 與 `--modifier`。
// 出現別的模組(`.m-popup`)或非 m- 開頭的 class(`.l-body`、`.foo`)就是混進來了 ——
// 樣式會散到別人身上,而且「看到 class 就能找到檔案」的對應關係會失效。
//
// 變體的收斂也靠這條:組件放在某個模組的子資料夾底下,它就是那個模組的變體,
// class 前綴要跟著母體走(mItem/ 底下不該出現 `m-switch-item-header`,
// 應該是 `m-item-switch-header`)。

/** mForm → m-form;mDatePicker → m-date-picker */
const toKebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/** 從檔案路徑推出這支 css 允許的 class 前綴;推不出來回傳 null(不檢查) */
const modulePrefixOf = (rel) => {
  const rest = rel.slice(MODULES_PREFIX.length)
  const segments = rest.split('/')

  // _modules/mForm/selection.css → mForm;_modules/mForm.css → mForm
  const moduleName = segments.length > 1 ? segments[0] : segments[0].replace(/\.css$/i, '')
  if (!/^m[A-Z]/.test(moduleName)) return null

  return toKebab(moduleName)
}

/** 選擇器行裡的 class token(含 CSS escape 的 \-\- 寫法) */
const CLASS_TOKEN_RE = /\.((?:\\.|[\w-])+)/g

const unescapeClass = (raw) => raw.replace(/\\/g, '')

const checkModuleScope = ({ rel, text: raw }) => {
  if (!rel.startsWith(MODULES_PREFIX) || !rel.endsWith('.css')) return []

  const prefix = modulePrefixOf(rel)
  if (!prefix) return []

  const text = maskCssComments(raw)

  const issues = []
  const seen = new Set()

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim()

    // 只看選擇器行 —— 宣告(`--x: 1px;`)與 at-rule 不算
    if (!/[{,]\s*$/.test(line) || line.startsWith('@')) return

    for (const m of line.matchAll(CLASS_TOKEN_RE)) {
      // 斷點前綴要先剝掉 —— `&.p\:\-\-px-24` 的本體是 `--px-24`,那是 modifier
      const cls = stripVariants(unescapeClass(m[1]))

      if (cls.startsWith('--')) continue // modifier / 狀態
      if (/^j[A-Z]/.test(cls)) continue // 純給 JS 抓的 hook class
      if (cls === prefix || cls.startsWith(`${prefix}-`)) continue // 自己的 class
      if (seen.has(cls)) continue
      seen.add(cls)

      issues.push(
        issueOf(
          rel,
          i + 1,
          'moduleScope',
          cls.startsWith('m-')
            ? `.${cls} 是別的模組的 class —— 這支檔案只能寫 .${prefix} 系列;變體的 class 也要收斂成 .${prefix}-* 開頭`
            : `.${cls} 不是 m- 開頭的模組 class —— 模組 css 只能寫 .${prefix} 系列與 --modifier`
        )
      )
    }
  })

  return issues
}

// --- 自動修正用的工具 -------------------------------------------------------

/**
 * 移除空的規則區塊(`.foo {}` / `@screen m {}`)。
 *
 * 空區塊在產物裡不會有任何輸出,留著只會讓人以為樣式被誤刪。
 * 帶註解的區塊不算空,不會被動到。沒有變動時回傳 null。
 *
 * 三道防線,少一道就會刪到程式碼:
 *
 *   1. `}` 後面**必須是行尾** —— 否則 `default: () => ({}),` 會被當成空區塊,
 *      吃掉 `default: () => ({`、留下孤兒 `),`。
 *   2. .vue **只掃 <style> 區塊** —— <script> 裡的 `: {}` / `() => ({})`
 *      是合法程式碼,不是 CSS 規則。
 *   3. **只有 .css 與 .vue 會被處理**,其餘副檔名一律回 null。
 *      JS 不能走進來:`if (!Array.isArray(events)) return {}` 完全符合空區塊的形狀,
 *      而 `[^{}]*` 會跨行,連它前面幾行程式碼都會一起被刪掉。
 *      判斷放在這裡而不是呼叫端 —— 呼叫端有好幾處,漏一處就是無聲地刪掉程式碼。
 */
/**
 * 已廢除的透明度寫法 —— 存檔時直接轉成 8 碼,不報違規。
 *
 * 三種寫法的轉法不同,差別在「算不算得出唯一的結果」:
 *
 *   使用端 rgba(var(--x-rgb), 0.4)
 *     色票查得到基礎色,連變數名都算得出來,換成 var(--x-<8碼後綴>);
 *     色票裡還沒有那個變數時一併補進去。
 *
 *   使用端 rgba(#hex, 0.4)
 *     色碼本來就不該寫在使用端,這裡只把它併成 8 碼色碼,
 *     接著由「不得硬寫色碼」那條規則報出來,請人建立變數。
 *
 *   色票檔 --x: rgba(#hex, 0.4) / rgba(var(--y), 0.4)
 *     值換成 8 碼,而且**名字也跟著重算** —— 名字是從色值算出來的,
 *     色值變了名字就不再對得上。改名之後全站用到舊名的地方都要跟著換,
 *     所以回傳 renamed 讓呼叫端去同步;只改色票不改使用端的話,
 *     那些地方會指向一個不存在的變數,畫面上不會報錯,顏色就是不見了。
 *
 * 這三種都是機械式轉換 —— 色值與透明度都是現成的,算得出唯一的結果,所以直接改。
 * `hexToRgb()` 不在這裡處理:要先知道那個衍生變數被用在哪幾種透明度,
 * 才知道要建幾個變數、各自叫什麼,那是判斷題,由規則報出來讓人決定。
 *
 * 回傳 { text, added, renamed }:
 *   added    要補進色票的變數(含所在檔案)
 *   renamed  色票裡改了名字的變數,全站使用端要跟著換
 * 沒有變動時回傳 null。
 */
const LEGACY_RGBA_VAR_RE = /rgba\(\s*var\(\s*(--[\w-]+)\s*\)\s*,\s*([0-9.]+)\s*\)/g
const LEGACY_RGBA_HEX_RE = /rgba\(\s*(#[0-9a-fA-F]{3,8})\s*,\s*([0-9.]+)\s*\)/g

/** 色票宣告的值:rgba(#hex, a) 或 rgba(var(--x), a) */
const COLOR_VALUE_RGBA_RE = /^rgba\(\s*(#[0-9a-fA-F]{3,8}|var\(\s*--[\w-]+\s*\))\s*,\s*([0-9.]+)\s*\)$/

/**
 * 色票檔:把 rgba() 的值換成 8 碼,名字跟著重算。
 *
 * `hexToRgb()` 的那幾筆完全不動 —— 它們要走另一條路(先問人)。
 */
const fixColorFileRgba = (text, index) => {
  const parsed = parseColorCss(text)
  if (!parsed) return null

  const renamed = []
  const decls = []

  for (const d of parsed.decls) {
    const m = d.value.trim().match(COLOR_VALUE_RGBA_RE)
    if (!m || /hexToRgb\s*\(/.test(d.value)) {
      decls.push(d)
      continue
    }

    const [, source, alpha] = m
    const baseHex = source.startsWith('#')
      ? source
      : index.get(source.replace(/^var\(\s*|\s*\)$/g, ''))?.hex

    const eight = baseHex ? withAlpha(baseHex, alpha) : null
    if (!eight) {
      decls.push(d)
      continue
    }

    const hue = hueOf(d.name, eight, 'name') ?? hueOf('', eight, 'value')
    const suffix = expectedSuffix(eight)
    if (!hue || !suffix) {
      decls.push(d)
      continue
    }

    const name = `--${hue}${COLOR_NAME_SEPARATOR}${suffix}`
    if (name !== d.name) renamed.push({ from: d.name, to: name })

    decls.push({ ...d, name, value: eight })
  }

  if (!renamed.length && decls.every((d, i) => d.value === parsed.decls[i].value)) return null

  return { text: buildColorCss(parsed, sortDecls(decls)), added: [], renamed }
}

export const onFixLegacyRgba = (text, rel, { definedVars } = {}) => {
  if (!/\.(css|vue)$/i.test(rel)) return null

  const index = varIndexOf(definedVars ?? new Map())

  if (isColorCssPath(rel)) return fixColorFileRgba(text, index)

  const added = new Map()

  let next = text.replace(LEGACY_RGBA_VAR_RE, (whole, varName, alpha) => {
    const base = baseNameOf(varName)
    const known = index.get(base) ?? index.get(varName)

    // 色票裡查不到基礎色 —— 算不出該叫什麼,留著由規則報出來
    if (!known) return whole

    const eight = withAlpha(known.hex, alpha)
    if (!eight) return whole

    const hue = hueOf(base, eight, 'name')
    const suffix = expectedSuffix(eight)
    if (!hue || !suffix) return whole

    const name = `--${hue}${COLOR_NAME_SEPARATOR}${suffix}`
    if (!index.has(name)) added.set(name, { name, value: eight, file: known.file })

    return `var(${name})`
  })

  next = next.replace(LEGACY_RGBA_HEX_RE, (whole, hex, alpha) => withAlpha(hex, alpha) ?? whole)

  return next === text ? null : { text: next, added: [...added.values()], renamed: [] }
}

const EMPTY_BLOCK = /^[ \t]*[^\s{}/][^{}]*\{[ \t\r\n]*\}[ \t]*(?=\r?\n|$)\r?\n?/gm

const stripEmptyBlocks = (css) => {
  let out = css
  let prev

  do {
    prev = out
    out = out.replace(EMPTY_BLOCK, '')
  } while (out !== prev) // 巢狀空區塊要反覆清到收斂

  return out
}

export const onRemoveEmptyRules = (text, { rel = '' } = {}) => {
  const isVue = /\.vue$/i.test(rel)

  // 不是 CSS 也不是 .vue 就完全不碰(見上面第 3 道防線)
  if (!isVue && !/\.css$/i.test(rel)) return null

  if (!isVue) {
    const out = stripEmptyBlocks(text)
    return out === text ? null : out
  }

  // .vue:逐個 <style> 區塊處理,標籤與其他區塊原封不動
  let out = text.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_m, open, css, close) => `${open}${stripEmptyBlocks(css)}${close}`
  )

  out = out.replace(/<style[^>]*>\s*<\/style>\r?\n?/gi, '')

  return out === text ? null : out
}

// --- 對外入口 ---------------------------------------------------------------

const CHECKS = [
  checkLiteralColor,
  checkColorFile,
  checkTailwindInComponents,
  checkDeadThemeClass,
  checkModuleImportOrder,
  checkModuleScope,
  checkModuleVariables,
  checkVariableNaming,
  checkTShirtSizing,
  checkThemeNaming,
  checkBreakpointSet,
  checkBreakpointNeeded,
  // 全站規範(不限 CSS)接在後面 —— 判斷寫在 rules-global.mjs
  ...GLOBAL_CHECKS,
  // API 規範 —— 判斷寫在 rules-api.mjs
  ...API_CHECKS,
  // Store 規範 —— 判斷寫在 rules-store.mjs
  ...STORE_CHECKS,
  // 程式碼撰寫規範 —— 判斷寫在 rules-code.mjs
  ...CODE_CHECKS,
  // 頁面規範 —— 判斷寫在 rules-page.mjs
  ...PAGE_CHECKS,
]

/**
 * 對「一段內容」做檢查,不必先寫進磁碟。
 *
 * 給 AI 寫檔那層用的:PreToolUse 拿到的是**即將寫入**的內容,檔案還沒落地,
 * lintFile 讀不到。lintFile 也走這支,判斷只有一份。
 *
 * root 給需要看專案結構的規則用(例如 api 檔名要對得上 views 的資料夾)。
 */
export const lintText = (root, rel, text, definedVars) => {
  /* 專案自己的文件一律不檢查 —— 那一層有自己的檢查工具。
     擋在這裡而不是各條規則各擋一次:這是所有規則的唯一匯合點,
     擋在這裡才保證每一條都適用,而且日後新增規則不必記得也去加一次排除。 */
  if (isProjectDocs(rel)) return []

  const ctx = { root, rel, text, isVue: /\.vue$/i.test(rel), definedVars }

  return CHECKS.flatMap((check) => {
    try {
      return check(ctx)
    } catch {
      return [] // 單條規則壞掉不要讓整個檢查停擺
    }
  }).sort((a, b) => a.line - b.line)
}

/** 單一檔案的完整檢查 */
export const lintFile = (root, abs, definedVars) =>
  lintText(root, toRel(root, abs), fs.readFileSync(abs, 'utf8'), definedVars)

/** 規則代號 → 標題與修正提示,五層共用 */
export const RULE_TITLE = {
  color: '顏色未使用色票變數',
  colorFile: '色票檔的命名 / 排序 / 分組歸屬',
  tailwind: 'components 的 template 使用 tailwind class',
  theme: '用到本專案不存在的 tailwind class',
  themeNaming: 'tailwind theme 自己定義的值用了尺寸縮寫',
  moduleOrder: '模組 css 的引入順序',
  moduleScope: '模組 css 混入了別的 class',
  moduleVar: '模組級距變數的歸屬',
  variable: '模組變數的命名或斷點',
  ...GLOBAL_RULE_TITLE,
  ...API_RULE_TITLE,
  ...STORE_RULE_TITLE,
  ...CODE_RULE_TITLE,
  ...PAGE_RULE_TITLE,
}

export const RULE_HINT = {
  color: `色票定義在 ${COLOR_CSS_DIR}/${COLOR_CSS_PREFIX}*.css,使用端寫 var(--色名-色碼)`,
  colorFile: `跨分組共用的色值收進 ${SHARED_COLOR_CSS_PATH};排序會自動修正,命名要人工改(牽動使用端)`,
  tailwind: `樣式搬進 ${CSS_MODULES_DIR}/,template 只留組件 class 與 --modifier`,
  theme: `theme 的 ${THEME_GROUPS.map((g) => g.key).join(' / ')} 是整組覆寫,內建 key 全部不存在`,
  themeNaming: '整組覆寫後重新定義的值不要再用 sm / md / lg —— 改用說得出用途的名字或實際數值',
  moduleOrder: '變數檔一律排在版型檔之前 —— 變數先定義完,版型才取用',
  moduleScope: '一支模組 css 只能寫自己那組 class,變體的 class 也要收斂成同一個前綴',
  moduleVar: '同屬性兩個以上級距值要搬到 ***Variables.css',
  variable: '命名對齊 tailwind(w / h / p / rounded / leading);尺寸值要三個斷點成套,級距用實際數值不用 sm / md / lg',
  ...GLOBAL_RULE_HINT,
  ...API_RULE_HINT,
  ...STORE_RULE_HINT,
  ...CODE_RULE_HINT,
  ...PAGE_RULE_HINT,
}
