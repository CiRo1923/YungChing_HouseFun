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
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

/* 同步載入專案自己的規則 —— 見下方 PROJECT_RULES 那一段的說明。
   這個載法要 node 22.12 以上;更舊的版本會丟 ERR_REQUIRE_ESM,
   那時會印出訊息而不是安靜略過。 */
const require = createRequire(import.meta.url)
import {
  baseNameOf,
  bodyOf,
  allColorDecls,
  COLOR_CSS_PREFIX,
  COLOR_NAME_SEPARATOR,
  expectedSuffix,
  hexOf,
  hueOf,
  HUE_LIST_TEXT,
  HUE_ORDER,
  isColorCssPath,
  isRgbVar,
  isSorted,
  isSuffixNamingChecked,
  LEGACY_RGB_HINT,
  namingStyleOf,
  varIndexOf,
  withAlpha,
  loadDefinedColorVars,
  parseColorBlocks,
  SHARED_COLOR_CSS_PATH,
  writeColorBlock,
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
export { onCloneApiDefault } from './rules-store.mjs'
import { GLOBAL_CHECKS, GLOBAL_RULE_HINT, GLOBAL_RULE_TITLE } from './rules-global.mjs'
import { PAGE_CHECKS, PAGE_RULE_HINT, PAGE_RULE_TITLE } from './rules-page.mjs'
import { STORE_CHECKS, STORE_RULE_HINT, STORE_RULE_TITLE } from './rules-store.mjs'
import {
  BREAKPOINTS,
  BREAKPOINT_SCREENS,
  COLOR_CSS_DIR,
  COMPONENTS_DIR,
  COMPONENT_DIRS,
  CSS_MODULES_DIR,
  MODULE_CSS_DIR_NAME,
  SCAN_TARGETS,
  SHARED_MODULE_VARIABLES,
  TAILWIND_THEME_OVERRIDES,
  isInSrc,
  listFiles,
  maskComments,
  maskCssComments,
  maskHtmlComments,
  readTextCached,
  isProjectDocs,
  DUAL_TYPE_UTILITIES,
  IMPORT_RE,
  VAR_DEFINE_RE,
  VAR_USE_RE,
  ARBITRARY_VAR_RE,
  stripVariants,
  utilityBodyOf,
  utilityNameFrom,
  hasExemptMark,
  isModuleCss,
  isModuleStyle,
  isSharedCss,
  isTransitionClass,
  moduleFolderOf,
  registerScanCache,
  classPrefixOf,
  componentClassOf,
  selectorClassesOf,
  issueOf,
  warnOf,
  lineNoOf,
  templateRangeOf,
  toRel,
} from './shared.mjs'

// 走訪與共用工具都在 shared.mjs —— 全站規範那支也要用,擺這裡會變成循環相依
// isWarn 也轉出去 —— 「哪些違規只是建議、不擋」的判斷五層守門共用同一份,
// 各層自己比對 level 字串的話,level 一旦增加新的值,各層的行為就開始不一致
// 「有哪些共同前提、有哪些寫法規範」也從這裡轉出 —— 那兩份清單由目錄長出來,
// 對話層才不必自己維護一份會過時的副本
export {
  PENDING_CACHE_FILE,
  SCAN_TARGETS,
  isScannable,
  isScannablePath,
  isWarn,
  listConventionRules,
  listConventionSkills,
  listFiles,
  toRel,
} from './shared.mjs'

/* 註解遮蔽(maskCssComments / maskHtmlComments)定義在 shared.mjs ——
   色票的解析也要用它找區塊邊界,各寫一份的話,兩邊對註解的認定會開始不一樣。 */

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
//
// **有一種檔案吃不到色票,改用 var() 會讓宣告真的失效** ——
// 那種在檔頭標 `lint-color-exempt` 並寫明理由,規則跳過整份。兩種情況:
//
//   色票掛在某個容器內的元素上,而這一支寫的是它的祖先(html / body)——
//       CSS 變數只往後代繼承,祖先讀不到
//   在 app 的程式碼之前就載入的樣式(由 HTML 直接引入,避免無樣式閃現)——
//       那個時間點色票還沒有掛上去
//
// 照規則改的後果是**靜默的**:宣告失效之後元素改吃繼承來的顏色,
// 畫面上「有顏色」只是不對 —— 比整片沒有顏色更難發現。
//
// 標記讀的是共用的 hasExemptMark,與其他規則同一套:寫在註解裡才算,
// 字串與範例區塊裡的不算。

const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/
const RGB_NUM_RE = /\brgba?\(\s*[\d.]/
const ARBITRARY_HEX_RE = /-\[#(?:[0-9a-fA-F]{3,8})\]/g

const checkLiteralColor = ({ rel, text, isVue, definedVars }) => {
  if (isColorCssPath(rel)) return []
  if (hasExemptMark(text, 'color')) return []
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
        issues.push(issueOf(rel, base + i, 'color', `hexToRgb() 已不使用 —— ${LEGACY_RGB_HINT}`))
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

  /* 一支色票可能有好幾組(深淺主題寫成巢狀的兩層就是兩組)。
     命名與值的檢查逐筆看,所以把每一組的宣告攤平就好;
     要以組為單位的事(排序、撞色)各自走 parseColorBlocks。 */
  const decls = allColorDecls(text)
  if (!decls.length) {
    return [issueOf(rel, 1, 'colorFile', '這支色票裡找不到任何變數,排序與命名檢查已跳過')]
  }

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
  const { hued, semantic } = namingStyleOf(decls)

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
  for (const d of decls) {
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

  for (const d of decls) {
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

  /*
   * 排序自己一個代號,不跟命名那幾條混在一起。
   *
   * 兩者性質相反:排序**存檔就自動修好了**,人什麼都不用做;
   * 命名與值那幾條要人動手改,而且改名會牽動每一個使用端。
   * 混在同一個代號底下的話,看到一串 colorFile 分不出哪幾筆該處理 ——
   * 而「都不用管」與「要改十個檔案」被當成同一件事,結果是兩種都被略過。
   */
  if (!isSorted(text)) {
    issues.push(
      issueOf(
        rel,
        1,
        'colorSort',
        '排序不符規則(彩虹 + 每類由淺到深)—— 存檔或 npm run sort:color 會自動修正'
      )
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

/* prettier-ignore —— 這份清單照 tailwind 的分類分行(display / position /
  文字裝飾 / 可見性 / 無障礙 / 容器 / 框線 / 濾鏡 / overflow),
  一行一類。排成一行一個的話 11 行會變成 50 多行,而且分類看不出來 ——
  要判斷「某個 utility 漏了沒」時,是照分類去看的。 */
// prettier-ignore
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

/* prettier-ignore —— 與上面那份同樣的理由:照 tailwind 的分類分行
  (尺寸 / 內距 / 外距 / 顏色 / 間隙 / 對齊 / 彈性 / 定位 / …),一行一類。
  一行一個的話 20 行會變成 130 多行,而分類正是查漏的依據。 */
// prettier-ignore
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

const isTailwindUtility = (rawClass) => {
  const body = utilityBodyOf(rawClass)
  if (!body) return false
  if (isProjectClass(body)) return false
  if (TW_EXACT.has(body)) return true
  return TW_PREFIX.some((p) => body.startsWith(p))
}

const CLASS_ATTR_RE = /(?::|v-bind:)?class\s*=\s*"([^"]*)"|(?::|v-bind:)?class\s*=\s*'([^']*)'/g

/**
 * 畫面區段裡出現的每一個 class 名稱,連同它那個 class 屬性在整份檔案裡的位置。
 *
 * 動態綁定(`:class`)只取引號包住的字面值 —— 變數與三元運算靜態判讀不出來。
 * 被 `<!-- -->` 註解掉的畫面區段是死程式碼,裡面的 class 不算;
 * 用等長空白取代而不是刪掉,行號才不會跑掉。
 *
 * 位置回傳原始 index 而不是行號,由呼叫端自己換算 ——
 * 看畫面區段 class 的規則不只一條,取法各寫一份的話,
 * 兩邊對「哪些算 class、哪一行」的認定會開始不一樣。
 */
const templateClassTokensOf = (text) => {
  const tpl = templateRangeOf(text)
  if (!tpl) return []

  const body = tpl.body.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
  const tokens = []

  for (const m of body.matchAll(CLASS_ATTR_RE)) {
    const raw = m[1] ?? m[2] ?? ''
    const isDynamic = /^(?::|v-bind:)/.test(m[0].trimStart())
    const chunks = isDynamic ? [...raw.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]) : [raw]

    /* group 認的是「這幾個 class 寫在同一個字串字面值裡」。

       動態綁定常常是互斥的分支(`:class="isError ? 'text-[--red]' : 'text-[--gray]'"`)——
       那兩個永遠不會同時出現在元素上,不能當成「同一段裡的兩個」。
       只靠屬性的位置分組的話,互斥的兩個會被湊成一組,
       而「同一段裡有兩個同樣的 utility」那類檢查就會對著它們誤報。 */
    for (const [at, chunk] of chunks.entries()) {
      for (const cls of chunk.split(/\s+/)) {
        if (cls) tokens.push({ cls, index: tpl.offset + m.index, group: `${m.index}:${at}` })
      }
    }
  }

  return tokens
}

/* 範圍只有共用元件目錄。容器(掛在版面上的系統元件)與版型不在內 ——
   那兩層是依頁面組起來的版面,不是會被到處放的模組:沒有模組前綴、
   也沒有自己的樣式資料夾,套上去等於要求整層改名搬家。
   那兩層仍受文字類規則約束(註解不用裝飾符號那幾條)。 */
const checkTailwindInComponents = ({ rel, text }) => {
  if (!rel.startsWith(`${COMPONENTS_DIR}/`) || !rel.endsWith('.vue')) return []

  const issues = []
  const seen = new Set()

  for (const { cls, index } of templateClassTokensOf(text)) {
    if (!isTailwindUtility(cls) || seen.has(cls)) continue
    seen.add(cls)

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, index),
        'tailwind',
        `template 使用 tailwind class ${cls} —— 樣式搬進這支元件自己的 css(與它的 .vue 放在同一個資料夾),template 只留組件 class 與 --modifier`
      )
    )
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
  return prefix ? `(?<![\\w-])${prefix}(?:${values})(?![\\w-])` : `(?<![\\w-])(?:${values}):`
}

/* 帶上設定裡的鍵名(screens / fontSize / boxShadow …)—— 訊息要寫出它,
   看到提醒的人才知道要去 tailwind 設定裡看哪一項。 */
const THEME_GROUPS = Object.entries(TAILWIND_THEME_OVERRIDES)
  .map(([key, group]) => ({ ...group, key }))
  .filter((g) => deadPatternOf(g))

/**
 * 這個專案**實際**整組覆寫了的那幾類。
 *
 * 設定列的是「tailwind 有哪幾類、各類的內建值叫什麼」,與專案無關;
 * 某一類在這個專案有沒有被整組覆寫,要讀專案自己的 tailwind 設定才知道。
 *
 * 不分這兩件事的話,只要一類被列進設定,沒有覆寫它的專案就會被整批誤報 ——
 * 而訊息還會寫著「這一類已整組覆寫」,那句話在那個專案是假的。
 *
 * 依 root 快取:一次全專案掃描會對每一支檔案問一次,而答案在同一次執行裡不變。
 */
let overriddenCache = null

const overriddenGroupsOf = (root) => {
  if (overriddenCache?.root === root) return overriddenCache.groups

  const overridden = tailwindThemeOf(root)
  const groups = THEME_GROUPS.filter((g) => g.key in overridden)

  overriddenCache = { root, groups }

  return groups
}

/** 這個專案要抓的那些消失的 class;一類都沒被覆寫時回 null(整條不檢查) */
const deadReOf = (root) => {
  const groups = overriddenGroupsOf(root)

  return groups.length ? new RegExp(groups.map(deadPatternOf).join('|'), 'g') : null
}

/** 命中的是哪一類 —— 訊息要寫出那一類還剩哪些值可用 */
const groupOfHit = (hit, root) =>
  overriddenGroupsOf(root).find((g) => (g.prefix ? hit.startsWith(g.prefix) : hit.endsWith(':')))

/**
 * 「這一類還剩哪些值可用」直接從專案的 tailwind 設定讀出來,不另外維護一份 ——
 * 抄一份就要人工同步,而忘了同步不會報錯,只會讓這句提示開始講錯話
 * (指著一個已經改掉的名字叫人去用)。
 */
const DEAD_REASON = (hit, root) => {
  const group = groupOfHit(hit, root)
  if (!group) return `${hit} 不存在`

  const available = tailwindThemeOf(root)[group.key] ?? []
  const hint = available.length ? `,可用的是 ${available.join(' / ')}` : ''

  return `${group.label} ${hit} 不存在(${group.key} 已整組覆寫${hint})`
}

/** .vue 的 <script> 換成等長空白 —— 那裡的字串不是 class,行號要保持不變 */
const maskScript = (text) =>
  text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (m) => m.replace(/[^\n]/g, ' '))

const checkDeadThemeClass = ({ rel, text, isVue, root }) => {
  if (!isInSrc(rel)) return []

  /* 這個專案一類都沒有整組覆寫時不檢查 —— 那種專案的內建 class 全部都還在,
     照設定清單去抓的話,每一支用了 text-sm 的檔案都會被報「不存在」。 */
  const deadRe = deadReOf(root)
  if (!deadRe) return []

  /* 註解裡舉例寫出一個已經消失的 class 是正常的(「這裡不要再用 text-sm」
     那句說明本身就含有它)—— 報出來的那一筆沒有人能修,照著改等於把說明改壞。
     每一種註解都要遮:樣式、程式、畫面區段各有各的寫法。 */
  const scope = maskComments(rel, isVue ? maskScript(text) : text)
  const issues = []
  const seen = new Set()

  for (const m of scope.matchAll(deadRe)) {
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
 * 「這行 import 指到某一支模組樣式」的判斷。
 *
 * 兩種都算:
 *
 *   相對路徑         元件載入自己資料夾裡的那幾支(`./variables.css`)
 *   集中目錄的路徑   跨模組共用的變數(認資料夾名,因為 import 多半寫成 alias)
 *
 * 色票那類全域載入的樣式不會出現在元件裡,所以不必另外排除;
 * 真的出現了也只會被當成一支版型檔,不影響「變數要排在版型之前」的判斷。
 *
 * 資料夾名從設定算出來,不寫死 —— 寫死之後,共用變數放在別的資料夾名的專案,
 * 那一半會完全不再命中,而且不會有任何徵兆。
 */
const MODULES_DIR_LEAF = CSS_MODULES_DIR.split('/').pop()
const CSS_IMPORT_RE = /import\s+['"]([^'"]+\.css)['"]/g

const isModuleImportPath = (spec) =>
  spec.startsWith('./') || spec.startsWith('../') || spec.includes(`${MODULES_DIR_LEAF}/`)

const checkModuleImportOrder = ({ rel, text, isVue }) => {
  if (!isVue) return []

  const imports = [...text.matchAll(CSS_IMPORT_RE)]
    .filter((m) => isModuleImportPath(m[1]))
    .map((m) => ({
      path: m[1],
      isVariables: isVariablesFile(m[1]),
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

// --- 規則 breakpointPrefix:級距在每個斷點都要列齊前綴 ------------------------
//
// 級距 class 由使用端傳進來(`p:--px-20`、`tm:--py-8`),CSS 這邊要為每一個
// 會命中的斷點各寫一次選擇器。少列一種的話,使用端那樣寫了在那個斷點沒有效果 ——
// 畫面上是「這個間距沒生效」,而那一行 class 看起來完全正常。
//
// 哪個 @screen 區塊該列哪幾種前綴由設定決定(BREAKPOINT_SCREENS)——
// 各專案的斷點名與涵蓋關係都不一樣,寫死在這裡的話換一個專案就整批誤報。
//
// **只有「這支檔案裡某處帶過前綴」的名字才算父層可傳入的級距。**
//    從來沒帶過前綴的是元件自己的變體(尺寸、狀態),使用端不會寫 `p:--size-md`,
//    要求它列出前綴變體是誤報,而一條整批誤報的規則會被整條忽略。

/** `&.\-\-px-20` 與 `&.p\:\-\-px-20` 都認,分別取出前綴與級距名 */
const SCALE_CLASS_RE = /&\.(?:([a-z]{1,3})\\:)?\\-\\-([a-z]+-[\w.]+)\s*[,{]/g

/**
 * 取出每一個 `@screen` 區塊的範圍(名稱、內容、起始位置)。
 *
 * 用大括號配對而不是 regex —— 區塊裡面還有巢狀的選擇器,
 * regex 抓到的結尾會是第一個右大括號,只涵蓋到區塊的開頭幾行。
 */
const screenBlocksOf = (text) => {
  const blocks = []

  for (const m of text.matchAll(/@screen\s+([\w-]+)\s*\{/g)) {
    let depth = 0

    for (let i = m.index + m[0].length - 1; i < text.length; i += 1) {
      if (text[i] === '{') depth += 1
      else if (text[i] === '}') {
        depth -= 1
        if (depth === 0) {
          blocks.push({ screen: m[1], body: text.slice(m.index, i), at: m.index })
          break
        }
      }
    }
  }

  return blocks
}

const checkBreakpointPrefix = ({ rel, text: raw }) => {
  if (!isModuleStyle(rel)) return []
  if (!Object.keys(BREAKPOINT_SCREENS).length) return []

  const text = maskCssComments(raw)

  /* 先認出哪些名字是「父層可傳入的級距」—— 整支檔案裡帶過前綴的那些。
     這一輪要掃全文,不能只看單一區塊:同一個級距常常只在某一個斷點帶前綴。 */
  const scales = new Set()
  for (const m of text.matchAll(SCALE_CLASS_RE)) if (m[1]) scales.add(m[2])
  if (!scales.size) return []

  const issues = []

  for (const { screen, body, at } of screenBlocksOf(text)) {
    const expect = BREAKPOINT_SCREENS[screen]
    if (!expect) continue

    /* 無前綴的寫法代表「所有斷點都套用」,每一個區塊都要有 ——
       這一份是規則要求的,不寫進設定(每個專案都一樣)。 */
    const wanted = ['', ...expect]
    const found = new Map()

    for (const m of body.matchAll(SCALE_CLASS_RE)) {
      const [, prefix = '', scale] = m
      if (!scales.has(scale)) continue

      if (!found.has(scale)) found.set(scale, { prefixes: new Set(), at: at + m.index })
      found.get(scale).prefixes.add(prefix)
    }

    for (const [scale, { prefixes, at: hit }] of found) {
      const missing = wanted.filter((prefix) => !prefixes.has(prefix))
      if (!missing.length) continue

      issues.push(
        issueOf(
          rel,
          lineNoOf(text, hit),
          'breakpointPrefix',
          `@screen ${screen} 裡的 --${scale} 少了 ${missing
            .map((prefix) => (prefix ? `${prefix}:--${scale}` : `--${scale}(無前綴)`))
            .join(' / ')} —— ` +
            `使用端那樣寫的話,這個斷點下不會有任何效果,而那一行 class 看起來完全正常`
        )
      )
    }
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

/**
 * 這支是不是變數檔。
 *
 * 兩種結尾都算:來源的 `***Variables.css`,以及接手的專案自己拆出去的
 * `***VariablesProject.css`(歸屬看得出來的那一種命名,見規則 styleProjectImport)。
 *
 * **後面那種漏掉的話,整組變數規則對它都不作用** —— 斷點要成套、命名要對齊
 * tailwind、不要用覆蓋寫斷點,全部跳過。而那幾條跳過時不會有任何訊息:
 * 檢查照樣顯示通過,只是這個專案自己那幾支變數沒有人在看。
 */
const isVariablesFile = (rel) => /variables(project)?\.css$/i.test(rel)

/**
 * 這支模組樣式的變數檔該叫什麼。
 *
 * 檔名的前半是**變體名**,不是模組名:`selection.css` 配
 * `selectionVariables.css`(selection 是 mForm 底下的一個變體)。
 *
 * 而模組的主樣式 `common.css` 不屬於任何變體 —— 它配的是 `variables.css`,
 * 前面不加東西。算成 `commonVariables.css` 的話,規則會叫人去建一支
 * 每個模組都沒有的檔案;而模組底下只有一支元件時,照著錯的推導會建出
 * `mStepCard/.css/mStepCardVariables.css` 這種把資料夾名重複一次的檔名。
 */
const MODULE_MAIN_STYLE = 'common'

const variablesFileFor = (rel) => {
  const base = path.basename(rel, '.css')

  return base === MODULE_MAIN_STYLE ? 'variables.css' : `${base}Variables.css`
}

const checkModuleVariables = ({ rel, text: raw }) => {
  if (!isModuleStyle(rel)) return []
  if (isVariablesFile(rel)) return []

  const text = maskCssComments(raw)
  const found = new Map()

  for (const m of text.matchAll(OVERRIDE_CLASS_RE)) {
    const [, prop, value] = m
    if (!isScaleValue(value)) continue
    if (!found.has(prop)) found.set(prop, new Map())
    if (!found.get(prop).has(value)) found.get(prop).set(value, lineNoOf(text, m.index))
  }

  const target = variablesFileFor(rel)
  const variablesHint = SHARED_MODULE_VARIABLES
    ? /* 集中目錄還沒有共用變數檔的專案(樣式都跟著元件走,那一層是空的)
         把設定留空 —— 指一個不存在的位置比不講更糟,照著做會建出
         一支沒有人知道為什麼在那裡的檔案。 */
      `;跨模組共用則放 ${SHARED_MODULE_VARIABLES}`
    : ''

  const issues = [...found.entries()]
    .filter(([, values]) => values.size >= 2)
    .map(([prop, values]) => {
      const [firstLine] = [...values.values()]
      return issueOf(
        rel,
        firstLine,
        'moduleVar',
        `--${prop}-* 有 ${values.size} 個級距值(${[...values.keys()].join(' / ')})—— 級距組要搬到 ${target}` +
          variablesHint
      )
    })

  return [...issues, ...crossBreakpointLiterals(rel, text, target, variablesHint)]
}

/* 同一處在不同斷點寫了不同的字面值 —— 那是一組該收進變數的斷點值。

  `text-[14px]` 在 pc、`text-[13px]` 在 mobile,兩邊各寫死一個數字。
  規範要求的是定義成 css 變數、由模組樣式做斷點對應
  (`--x: var(--x-pc)`),原因是改的時候要翻遍整支樣式才找得齊,
  而漏掉一個斷點不會有任何徵兆。

  **判準是「不同斷點的值不一樣」,不是「有沒有寫字面值」。**
     三個斷點都寫 `text-[14px]` 只是重複,那個值根本不隨斷點變,
     抽成變數反而多繞一層。把那種也報出來的話,一支樣式檔會冒出
     十幾筆改了沒有意義的違規,而整條規則會因此被忽略。 */
const UTILITY_LITERAL_RE = /([a-z]+(?:-[a-z]+)*)-\[(\d+(?:\.\d+)?)(px|rem|em|%)\]/g

const crossBreakpointLiterals = (rel, text, target, variablesHint) => {
  /* 選擇器鏈要跟著算 —— 不同選擇器底下的同一個 utility 是兩回事。
     只看 utility 名的話,`.m-a` 的 14px 與 `.m-b` 的 13px 會被湊成一組。 */
  const seen = new Map()

  for (const { screen, body, at } of screenBlocksOf(text)) {
    const stack = []
    let offset = 0

    for (const line of body.split('\n')) {
      const trimmed = line.trim()
      const selector = trimmed.match(/^([.&][^{]*)\{/)

      if (selector) stack.push(selector[1].trim())

      for (const m of trimmed.matchAll(UTILITY_LITERAL_RE)) {
        const key = `${stack.join(' ')}|${m[1]}`
        if (!seen.has(key)) seen.set(key, new Map())
        // 同一個斷點裡重複寫同一個值不算兩筆,取第一次出現的位置
        if (!seen.get(key).has(screen))
          seen.get(key).set(screen, {
            value: `${m[2]}${m[3]}`,
            line: lineNoOf(text, at + offset),
            utility: m[1],
          })
      }

      for (let i = 0; i < (trimmed.match(/\}/g) ?? []).length; i += 1) stack.pop()
      offset += line.length + 1
    }
  }

  const issues = []

  for (const byScreen of seen.values()) {
    const values = [...byScreen.values()]
    if (new Set(values.map((v) => v.value)).size < 2) continue

    const [first] = values
    const shown = [...byScreen.entries()].map(([s, v]) => `${s} ${v.value}`).join(' / ')

    issues.push(
      issueOf(
        rel,
        first.line,
        'moduleVar',
        `${first.utility}- 在不同斷點寫了不同的值(${shown})—— ` +
          `那是一組斷點值,要定義成 css 變數放 ${target},` +
          `再由這支樣式做斷點對應(--x: var(--x-pc));` +
          `寫死的話改的時候要翻遍整支樣式,而漏掉一個斷點不會有任何徵兆` +
          variablesHint
      )
    )
  }

  return issues
}

// --- 規則 sharedVarScope:共用變數檔只放真的跨模組的那幾組 -------------------
//
// 共用變數檔是留給「兩個以上的元件都要用」的那幾組級距。只有一個模組在用的
// 放在那裡,對那個模組來說它的值就跑到別的檔案去了 —— 改的時候要開兩支,
// 刪掉那個元件時也不會有人想到要清掉這一段。
//
// 「以後可能也會用到」不算 —— 那個以後常常不會來,而清單會一直長。
// 真的第二個模組要用的時候再搬過去,那時兩邊都看得到它確實被共用。
//
// 判斷要看全案:哪幾支模組樣式引用了這個變數。所以整份建一次索引,
// 與「誰定義過這個變數」那一份同一個做法。

/**
 * 只有一個模組在用的變數 —— 回傳 [變數名, 那個模組] 的清單。
 *
 * 判準抽出來讓驗證直接測得到:多數專案的共用變數檔是空的(樣式都跟著元件走),
 * 靠實際檔案來驗的話,這條的判準永遠沒有人守。
 *
 * 一個使用者都沒有的不列入 —— 那是另一件事(沒有人用的變數),
 * 而且剛加上去、還沒接上使用端的那一刻也長這樣,報它只會擋住正在做的事。
 */
export const singleModuleVarsOf = (defined, usedBy) =>
  [...defined]
    .map((name) => [name, [...(usedBy.get(name) ?? [])]])
    .filter(([, modules]) => modules.length === 1)
    .map(([name, modules]) => [name, modules[0]])

let sharedVarCache = null

registerScanCache(() => {
  sharedVarCache = null
})

/** 每個變數被哪幾個模組引用過(只看模組自己的樣式) */
const varUsersOf = (root) => {
  if (sharedVarCache?.root === root) return sharedVarCache.usedBy

  const usedBy = new Map()

  for (const dir of COMPONENT_DIRS) {
    for (const abs of listFiles(root, dir)) {
      const rel = toRel(root, abs)
      if (!isModuleCss(rel)) continue

      const owner = moduleFolderOf(rel)
      if (!owner) continue

      try {
        const text = maskCssComments(readTextCached(abs) ?? '')

        for (const m of [...text.matchAll(VAR_USE_RE), ...text.matchAll(ARBITRARY_VAR_RE)]) {
          if (!usedBy.has(m[1])) usedBy.set(m[1], new Set())
          usedBy.get(m[1]).add(owner)
        }
      } catch {
        // 讀不到某一支就跳過,不要因此讓整條規則失效
      }
    }
  }

  sharedVarCache = { root, usedBy }

  return usedBy
}

const checkSharedVarScope = ({ rel, text: raw, root }) => {
  if (!SHARED_MODULE_VARIABLES || !rel.endsWith(SHARED_MODULE_VARIABLES)) return []

  const text = maskCssComments(raw)
  const defined = new Set([...text.matchAll(VAR_DEFINE_RE)].map((m) => m[1]))

  return singleModuleVarsOf(defined, varUsersOf(root)).map(([name, owner]) => ({
    ...issueOf(
      rel,
      lineNoOf(text, text.indexOf(name)),
      'sharedVarScope',
      `${name} 只有 ${owner} 在用 —— 搬回那個模組自己的 Variables 檔;` +
        `留在共用檔的話,改它要開兩支檔案,而那個元件被刪掉時這一段不會有人想到要清`
    ),
  }))
}

// --- 規則 truncateClass:單行省略改用 line-clamp-1 ---------------------------
//
// tailwind 的 truncate 是「不換行 + 超出的部分顯示省略號」,只能做一行。
// 要改成兩行時它幫不上忙,得換成 line-clamp-2 —— 也就是換一個行數就換一種寫法,
// 而截幾行是會被調整的值(同一張卡片在列表裡一行、在詳情頁兩行)。
//
// line-clamp-1 做的是同一件事,而且與 line-clamp-2、line-clamp-3 是同一組,
// 改行數只動數字;一組級距寫成 --line-1 / --line-2 也才對得起來。
//
// 這條是建議級:truncate 現在這樣寫不會壞,只是改行數時要整句換掉。

const APPLY_RE = /@apply([^;{}]*)/g

const TRUNCATE_DETAIL =
  'truncate 改用 line-clamp-1 —— truncate 只能做一行,要換成兩行時得整句換成 line-clamp-2;' +
  'line-clamp 這一組改行數只動數字,截幾行才有辦法交給使用端決定'

/** 帶不帶 variant 前綴、有沒有 ! 都算同一個 utility */
const isTruncateClass = (cls) => utilityBodyOf(cls) === 'truncate'

/**
 * 兩個位置都看:樣式檔 `@apply` 後面的清單,以及畫面區段裡的 class 屬性。
 *
 * 畫面區段那一份走 templateClassTokensOf —— 動態綁定只取引號包住的字面值,
 * 所以 `:class="truncate"`(把行數當 prop 傳進來的那種寫法)不會被算進來。
 */
const checkTruncateClass = ({ rel, text: raw }) => {
  /* 只看樣式檔與 .vue —— class 名稱只會寫在這兩種檔案裡。
     不限範圍的話,規則自己的驗證案例(程式碼裡寫著違規長相的字串)
     會被當成違規報出來,而那正是它該有的樣子。 */
  if (!rel.endsWith('.css') && !rel.endsWith('.vue')) return []

  const text = maskCssComments(raw)
  const issues = []

  for (const m of text.matchAll(APPLY_RE)) {
    if (m[1].split(/\s+/).some(isTruncateClass)) {
      issues.push(warnOf(rel, lineNoOf(text, m.index), 'truncateClass', TRUNCATE_DETAIL))
    }
  }

  if (rel.endsWith('.vue')) {
    for (const { cls, index } of templateClassTokensOf(raw)) {
      if (isTruncateClass(cls)) {
        issues.push(warnOf(rel, lineNoOf(raw, index), 'truncateClass', TRUNCATE_DETAIL))
      }
    }
  }

  return issues
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
  `(--[\\w-]*?)-(${Object.keys(SHORT_OF)
    .sort((a, b) => b.length - a.length)
    .join('|')})(?![\\w-])\\s*:`,
  'g'
)

// --- 規則 unknownVar:用到沒有定義的 css 變數 ---------------------------------
//
// `var(--不存在)` **不會報錯** —— 瀏覽器把整條宣告丟掉就算了。
// 症狀是「框線和底色整片不見」,而每一個檢查工具都顯示通過:
// 那個落差很難從結果反推原因。
//
// 最常踩到的時機是把元件搬到另一個專案 —— 那邊的色票命名不一樣,
// 元件引用的名字一個都對不上,整批樣式安靜地失效。
//
// 定義有兩種形狀,兩種都要認:樣式裡的 `--x: 值`,以及元件動態綁定的
// `'--x': 值`(名字包在引號裡)。少認後者的話,那些由程式算出來的尺寸
// 會被整批誤報,而它們完全正確。
//
// 帶後備值的 `var(--x, 20px)` 不算 —— 那是刻意寫的,變數沒有時用後備值,
// 樣式不會消失。

// 與色票那一套的界線:那邊問「這個**色值**有沒有現成的變數」(色值 → 變數名,
// 只看色票目錄),這裡問「這個**名字**有沒有被定義過」(名字 → 有或沒有,要看全案
// —— 模組變數、元件動態綁的也算)。兩個問題不同,所以各自收集,不共用同一份索引。

/* 變數引用的那兩個比對式收在 shared.mjs —— 元件介面那份名單也要問同一件事
  (「這個變數有沒有人讀」),而那一支不能反過來 import 這裡:會變成循環相依。 */

/* 色票類的變數要另外看一眼 —— 見下方 paletteVarsOf。

  「全案找得到定義」對色票來說不夠:色票是**全域載入**的那一支
  (色票目錄底下的那幾支),而別的地方也可能定義出同名的變數 ——
  元件自己的 variables.css、頁面裡動態綁的 style。那幾支是跟著元件
  或那一頁載入的,使用端在別處的話根本讀不到。

  症狀與打錯字一模一樣:瀏覽器讀不到變數就把整條宣告丟掉,顏色整片不見,
  而四個檢查時機全部顯示通過 —— 那正是這條規則說明裡想防的情況,
  只是原本的判準防得了打錯字、防不了「定義在讀不到的地方」。

  判準只看名字:名字以色相開頭的(--red-…、--gray-…、--white)就是色票,
  那種一律要在色票檔裡定義。色相清單取色票那一套的同一份,不在這裡重寫。 */
const isPaletteName = (name) => {
  const body = name.replace(/^--/, '')

  return HUE_ORDER.some((hue) => body === hue || body.startsWith(`${hue}${COLOR_NAME_SEPARATOR}`))
}

let definedVarCache = null
let paletteVarCache = null

registerScanCache(() => {
  definedVarCache = null
  paletteVarCache = null
})

/** 色票檔裡定義了哪些變數 —— 那幾支是全域載入的,任何地方都讀得到 */
const paletteVarsOf = (root) => {
  if (paletteVarCache?.root === root) return paletteVarCache.set

  const set = new Set()

  for (const dir of SCAN_TARGETS) {
    for (const abs of listFiles(root, dir)) {
      const rel = toRel(root, abs)
      if (!isColorCssPath(rel)) continue

      try {
        const text = maskComments(rel, readTextCached(abs) ?? '')
        for (const m of text.matchAll(VAR_DEFINE_RE)) set.add(m[1])
      } catch {
        // 讀不到某一支就跳過,不要因此讓整條規則失效
      }
    }
  }

  paletteVarCache = { root, set }

  return set
}

/**
 * 全案定義過的 css 變數 —— 名字對到它的值。
 *
 * 一支一支檔案各自掃全案的話會慢得離譜,所以整份建一次索引 ——
 * 與「誰被定義過」那一類的判斷同一個做法。
 *
 * 兩條規則問這一份:「這個名字有沒有被定義過」只看名字,
 * 「這個變數裝的是長度還是顏色」要看值。收兩份索引的話同一批檔案掃兩次,
 * 而且有一天會出現「一邊看得到、另一邊看不到」的差異。
 *
 * 同一個名字在好幾個斷點各定義一次時留最後一個 ——
 * 那幾份的形狀是一樣的(都是長度或都是顏色),問型別時取哪一個都相同。
 */
const definedVarsOf = (root) => {
  if (definedVarCache?.root === root) return definedVarCache.set

  const set = new Map()

  for (const dir of SCAN_TARGETS) {
    for (const abs of listFiles(root, dir)) {
      if (!/\.(css|vue|js)$/i.test(abs)) continue

      try {
        const text = maskComments(toRel(root, abs), readTextCached(abs) ?? '')
        for (const m of text.matchAll(VAR_DEFINE_RE)) set.set(m[1], m[2].trim())
      } catch {
        // 讀不到某一支就跳過,不要因此讓整條規則失效
      }
    }
  }

  definedVarCache = { root, set }

  return set
}

const checkUnknownVar = ({ rel, text: raw, root }) => {
  if (!isInSrc(rel) || !/\.(css|vue)$/i.test(rel)) return []

  const text = maskComments(rel, raw)

  /* 全案索引 + 這支檔案自己定義的。
     自己那一份要另外算 —— 索引是整份建好之後快取的,而存檔守門拿到的是
     **還沒寫進磁碟**的內容:剛加的變數不在索引裡,會被報成「找不到定義」。 */
  const defined = definedVarsOf(root)
  const own = new Set()
  for (const m of text.matchAll(VAR_DEFINE_RE)) own.add(m[1])

  const issues = []
  const seen = new Set()

  /* 兩種引用寫法都要看:`var(--x)` 與方括號那種(`text-[--x]`)。
     方括號那種編譯出來就是 var(),壞掉的方式一樣,只是沒有後備值可寫。 */
  const uses = [
    ...[...text.matchAll(VAR_USE_RE)].map((m) => ({
      name: m[1],
      index: m.index,
      hasFallback: m[2] === ',',
    })),
    ...[...text.matchAll(ARBITRARY_VAR_RE)].map((m) => ({
      name: m[1],
      index: m.index,
      hasFallback: false,
    })),
  ]

  const palette = paletteVarsOf(root)
  const inColorCss = isColorCssPath(rel)

  for (const { name, index, hasFallback } of uses) {
    if (hasFallback) continue // 有後備值,變數缺了也不會讓樣式消失
    if (seen.has(name)) continue

    /* 色票類的名字要在色票檔裡找得到 —— 定義在元件自己的 variables.css
       或某一頁裡的不算,那幾支是跟著元件或那一頁載入的,使用端在別處就讀不到。
       色票檔自己那幾支不受這條約束:它們正在定義色票,引用同一組是正常的。 */
    if (isPaletteName(name) && !inColorCss) {
      if (palette.has(name) || own.has(name)) continue

      seen.add(name)

      issues.push(
        issueOf(
          rel,
          lineNoOf(text, index),
          'unknownVar',
          defined.has(name)
            ? `${name} 是色票,卻不在色票檔裡 —— 它定義在別的地方(元件自己的變數檔、` +
                `或某一頁裡動態綁的),那幾支是跟著那個元件或那一頁載入的,這裡讀不到;` +
                `瀏覽器讀不到就把整條宣告丟掉,顏色整片不見,而且不會有任何錯誤訊息。` +
                `把它搬進色票檔,或改用色票裡已經有的那一個`
            : `${name} 全案找不到定義 —— 瀏覽器會把整條宣告丟掉,` +
                `畫面上那一段樣式直接消失,而且不會有任何錯誤訊息;` +
                `先確認變數名有沒有打錯,或那個色票還沒建立`
        )
      )
      continue
    }

    if (defined.has(name) || own.has(name)) continue

    seen.add(name)

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, index),
        'unknownVar',
        `${name} 全案找不到定義 —— 瀏覽器會把整條宣告丟掉,` +
          `畫面上那一段樣式直接消失,而且不會有任何錯誤訊息;` +
          `先確認變數名有沒有打錯,或那個色票 / 級距還沒建立`
      )
    )
  }

  return issues
}

const checkVariableNaming = ({ rel, text: raw }) => {
  if (!isModuleStyle(rel)) return []

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

const T_SHIRT_VAR_RE = new RegExp(`(--[\\w-]*?)-(${T_SHIRT_SIZE.join('|')})(?![\\w-])\\s*:`, 'g')

const checkTShirtSizing = ({ rel, text: raw }) => {
  if (!isModuleStyle(rel)) return []

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

// --- 規則 lengthTypeHint:長度值要標 length: ----------------------------------
//
// text- / border- / outline- / ring- 這四個同時有「長度」與「顏色」兩種版本。
// 值寫成變數時建置工具分不出是哪一種,**一律當成顏色**:
//
//   text-[--nav-description-text-size]    產出 color,字級完全沒有生效
//   text-[length:--nav-description-text-size]  產出 font-size,這才是要的
//
// 這是最難發現的一類:編譯通過、瀏覽器不報錯、檢查也是綠的,
// 畫面上只是那個字級或框線寬度沒有作用,要拿設計稿逐項比對才看得出來。
//
// 兩條路徑各自判定,誰先成立就報誰:
//
//   一、同一個宣告裡同一個 utility 出現兩次,而且至少一個沒標型別。
//      那一定有一個不會產出 —— 兩個都是同一個 CSS 屬性,後面的蓋掉前面的。
//      不必知道變數裝什麼就判得出來,零誤判。
//
//   二、單獨出現時,追那個變數的值。是長度就要標。
//      追不到、或值的形狀認不出來的一律不報 —— 這一段本來就是推測,
//      誤報一次之後整條規則就會被當成雜訊。

/** 數字開頭(帶不帶單位都算)或 calc(:這是長度 */
const LENGTH_LITERAL_RE = /^(?:-?\.?\d|calc\(|clamp\(|min\(|max\()/

/** 色碼與顏色函式:這是顏色 */
const COLOR_LITERAL_RE = /^(?:#|rgba?\(|hsla?\(|color\(|transparent\b|currentColor\b)/

/** 值只是「指向另一個變數」時,要追到那一個去問 */
const SINGLE_VAR_RE = /^var\(\s*(--[\w-]+)\s*\)$/

/**
 * 這個變數裝的是長度還是顏色 —— 認不出來時回 `''`。
 *
 * 值只是指向另一個變數時(斷點那一套就是這樣寫的:
 * `--popup-header-text-size: var(--popup-header-pc-text-size)`)要追過去,
 * 不追的話整個斷點機制底下的變數全部都答不出來。
 *
 * 追的深度有上限,而且走過的名字不再走第二次 ——
 * 兩個變數互相指向對方時(改壞的時候會出現)會一直追下去,
 * 那會讓整個檢查停在那裡,看起來像當掉。
 */
const varValueTypeOf = (name, vars, seen = new Set()) => {
  if (seen.has(name) || seen.size > 10) return ''
  seen.add(name)

  const value = vars.get(name)
  if (!value) return ''

  if (LENGTH_LITERAL_RE.test(value)) return 'length'
  if (COLOR_LITERAL_RE.test(value)) return 'color'

  const next = value.match(SINGLE_VAR_RE)?.[1]
  if (next) return varValueTypeOf(next, vars, seen)

  // 關鍵字(auto、inherit)、多段的值、認不得的寫法 —— 問不出來就不回答
  return ''
}

/**
 * 一個 class 的前綴、utility 名字與方括號裡的值;不是方括號寫法的回 null。
 *
 * 前綴要留著 —— `text-[--a]` 與 `hover:text-[--b]` 是兩個不同的狀態,
 * 不會互相蓋掉。把前綴剝掉之後分組的話,
 * 「常態一個顏色、滑過去換一個顏色」這種最普通的寫法會整批被報。
 */
const arbitraryClassOf = (cls) => {
  const body = utilityBodyOf(cls)
  const name = utilityNameFrom(body)
  if (!name) return null

  // 整個本體就是「名字 + 方括號值」才算;後面還跟著別的東西的不是
  const value = body.slice(name.length).match(/^-\[([^\]]*)\]$/)?.[1]
  if (value === undefined) return null

  return { name, value, prefix: cls.slice(0, cls.length - body.length) }
}

const TYPE_HINT_TAIL =
  '建置工具分不出方括號裡的變數是長度還是顏色,一律當成顏色 —— ' +
  '不標的話產出的是顏色那一種,畫面上那個值完全沒有生效,而且不會有任何錯誤訊息'

/**
 * 一段 class 清單裡該標而沒標型別的那幾個。
 *
 * `@apply` 後面那一串與畫面區段的 class 屬性是同一種東西(空白隔開的 class),
 * 所以兩個位置共用這一份判斷,不各寫一次。
 */
const missingTypeHintsIn = (classes, vars) => {
  const parsed = classes
    .map(arbitraryClassOf)
    .filter((one) => one && DUAL_TYPE_UTILITIES.has(one.name))

  /* **只看值是變數、而且沒標型別的那些。**

     字面值不在這條的範圍內:`text-[14px]` 產出 font-size、`text-[#fff]` 產出 color ——
     建置工具看得出帶單位的數字是長度、色碼是顏色,自己就分對了。
     所以 `text-[14px] text-[--gray-6b]` 兩個都會產出,那是正確的寫法。
     把字面值也算進來的話,那種寫法整批被報,而照著改成 text-[length:14px] 沒有任何意義。

     標了型別的(`length:` 開頭)本來就不是 `--` 開頭,一起被這一行濾掉。 */
  const untyped = parsed.filter((one) => one.value.startsWith('--'))

  const found = []

  /* 一、同一個 utility 有兩個以上「沒標型別的變數」。

     那幾個會全部被當成顏色 —— 同一個 CSS 屬性,後面的蓋掉前面的,
     其中至少一個不會產出。變數裝什麼不必知道就判得出來,這一段不會誤報。 */
  const byName = new Map()

  for (const one of untyped) {
    // 前綴一起當分組的依據 —— 不同前綴是不同狀態,不會互相蓋掉
    const key = `${one.prefix}${one.name}`
    byName.set(key, [...(byName.get(key) ?? []), one])
  }

  const reported = new Set()

  for (const group of byName.values()) {
    if (group.length < 2) continue

    for (const one of group) reported.add(one)

    const { name, prefix } = group[0]
    const list = group.map((one) => `${prefix}${name}-[${one.value}]`).join('、')

    found.push({
      detail:
        `同一段裡有 ${group.length} 個沒標型別的 ${prefix}${name}-(${list})—— ` +
        `${TYPE_HINT_TAIL};` +
        `這幾個會被當成同一個屬性,只有最後一個產得出來。` +
        `其中管長度的那一個要標成 ${prefix}${name}-[length:--變數名]`,
    })
  }

  /* 二、單獨出現的那些,追變數的值。
     追不出來的不報 —— 這一段是推測,誤報一次整條規則就會被當成雜訊。 */
  for (const one of untyped) {
    if (reported.has(one)) continue
    if (varValueTypeOf(one.value, vars) !== 'length') continue

    found.push({
      detail:
        `${one.name}-[${one.value}] 的值是長度(${vars.get(one.value)}),` +
        `要寫成 ${one.name}-[length:${one.value}] —— ${TYPE_HINT_TAIL}`,
    })
  }

  return found
}

const checkLengthTypeHint = ({ rel, text: raw, root }) => {
  /* 只看樣式檔與 .vue —— class 名稱只會寫在這兩種檔案裡。
     不限範圍的話,規則自己的驗證案例(程式碼裡寫著違規長相的字串)
     會被當成違規報出來,而那正是它該有的樣子。 */
  if (!rel.endsWith('.css') && !rel.endsWith('.vue')) return []

  const text = maskComments(rel, raw)
  const vars = definedVarsOf(root)

  /* 這支檔案自己定義的要另外算 —— 索引是整份建好之後快取的,
     而存檔守門拿到的是還沒寫進磁碟的內容:剛加的變數不在索引裡。 */
  const own = new Map(vars)
  for (const m of text.matchAll(VAR_DEFINE_RE)) own.set(m[1], m[2].trim())

  const issues = []

  for (const m of text.matchAll(APPLY_RE)) {
    for (const { detail } of missingTypeHintsIn(m[1].split(/\s+/).filter(Boolean), own)) {
      issues.push(issueOf(rel, lineNoOf(text, m.index), 'lengthTypeHint', detail))
    }
  }

  if (rel.endsWith('.vue')) {
    /* 畫面區段的 class 一個一個來 —— 那一份拿到的是單一 class 與它的位置,
       而「同一段裡出現兩次」要看整組。

       分組看的是「寫在同一個字串字面值裡」,不是「同一個屬性」——
       動態綁定常常是互斥的分支(`:class="isError ? 'text-[--紅]' : 'text-[--灰]'"`),
       那兩個永遠不會同時出現在元素上,湊成一組就會對著它們誤報。 */
    const byChunk = new Map()

    for (const { cls, index, group } of templateClassTokensOf(raw)) {
      const at = byChunk.get(group) ?? { line: lineNoOf(raw, index), classes: [] }

      at.classes.push(cls)
      byChunk.set(group, at)
    }

    for (const { line, classes } of byChunk.values()) {
      for (const { detail } of missingTypeHintsIn(classes, own)) {
        issues.push(issueOf(rel, line, 'lengthTypeHint', detail))
      }
    }
  }

  return issues
}

// --- 規則 lengthTypeVar:標型別時不要包 var() --------------------------------
//
// `text-[length:--x]` 與 `text-[length:var(--x)]` 產出的 CSS 完全相同,
// 所以這條不是「會壞掉」,是**同一件事只能有一種寫法**:
//
//   要找出全站哪些地方標了型別時,兩種寫法得搜兩次,而搜的人不會知道要搜第二種。
//   規範寫的是變數名直接接在冒號後面,照著寫的人看到另一種會以為那是別的東西。

const LENGTH_VAR_WRAP_RE = /\[length:\s*var\(\s*(--[\w-]+)\s*\)\s*\]/g

const checkLengthTypeVar = ({ rel, text: raw }) => {
  if (!rel.endsWith('.css') && !rel.endsWith('.vue')) return []

  const text = maskComments(rel, raw)

  return [...text.matchAll(LENGTH_VAR_WRAP_RE)].map((m) =>
    issueOf(
      rel,
      lineNoOf(text, m.index),
      'lengthTypeVar',
      `[length:var(${m[1]})] 把變數包在 var() 裡 —— 寫成 [length:${m[1]}],變數名直接接在冒號後面;` +
        `兩種寫法產出的 CSS 一樣,但同一件事有兩種長相時,` +
        `要找出全站哪些地方標了型別就得搜兩次,而搜的人不會知道還有第二種`
    )
  )
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
/**
 * 模組樣式底下有沒有任何一支檔案符合條件。
 *
 * 兩種位置都要走過:元件自己的樣式在元件目錄底下,跨模組共用的變數在集中目錄。
 * 只看其中一種的話,樣式全部放在另一種位置的專案會得到「一個都沒用到」,
 * 而那個結論會讓前提檢查說反話。
 */
const someModuleCss = (root, test) => {
  const dirs = [...COMPONENT_DIRS, CSS_MODULES_DIR]
    .map((rel) => path.join(root, ...rel.split('/')))
    .filter((dir) => fs.existsSync(dir))

  if (!dirs.length) return false

  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)

      if (entry.isDirectory()) {
        if (walk(full)) return true
        continue
      }
      if (!entry.name.endsWith('.css')) continue
      if (test(readTextCached(full) ?? '')) return true
    }

    return false
  }

  return dirs.some(walk)
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

/**
 * 字級不吃斷點的豁免標記。
 *
 * 字級分兩種,而兩種的正確做法相反:全站只有一種樣貌的固定模組,字級寫在元件裡、
 * 分斷點定義成變數;到處會用到的通用元件則不寫死,留給使用端傳。
 *
 * 兩種在程式碼上長得一樣,工具分不出來 —— 但**兩種都不會需要這個標記**:
 * 前者照規範分斷點就通過了,後者根本不該把值寫在元件裡。
 * 放行的話,那個標記會讓「還沒決定由誰定」看起來像「決定過了」,
 * 而它蓋掉的正是唯一會提醒人去想這件事的那一筆。
 *
 * 命名規範要求字級一律以 -text-size 結尾,所以認名字就夠。
 */
const isTextSizeVar = (name) => name.endsWith('-text-size')

// --- 規則 breakpointVarOverride:斷點不要用覆蓋的 -----------------------------
//
// 同一條選擇器鏈裡的同一個變數,在基底與 `@screen` 區塊**各寫一次字面值**:
//
//    .home-index-header { --home-header-mt: -56px; }
//    @screen p { .home-index-header { --home-header-mt: -84px; } }
//
// 那是覆蓋 —— 值寫死在兩個地方,而畫面上看不出哪一個才是這個斷點在用的。
// 要改的時候得先找齊所有寫過它的位置,漏掉一個就是某個斷點停在舊值,不會報錯。
//
// 這一套本來的做法是「各斷點的值各有名字,斷點區塊只做指派」:
//
//    .home-index-header {
//      --home-header-mt: 0;
//      --home-header-pc-mt: -84px;
//      --home-header-tablet-mt: -56px;
//      --home-header-mobile-mt: -56px;
//    }
//    @screen p { .home-index-header { --home-header-mt: var(--home-header-pc-mt); } }
//
// 值集中在一處、斷點區塊看得出「這個斷點用哪一份」。
//
// 兩種寫法不算違規:
//
//    右邊是 var(…)        那正是上面那套機制,不是覆蓋
//    選擇器鏈不一樣       modifier 底下的級距(`&.--px-30`)是使用端傳 class 選的,
//                         與基底那一個本來就不是同一個東西

/**
 * 每一個變數宣告,連同它所在的選擇器鏈與「在不在 @screen 裡」。
 *
 * 逐字掃括號而不是用比對式:巢狀(`&.--x { … }`)與 `@screen` 包在一起時,
 * 比對式分不出某一行屬於哪一層,而分錯層的結果是把不同的東西當成同一個。
 */
const varDeclarationsOf = (text) => {
  const out = []
  const stack = []
  let buf = ''

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]

    if (c === '{') {
      stack.push(buf.trim().replace(/\s+/g, ' '))
      buf = ''
      continue
    }

    if (c === '}') {
      stack.pop()
      buf = ''
      continue
    }

    if (c === ';') {
      const m = buf.trim().match(/^(--[\w-]+)\s*:\s*(.+)$/)

      if (m) {
        out.push({
          name: m[1],
          value: m[2].trim(),
          chain: stack.filter((s) => !s.startsWith('@')).join(' '),
          inScreen: stack.some((s) => s.startsWith('@screen')),
          index: i,
        })
      }

      buf = ''
      continue
    }

    buf += c
  }

  return out
}

const checkBreakpointVarOverride = ({ rel, text: raw }) => {
  if (!rel.endsWith('.css') && !rel.endsWith('.vue')) return []

  const text = maskCssComments(raw)
  const byKey = new Map()

  for (const one of varDeclarationsOf(text)) {
    // 指派另一個變數就是那套機制本身,不是覆蓋
    if (one.value.startsWith('var(')) continue

    const key = `${one.chain}|${one.name}`
    const at = byKey.get(key) ?? { base: null, screen: null }

    if (one.inScreen) at.screen ??= one
    else at.base ??= one

    byKey.set(key, at)
  }

  const issues = []

  for (const { base, screen } of byKey.values()) {
    if (!base || !screen) continue

    issues.push(
      issueOf(
        rel,
        lineNoOf(text, screen.index),
        'breakpointVarOverride',
        `${screen.name} 在基底與斷點各寫了一次值(${base.value} → ${screen.value})—— ` +
          `那是覆蓋,值散在兩個地方,改的時候漏掉一處就是某個斷點停在舊值,不會報錯;` +
          `把各斷點的值各給一個名字(-pc- / -tablet- / -mobile-),斷點區塊只寫 ` +
          `${screen.name}: var(…) 做指派`
      )
    )
  }

  return issues
}

const checkBreakpointSet = ({ rel, text: raw }) => {
  if (!BREAKPOINTS.length) return []
  if (!isModuleStyle(rel)) return []

  /* 豁免看的是**這一組自己的那幾行**:這一組裡任何一行標了,就當成這一組刻意不成套
    (桌機平板用 mx、手機用 mt 那種,三行分屬兩個名字,標在哪一行都是在講同一件事)。

    整支檔案問一次的話,只要任何一處標了,那支檔案的每一組都不檢查了 ——
    而寫標記的人以為自己只豁免了那一組。一支變數檔通常有好幾十組,
    其餘的會安靜地失去檢查,之後漏掉一個斷點也不會有人發現。

    標記寫在註解裡,所以要拿還沒遮掉註解的那一份來看。 */
  const rawLines = raw.split(/\r?\n/)

  const text = maskCssComments(raw)
  const groups = new Map()

  for (const m of text.matchAll(BREAKPOINT_VAR_RE)) {
    const key = `${m[1]}|${m[3]}`
    const line = lineNoOf(text, m.index)

    if (!groups.has(key)) groups.set(key, { found: new Set(), line, lines: [] })
    groups.get(key).found.add(m[2])
    groups.get(key).lines.push(line)
  }

  const issues = []

  for (const [key, { found, line, lines }] of groups) {
    const missing = BREAKPOINTS.filter((b) => !found.has(b))
    if (!missing.length) continue

    const [prefix, suffix] = key.split('|')
    const exempt = lines.some((n) => hasExemptMark(rawLines[n - 1] ?? '', 'breakpoint'))

    if (exempt && !isTextSizeVar(`${prefix}-${suffix}`)) continue
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

const NEUTRAL_VALUE = new Set([
  '0',
  '0px',
  'auto',
  'none',
  'inherit',
  'initial',
  'transparent',
  '100%',
])

const checkBreakpointNeeded = ({ rel, text: raw }) => {
  if (!isModuleStyle(rel) || !isVariablesFile(rel)) return []

  /* 豁免是**一行一個**:標記寫在哪一行,就只放行那一行的變數。

    整支檔案問一次的話,只要任何一處標了,那支檔案的所有尺寸變數就都不檢查了 ——
    而寫標記的人以為自己只豁免了那一行。一支變數檔通常有好幾十個值,
    其中一個合理的例外會讓其餘全部安靜地失去檢查,之後新加的變數漏了斷點也不會有人發現。

    標記寫在註解裡,所以要拿還沒遮掉註解的那一份來看。
    遮掉之後註解變成空白,每一行都會被判成沒有標記。 */
  const rawLines = raw.split(/\r?\n/)

  const text = maskCssComments(raw)
  const root = text.match(/:root\s*\{([\s\S]*?)\n\}/)
  if (!root) return []

  const baseLine = lineNoOf(text, root.index)
  const issues = []

  root[1].split(/\r?\n/).forEach((raw, i) => {
    const m = raw.trim().match(/^(--[\w-]+)\s*:\s*([^;]+);/)
    if (!m) return

    const [, name, value] = m

    if (new RegExp(`-(${BREAKPOINT_ALT})-`).test(name)) return // 帶斷點名的那幾個由 checkBreakpointSet 看成不成套
    if (value.includes('var(')) return // 指向別的變數
    if (NEUTRAL_VALUE.has(value.trim())) return
    if (!SIZE_VALUE_RE.test(value.trim())) return

    /* 字級不受豁免 —— 使用端要能傳字級,那是這條規則的重點,
       標了也照樣要分斷點。 */
    const isTextSize = isTextSizeVar(name)
    if (!isTextSize && hasExemptMark(rawLines[baseLine + i - 1] ?? '', 'breakpoint')) return

    issues.push(
      issueOf(
        rel,
        baseLine + i,
        'variable',
        `${name}: ${value.trim()} 是尺寸值卻沒有分斷點 —— 拆成 ${name.replace(/^--/, '--')}(中性)加上 -pc- / -tablet- / -mobile- 三份;三個斷點值相同也要拆` +
          (isTextSize
            ? ';字級不吃豁免標記 —— 固定模組的字級照規範分斷點就通過了,通用元件的字級本來就不該寫在元件裡,兩種都不需要那個標記'
            : '(例外請標 /* lint-breakpoint-exempt: 理由 */)')
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

/**
 * 從檔案路徑推出這支 css 允許的 class 前綴;推不出來回傳 null(不檢查)。
 *
 * 元件的樣式與它的 .vue 放在同一個資料夾,所以資料夾名就是模組名 ——
 * mForm 那個資料夾底下的每一支 css,class 一律是 `m-form` 開頭。
 *
 * 資料夾名怎麼推成前綴由 classPrefixOf 決定(元件的 template 那側問的是同一件事)。
 */
const modulePrefixOf = (rel) => classPrefixOf(moduleFolderOf(rel))

/**
 * 建置工具的關聯機制 class —— 不是任何模組的 class,而是「父層或兄弟的狀態」的掛勾。
 *
 * 父層掛上它,底下的元件就能對父層的 hover / focus 有反應。使用端掛在外面,
 * 元件的樣式裡要寫得出那個條件,否則這種連動沒有辦法做。
 *
 * 具名的寫法(`group/card`)是同一種東西,取斜線前那一段比對。
 *
 * 這幾個名字由建置工具定義,與專案無關,所以寫在規則裡,不進專案設定。
 */
const STRUCTURAL_CLASSES = new Set(['group', 'peer'])

const isStructuralClass = (cls) => STRUCTURAL_CLASSES.has(cls.split('/')[0])

const checkModuleScope = ({ rel, text }) => {
  if (!isModuleCss(rel)) return []

  const prefix = modulePrefixOf(rel)
  if (!prefix) return []

  const issues = []
  const seen = new Set()

  /* 「選擇器裡出現過哪些 class」的抽取收在 shared.mjs 一份 ——
     元件那一側也要問同一件事(寫出來的 class 有沒有對應的樣式)。
     各寫一份的話,其中一邊修了誤判、另一邊沒修,
     兩條規則就開始對同一份檔案講不同的話。 */
  for (const { cls: raw, line } of selectorClassesOf(text)) {
    // 斷點前綴要先剝掉 —— `&.p\:\-\-px-24` 的本體是 `--px-24`,那是 modifier
    const cls = stripVariants(raw)

    if (cls.startsWith('--')) continue // modifier / 狀態
    if (/^j[A-Z]/.test(cls)) continue // 純給 JS 抓的 hook class
    if (isStructuralClass(cls)) continue // 父層 / 兄弟狀態的掛勾,不是模組的 class
    if (isTransitionClass(cls)) continue // 轉場的六個 class,名字跟著 template 的 name 走
    if (cls === prefix || cls.startsWith(`${prefix}-`)) continue // 自己的 class
    if (seen.has(cls)) continue
    seen.add(cls)

    issues.push(
      issueOf(
        rel,
        line,
        'moduleScope',
        cls.startsWith('m-')
          ? `.${cls} 是別的模組的 class —— 這支檔案只能寫 .${prefix} 系列;變體的 class 也要收斂成 .${prefix}-* 開頭`
          : `.${cls} 不是 m- 開頭的模組 class —— 模組 css 只能寫 .${prefix} 系列與 --modifier`
      )
    )
  }

  return issues
}

// --- 規則 moduleLocation:元件的樣式要放在元件自己的資料夾 ---------------------
//
// 集中目錄是留給「跨模組共用的變數」的 —— 兩個以上的元件都要用、不屬於任何一支。
// 一支樣式的名字對得上某個實際存在的元件時,它就屬於那個元件,要搬過去。
//
// **這條擋的是一種安靜的失效。** class 前綴那條只看元件自己的樣式,
// 所以留在集中目錄的檔案不會被它檢查 —— 不是報錯,是完全沒有訊息:
// 違規數字還會因此變少,看起來像程式碼變好了。
// 規則改了位置而存量沒搬的專案,正是靠這條才知道有一批檔案沒有人在看。
//
// **歸屬只看檔名,不看裡面寫了哪些 class。** 用 class 反查看起來更準
// (「這支寫的是 .m-card-* 所以屬於 mCard」),實際上歸屬會變成不唯一:
// 一支樣式裡本來就會出現別的模組的 class(狀態掛勾、轉手傳進去的),
// 那時反查會指向好幾個元件,而規則只能挑一個說出來 —— 挑錯的那次,
// 照著搬就是把樣式放進不相干的元件資料夾。
// 檔名對不上元件的那幾支,由 componentFolder 與 componentClass 從元件那一側看。

/** 這個名字對得上哪一個實際存在的元件 —— 對不上回 null(那就是共用的,留在原地) */
const componentDirOf = (root, name) => {
  for (const dir of COMPONENT_DIRS) {
    const base = path.join(root, ...dir.split('/'))
    if (!fs.existsSync(base)) continue

    const found = findComponentFolder(base, name)
    if (found) return toRel(root, found)
  }

  return componentDirByClass(root, name)
}

/**
 * 用 class 前綴反查元件 —— 名字對不上時的第二種找法。
 *
 * 樣式資料夾的名字跟著**元件的 class** 走,不是跟著檔名:class 是 `m-figure`
 * 的元件,樣式資料夾就叫 `mFigure/`,而那支 `.vue` 可能叫別的名字。
 * 只比對名字的話,那種元件的樣式會被判成「跨模組共用的,留在集中目錄是對的」
 * 而放行 —— 然後 class 前綴那條只看元件自己的樣式,也不會檢查它。
 * 兩條規則都靜靜略過,那支樣式從此沒有人在看。
 *
 * 所以退一步:把資料夾名推成 class 前綴,再找哪一支元件寫的就是那個 class。
 * 只在名字對不上時才做 —— 名字對得上的那些不必讀任何檔案內容。
 */
const componentDirByClass = (root, name) => {
  const prefix = classPrefixOf(name)
  if (!prefix) return null

  for (const dir of COMPONENT_DIRS) {
    const base = path.join(root, ...dir.split('/'))
    if (!fs.existsSync(base)) continue

    const found = findComponentByClass(base, prefix, name)
    if (found) return toRel(root, found)
  }

  return null
}

/**
 * 走訪元件目錄,找 template 寫著這個 class 的那一支,回傳樣式該搬去的資料夾。
 *
 * 那支元件已經在自己的資料夾裡(資料夾名推得出同一個 class)就回傳它;
 * 還直接放在分類層底下的話,回傳它**應該要有**的那個資料夾 ——
 * 名字跟著 class 走,與樣式資料夾同名,搬完兩邊就對得起來了。
 */
const findComponentByClass = (dir, prefix, name) => {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name)

    if (item.isDirectory()) {
      const deeper = findComponentByClass(full, prefix, name)
      if (deeper) return deeper
      continue
    }

    if (!item.name.endsWith('.vue')) continue
    if (componentClassOf(readTextCached(full) ?? '') !== prefix) continue

    return classPrefixOf(path.basename(dir)) === prefix ? dir : path.join(dir, name)
  }

  return null
}

/**
 * 這個資料夾是元件本身,還是只是把元件分類起來的一層 ——
 * 直接放著 `.vue` 的才是元件。
 *
 * 元件目錄底下常常先分幾個大類(共用的、某個功能的),每一類底下才是元件。
 * 分類層不分辨出來的話,一支放在分類資料夾底下的樣式會被判成「屬於那個分類」,
 * 而照著搬的結果是好幾個元件的樣式全堆進同一個資料夾 ——
 * 元件與樣式的對應關係反而消失,正好是這條規則要達成的相反。
 */
const isComponentFolder = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .some((item) => item.isFile() && item.name.endsWith('.vue'))

/** 走訪元件目錄,找同名的元件資料夾或同名的 .vue(後者代表那支元件還沒有自己的資料夾) */
const findComponentFolder = (dir, name) => {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name)

    if (item.isDirectory()) {
      if (item.name === name && isComponentFolder(full)) return full

      /* 名字對上了但那是分類層時也繼續往深處找 ——
         同一個名字可能在更底下有一個真的元件。 */
      const deeper = findComponentFolder(full, name)
      if (deeper) return deeper
      continue
    }

    if (item.name === `${name}.vue`) return path.join(dir, name)
  }

  return null
}

/**
 * 這支樣式有沒有版型規則 —— class 的定義,或 `@apply`。
 *
 * 集中目錄那一層的定位是「跨模組共用的**變數**」,所以有沒有版型規則
 * 就是「位置對不對」的判準,與「對應的元件存不存在」無關。
 *
 * 只看元件在不在的話,還沒建元件就先寫樣式的那一種完全抓不到 ——
 * 規則一筆都不報,檢查顯示通過,而那支樣式從此不會被
 * 「模組 css 只能寫自己那組 class」檢查,也沒有任何訊息。
 *
 * `:root` 與 `@screen` 底下純粹指派變數的不算版型 —— 那正是這一層該放的東西。
 */
const hasLayoutRules = (text) => /@apply\b/.test(text) || /^[^@\n]*\.[\w\\-]+[^{}\n]*\{/m.test(text)

// --- 規則 moduleCssUnused:樣式檔要有人載入 -----------------------------------
//
// 樣式檔不會自己生效 —— 沒有任何元件 import 它的話,**整支一行都不會輸出**。
//
// 那是完全沒有徵狀的一種壞法:檔案還在、語法正確、全案檢查通過,
// 只有畫面上少了那一整批樣式。而「少了樣式」看起來常常像設計本來就長那樣。
//
// 兩種情況都是它在抓:
//
//   新加了一支卻忘了 import        最容易發生的一步
//   元件改寫時把 import 拿掉了     整支樣式從此靜靜地沒有作用
//
// 範圍是元件自己的樣式目錄裡每一支 css,不限檔名 ——
// 只看其中幾種的話,其餘那些沒人 import 也不會被發現。
//
// **載入的方式有兩種,兩種都算。** 元件在 <script> 裡 import 是一種;
// 另一種是接手的專案把自己拆出去的那幾支,用 css 的 `@import` 從
// styleProject.css(或別的已經被載入的樣式)接進來 —— 那一支照樣會輸出。
// 只認前者的話,照著規範接的人會被報一筆違規,而照訊息去 .vue 加一行,
// 又違反「不要自己多加 import」那一條:兩邊都過不了。

/* css 自己的 @import。兩條規則都要認它:這一條問「有沒有人接這支」,
  styleProjectImport 問「接進來的那幾支叫什麼名字」。 */
const CSS_AT_IMPORT_RE = /@import\s+(?:url\()?['"]([^'"]+)['"]/g

const checkModuleCssUnused = ({ rel, root }) => {
  if (!isModuleCss(rel)) return []

  const cssDir = path.dirname(path.join(root, ...rel.split('/')))
  const issues = []

  const componentDir = path.dirname(cssDir)
  const fileName = path.basename(rel)

  let imported = false
  let items

  /* 先看同一層的樣式有沒有用 @import 接它。

     接進來的那一支自己有沒有人載入是它自己的事 —— 這裡只回答
     「有沒有人接這一支」。整條鏈都沒人載入的話,鏈頭那一支會被報,
     訊息指的就是真正要處理的位置。 */
  try {
    for (const item of fs.readdirSync(cssDir, { withFileTypes: true })) {
      if (!item.isFile() || !item.name.endsWith('.css') || item.name === fileName) continue

      const text = fs.readFileSync(path.join(cssDir, item.name), 'utf8')

      for (const m of text.matchAll(CSS_AT_IMPORT_RE)) {
        if (path.basename(m[1]) === fileName) imported = true
      }

      if (imported) break
    }
  } catch {
    // 讀不到樣式那一層時問不出來,交給下面那一段看 .vue
  }

  if (imported) return issues

  /* try 只包「讀檔」這一件事。

     把整段邏輯都包進去的話,程式本身的錯誤(少 import 一個名字那種)
     也會被這個 catch 接走,而接走之後規則安靜地不再檢查任何東西 ——
     引擎本來會把它報成 ruleCrashed,包太大就等於把那道保護關掉。 */
  try {
    items = fs.readdirSync(componentDir, { withFileTypes: true })
  } catch {
    return issues // 讀不到元件那一層時問不出來,不報 —— 報了也指不出要改哪裡
  }

  for (const item of items) {
    if (!item.isFile() || !item.name.endsWith('.vue')) continue

    let text

    try {
      text = fs.readFileSync(path.join(componentDir, item.name), 'utf8')
    } catch {
      continue // 這一支讀不到就跳過它,別的還是要看
    }

    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3] ?? ''
      if (path.basename(spec) === fileName) imported = true
    }

    if (imported) break
  }

  if (!imported) {
    issues.push(
      issueOf(
        rel,
        1,
        'moduleCssUnused',
        `沒有人載入這支 —— 樣式檔不會自己生效,整支一行都不會輸出,` +
          `而畫面上少了那一整批樣式看起來常常像設計本來就長那樣。` +
          `接手的專案自己拆出去的樣式,從 styleProject.css 用 @import './${fileName}' 接;` +
          `元件本身要載的才寫進 .vue(import './${MODULE_CSS_DIR_NAME}/${fileName}')。` +
          `真的用不到了就把這支刪掉`
      )
    )
  }

  return issues
}

// --- 規則 styleProjectImport:從接點拆出去的樣式要看得出歸屬 ----------------
//
// styleProject.css 是接手的專案往元件裡加東西的唯一接點。從它 @import 出去的
// 那幾支與來源的樣式躺在同一個資料夾裡,檔名看不出歸屬的話,下一次整套更新時
// 沒有人分得出哪幾支是來源的、哪幾支是這個站自己加的。
//
// 兩種結尾,各對應一層:
//
//   <自己那一組>VariablesProject.css   變數
//   <自己那一組>Project.css            版型
//
// 變數那一種要分得出來還有第二個理由:整組變數規則靠檔名認它
// (見 isVariablesFile)—— 名字不對的話它被當成版型檔,斷點要成套、
// 命名要對齊 tailwind、斷點不要用覆蓋寫那幾條對它全部不作用,
// 而那幾條不作用時不會有任何訊息,檢查照樣顯示通過。
//
// 接點只接同一層自己拆出去的那幾支。外部套件的樣式與全域那幾支走全域的
// 進入點 —— 從元件的樣式接進來的話,每一支載入它的元件都會輸出一份。

const STYLE_PROJECT_FILE = 'styleProject.css'

const checkStyleProjectImport = ({ rel, text: raw }) => {
  if (!isModuleStyle(rel) || path.basename(rel) !== STYLE_PROJECT_FILE) return []

  /* 遮掉註解再找 —— 這一支的檔頭本來就寫著 @import 的示範,
     照 raw 掃的話那幾行每次都被報成違規。 */
  const text = maskCssComments(raw)
  const issues = []

  /* **這一支只放 @import,樣式本身寫在拆出去的那幾支裡。**

    直接寫在這裡不會壞掉(它照樣輸出),所以單看畫面分不出來 ——
    分得出來的是檔名:拆出去的那幾支一眼看得出哪些是這個站自己加的,
    而全部堆在接點裡的話,這個站加了什麼要整支讀完才知道。

    遮掉註解之後,每一行要嘛是 @import、要嘛是空白 —— 還剩別的東西,
    那就是直接寫在接點裡的樣式。來源那一份只有檔頭註解,所以不會被報。 */
  const strayLine = text
    .split(/\r?\n/)
    .findIndex((line) => line.trim() && !/^\s*@import\b/.test(line))

  if (strayLine !== -1) {
    issues.push(
      issueOf(
        rel,
        strayLine + 1,
        'styleProjectImport',
        `樣式不要直接寫在這支接點裡 —— 它只放 @import,` +
          `內容拆到 <自己的那一組>Project.css(版型)與 ` +
          `<自己的那一組>VariablesProject.css(變數),再從這裡接。` +
          `主樣式那一組沿用來源的名字:common.css 對 commonProject.css、` +
          `variables.css 對 variablesProject.css。` +
          `直接寫在這裡照樣會輸出,所以畫面上分不出來 —— ` +
          `分得出來的是檔名:這個站自己加了什麼,看檔名就知道`
      )
    )
  }

  for (const m of text.matchAll(CSS_AT_IMPORT_RE)) {
    const spec = m[1]
    const name = path.basename(spec)
    const line = lineNoOf(text, m.index)

    if (!spec.startsWith('./') && !spec.startsWith('../')) {
      issues.push(
        issueOf(
          rel,
          line,
          'styleProjectImport',
          `${spec} 不是這個元件自己的樣式 —— 這支接點只接同一層拆出去的那幾支。` +
            `外部套件與全域樣式從全域的進入點載入:接在這裡的話,` +
            `每一支載入這個元件的地方都會再輸出一份`
        )
      )
      continue
    }

    if (/variables\.css$/i.test(name)) {
      issues.push(
        issueOf(
          rel,
          line,
          'styleProjectImport',
          `${name} 是來源那一層的命名 —— 這個專案自己拆出去的變數檔叫 ***VariablesProject.css。` +
            `沿用來源的名字,下一次整套更新時分不出這支是誰的`
        )
      )
      continue
    }

    if (!/project\.css$/i.test(name)) {
      issues.push(
        issueOf(
          rel,
          line,
          'styleProjectImport',
          `${name} 看不出是這個專案自己加的 —— 變數檔叫 ***VariablesProject.css、` +
            `版型檔叫 ***Project.css。變數那一種的名字還決定它受不受變數規則檢查` +
            `(斷點要成套、命名要對齊 tailwind),名字不對的話那幾條對它完全不作用`
        )
      )
    }
  }

  return issues
}

// --- 規則 styleProjectValue:接手的專案新加的版型不寫死尺寸 ------------------
//
// `***Project.css` 是接手的專案自己加上去的版型。尺寸寫死在這一層的話,
// 那個值在三個斷點都一樣 —— 而手機與桌機要同一個間距是少數情況,
// 多數是寫的當下只看了一個尺寸。要分斷點時得先把值搬進變數檔,
// 那時這個值已經散在好幾個地方了。
//
// **只管接手的專案新加的那幾支。** 來源的版型檔與既有的樣式不在範圍內 ——
// 那裡有十幾處單一值,而規則 moduleVar 明許「單一值可留在模組 css」。
// 一起擋的話來源自己就報一整排,而一條一直報改不了的東西的規則,
// 結果是整條被關掉。新加的東西照新規矩,存量不必先清。
//
// 判準與「變數該不該分斷點」同一份(SIZE_VALUE_RE / NEUTRAL_VALUE / 同一個豁免標記)——
// 兩邊各寫一次的話,改了其中一邊,同一個值在變數檔與版型檔的待遇會開始不一樣。
//
// 只看方括號裡的值(`gap-x-[4px]`)。這一層的樣式幾乎都走 @apply,
// 而純 css 宣告裡的字面值認起來誤報多(translateY(-50%) 那種位移不該分斷點)。

/**
 * 這幾個不必分斷點 —— 它們帶單位,但講的不是尺寸。
 *
 *   z        疊放順序。合法的值沒有單位,所以實際上掃不到它,
 *            列著是為了把「哪幾種不必分」講完整
 *   leading  行高。跟著字級走,而字級自己已經分斷點了
 *   tracking 字距。同一份字體在每個尺寸是同一個視覺密度
 *
 * 其餘一律要分 —— 換一個斷點而那個值不用改,是少數情況,
 * 多數是寫的當下只看了一個尺寸。
 */
const BREAKPOINT_FREE_UTILITIES = new Set(['z', 'leading', 'tracking'])

const checkStyleProjectValue = ({ rel, text: raw }) => {
  if (!isModuleStyle(rel)) return []
  if (!/project\.css$/i.test(path.basename(rel))) return []
  if (isVariablesFile(rel)) return [] // 變數檔那一種由 variable 那條看斷點

  const rawLines = raw.split(/\r?\n/)
  const issues = []

  // 豁免一行一個 —— 標記寫在註解裡,所以看還沒遮掉註解的那一份
  maskCssComments(raw)
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (hasExemptMark(rawLines[i] ?? '', 'breakpoint')) return

      /* 分號先換成空白再切 —— 不換的話,每一行最後那一個 utility
         帶著 `;`(`@apply … rounded-[4px];`),結尾就不是方括號,整個被跳過。
         一行只有最後一個會漏,所以漏掉的那幾筆看起來像是規則認不得某些寫法。 */
      for (const token of line.replace(/[;,]/g, ' ').split(/\s+/)) {
        const value = /\[([^\]]+)\]$/.exec(token)?.[1]?.trim()

        if (!value || NEUTRAL_VALUE.has(value)) continue
        if (!SIZE_VALUE_RE.test(value)) continue

        /* 「這個 class 是哪一個屬性」用共用的那一份判斷 ——
           自己切一次的話,名字帶連字號的那幾個(gap-x、inset-x)會切錯。 */
        const name = utilityNameFrom(utilityBodyOf(token))
        if (BREAKPOINT_FREE_UTILITIES.has(name)) continue

        issues.push(
          issueOf(
            rel,
            i + 1,
            'styleProjectValue',
            `${token} 的值是寫死的 —— 值定義在同一組的 ***VariablesProject.css 的 :root` +
              `(-pc- / -tablet- / -mobile- 三份,三個斷點值相同也要拆),` +
              `這裡讀中性的那個名字。寫死的話三個斷點都是同一個值,` +
              `而要分開時這個值已經散在好幾個地方了。` +
              `不必分斷點的只有疊放順序、行高與字距 —— ` +
              `其餘真的不必分的話,在**那一行的行尾**標 ` +
              `/* lint-breakpoint-exempt: 理由 */(標在上一行不算,而且不會有訊息說它沒生效)`
          )
        )
      }
    })

  return issues
}

const checkModuleLocation = ({ rel, text: raw, root }) => {
  if (!isSharedCss(rel)) return []

  /* 名字從路徑推:`<集中目錄>/mForm/common.css` 的模組名是 mForm,
     `<集中目錄>/mForm.css` 也是 —— 兩種擺法都有專案在用。

     集中目錄底下也可能先分一層類(`<集中目錄>/<分類>/mChart/common.css`),
     所以由深到淺試每一段資料夾名,第一個對得上實際元件的就是歸屬 ——
     只看第一段的話,那一段常常是分類名,會把一整批不同元件的樣式
     都判成屬於同一個「元件」。 */
  const parts = rel.slice(`${CSS_MODULES_DIR}/`.length).split('/')
  const folders = parts.slice(0, -1)
  const candidates = folders.length ? [...folders].reverse() : [parts[0].replace(/\.css$/i, '')]

  for (const moduleName of candidates) {
    const target = componentDirOf(root, moduleName)
    if (!target) continue

    return [
      issueOf(
        rel,
        1,
        'moduleLocation',
        `這支樣式屬於元件 ${moduleName} —— 搬進 ${target}/${MODULE_CSS_DIR_NAME}/,` +
          `留在集中目錄的話「模組 css 只能寫自己那組 class」那條不會檢查它,而且沒有任何訊息。` +
          `搬過去的檔名:版型檔叫什麼都可以,變數檔一律以 variables.css 結尾 ——` +
          `載入順序那條靠這個名字認出它,名字不對就不再檢查「變數要先定義完」`
      ),
    ]
  }

  /* 對不上任何現成的元件,但**名字是元件的命名**而且寫了版型規則 ——
     那是「元件還沒建,樣式先寫」。

     只認得出已存在的元件的話,這一種一筆都不會報:檢查顯示通過,
     而那支樣式從此不被「模組 css 只能寫自己那組 class」檢查,也沒有任何訊息。

     名字要像元件才報 —— 這一層本來就允許放跨模組共用的東西,
     不看名字的話,那些共用的會被逼著搬進某一個元件的資料夾,
     而另一個元件就得去 import 別人的檔案。 */
  const moduleName = candidates.find((name) => classPrefixOf(name))
  if (!moduleName) return []
  if (!hasLayoutRules(maskCssComments(raw))) return []

  return [
    issueOf(
      rel,
      1,
      'moduleLocation',
      `集中目錄只放跨模組共用的變數,這支寫了版型規則(class 的定義或 @apply)—— ` +
        `它屬於某一個元件,建 ${COMPONENTS_DIR}/${moduleName}/ 並把樣式收進那裡的 ` +
        `${MODULE_CSS_DIR_NAME}/;留在這裡的話「模組 css 只能寫自己那組 class」那條不會檢查它,` +
        `而且沒有任何訊息`
    ),
  ]
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
const COLOR_VALUE_RGBA_RE =
  /^rgba\(\s*(#[0-9a-fA-F]{3,8}|var\(\s*--[\w-]+\s*\))\s*,\s*([0-9.]+)\s*\)$/

/**
 * 色票檔:把 rgba() 的值換成 8 碼,名字跟著重算。
 *
 * `hexToRgb()` 的那幾筆完全不動 —— 它們要走另一條路(先問人)。
 *
 * **有兩組以上主題的色票整支不動。** 那種檔案裡同一個名字在每一組各有一份、
 * 值不同,改名要連帶決定每一組的新名字與新值,而深淺主題的顏色是設計決定 ——
 * 工具算得出其中一組,算不出另一組該配什麼。這種檔案由 colorFile 那條報出來由人改。
 */
const fixColorFileRgba = (text, index) => {
  const blocks = parseColorBlocks(text)
  if (blocks.length !== 1) return null

  const [block] = blocks
  const renamed = []
  const decls = []

  for (const d of block.items) {
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

  if (!renamed.length && decls.every((d, i) => d.value === block.items[i].value)) return null

  return { text: writeColorBlock(text, block, decls), added: [], renamed }
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

/* 空的 class 屬性 —— `class=""`、`class=" "`、`:class=""`。

  多半是刪掉最後一個 class 之後留下來的空殼。它不會出錯、也不會影響畫面,
  但搜尋 class 名、比對兩支元件的時候會一直跳出來,而且下一個人看到
  會猶豫「這裡是不是本來要放什麼」。

  只清「整個屬性都是空的」那種 —— class="--x" 這類有內容的完全不碰。
  動態綁定的 `:class=""` 同樣是空的,一起清。 */
const EMPTY_CLASS_ATTR = /\s+:?class=(["'])\s*\1/g

export const onRemoveEmptyClassAttr = (text, { rel = '' } = {}) => {
  // 只處理 .vue 的畫面區段;.js / .css 裡出現這串多半是字串內容,不要動
  if (!/\.vue$/i.test(rel)) return null

  const out = text.replace(
    /(<template\b[^>]*>)([\s\S]*)(<\/template>)/i,
    (_m, open, body, close) => `${open}${body.replace(EMPTY_CLASS_ATTR, '')}${close}`
  )

  return out === text ? null : out
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

/**
 * 這個專案自己的規則 —— 有些規範只有這個專案需要,不適合放進每個專案都拿到的那一套。
 *
 * 放在 `.tools/lint/rules-project.mjs`,**有就讀、沒有就跳過**。
 * 那支檔案要匯出三樣東西,形狀與別的規則檔一樣:
 *
 *   PROJECT_CHECKS      檢查函式,每一支收 ctx、回傳違規陣列
 *   PROJECT_RULE_TITLE  代號 → 標題
 *   PROJECT_RULE_HINT   代號 → 怎麼修
 *   PROJECT_CASES       驗證案例(self-test 會讀,形狀與它裡面的案例相同)
 *
 * **代號一律以 `project:` 開頭。** 不加前綴的話,專案自己的規則有一天會與
 * 來源的規則撞名 —— 那時同一個代號底下有兩種判準,而看訊息的人分不出是哪一種。
 * 前綴也讓人一眼看出「這條只有這個專案有」,搬到別的專案時不必猜。
 *
 * **來源整套覆蓋時不會動到這支檔案**(它不在來源裡),所以專案自己的規則不會被蓋掉。
 * 反過來,這支檔案裡的東西也不該複製回來源 —— 那是這個專案的需求,
 * 每個專案都拿到的話,不需要的那幾個會被迫標例外。
 */
const loadProjectRules = () => {
  const file = path.join(root, '.tools', 'lint', 'rules-project.mjs')
  if (!fs.existsSync(file)) return { checks: [], title: {}, hint: {} }

  let mod

  try {
    mod = require(file)
  } catch (err) {
    /* 載不起來時**講出來**,不要安靜地當作沒有這些規則 ——
       那個專案自己的規範會從此完全不檢查,而檢查結果顯示通過。 */
    console.error(
      `[lint] .tools/lint/rules-project.mjs 載不起來,這個專案自己的規則這次沒有跑:\n` +
        `    ${err.message}`
    )

    return { checks: [], title: {}, hint: {} }
  }

  const checks = mod.PROJECT_CHECKS ?? []
  const title = mod.PROJECT_RULE_TITLE ?? {}
  const hint = mod.PROJECT_RULE_HINT ?? {}

  /* 代號沒有前綴時**講出來並跳過那一條** —— 靜靜地收下的話,
     它會與來源的規則混在同一份清單裡,撞名時沒有人看得出來。 */
  const bad = Object.keys(title).filter((code) => !code.startsWith(PROJECT_RULE_PREFIX))
  if (bad.length) {
    console.error(
      `[lint] .tools/lint/rules-project.mjs 的代號要以 ${PROJECT_RULE_PREFIX} 開頭:${bad.join('、')}`
    )
  }

  return { checks, title, hint }
}

/** 專案自己的規則代號一律用這個開頭 —— 與來源的規則分得開 */
export const PROJECT_RULE_PREFIX = 'project:'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')

/* **同步載入,這一支不可以有 top-level await。**

  這支引擎會被接進開發伺服器,而建置設定檔是先被打包起來才執行的 ——
  打包出來的格式不支援 top-level await,於是建置在「打包設定檔」那一步就失敗,
  錯誤訊息指向引擎內部,從訊息看不出原因其實出在設定檔的打包格式。

  來源這邊的外掛是開子行程跑檢查(見 dev-server-plugin),不會把引擎拉進去 ——
  所以這件事在這裡永遠不會發生,要到別的專案改用直接 import 才會炸。 */
const PROJECT_RULES = loadProjectRules()

const CHECKS = [
  checkLiteralColor,
  checkColorFile,
  checkTailwindInComponents,
  checkDeadThemeClass,
  checkModuleImportOrder,
  checkModuleScope,
  checkModuleLocation,
  checkModuleCssUnused,
  checkStyleProjectImport,
  checkStyleProjectValue,
  checkModuleVariables,
  checkTruncateClass,
  checkSharedVarScope,
  checkBreakpointPrefix,
  checkVariableNaming,
  checkUnknownVar,
  checkLengthTypeHint,
  checkLengthTypeVar,
  checkTShirtSizing,
  checkThemeNaming,
  checkBreakpointSet,
  checkBreakpointVarOverride,
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
  // 這個專案自己的規則(有的話)—— 見下方 loadProjectRules
  ...PROJECT_RULES.checks,
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
    } catch (err) {
      /*
       * 單條規則壞掉不讓整個檢查停擺,但**一定要講出來**。
       *
       * 安靜地回傳空陣列的話,那條規則從此不再抓任何東西,而畫面上顯示的是通過 ——
       * 最常見的成因是搬了函式卻沒搬它的 import(執行到那一行才爆),
       * 那種錯誤放著沒有人會發現。
       *
       * 報成違規而不是印在旁邊:違規會跟著五層守門一起出現在存檔、commit、
       * 對話提醒裡,印在旁邊的訊息只有當下跑指令的人看得到。
       */
      return [
        issueOf(
          rel,
          1,
          'ruleCrashed',
          `規則 ${check.name || '(匿名)'} 這次執行失敗,它沒有檢查這支檔案 —— ${err.message}`
        ),
      ]
    }
  }).sort((a, b) => a.line - b.line)
}

/** 單一檔案的完整檢查 */
export const lintFile = (root, abs, definedVars) =>
  lintText(root, toRel(root, abs), fs.readFileSync(abs, 'utf8'), definedVars)

/**
 * 不是給人遵守的規範,而是工具自己的狀態回報。
 *
 * 其餘每一條規則都要在寫法規範(`.claude/skills/`)或跨規則的共同前提
 * (`.claude/rules/`)裡講到 —— 被一條沒有寫在規範裡的規則擋下來,
 * 看到的只是一個陌生的代號,而照著規範做的人不可能事先知道有這回事。
 *
 * 這一條不一樣:它報的是「某條規則這次執行失敗了」,沒有任何寫法可以遵守。
 * 把它也要求寫進規範的話,那一段只會寫成「工具壞掉時會報這個」——
 * 對讀規範的人沒有用,而規則自己的驗證會比對兩邊,所以要在這裡講明。
 */
export const TOOL_STATE_RULES = ['ruleCrashed']

/** 規則代號 → 標題與修正提示,五層共用 */
export const RULE_TITLE = {
  /* 規則自己壞掉 —— 不是程式碼違規,但要跟違規一起被看到:
     安靜地跳過的話,那條規則從此不抓任何東西,而畫面上顯示的是通過。 */
  ruleCrashed: '規則執行失敗,這支檔案沒有被那條規則檢查',
  color: '顏色未使用色票變數',
  colorFile: '色票檔的命名 / 值 / 分組歸屬',
  colorSort: '色票檔的排列順序',
  tailwind: 'components 的 template 使用 tailwind class',
  theme: '用到本專案不存在的 tailwind class',
  themeNaming: 'tailwind theme 自己定義的值用了尺寸縮寫',
  moduleOrder: '模組 css 的引入順序',
  moduleScope: '模組 css 混入了別的 class',
  moduleLocation: '元件的樣式放在集中目錄,不在元件自己的資料夾裡',
  moduleVar: '模組級距變數的歸屬',
  truncateClass: '單行省略用了 truncate,不是 line-clamp-1',
  sharedVarScope: '共用變數檔裡放了只有一個模組在用的那幾組',
  breakpointPrefix: '級距在某個斷點少列了前綴',
  variable: '模組變數的命名或斷點',
  unknownVar: '用到沒有定義的 css 變數',
  breakpointVarOverride: '斷點用覆蓋的,值散在兩個地方',
  moduleCssUnused: '樣式檔沒有任何元件 import 它',
  styleProjectImport: 'styleProject.css 接進來的檔名看不出歸屬,或樣式直接寫在接點裡',
  styleProjectValue: '接手的專案新加的版型檔寫死了尺寸值',
  lengthTypeHint: '長度值沒有標 length:,會被當成顏色',
  lengthTypeVar: '標型別時把變數包在 var() 裡',
  ...GLOBAL_RULE_TITLE,
  ...API_RULE_TITLE,
  ...STORE_RULE_TITLE,
  ...CODE_RULE_TITLE,
  ...PAGE_RULE_TITLE,
  // 這個專案自己的規則(有的話)
  ...PROJECT_RULES.title,
}

export const RULE_HINT = {
  ruleCrashed: '多半是搬了函式卻沒搬它的 import —— 跑 npx eslint .tools/ 會指出是哪一個名字',
  color: `色票定義在 ${COLOR_CSS_DIR}/${COLOR_CSS_PREFIX}*.css,使用端寫 var(--色名-色碼)`,
  colorFile: `跨分組共用的色值收進 ${SHARED_COLOR_CSS_PATH};命名要人工改,改名會牽動每一個使用端`,
  colorSort: '存檔或 npm run sort:color 就會排好,不必自己動手',
  tailwind: `樣式搬進這支元件自己的 css(與它的 .vue 放在同一個資料夾),template 只留組件 class 與 --modifier`,
  theme: `theme 的 ${THEME_GROUPS.map((g) => g.key).join(' / ')} 是整組覆寫,內建 key 全部不存在`,
  themeNaming: '整組覆寫後重新定義的值不要再用 sm / md / lg —— 改用說得出用途的名字或實際數值',
  moduleOrder: '變數檔一律排在版型檔之前 —— 變數先定義完,版型才取用',
  moduleScope: '一支模組 css 只能寫自己那組 class,變體的 class 也要收斂成同一個前綴',
  moduleLocation: '搬進那支元件自己的資料夾 —— 留在集中目錄的話,class 前綴那條不會檢查它',
  moduleVar: '同屬性兩個以上級距值要搬到 ***Variables.css',
  truncateClass:
    'truncate 換成 line-clamp-1 —— 與 line-clamp-2、line-clamp-3 是同一組,改行數只動數字',
  sharedVarScope: '共用變數檔只放兩個以上模組都要用的;只有一個在用的搬回那個模組',
  breakpointPrefix: '每個 @screen 區塊都要列齊會命中該斷點的前綴變體',
  variable:
    '命名對齊 tailwind(w / h / p / rounded / leading);尺寸值要三個斷點成套,級距用實際數值不用 sm / md / lg',
  unknownVar:
    'var(--x) 引用的變數全案要找得到定義 —— 找不到時瀏覽器會把整條宣告丟掉,樣式安靜地消失',
  lengthTypeHint:
    'text- / border- / outline- / ring- 的值是長度時要標 text-[length:--x] —— 不標的話產出的是顏色,那個值完全沒有生效',
  lengthTypeVar: '標型別時變數名直接接在冒號後面(text-[length:--x]),不要包 var()',
  breakpointVarOverride:
    '各斷點的值各給一個名字,斷點區塊只做指派 —— 基底與斷點各寫一次字面值的話,改的時候漏掉一處就是某個斷點停在舊值',
  moduleCssUnused:
    '樣式檔要有人 import —— 沒有的話整支一行都不會輸出,而畫面上少了一整批樣式看起來像設計本來就長那樣',
  styleProjectImport:
    '接點只放 @import —— 自己拆出去的變數檔叫 ***VariablesProject.css、版型檔叫 ***Project.css;變數那一種的名字還決定它受不受變數規則檢查',
  styleProjectValue:
    '自己新加的版型裡不寫死尺寸 —— 值放同一組的 ***VariablesProject.css,三個斷點各一份,版型檔讀中性的那個名字',
  ...GLOBAL_RULE_HINT,
  ...API_RULE_HINT,
  ...STORE_RULE_HINT,
  ...CODE_RULE_HINT,
  ...PAGE_RULE_HINT,
  ...PROJECT_RULES.hint,
}
