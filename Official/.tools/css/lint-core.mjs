// CSS 規範檢查的核心邏輯:
//   規則 1 —— 顏色一律定義在 assets/css/_common/color*.css(共用 / 頻道)
//   規則 2 —— components/ 底下的 .vue,template 的 class 不得使用 tailwind utility
//   規則 3 —— module css 的引入方式與順序
//   規則 4 —— module 變數的命名與斷點
//
// 這支只負責「判斷」,不做輸出也不改檔案。
// CLI 在 lint-css.mjs;dev server 的即時檢查在 .vite/css-guard.mjs;
// Claude 寫檔後的檢查在 .claude/hooks/cssGuard.js。

import fs from 'node:fs'
import path from 'node:path'
import {
  SHARED_COLOR_CSS_PATH,
  buildColorCss,
  expectedSuffix,
  findSharedColors,
  hexOfValue,
  hueOf,
  isColorCssPath,
  isDerivedColorVar,
  parseColorCss,
  sortDecls,
  suffixOf,
} from './color-order.mjs'

/** 全專案掃描時要看的目錄 / 檔案 */
export const SCAN_TARGETS = [
  'components',
  'containers',
  'pages',
  'layouts',
  'assets/css',
  'app.vue',
  'error.vue',
  ...['tailwind.extend.js', 'tailwind.config.js'],
]

export const SCAN_EXT = new Set(['.vue', '.css'])

/**
 * 副檔名不是 .vue / .css,但**會產生 CSS** 的設定檔 —— 只檢查顏色。
 *
 * tailwind 的 theme 設定(boxShadow / colors 等)最後會變成產物裡的宣告,
 * 所以「顏色一律走色票」對它一樣成立;寫死在這裡的色碼一樣是規則 1 違規,
 * 只是它躲在 .js 裡,不掃就永遠看不到。
 *
 * ⚠️ 不要把 .js 整個放進 SCAN_EXT —— 一般 js 裡的 hex(雜湊、id、二進位遮罩)
 *    會全部變成誤報。只有這份白名單裡的設定檔要看。
 */
export const SCAN_CONFIG_FILES = new Set(['tailwind.extend.js', 'tailwind.config.js'])

export const isScannable = (abs) =>
  SCAN_EXT.has(path.extname(abs)) || SCAN_CONFIG_FILES.has(path.basename(abs))

/**
 * 文件用的路徑 —— 一律**不檢查**(2026-08-31 加)。
 *
 * `docs/` 是獨立的文件系統(doc.css + 各組件的 html 範例頁),它的樣式只服務那幾頁,
 * 不進產物、也沒有色票變數可用 —— 硬套規則 1 會報出上百筆寫死色碼,全是噪音。
 * `.docs/` 與 `.acceptance/` 同理,那裡是說明與驗收紀錄。
 *
 * ⚠️ 為什麼不是只從 SCAN_TARGETS 排除就好:`docs/` 本來就不在 SCAN_TARGETS 裡,
 *    所以 `npm run lint:css` 的全站掃描碰不到它。**但 hook 那層是靠 git status
 *    找「工作區有改動的 .vue / .css」再逐檔跑 lintFile**,完全繞過 SCAN_TARGETS ——
 *    docs 的檔案一改動就會被報。擋在 lintFile 開頭,五層才會一致。
 */
const IGNORED_PATH = /(^|\/)(docs|\.docs|\.acceptance)\//

export const isIgnoredPath = (rel) => IGNORED_PATH.test(rel)

// --- 顏色偵測用的樣式 -------------------------------------------------------

/** CSS 具名色(常見的一批;完整 148 色沒必要,誤報成本高於漏報) */
const NAMED_COLORS = new Set([
  'white',
  'black',
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'pink',
  'gray',
  'grey',
  'brown',
  'cyan',
  'magenta',
  'lime',
  'navy',
  'teal',
  'olive',
  'maroon',
  'silver',
  'aqua',
  'fuchsia',
  'gold',
  'beige',
  'ivory',
  'khaki',
  'salmon',
  'coral',
  'crimson',
  'indigo',
  'violet',
  'turquoise',
  'tan',
  'plum',
  'orchid',
  'lavender',
  'wheat',
  'azure',
])

/** tailwind 內建色票的色名(搭配數字階層或直接使用) */
const TW_PALETTE = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'white',
  'black',
]

/** 會吃顏色的 tailwind utility 前綴 */
const TW_COLOR_UTIL = [
  'text',
  'bg',
  'border',
  'ring',
  'divide',
  'outline',
  'shadow',
  'accent',
  'caret',
  'decoration',
  'fill',
  'stroke',
  'from',
  'via',
  'to',
  'placeholder',
]

/** 會吃顏色的 CSS 屬性 */
const COLOR_PROP_RE =
  /(^|[;{\s])(color|background-color|background|border(?:-(?:top|right|bottom|left))?-color|border|outline-color|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|text-decoration-color|column-rule-color)\s*:\s*([^;}]+)/gi

// --- tailwind utility 偵測(規則 2)------------------------------------------

/**
 * tailwind utility 的判定採「已知清單」而非反向排除 —— 寧可漏抓罕見 utility,
 * 也不要把 m-nav / --px-15 這類專案自訂 class 誤報成違規。
 */
const TW_EXACT = new Set([
  'flex',
  'grid',
  'block',
  'inline',
  'inline-block',
  'inline-flex',
  'inline-grid',
  'hidden',
  'contents',
  'table',
  'flow-root',
  'list-item',
  'absolute',
  'relative',
  'fixed',
  'sticky',
  'static',
  'truncate',
  'italic',
  'underline',
  'overline',
  'uppercase',
  'lowercase',
  'capitalize',
  'invisible',
  'visible',
  'collapse',
  'isolate',
  'grow',
  'shrink',
  'antialiased',
  'subpixel-antialiased',
  'sr-only',
  'not-sr-only',
  'container',
  'group',
  'peer',
  'border',
  'rounded',
  'shadow',
  'ring',
  'outline',
  'filter',
  'blur',
  'transition',
  'transform',
  'appearance-none',
  'resize',
  'overflow-hidden',
  'overflow-auto',
  'overflow-visible',
  'overflow-scroll',
])

const TW_PREFIX = [
  'w-',
  'h-',
  'min-w-',
  'max-w-',
  'min-h-',
  'max-h-',
  'size-',
  'p-',
  'px-',
  'py-',
  'pt-',
  'pr-',
  'pb-',
  'pl-',
  'ps-',
  'pe-',
  'm-',
  'mx-',
  'my-',
  'mt-',
  'mr-',
  'mb-',
  'ml-',
  'ms-',
  'me-',
  'text-',
  'bg-',
  'border-',
  'rounded-',
  'shadow-',
  'ring-',
  'outline-',
  'gap-',
  'gap-x-',
  'gap-y-',
  'space-x-',
  'space-y-',
  'divide-',
  'items-',
  'justify-',
  'content-',
  'self-',
  'place-',
  'order-',
  'flex-',
  'basis-',
  'grow-',
  'shrink-',
  'col-',
  'row-',
  'grid-',
  'top-',
  'right-',
  'bottom-',
  'left-',
  'inset-',
  'z-',
  'opacity-',
  'overflow-',
  'object-',
  'aspect-',
  'font-',
  'leading-',
  'tracking-',
  'align-',
  'whitespace-',
  'break-',
  'list-',
  'indent-',
  'decoration-',
  'underline-',
  'transition-',
  'duration-',
  'delay-',
  'ease-',
  'animate-',
  'translate-',
  'rotate-',
  'scale-',
  'skew-',
  'origin-',
  'cursor-',
  'pointer-events-',
  'select-',
  'touch-',
  'will-change-',
  'fill-',
  'stroke-',
  'backdrop-',
  'blur-',
  'brightness-',
  'contrast-',
  'grayscale-',
  'invert-',
  'saturate-',
  'sepia-',
  'drop-shadow-',
  'accent-',
  'caret-',
  'placeholder-',
  'from-',
  'via-',
  'to-',
  'float-',
  'clear-',
  'box-',
  'table-',
  'caption-',
  'border-spacing-',
]

/**
 * 專案自訂 class:`m-` 開頭的組件 class、`--` 開頭的 modifier / 狀態,
 * 以及 `j` 開頭純給 JS 抓的 hook class(jFormValid,不帶樣式)。
 *
 * `is-*` / `has-*` 這種裸前綴**不算合法** —— 狀態一律寫成 `--active` / `--has-label`,
 * 由 checkStateClassNaming 另外抓出來。
 */
const isProjectClass = (name) =>
  name.startsWith('--') || /^m-[a-z]/.test(name) || /^j[A-Z]/.test(name)

/** 去掉 variant 前綴(p: / t: / m: / hover: / group-hover: ...),回傳 utility 本體 */
function stripVariants(cls) {
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

function isTailwindUtility(rawClass) {
  const cls = rawClass.replace(/^!/, '')
  const body = stripVariants(cls).replace(/^!/, '')
  if (!body) return false
  if (isProjectClass(body)) return false
  if (TW_EXACT.has(body)) return true
  return TW_PREFIX.some((p) => body.startsWith(p))
}

// --- 共用小工具 -------------------------------------------------------------

/** 取出 .vue 的 <template> 區段(含行號偏移) */
function extractTemplate(text) {
  const start = text.search(/<template[^>]*>/)
  if (start === -1) return null
  const openEnd = text.indexOf('>', start) + 1
  const close = text.lastIndexOf('</template>')
  if (close === -1) return null
  return { body: text.slice(openEnd, close), offset: openEnd }
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length

/**
 * 把 CSS / JS 註解的內容換成等長空白 —— 註解裡常會寫下設計稿的色碼
 * (例如 `/* 黑色-副標 #000000 18px *\/`),那是說明不是實際樣式,不該報。
 * 用等長空白取代而不是刪除,行號與位移才不會跑掉。
 */
function maskComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
}

/**
 * 遮掉 js 的 `//` 行註解 —— 只給設定檔(SCAN_CONFIG_FILES)用。
 *
 * 註解裡的色碼是說明不是樣式,跟 maskComments 對 CSS 做的事一樣。
 * `https://` 這種也會被遮掉,但網址裡不會有色碼,對顏色檢查沒有影響。
 * 保留換行,行號才不會跑掉。
 */
function maskLineComments(text) {
  return text.replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
}

export function listFiles(projectRoot, target) {
  const abs = path.join(projectRoot, target)
  if (!fs.existsSync(abs)) return []
  if (fs.statSync(abs).isFile()) return isScannable(abs) ? [abs] : []
  const out = []
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.isDirectory()) continue
    out.push(...listFiles(projectRoot, path.join(target, entry.name)))
  }
  return out
}

// --- 規則 1:顏色 -----------------------------------------------------------

export function checkColors(relPath, rawText, definedVars) {
  // 註解裡的色碼是設計說明不是樣式,先遮掉再檢查
  const text = maskComments(rawText)
  const issues = []
  const add = (line, detail, snippet) =>
    issues.push({ rule: 'color', file: relPath, line, detail, snippet })

  // 1-a 寫死的 hex
  for (const m of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    // 排除 URL fragment 與 SVG id 參照
    const before = text.slice(Math.max(0, m.index - 12), m.index)
    if (/url\(['"]?$|href=['"]?$|xlink:href=['"]?$/.test(before)) continue
    const hex = m[0].slice(1)
    if (![3, 4, 6, 8].includes(hex.length)) continue
    add(lineOf(text, m.index), `寫死色碼 ${m[0]}`, m[0])
  }

  // 1-b 寫死的 rgb() / rgba() / hsl() 字面值
  //     rgba(var(--black-rgb), 0.1) 這種取用既有變數的寫法不算 —— 只抓數字開頭的字面值
  for (const m of text.matchAll(/\b(rgba?|hsla?)\(\s*[\d.]/g)) {
    add(lineOf(text, m.index), `寫死 ${m[1]}() 色值`, m[0])
  }

  // 1-c 在色票檔以外定義顏色變數
  for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}\n]+)/gi)) {
    const [, name, rawValue] = m
    const value = rawValue.trim()
    if (definedVars.has(name)) continue // 色票檔已有的同名變數不重複計
    const isLiteralColor =
      /^#[0-9a-fA-F]{3,8}$/.test(value) ||
      /^(rgba?|hsla?)\(\s*[\d.]/.test(value) ||
      NAMED_COLORS.has(value.toLowerCase())
    if (isLiteralColor) {
      add(lineOf(text, m.index), `在色票檔以外定義顏色變數 ${name}: ${value}`, m[0])
    }
  }

  // 1-d 顏色屬性直接使用具名色
  for (const m of text.matchAll(COLOR_PROP_RE)) {
    const value = m[3].trim()
    for (const token of value.split(/[\s,]+/)) {
      const t = token.replace(/[()]/g, '').toLowerCase()
      if (NAMED_COLORS.has(t)) {
        add(lineOf(text, m.index), `${m[2]} 使用具名色 ${t}`, `${m[2]}: ${value}`)
        break
      }
    }
  }

  // 1-e tailwind 內建色票(text-red-500 / bg-white / border-gray-100 ...)
  //
  // lookbehind 排除前面接著 - 或字元的情況 —— 專案的 modifier 選擇器寫成
  // `&.\-\-text-blue-08dc`、class 寫成 `--bg-gray-eeee`,那是自訂 modifier
  // 而非 tailwind 色票,不能誤報。
  const paletteRe = new RegExp(
    `(?<![-\\w\\\\])(${TW_COLOR_UTIL.join('|')})-(${TW_PALETTE.join('|')})(-\\d{2,3})?\\b(?!\\[)`,
    'g'
  )
  for (const m of text.matchAll(paletteRe)) {
    // text-[--gray-666] 這種 arbitrary value 不算
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 2)
    if (after.startsWith('[')) continue
    // 色名後面若接著 - 再接非數字(例如 --gray-eeee 的 gray-eeee),屬於專案色票命名
    const tail = text.slice(m.index + m[0].length)
    if (/^-[0-9a-f]{2,6}\b/i.test(tail) && !/^-\d{2,3}\b/.test(tail)) continue

    // 色名後面還接著別的字段 —— tailwind 內建只有 `bg-black` 或 `text-red-500`
    // 這兩種形狀,再多接就是專案自訂的 utility(shadow-black-y2-b4 定義在
    // tailwind.extend.js 的 boxShadow),不是內建色票。
    if (/^-(?!(?:50|\d{3})\b)/.test(tail)) continue

    add(lineOf(text, m.index), `使用 tailwind 內建色票 ${m[0]}`, m[0])
  }

  // 1-f2 rgba(var(--x-rgb), 0.1) 是舊寫法 —— 透明色一律改用 8 碼 hex 的色票變數
  for (const m of text.matchAll(/\b(?:rgba?|hsla?)\(\s*var\(\s*(--[a-z0-9-]+-rgb)\s*\)/gi)) {
    add(
      lineOf(text, m.index),
      `rgba(var(${m[1]}), …) 是舊寫法 —— 改用 8 碼 hex 的色票變數(例如 --black-1a),` +
        'hexToRgb 機制只為既有程式碼保留,不要新增',
      m[1]
    )
  }

  // 1-f 取用不存在的色票變數 —— 色系前綴的變數(--blue-08dc / --gray-666)
  //     一定來自色票檔;取不到值時畫面不會報錯,只會默默沒顏色。
  const selfDefined = new Set([...text.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]))
  const usageRe = /(?:var\(\s*|\[\s*)(--[a-z0-9-]+)/gi

  for (const m of text.matchAll(usageRe)) {
    const name = m[1]
    if (!hueOf(name)) continue // 不是色票命名(--tab-select-h 之類)就不管
    if (definedVars.has(name) || selfDefined.has(name)) continue
    add(
      lineOf(text, m.index),
      `取用未定義的色票變數 ${name} —— 要先在色票檔建立,否則畫面上不會有顏色也不會報錯`,
      name
    )
  }

  return issues
}

/**
 * 檢查已淘汰的透明色寫法。與 checkColors 分開,是因為這兩條**連色票檔也要看** ——
 * checkColors 遇到色票檔會整個跳過(色票檔本來就該有顏色),
 * 但 hexToRgb() 與 -rgb 衍生變數在色票檔裡出現同樣是錯的,那正是它們的原生棲地。
 *
 * 規則檔早就寫明「hexToRgb 機制保留但不要新增」、「-rgb 變數已於 2026-08-27 刪除」,
 * 這裡補上工具端的把關,避免只靠人記得。
 *
 * 移植自參考專案 EFOfficial 的 checkColorMechanism(2026-08-28)。
 */
export function checkColorMechanism(relPath, rawText) {
  const text = maskComments(rawText)
  const issues = []
  const add = (line, detail, snippet) =>
    issues.push({ rule: 'color', file: relPath, line, detail, snippet })

  // 1-g hexToRgb() —— 機制保留但不該再有呼叫端
  for (const m of text.matchAll(/\bhexToRgb\s*\(/g)) {
    add(
      lineOf(text, m.index),
      'hexToRgb() 已淘汰 —— 透明色改用 8 碼 hex(例如 #0087dc1a)並在色票檔建立變數',
      'hexToRgb('
    )
  }

  // 1-h --xxx-rgb 變數的「定義端」—— 1-f2 抓的是使用端
  for (const m of text.matchAll(/(--[a-z0-9-]*-rgb)\s*:/gi)) {
    add(
      lineOf(text, m.index),
      `${m[1]} 是已淘汰的 -rgb 衍生變數 —— 透明色直接在色票檔定義 8 碼 hex(例如 --black-1a)`,
      m[1]
    )
  }

  return issues
}

// --- 規則 2:components 的 tailwind class ------------------------------------

export function checkTailwindInComponents(relPath, text) {
  const tpl = extractTemplate(text)
  if (!tpl) return []

  // 被 <!-- --> 註解掉的 template 是死程式碼,裡面的 class 不算違規。
  // 用等長空白取代而不是刪除,行號才不會跑掉。
  const body = tpl.body.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))

  const issues = []
  const seen = new Set()

  // class="..." 與 :class="'...'" / :class="{ '...': cond }" 內的字面 class 字串
  const attrRe = /(?::|v-bind:)?class\s*=\s*"([^"]*)"|(?::|v-bind:)?class\s*=\s*'([^']*)'/g

  for (const m of body.matchAll(attrRe)) {
    const raw = m[1] ?? m[2] ?? ''
    const isDynamic = m[0].trimStart().startsWith(':') || m[0].trimStart().startsWith('v-bind')

    // 動態綁定只取引號包住的字面 class,其餘(變數、三元運算)無法靜態判讀
    const candidates = isDynamic ? [...raw.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]) : [raw]

    for (const chunk of candidates) {
      for (const cls of chunk.split(/\s+/)) {
        if (!cls || !isTailwindUtility(cls)) continue
        if (seen.has(cls)) continue
        seen.add(cls)
        issues.push({
          rule: 'tailwind',
          file: relPath,
          line: lineOf(text, tpl.offset + m.index),
          detail: `template 使用 tailwind class ${cls}`,
          snippet: cls,
        })
      }
    }
  }

  return issues
}

// --- 規則 3:module 的引入方式與順序 -----------------------------------------

/**
 * module css 的引入順序權重:
 *   共用變數 → 變體變數 → 共用版型 → 變體樣式
 * 變數要全部先定義完,版型才取用。
 */
function importWeight(fileName) {
  if (fileName === 'variables.css') return 0
  if (/Variables\.css$/.test(fileName)) return 1
  if (fileName === 'common.css') return 2
  return 3
}

export function checkModuleImports(relPath, text) {
  const issues = []
  const add = (line, detail, snippet) =>
    issues.push({ rule: 'module', file: relPath, line, detail, snippet })

  // 3-0 components 的 .vue 不該自己留 <style> —— 樣式要進 assets/css/_modules/。
  //     只看 components/,pages 的頁面元件不在此限。
  if (relPath.startsWith('components/')) {
    for (const m of text.matchAll(/<style(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/style>/g)) {
      // 空的 style 區塊不算
      if (!m[1].trim()) continue
      add(
        lineOf(text, m.index),
        '組件自己留了 <style> 區塊 —— 樣式要拆進 assets/css/_modules/ 並用 JS import',
        '<style>'
      )
    }
  }

  // 3-a 不該再用 <style src="…"> 或 <style> 內的 @import
  for (const m of text.matchAll(/<style[^>]*\ssrc\s*=\s*["']([^"']*_modules[^"']*)["']/g)) {
    add(
      lineOf(text, m.index),
      `用 <style src> 引入 ${m[1]} —— 改在 <script setup> 最上方 JS import`,
      m[1]
    )
  }

  for (const m of text.matchAll(/@import\s+["']([^"']*_modules[^"']*)["']/g)) {
    add(
      lineOf(text, m.index),
      `用 @import 引入 ${m[1]} —— 改在 <script setup> 最上方 JS import`,
      m[1]
    )
  }

  // 3-b JS import 的順序。本專案的 module 路徑含頻道層(_modules/<頻道>/<組件>/),
  //     以「頻道/組件」為單位分組比較。
  const imports = [...text.matchAll(/^\s*import\s+["'][^"']*_modules\/(.+)\/([^/"']+\.css)["']/gm)]

  const byModule = new Map()
  for (const m of imports) {
    const [, mod, file] = m
    if (!byModule.has(mod)) byModule.set(mod, [])
    byModule.get(mod).push({ file, index: m.index })
  }

  for (const [mod, list] of byModule) {
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1]
      const curr = list[i]
      if (importWeight(curr.file) < importWeight(prev.file)) {
        add(
          lineOf(text, curr.index),
          `${mod} 的 css 引入順序不對:${curr.file} 應排在 ${prev.file} 之前` +
            '(共用變數 → 變體變數 → 共用版型 → 變體樣式)',
          curr.file
        )
      }
    }
  }

  return issues
}

/**
 * 2-b 狀態 class 一律 `--` 開頭。
 *
 * `is-active` / `has-label` 這種裸前綴不要用 —— 專案只有 `--active` / `--has-label` 一種寫法,
 * 看到 `--` 就知道是這個組件的狀態或變體。`jFormValid` 那類純給 JS 抓的 hook class 不在此限。
 */
/** 常見的狀態字 —— 這些出現在 :class 物件的 key 上,幾乎都是忘了加 `--` */
const STATE_WORDS = [
  'active',
  'curr',
  'current',
  'checked',
  'selected',
  'disabled',
  'readonly',
  'focus',
  'open',
  'opened',
  'close',
  'closed',
  'show',
  'hidden',
  'error',
  'loading',
  'draggable',
  'fixed',
]

export function checkStateClassNaming(relPath, text) {
  const tpl = extractTemplate(text)
  const body = tpl
    ? tpl.body.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    : maskComments(text)
  const offset = tpl ? tpl.offset : 0

  const issues = []
  const seen = new Set()

  const add = (name, index, detail) => {
    if (seen.has(name)) return
    seen.add(name)
    issues.push({
      rule: 'tailwind',
      file: relPath,
      line: lineOf(text, offset + index),
      detail,
      snippet: name,
    })
  }

  // is-x / has-x 這種裸前綴,不論在 class 屬性還是 css 選擇器裡
  for (const m of body.matchAll(/(?<![-\w.])(is|has)-([a-z][a-z0-9-]*)/g)) {
    const name = `${m[1]}-${m[2]}`
    add(
      name,
      m.index,
      `狀態 class ${name} 要寫成 --${name}(狀態一律 -- 開頭,不用裸的 is- / has- 前綴)`
    )
  }

  // :class="{ disabled: x }" / :class="{ 'active': x }" —— 物件的 key 是裸狀態字
  for (const attr of body.matchAll(/(?::|v-bind:)class\s*=\s*"([^"]*)"/g)) {
    for (const pair of attr[1].matchAll(/(['"]?)([a-z][a-z0-9-]*)\1\s*:/g)) {
      const key = pair[2]
      if (!STATE_WORDS.includes(key)) continue
      add(
        key,
        attr.index + pair.index,
        `狀態 class ${key} 要寫成 --${key}(狀態一律 -- 開頭;裸的狀態字會跟第三方或全域樣式撞名)`
      )
    }
  }

  return issues
}

// --- 規則 5:.vue 的 import 順序 ---------------------------------------------

/**
 * `<script setup>` 的 import 由「離這支組件最近」排到「最遠」:
 *
 *   1. css            `import '@css/_modules/…'`
 *   2. .composables   `from './.composables/…'`(組件自己的邏輯)
 *   3. @js            `from '@js/…'`(專案共用工具)
 *   4. 其他套件       `from 'vee-validate'`(第三方)
 *
 * 沒列在上面的(@stores / @components / @imgs …)不參與排序檢查 —— 只確保
 * 這四類彼此的相對順序沒顛倒。
 */
const IMPORT_GROUPS = [
  { weight: 0, name: 'css', test: (p) => p.startsWith('@css/') || p.endsWith('.css') },
  { weight: 1, name: '.composables', test: (p) => /(^|\/)\.composables\//.test(p) },
  { weight: 2, name: '@js', test: (p) => p.startsWith('@js/') },
  // 第三方:不是相對路徑、也不是專案 alias
  { weight: 3, name: '套件', test: (p) => !/^[.~@/]/.test(p) },
]

const groupOf = (specifier) => IMPORT_GROUPS.find((g) => g.test(specifier)) ?? null

export function checkImportOrder(relPath, text) {
  const start = text.search(/<script\b[^>]*\bsetup\b[^>]*>/)
  if (start === -1) return []

  const end = text.indexOf('</script>', start)
  const body = text.slice(start, end === -1 ? undefined : end)

  const found = []
  for (const m of body.matchAll(/^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/gm)) {
    const group = groupOf(m[1])
    if (group) found.push({ group, index: start + m.index, specifier: m[1] })
  }

  const issues = []
  for (let i = 1; i < found.length; i += 1) {
    const prev = found[i - 1]
    const curr = found[i]
    if (curr.group.weight >= prev.group.weight) continue

    issues.push({
      rule: 'import',
      file: relPath,
      line: lineOf(text, curr.index),
      detail:
        `import 順序不對:'${curr.specifier}'(${curr.group.name})` +
        `應排在 '${prev.specifier}'(${prev.group.name})之前 —— ` +
        '順序為 css → ./.composables → @js → 其他套件',
      snippet: curr.specifier,
    })
  }

  return issues
}

// --- 規則 4:module 變數的命名與斷點 -----------------------------------------

/** 命名慣例:左邊的寫法要改成右邊的 */
const NAMING_FIXES = [
  [/-border-width$/, '-border'],
  [/-width$/, '-w'],
  [/-height$/, '-h'],
  [/-padding$/, '-p'],
  [/-margin$/, '-m'],
]

/** 尺寸類的值(需要分斷點);顏色、auto/0/transparent 等不算 */
const SIZE_VALUE_RE = /^-?\d*\.?\d+(px|rem|em|%|vh|vw)$/

/** 這些值即使長得像尺寸也不必分斷點 —— 純結構性、不隨裝置調整 */
const STRUCTURAL_VALUES = new Set(['0', '0px', 'auto', 'inherit', 'initial', 'none', 'transparent'])

/**
 * `100%` 不該出現在 module 變數裡 —— tailwind 已經有 `-full`。
 *
 * 語意是「撐滿容器」而不是某個尺寸,繞一層變數只是讓人多查一次;
 * 拆三斷點更是只會得到三個一模一樣的值。
 * 真的分斷點不同(pc 50% / mobile 100%)才需要變數,那時值不會全是 100%。
 */
const FULL_UTILITY_HINT = 'w-full / h-full / max-w-full / min-w-full / min-h-full'

/**
 * 檢查 module 的 variables:
 *   4-a 命名慣例(-width → -w 等)
 *   4-b 尺寸類的值要分 pc / tablet / mobile 三份
 */
export function checkModuleVariables(relPath, text) {
  const issues = []
  const add = (line, detail, snippet) =>
    issues.push({ rule: 'variable', file: relPath, line, detail, snippet })

  const masked = maskComments(text)

  // 收集這個檔案 :root 內的宣告
  const declared = new Map()
  for (const rm of masked.matchAll(/:root\s*\{([\s\S]*?)\n\}/g)) {
    const body = rm[1]
    const bodyStart = rm.index + rm[0].indexOf(body)
    for (const v of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      declared.set(v[1], { value: v[2].trim(), index: bodyStart + v.index })
    }
  }

  const names = [...declared.keys()]

  for (const [name, { value, index }] of declared) {
    const line = lineOf(text, index)

    // 4-a 命名慣例
    for (const [pattern, replacement] of NAMING_FIXES) {
      if (pattern.test(name)) {
        add(line, `${name} 命名不符慣例,應為 ${name.replace(pattern, replacement)}`, name)
        break
      }
    }

    // 4-c 100% 不繞變數 —— tailwind 有 -full
    if (value === '100%') {
      add(line, `${name}: 100% —— 撐滿直接用 tailwind 的 ${FULL_UTILITY_HINT},不要繞變數`, name)
      continue
    }

    // 4-b 尺寸類要分斷點 —— 除非明確標註「三個斷點同值」
    if (name.includes('-pc-') || name.includes('-tablet-') || name.includes('-mobile-')) continue
    if (STRUCTURAL_VALUES.has(value)) continue
    if (!SIZE_VALUE_RE.test(value)) continue

    // 已經有對應的斷點版本就不算(base 值,例如 --anchor-px: 0 搭配 modifier)
    const hasBreakpointSibling = names.some(
      (n) => n.replace(/-(pc|tablet|mobile)-/, '-') === name && n !== name
    )
    if (hasBreakpointSibling) continue

    // 標了 lint-same-value 就放行 —— 見該常數的說明,理由一定要寫
    if (SAME_VALUE_RE.test(lineTextOf(text, line))) continue

    add(
      line,
      `${name}: ${value} 是尺寸類單值 —— 要嘛拆成 pc / tablet / mobile 三份,` +
        `要嘛標 /* lint-same-value: 理由 */ 表示三個斷點同值。` +
        `⚠️ 決定之前**先問設計者這個屬性要不要分斷點**(box-shadow / border 這類最常被問), ` +
        `不要自己假設 —— 猜「不用分」之後要加就得改結構並回頭動每個使用端。`,
      name
    )
  }

  return issues
}

/**
 * 4-d variables 檔只能放「值與 modifier」,不能有版型宣告。
 *
 * `@apply h-[25px] w-[25px]` 這種寫在 xxxVariables.css 裡,會讓「值」與「怎麼用」混在一起:
 * 之後想調某個斷點就得翻兩個檔案,而且 modifier 沒有走變數,版型層也就取不到。
 * 正確寫法是 modifier 只設 `--x-size: 25px`,套用交給 common.css / <變體>.css。
 */
/** `variables.css` 或 `<變體>Variables.css` —— 放「值」的那一層 */
const isVariablesFile = (relPath) => /(^|\/)([a-z][A-Za-z]*)?[Vv]ariables\.css$/.test(relPath)

export function checkVariablesFile(relPath, text) {
  if (!isVariablesFile(relPath)) return []

  const issues = []
  const masked = maskComments(text)

  for (const m of masked.matchAll(/@apply\s+([^;]+);/g)) {
    issues.push({
      rule: 'variable',
      file: relPath,
      line: lineOf(text, m.index),
      detail:
        `variables 檔不該有版型宣告(@apply ${m[1].trim().slice(0, 40)}…)—— ` +
        'modifier 只設變數(--x-size: 25px),套用寫在 common.css / <變體>.css',
      snippet: '@apply',
    })
  }

  // 一般 CSS 屬性宣告(排除 --custom-property)
  for (const m of masked.matchAll(/(^|[{;\s])([a-z-]+)\s*:\s*[^;{}]+;/g)) {
    const prop = m[2]
    if (prop.startsWith('--')) continue
    issues.push({
      rule: 'variable',
      file: relPath,
      line: lineOf(text, m.index),
      detail: `variables 檔不該有版型宣告(${prop}: …)—— 值放變數,套用寫在版型檔`,
      snippet: prop,
    })
  }

  /*
   * variables 檔放的是「值」:`:root` 的預設值、modifier 對應的具體值、@screen p / t / m 的斷點值。
   * 把 module 自己的變數指向自己的另一個變數(`--border { --x-border-color: var(--x-border-on-color) }`)
   * 是**狀態切換**不是值,屬於版型檔。
   * 指向色票變數(`var(--white)` / `var(--gray-333)`)則是在設定值,留在 variables 是對的。
   */
  for (const m of masked.matchAll(/(--[a-z0-9-]+)\s*:\s*var\(\s*(--[a-z0-9-]+)\s*\)/g)) {
    const [, name, source] = m
    if (hueOf(source)) continue // 指向色票 = 設定值

    issues.push({
      rule: 'variable',
      file: relPath,
      line: lineOf(text, m.index),
      detail:
        `${name}: var(${source}) 是狀態切換不是值 —— variables 檔只放「值」` +
        '(:root 預設值、modifier 的具體值、@screen p / t / m 斷點值),' +
        '把 module 自己的變數指向自己另一個變數要寫在版型檔',
      snippet: name,
    })
  }

  return issues
}

/**
 * 4-e 反過來:版型檔不可直接宣告常值。
 *
 * `common.css` 裡寫 `--tag-px: 0` 會讓「值」散在兩個檔案 —— 要調一個預設值
 * 得先猜它在 variables 還是版型檔。規則很好記:
 * **variables.css / *Variables.css 以外的檔案,變數宣告右邊一定是 `var(…)`**。
 *
 * 版型檔裡合法的變數宣告只有兩種,右邊都是 var():
 *   斷點對應 `--x-size: var(--x-pc-size)` / 狀態切換 `--x-bg: var(--x-checked-bg)`
 */
export function checkLayoutFileValues(relPath, text) {
  if (isVariablesFile(relPath)) return []

  const issues = []
  const masked = maskComments(text)

  for (const m of masked.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;{}]+);/g)) {
    const [, name, rawValue] = m
    const value = rawValue.trim()

    // tailwind 自己的 --tw-* 是它產的,不是我們宣告的
    if (name.startsWith('--tw-')) continue
    if (value.includes('var(')) continue

    issues.push({
      rule: 'variable',
      file: relPath,
      line: lineOf(text, m.index),
      detail:
        `${name}: ${value.slice(0, 30)} —— 版型檔的變數宣告右邊一定是 var(…),` +
        'base 值屬於 variables.css 的 :root(斷點對應與狀態切換才寫在這裡)',
      snippet: name,
    })
  }

  return issues
}

/**
 * tailwind 推斷不出型別的三個屬性 —— **全部靜默失效,不報錯**,只能靠 lint。
 *
 *   text-[--x]    → 被當成 color,`font-size` 根本不出現
 *   shadow-[--x]  → 被當成 shadow color,`box-shadow` 根本不出現
 *   border-[--x]  → production 壓成 `border` shorthand,值是 var() 時整條失效
 *
 * 判斷靠規則 4 的命名慣例:字級一律 `-text-size`、顏色一律 `-color`,
 * 所以 `text-[--x-color]` 與 `border-[--x-border-color]` 是合法的顏色用法,不要抓。
 */
export function checkTailwindPitfalls(relPath, text) {
  const issues = []
  const masked = maskComments(text)
  const add = (index, detail, snippet) =>
    issues.push({ rule: 'module', file: relPath, line: lineOf(text, index), detail, snippet })

  // font-size —— 少了 length: 就變成 color
  for (const m of masked.matchAll(/(?<![\w-])text-\[(--[a-z0-9-]*-text-size)\]/g)) {
    add(
      m.index,
      `text-[${m[1]}] 會被當成 color,font-size 不會生效 —— 改用 text-[length:${m[1]}]`,
      m[0]
    )
  }

  // box-shadow —— 值只有「一個 token」時 tailwind 推斷不出型別,當成陰影**顏色**:
  //   shadow-[--x-shadow]      → --tw-shadow-color: var(--x-shadow)   ✗ box-shadow 不出現
  //   shadow-[var(--x-shadow)] → 同上,一樣沒救                        ✗
  //
  // 但**帶完整陰影值**的 arbitrary value 是合法的(2026-09-01 實測 npx tailwindcss 的產物):
  //   shadow-[0_2px_4px_var(--black-33)] → --tw-shadow: 0 2px 4px var(…) + box-shadow  ✓
  //
  // 界線就是「值裡有沒有 _ 分隔的多個部分」—— 有就是完整的陰影值,放行。
  // module 內仍建議走原生 box-shadow + 自己的斷點變數(才能分 pc / tablet / mobile);
  // containers / pages 沒有 module 可放,就用這種帶完整值的寫法,色值仍取色票變數。
  for (const m of masked.matchAll(/(?<![\w-])shadow-\[([^\]_]*--[^\]_]*)\]/g)) {
    add(
      m.index,
      `shadow-[${m[1].slice(0, 30)}] 會被當成 shadow color,box-shadow 不會出現 —— ` +
        '改寫原生屬性 box-shadow: var(--x-shadow)',
      m[0]
    )
  }

  // border-width —— production 會壓成 border shorthand,值是 var() 時整條失效
  for (const m of masked.matchAll(/(?<![\w-])border(?:-[xytrbl])?-\[(--[a-z0-9-]+)\]/g)) {
    // border-color 沒這個問題:module 自己的 -color 變數,或直接指色票(--gray-e5)
    if (m[1].endsWith('-color')) continue
    if (hueOf(m[1])) continue
    add(
      m.index,
      `${m[0]} 在 production 會被壓成 border shorthand 而整條失效 —— ` +
        '改寫原生屬性 border-width: var(…)',
      m[0]
    )
  }

  return issues
}

/**
 * 規則 6 —— 用到本專案「不存在」或「已淘汰」的 tailwind class。
 *
 * ⚠️ 這裡的「規則 6」與規則 4 章節內的 6-a / 6-b 編號無關,那是另一組代號。
 *
 * tailwind.config.js 的 `theme` 有四組是**整組覆寫**(寫在 `theme` 而非 `theme.extend`),
 * 內建的那些 key 因此**完全消失**:
 *
 *   screens     → 只有 m / t / p / tm / pt / pMin / pMax / mLandscape / notsupport / firefox / IE
 *   fontSize    → 只有 vmp / vmt / vmm / vmmls
 *   boxShadow   → **一個都沒有** —— tailwind.extend.js 刻意不放陰影(值裡會帶色碼,
 *                 而那支檔案不在掃描範圍內),陰影一律走原生 box-shadow + module 變數
 *   fontFamily  → 只有 default
 *
 * 所以 `md:flex`、`text-sm`、`shadow-md`、`font-sans` 這些**產不出任何 CSS**
 * ——tailwind 不會報錯,class 就靜靜地不生效,和拼錯字一樣難找。
 * 實測方式:`npx tailwindcss -c tailwind.config.js --content <含這些 class 的檔案>`。
 *
 * 另外兩類:
 *   `*-hexa`      → 2026-08-28 起全面改用 8 碼 hex 色票,plugin 還留著但不要再用
 *   `transition-` 單數 → 專案定義的是複數(widths / heights / sizes),寫單數不存在
 *
 * ⚠️ **移植到別的專案時,這份清單要重新對照那邊的 config**,不能照抄 ——
 *    最容易錯的是陰影:本專案的 tailwind.extend.js 完全不放陰影,所以抓「任何 shadow-*」;
 *    若對方的 extend 有 preset,就只能抓內建那幾個 key,否則會把合法的 preset 報成違規。
 *
 * ⚠️ 改了 tailwind.config.js 的 `theme` 就要回頭同步這裡 ——
 *    把某組從 `theme` 移進 `theme.extend`(內建復活)時,對應那段要刪掉。
 */
const UNAVAILABLE_CLASSES = [
  {
    // theme.screens 整組覆寫 —— 內建斷點前綴全部不存在
    re: /(?<![\w-])(sm|md|lg|xl|2xl):/g,
    detail: (m) =>
      `${m[1]}: 這個斷點前綴不存在(theme.screens 整組覆寫過)—— ` +
      '本專案只有 m / t / p / tm / pt / pMin / pMax,整條 class 不會產生任何 CSS',
  },
  {
    // theme.fontSize 整組覆寫 —— 只剩四個 vw 值
    re: /(?<![\w-])text-(xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/g,
    detail: (m) =>
      `${m[0]} 這個字級不存在(theme.fontSize 整組覆寫過)—— ` +
      '本專案只有 text-vmp / vmt / vmm / vmmls,其餘一律寫 text-[值] 或 text-[length:--變數]',
  },
  {
    // theme.boxShadow 整組覆寫,而 tailwind.extend.js 不放陰影 —— 一個 preset 都沒有。
    // 所以任何 shadow-* 都不存在(有 preset 的專案只需抓內建那幾個 key),
    // 只有 arbitrary value 的 shadow-[…] 例外(不吃 theme)—— 但那有規則 3 的 pitfall 在管。
    // lookbehind 讓 drop-shadow-md / box-shadow: / --x-shadow 都不會誤中。
    re: /(?<![\w-])shadow(?!-\[)(-[a-z0-9-]+)?(?![\w[])/g,
    detail: (m) =>
      `${m[0]} 不存在 —— 本專案沒有任何 shadow preset(tailwind.extend.js 刻意不放陰影),` +
      '陰影一律走原生 box-shadow: var(--x-shadow) + module 自己的斷點變數',
  },
  {
    // theme.fontFamily 整組覆寫 —— 只剩 default
    re: /(?<![\w-])font-(sans|serif|mono)(?![\w-])/g,
    detail: (m) => `${m[0]} 這個字族不存在(theme.fontFamily 整組覆寫過)—— 本專案只有 font-default`,
  },
  {
    // plugin 還在,但已淘汰。實際寫法是 bg-hexa-[--black,0.7],所以 hexa 後面允許接 -[
    re: /(?<![\w-])(text|bg|border|divide)-hexa(?![\w])/g,
    detail: (m) =>
      `${m[0]} 已淘汰(2026-08-28 全面改用 8 碼 hex 色票)—— ` +
      `在色票檔建立 8 碼 hex 變數,改寫 ${m[1]}-[--色名-色碼-alpha]`,
  },
  {
    // transitionProperty 定義的是複數
    re: /(?<![\w-])transition-(width|height|size)(?![\w-])/g,
    detail: (m) => `${m[0]} 不存在 —— 專案定義的是複數:transition-${m[1]}s`,
  },
]

export function checkTailwindTheme(relPath, text) {
  const issues = []
  const masked = maskComments(text)

  for (const { re, detail } of UNAVAILABLE_CLASSES) {
    for (const m of masked.matchAll(re)) {
      issues.push({
        rule: 'theme',
        file: relPath,
        line: lineOf(text, m.index),
        detail: detail(m),
        snippet: m[0],
      })
    }
  }

  return issues
}

/**
 * letter-spacing(tracking)不開變數。
 *
 * 字距是組件的字體造型設定,全站一個值走到底,沒有「各頁面各自指定」或
 * 「各斷點不同」的需求 —— 直接寫在 common.css 的 `@apply tracking-[0.06em]` 就好。
 * 開成變數只是多一層轉手,還要憑空拆出三個一模一樣的斷點值。
 *
 * 抓三種寫法:變數定義、tailwind 取用、原生屬性取用。
 */
export function checkTrackingVariable(relPath, text) {
  const issues = []
  const masked = maskComments(text)
  const add = (index, detail, snippet) =>
    issues.push({ rule: 'variable', file: relPath, line: lineOf(text, index), detail, snippet })

  const hint = '—— tracking 不開變數,直接寫 @apply tracking-[值]'

  // 定義端:--x-tracking / --x-pc-tracking / --x-letter-spacing
  for (const m of masked.matchAll(/(--[a-z0-9-]*(?:tracking|letter-spacing))\s*:/g)) {
    add(m.index, `${m[1]} 是字距變數 ${hint}`, m[0])
  }

  // 使用端:tracking-[--x] / tracking-[var(--x)]
  for (const m of masked.matchAll(/(?<![\w-])tracking-\[[^\]]*--[^\]]*\]/g)) {
    add(m.index, `${m[0]} 取用了字距變數 ${hint}`, m[0])
  }

  // 使用端:原生 letter-spacing: var(…)
  for (const m of masked.matchAll(/letter-spacing\s*:\s*var\([^)]*\)/g)) {
    add(m.index, `${m[0]} 取用了字距變數 ${hint}`, m[0])
  }

  return issues
}

/**
 * 同一支檔案的 `@screen X` 只能寫一組 —— **頂層與巢狀都算**。
 *
 * 同一個斷點的設定散在檔案各處時,改的時候很容易漏掉其中一組 ——
 * 而漏掉的那一組不會報錯,只會在某個斷點靜靜地少一段樣式。
 *
 * ⚠️ **巢狀寫法也要抓**(2026-08-31 決定)。
 * `.m-x { @screen p { … } } .m-y { @screen p { … } }` 這種「每個選擇器自己收三段」
 * 讀起來很順,但同一個斷點還是散在檔案各處 —— 要調整 pc 的版型時,
 * 得逐一檢查每個選擇器有沒有 `@screen p`,漏掉哪一個不會有任何提示。
 * 集中成一組 `@screen p { .m-x { … } .m-y { … } }` 才能一眼看完該斷點的全部設定。
 *
 * 真的需要分開寫(例如變數對應與子元素版型差異大)就在該行或上一行標
 * `/* lint-screen-group-exempt: 理由 *\/`,理由一定要寫。
 */
export function checkScreenGrouping(relPath, text) {
  const issues = []
  const lines = maskComments(text).split('\n')
  const rawLines = text.split('\n')
  const seen = new Map()

  lines.forEach((line, i) => {
    // 不綁行首 —— 有縮排的(巢狀)也要算進來
    const m = /^\s*@screen\s+([a-zA-Z]+)\s*\{/.exec(line)
    if (!m) return

    const exempt = /lint-screen-group-exempt\s*:/.test(
      `${rawLines[i] ?? ''}\n${rawLines[i - 1] ?? ''}`
    )
    if (exempt) return

    const bp = m[1]
    if (!seen.has(bp)) {
      seen.set(bp, i + 1)
      return
    }

    issues.push({
      rule: 'variable',
      file: relPath,
      line: i + 1,
      detail:
        `@screen ${bp} 在這支檔案出現第二次(第一次在 L${seen.get(bp)})—— ` +
        '同一個斷點只寫一組,散在各處改的時候會漏;' +
        '真要分開就標 /* lint-screen-group-exempt: 理由 */',
      snippet: `@screen ${bp} {`,
    })
  })

  return issues
}

/**
 * 顏色變數的 base 不可以是 `initial`。
 *
 * `initial` 能運作,但靠的是繞路:custom property 的值寫成 CSS-wide keyword 時,
 * 它的計算值是 guaranteed-invalid,於是 `color: var(--x-color)` 變成
 * IACVT(invalid at computed-value time)—— 繼承屬性(color)表現為 inherit、
 * 非繼承屬性(background-color)表現為 initial(transparent)。
 * 結果剛好符合直覺,但**意圖完全讀不出來**,而且下一個人會以為
 * 「initial 就是 color 的初始值(黑色)」而不敢動它。
 *
 * 所以一律寫出真正想要的值,分兩種:
 *   文字色(`-color`)          → `inherit`     沒指定就跟父層走
 *   背景 / 邊框色(`-bg-color` / `-border-color` / `-outline-color`)
 *                             → `transparent` 沒指定就是沒有顏色,不該繼承父層的背景
 *
 * 2026-08-31 決定並清完本專案的存量(5 處)。
 */
const TRANSPARENT_BASE = /-(?:bg|background|border|outline|divide|fill|stroke)-color$/

export function checkColorBase(relPath, text) {
  const issues = []
  const masked = maskComments(text)
  const issuesFor = (name) =>
    TRANSPARENT_BASE.test(name)
      ? `${name} 是背景 / 邊框色 —— base 寫 transparent(沒指定就是沒有顏色,不要繼承父層)`
      : `${name} 是文字色 —— base 寫 inherit(沒指定就跟父層走)`

  for (const m of masked.matchAll(/(--[a-z0-9-]*color)\s*:\s*initial\s*[;}]/g)) {
    issues.push({
      rule: 'variable',
      file: relPath,
      line: lineOf(text, m.index),
      detail: `顏色變數的 base 不要用 initial —— ${issuesFor(m[1])}`,
      snippet: m[0].trim(),
    })
  }

  return issues
}

/**
 * 空的規則區塊(`.foo {}` / `@screen m {}`)—— 一律清掉。
 *
 * 空區塊在產物裡不會有任何輸出,留著只有壞處:
 *   - 讀的人以為「這裡本來有樣式、是不是被誤刪了」
 *   - 拆 module 時常常先開好骨架再填,填不完的就變成殘骸
 *   - `@screen m {}` 這種更糟 —— 看起來像「手機刻意不設定」,其實只是空殼
 *
 * ⚠️ **只抓大括號內完全空白的**。帶註解的(`.foo { /* 之後補 *\/ }`)不算 ——
 *    那是有意留的位置,而且註解通常寫著為什麼。
 *
 * 這條有**自動修正**:存檔時(guard-file / cssGuard)會直接把空區塊連同
 * 後面的空行一起刪掉,不必手動處理。
 */
export function checkEmptyRule(relPath, text) {
  const issues = []

  // .vue 的空 <style> 區塊 —— 連 SFC 的殼都不必留
  if (relPath.endsWith('.vue')) {
    for (const m of text.matchAll(EMPTY_STYLE_BLOCK_RE)) {
      issues.push({
        rule: 'module',
        file: relPath,
        line: lineOf(text, m.index),
        detail:
          '空的 <style> 區塊 —— 沒有樣式就不要留這個殼(存檔時會自動移除)。' +
          '樣式本身要拆進 assets/css/_modules/,見規則 3',
        snippet: m[0].replace(/\s+/g, ''),
      })
    }
    return issues
  }

  if (!relPath.endsWith('.css')) return []

  for (const m of text.matchAll(EMPTY_RULE_RE)) {
    issues.push({
      rule: 'module',
      file: relPath,
      line: lineOf(text, m.index),
      detail: `${m[2].trim()} { } 是空的規則區塊 —— 產物不會有任何輸出,清掉(存檔時會自動移除)`,
      snippet: `${m[2].trim()} { }`,
    })
  }
  return issues
}

/**
 * `.vue` 裡內容全空白的 `<style>` 區塊 —— 含 `lang="postcss"` / `scoped` 之類的屬性。
 *
 * 樣式搬進 module 後,那個殼常常留在檔案末尾;它不會產生任何輸出,
 * 但會讓人以為「這支還有自己的樣式」。
 */
export const EMPTY_STYLE_BLOCK_RE = /<style[^>]*>\s*<\/style>/g

/**
 * 空規則的樣式 —— 檢查與自動移除共用同一份,兩邊的判斷才不會分岔。
 *
 * `[^{}\n]` 讓選擇器不跨行也不含大括號;`\{\s*\}` 只吃「完全空白」的內容,
 * 所以帶註解的區塊不會被誤判成空的。
 */
export const EMPTY_RULE_RE = /^([ \t]*)([^{}\n][^{}\n]*?)\s*\{\s*\}/gm

/**
 * 移除檔案裡所有空的規則區塊(連同後面的空行),回傳新內容。
 * 沒有可移除的就回傳 null —— 呼叫端據此判斷要不要寫檔。
 */
export function onRemoveEmptyRules(text, { isVue = false } = {}) {
  const nl = text.includes('\r\n') ? '\r\n' : '\n'

  // .vue:只處理空的 <style> 區塊(裡面的 CSS 規則由 module 那邊管)
  if (isVue) {
    const next = text
      .replace(/(\r?\n)*[ \t]*<style[^>]*>\s*<\/style>[ \t]*(\r?\n)*/g, nl)
      .replace(/(\r?\n){3,}/g, nl + nl)
      .replace(/(\r?\n)+$/, nl)

    return next === text ? null : next
  }

  const next = text
    .replace(/^[ \t]*[^{}\n][^{}\n]*?\s*\{\s*\}[ \t]*(\r?\n)+/gm, '')
    .replace(/(\r?\n){3,}/g, nl + nl)

  return next === text ? null : next
}

/**
 * 文字截斷:一律用 `line-clamp-*`,而且**不寫在 module 裡**。
 *
 * 兩件事:
 *   1. `truncate` 一律換成 `line-clamp-1` —— 統一成一組 utility,
 *      多行截斷(`line-clamp-2` / `-3`)才不必在兩套機制之間切換。
 *   2. `line-clamp-*` 由父系 `setClass` 傳入,module 不要自己定 ——
 *      理由同字級:要截幾行是**使用位置**的決定(列表要一行、詳情頁可能兩行),
 *      module 寫死就替所有使用端決定了。
 *
 * ⚠️ 兩種寫法**不等值**,替換時要看 DOM 結構:
 *      truncate      → overflow:hidden + text-overflow:ellipsis + white-space:nowrap
 *      line-clamp-1  → overflow:hidden + display:-webkit-box + -webkit-line-clamp:1
 *    `display` 會變成 `-webkit-box`、而且失去 `white-space:nowrap` ——
 *    block 元素通常沒事,但 inline 元素或 flex item 要實機確認版面沒有位移。
 *
 * 只抓 module(版型檔與 variables),使用端(pages / containers)本來就該寫。
 */
export function checkLineClamp(relPath, text) {
  if (!relPath.startsWith('assets/css/_modules/')) return []

  const issues = []
  const masked = maskComments(text)
  const add = (index, detail, snippet) =>
    issues.push({ rule: 'variable', file: relPath, line: lineOf(text, index), detail, snippet })

  for (const m of masked.matchAll(/(?<![\w-])truncate(?![\w-])/g)) {
    add(
      m.index,
      'truncate 一律改用 line-clamp-1 —— 而且截斷幾行由父系 setClass 傳,module 不要定。' +
        '⚠️ 兩者不等值:display 會變成 -webkit-box、也沒有 white-space:nowrap,' +
        'inline 元素或 flex item 要實機確認',
      m[0]
    )
  }

  for (const m of masked.matchAll(/(?<![\w-])line-clamp-[a-z0-9-]+/g)) {
    add(
      m.index,
      `${m[0]} 不要寫在 module —— 要截斷幾行是使用位置的決定,` +
        '由父系 setClass 傳入(module 寫死就替所有使用端決定了)',
      m[0]
    )
  }

  return issues
}

/**
 * line-height(leading)不開變數。
 *
 * 理由同 tracking:行高是組件的字體造型設定,跟著字級走,
 * 沒有「各頁面各自指定」的需求;而且值多半是無單位比例(`1.5` / `1`),
 * 本來就不隨斷點改變 —— 拆三份只會得到三個一樣的數字。
 * 直接寫 `@apply leading-[1.5]` 就好。
 *
 * 抓三種寫法:變數定義、tailwind 取用、原生屬性取用。
 */
export function checkLeadingVariable(relPath, text) {
  const issues = []
  const masked = maskComments(text)
  const add = (index, detail, snippet) =>
    issues.push({ rule: 'variable', file: relPath, line: lineOf(text, index), detail, snippet })

  const hint = '—— leading 不開變數,直接寫 @apply leading-[值]'

  // 定義端:--x-leading / --x-line-height / --x-pc-leading
  for (const m of masked.matchAll(/(--[a-z0-9-]*(?:leading|line-height))\s*:/g)) {
    add(m.index, `${m[1]} 是行高變數 ${hint}`, m[0])
  }

  // 使用端:leading-[--x] / leading-[var(--x)]
  for (const m of masked.matchAll(/(?<![\w-])leading-\[[^\]]*--[^\]]*\]/g)) {
    add(m.index, `${m[0]} 取用了行高變數 ${hint}`, m[0])
  }

  // 使用端:原生 line-height: var(…)
  for (const m of masked.matchAll(/line-height\s*:\s*var\([^)]*\)/g)) {
    add(m.index, `${m[0]} 取用了行高變數 ${hint}`, m[0])
  }

  return issues
}

/**
 * z-index 不開變數。
 *
 * 疊層順序是「整站共用的一套秩序」——「遮罩要蓋在下拉選單上面」這種關係一旦決定就
 * 不會變,也不隨斷點或使用端改變。開成變數只是把一個常數多轉一手,還要憑空拆出
 * 三個一模一樣的斷點值;更糟的是它會讓「這一層到底排第幾」變得要跨檔案追,
 * 而疊層問題最需要的正是「一眼看到數字」。
 *
 * 直接寫 `@apply z-[3]`,要調整時整站 grep `z-[` 就看得到全部層級。
 *
 * 抓三種寫法:變數定義、tailwind 取用、原生屬性取用。
 */
export function checkZIndexVariable(relPath, text) {
  const issues = []
  const masked = maskComments(text)
  const add = (index, detail, snippet) =>
    issues.push({ rule: 'variable', file: relPath, line: lineOf(text, index), detail, snippet })

  const hint = '—— z-index 不開變數,直接寫 @apply z-[數字]'

  // 定義端:--x-z / --x-z-index / --x-pc-z / --z-index
  for (const m of masked.matchAll(/(--(?:[a-z0-9-]*-)?z(?:-index)?)\s*:/g)) {
    add(m.index, `${m[1]} 是 z-index 變數 ${hint}`, m[0])
  }

  // 使用端:z-[--x] / z-[var(--x)]
  for (const m of masked.matchAll(/(?<![\w-])z-\[[^\]]*--[^\]]*\]/g)) {
    add(m.index, `${m[0]} 取用了 z-index 變數 ${hint}`, m[0])
  }

  // 使用端:原生 z-index: var(…)
  for (const m of masked.matchAll(/z-index\s*:\s*var\([^)]*\)/g)) {
    add(m.index, `${m[0]} 取用了 z-index 變數 ${hint}`, m[0])
  }

  return issues
}

/**
 * 字級變數只有「固定位置」的元件才能建。
 *
 * 到處複用的元件(按鈕、表單、標籤)每個位置的字級都不一樣,規範要求交給父系
 * `setClass` 傳 tailwind class。**這件事最容易做半套** —— 知道字級交給父系,
 * 卻還是順手建了 `--x-text-size`;只要建了,module 就會在某處 `@apply` 它,
 * 而一輸出就蓋掉使用端傳的 `text-*`,等於「交給父系」白做。
 * **沒有變數,才真的沒有輸出。**
 *
 * 反過來,固定位置的元件(header / footer / 分頁器 / 麵包屑)全站長一樣,
 * 字級本來就該由 module 決定;使用端根本沒有管道可傳的情況(元件自己疊出來的
 * 圖層、後台編輯器存進 HTML 的 class)同理。
 *
 * 「這支是不是固定位置」是設計意圖,工具看不出來 —— 所以一律報,
 * 由人在該行或上一行標 `/* lint-text-size-exempt: 理由 *\/` 表示已經確認過。
 * 這樣新元件建字級變數時會被擋下來問,既有的合法用法則在原地留下判斷依據。
 *
 * **只看 variables 檔** —— 變數存不存在是那裡決定的,版型檔裡的
 * `--x-text-size: var(--x-pc-text-size)` 只是斷點對應,跟著定義走。這樣一支 module
 * 只需要在 `:root` 標一次豁免,而不是每個 `@screen` 段各標一次。
 * (版型檔若直接寫死 `--x-text-size: 14px`,那由 checkLayoutFileValues 那條抓。)
 */
const TEXT_SIZE_EXEMPT_RE = /lint-text-size-exempt/

// 字級變數的兩種命名:斷點在中間(--x-pc-text-size)與在後面(--x-text-pc-size)。
// 後者不符規則 4 的命名慣例,但實務上存在 —— 只抓前者的話它會整組躲過這條檢查。
const TEXT_SIZE_RE = /(--[a-z0-9-]*-text(?:-(?:pc|tablet|mobile))?-size)\s*:/g

export function checkTextSizeVariable(relPath, text) {
  if (!isVariablesFile(relPath)) return []

  const issues = []
  const masked = maskComments(text)
  // 豁免註解要從原文讀 —— masked 已經把註解換成空白了。
  // 反過來,「masked 該行是空白但原文不是」正好等於「這行整行都是註解」。
  const rawLines = text.split(/\r?\n/)
  const maskedLines = masked.split(/\r?\n/)
  const isCommentLine = (i) =>
    (rawLines[i] || '').trim() !== '' && (maskedLines[i] || '').trim() === ''

  /** 標在該行,或緊貼在上方的連續註解區塊裡(多行 /* … *\/ 也算) */
  const hasMark = (idx) => {
    if (TEXT_SIZE_EXEMPT_RE.test(rawLines[idx] || '')) return true
    for (let i = idx - 1; i >= 0 && isCommentLine(i); i--) {
      if (TEXT_SIZE_EXEMPT_RE.test(rawLines[i])) return true
    }
    return false
  }

  // 字級變數依規則 4 必定拆 pc / tablet / mobile 三份,所以豁免要涵蓋整組 ——
  // 只標在 pc 那行就夠,不必為同一個判斷貼三次。
  // 斷點可能寫在中間(--x-pc-text-size)或後面(--x-text-pc-size)—— 兩種都收斂成同一個基底
  const baseOf = (name) => name.replace(/-(?:pc|tablet|mobile)(-|$)/, '$1')
  const hits = [...masked.matchAll(TEXT_SIZE_RE)].map((m) => ({
    name: m[1],
    line: lineOf(text, m.index),
    snippet: m[0],
  }))
  const exemptBases = new Set(hits.filter((h) => hasMark(h.line - 1)).map((h) => baseOf(h.name)))

  for (const hit of hits) {
    if (exemptBases.has(baseOf(hit.name))) continue
    issues.push({
      rule: 'variable',
      file: relPath,
      line: hit.line,
      detail:
        `${hit.name} 是字級變數 —— 到處複用的元件不要建,` +
        `建了就會 @apply 出去、蓋掉使用端傳的 text-*,字級交給父系 setClass 傳。` +
        `固定位置的元件才可以,在 pc 那行或上方註解標 /* lint-text-size-exempt: 理由 */(整組三個斷點一起放行)。`,
      snippet: hit.snippet,
    })
  }

  return issues
}

/**
 * 4-c 變數名的屬性要跟實際套用的 utility 一致。
 *
 * 例如 `px-[--x-container-mx]` —— 變數叫 mx(margin)卻套在 px(padding)上,
 * 值是對的、畫面也正常,但名字會騙人:之後有人要調 margin 就會改錯地方。
 *
 * 只在「變數尾碼是已知的屬性簡寫」時才比對,`--x-size` / `--x-color` / `--x-shadow`
 * 這類泛用命名一律略過,避免誤報。
 */
const PROP_SUFFIXES = [
  'rounded-t',
  'rounded-r',
  'rounded-b',
  'rounded-l',
  'rounded',
  'min-w',
  'max-w',
  'min-h',
  'max-h',
  'gap-x',
  'gap-y',
  'gap',
  'px',
  'py',
  'pt',
  'pr',
  'pb',
  'pl',
  'p',
  'mx',
  'my',
  'mt',
  'mr',
  'mb',
  'ml',
  'm',
  'w',
  'h',
  'border',
]

export function checkVariableUsage(relPath, text) {
  const issues = []
  const masked = maskComments(text)

  // tailwind 的 arbitrary value:`px-[--form-select-dropdown-container-mx]`
  for (const m of masked.matchAll(/(?<![-\w])([a-z]+(?:-[a-z]+)*)-\[--([a-z0-9-]+)\]/g)) {
    const [, util, varName] = m
    if (!PROP_SUFFIXES.includes(util)) continue // 不是我們認得的屬性就不管
    if (varName.endsWith(`-${util}`)) continue // 名實相符

    // 變數尾碼是不是「別的」屬性?最長的先比,才不會把 -rounded-b 誤判成 -b
    const actual = PROP_SUFFIXES.find((s) => varName.endsWith(`-${s}`))
    if (!actual || actual === util) continue

    // 例外:用 ::after 的 h / w 模擬分隔線是常見手法,變數叫 -border 是對的語意
    if (actual === 'border' && (util === 'h' || util === 'w')) continue

    issues.push({
      rule: 'variable',
      file: relPath,
      line: lineOf(text, m.index),
      detail:
        `${util}-[--${varName}] 名實不符 —— 變數叫 -${actual} 卻套在 ${util} 上,` +
        `改成 -${util} 結尾(或改用正確的 utility)`,
      snippet: m[0],
    })
  }

  return issues
}

const BREAKPOINT_KINDS = ['pc', 'tablet', 'mobile']

/**
 * 斷點名稱 -> 該區塊內可以直接取用的變數斷點。
 *
 * 複合斷點(pt / tm)刻意不列 —— `pt` 同時涵蓋 p 與 t,
 * 在裡面直接吃 pc 的值,平板也會跟著吃到,那正是要抓的錯。
 */
const SCREEN_OF = { p: 'pc', t: 'tablet', m: 'mobile' }

/** 標了這個註解就跳過 —— 例外一定要在註解裡寫清楚理由 */
const EXEMPT_RE = /lint-breakpoint-exempt/

/**
 * 「三個斷點同值,刻意不拆」的標註。
 *
 * 規則 4-b 原本要求尺寸類一律拆成 pc / tablet / mobile 三份、即使三個值一樣 ——
 * 那是為了「之後要單獨調某個斷點時不必回頭拆結構」。但實務上有一批屬性
 * (box-shadow、border-width 這類造型)三端本來就同一個值,拆三份只是
 * 讓同一個數字重複三次,改的時候還要記得三個都改。
 *
 * 所以改成二選一:**拆三份,或標註同值**。標註的形式是
 * `/* lint-same-value: 理由 *\/`,寫在該行或上一行。
 *
 * ⚠️ **標之前要先問設計者這個屬性到不到分斷點** —— 這不是工程判斷。
 *    猜「不用分」的代價:之後要加斷點就得把一個變數拆成三個、
 *    改斷點對應、還要回頭確認每個使用端。
 */
const SAME_VALUE_RE = /lint-same-value/

/** 取某一行的原文(含註解)—— 判斷豁免標註用 */
const lineTextOf = (text, line) =>
  text
    .split(/\r?\n/)
    .slice(Math.max(0, line - 2), line)
    .join('\n')

/** 斷點對應本身:  --中性變數: var(--帶斷點的變數); */
const BREAKPOINT_MAP_RE = /^\s*--[a-z0-9-]+:\s*var\(--[a-z0-9-]+\)\s*;?\s*$/

/** 變數定義行:  --x-pc-y: 值;  (含組件以 inline style 帶入的 --pc-xxx) */
const BREAKPOINT_DECL_RE = /^\s*--[a-z0-9-]*?-?(pc|tablet|mobile)-[a-z0-9-]+\s*:/

/**
 * 規則 4 的斷點面向:斷點要成套,不要只做某一端。
 *
 *   6-a 版型不可直接吃 -pc- / -tablet- / -mobile- 變數,
 *       要在 @screen p / t / m 各自對應到中性變數再用
 *   6-b :root 有 -pc-X 就要有 -tablet-X 與 -mobile-X
 *
 * 6-b 補的是既有檢查的死角:checkModuleVariables 只抓「完全沒分斷點的單值」,
 * 分了三份卻漏掉其中一個(最常見的是只寫 pc + tablet)完全沒人會發現 ——
 * 那個斷點會靜靜地讀不到值,畫面不會報錯。
 *
 * 真的只有某一端才成立的樣式(例如手機版刻意不給 padding,讓使用端自己控制)
 * 屬於例外,在該行或上一行寫 `lint-breakpoint-exempt: 理由` 就會跳過。
 *
 * 移植自參考專案 EFOfficial(2026-08-28),判斷邏輯保持一致。
 */
export function checkBreakpointCoverage(relPath, text) {
  const issues = []
  const add = (line, detail, snippet) =>
    issues.push({ rule: 'variable', file: relPath, line, detail, snippet })

  const masked = maskComments(text)
  const rawLines = text.split('\n')
  const maskedLines = masked.split('\n')

  const isExempt = (i) => EXEMPT_RE.test(rawLines[i] || '') || EXEMPT_RE.test(rawLines[i - 1] || '')

  // 6-a —— 但「在 p 斷點區塊裡面吃 -pc- 的值」是直接且正確的,不算違規。
  //        追蹤目前所在的斷點區塊,只報「斷點對不上」與「根本沒包在斷點區塊裡」的。
  let depth = 0
  const screenStack = [] // { name: 'p' | 't' | 'm' | 'pt' | …, depth }

  maskedLines.forEach((line, i) => {
    const screenMatch = line.match(/@screen\s+([a-z]+)/)

    if (screenMatch) screenStack.push({ name: screenMatch[1], depth })

    depth += (line.match(/\{/g) || []).length
    depth -= (line.match(/\}/g) || []).length

    while (screenStack.length && depth <= screenStack.at(-1).depth) screenStack.pop()

    // tailwind 自己的斷點前綴也算數:`m:max-w-[--x-mobile-max-w]` 等同包在 @screen m 裡,
    // 先把這種「前綴與變數斷點相符」的 utility 從該行拿掉,剩下的才檢查。
    const cleaned = line.replace(
      /(?<![\w-])(p|t|m):[a-z-]+-\[--[a-z0-9-]*-(pc|tablet|mobile)-[a-z0-9-]*\]/g,
      (utility, prefix, bp) => (SCREEN_OF[prefix] === bp ? '' : utility)
    )

    const m = cleaned.match(/-(pc|tablet|mobile)-/)
    if (!m) return
    if (BREAKPOINT_MAP_RE.test(line) || BREAKPOINT_DECL_RE.test(line)) return
    if (isExempt(i)) return

    // 所在的斷點區塊正好對應這個變數的斷點 → 直接取值沒問題
    if (screenStack.length && SCREEN_OF[screenStack.at(-1).name] === m[1]) return

    const where = screenStack.length
      ? `@screen ${screenStack.at(-1).name} 內`
      : '沒有包在 @screen p / t / m 裡'
    add(
      i + 1,
      `版型吃了 ${m[1]} 的變數但${where} —— ` +
        '要嘛放進對應的 @screen,要嘛改吃中性變數由三個斷點各自對應',
      line.trim().slice(0, 90)
    )
  })

  // 6-b
  const declared = new Map()
  for (const rm of masked.matchAll(/:root\s*\{([\s\S]*?)\n\}/g)) {
    const body = rm[1]
    const bodyStart = rm.index + rm[0].indexOf(body)
    for (const v of body.matchAll(/(--[a-z0-9-]+)\s*:/g)) {
      declared.set(v[1], bodyStart + v.index)
    }
  }

  const groups = new Map()
  for (const [name, index] of declared) {
    const m = name.match(/^(--.*?)-(pc|tablet|mobile)-(.*)$/)
    if (!m) continue
    const key = `${m[1]}|${m[3]}`
    if (!groups.has(key)) groups.set(key, { kinds: new Set(), index })
    groups.get(key).kinds.add(m[2])
  }

  for (const [key, { kinds, index }] of groups) {
    const lack = BREAKPOINT_KINDS.filter((k) => !kinds.has(k))
    if (!lack.length) continue
    const line = lineOf(text, index)
    if (isExempt(line - 1)) continue
    const [prefix, suffix] = key.split('|')
    add(
      line,
      `${prefix}-*-${suffix} 只有 ${[...kinds].join(' / ')},缺 ${lack.join(' / ')} —— 斷點要成套(即使三個值一樣)`,
      `${prefix}-${[...kinds][0]}-${suffix}`
    )
  }

  return issues
}

// --- 色票檔自身:命名、排序、頻道歸屬 ---------------------------------------

/**
 * 數某個色票變數在專案裡的使用次數(色票檔本身不算)。
 * 只在檢查色票檔時才會呼叫,不影響一般檔案的檢查速度。
 */
function countUsages(projectRoot, varName) {
  const needle = new RegExp(`var\\(\\s*${varName}\\s*[),]|\\[\\s*${varName}\\s*\\]`)
  let count = 0

  for (const target of SCAN_TARGETS) {
    for (const abs of listFiles(projectRoot, target)) {
      const rel = path.relative(projectRoot, abs).split(path.sep).join('/')
      if (isColorCssPath(rel)) continue
      if (needle.test(fs.readFileSync(abs, 'utf8'))) count += 1
    }
  }

  return count
}

/**
 * 檢查單一色票檔的命名與排序。
 * 排序只回報,不改檔 —— 自動修正在 sort-color-css.mjs / 各層守門。
 */
export function checkColorFile(projectRoot, rel) {
  const abs = path.join(projectRoot, rel)
  if (!fs.existsSync(abs)) return []

  const issues = []
  const add = (detail, snippet) =>
    issues.push({ rule: 'colorFile', file: rel, line: 1, detail, snippet })

  const original = fs.readFileSync(abs, 'utf8')
  const parsed = parseColorCss(original)

  if (!parsed) {
    add(`${rel} 結構無法解析(需要單層 :root { … })`, ':root')
    return issues
  }

  for (const d of parsed.decls) {
    const hue = hueOf(d.name)
    if (!hue) {
      add(`${d.name} 的色系前綴不在允許清單內(紅澄黃綠藍紫金白灰黑)`, d.name)
      continue
    }
    if (isDerivedColorVar(d.name)) continue

    const hex = hexOfValue(d.value)
    if (!hex) continue

    const expect = expectedSuffix(hex)
    if (expect === null) continue
    if (suffixOf(d.name) !== expect) {
      const should = expect === '' ? `--${hue}` : `--${hue}-${expect}`
      add(`${d.name}: ${hex} 依命名規則應為 ${should}`, d.name)
    }
  }

  // `--white-rgb: hexToRgb(#fff)` 這類衍生變數:要有本體、色值要一致、還要真的有人在用
  const byName = new Map(parsed.decls.map((d) => [d.name, d]))

  for (const d of parsed.decls.filter((x) => isDerivedColorVar(x.name))) {
    const baseName = d.name.replace(/-rgb$/, '')
    const base = byName.get(baseName)

    if (!base) {
      add(`${d.name} 找不到本體 ${baseName} —— 衍生變數要跟著本體走,先建本體或刪掉這個`, d.name)
    } else {
      const a = hexOfValue(d.value)
      const b = hexOfValue(base.value)
      if (a && b && a.toLowerCase() !== b.toLowerCase()) {
        add(`${d.name}(${a})與本體 ${baseName}(${b})色值不一致`, d.name)
      }
    }

    if (!countUsages(projectRoot, d.name)) {
      add(
        `${d.name} 沒有任何使用端 —— 是死變數,建議刪掉` +
          '(新的透明色請直接用 8 碼 hex,不要走 hexToRgb)',
        d.name
      )
    }
  }

  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  const sortedText = buildColorCss(parsed, sortDecls(parsed.decls)).split('\n').join(eol)
  if (sortedText.trimEnd() !== original.split(/\r?\n/).join(eol).trimEnd()) {
    add('排序不符規則(紅澄黃綠藍紫金白灰黑 + 由淺至深)—— 執行 npm run sort:color 自動修正', rel)
  }

  return issues
}

/** 檢查頻道色票是否該收攏到共用 color.css(跨檔比對,與單一檔案無關) */
export function checkSharedColors(projectRoot) {
  return findSharedColors(projectRoot).map(({ hex, kind, entries }) => ({
    rule: 'colorFile',
    file: entries.find((e) => e.channel)?.rel ?? SHARED_COLOR_CSS_PATH,
    line: 1,
    detail:
      `${hex} ${entries.map((e) => `${e.name} @ ${e.rel}`).join('、')} —— ` +
      (kind === 'duplicate-shared'
        ? `共用色票已有同色值,頻道檔那份多餘 → 刪掉頻道檔的,使用端改用共用變數`
        : `同一色值用在兩個以上頻道 → 搬到 ${SHARED_COLOR_CSS_PATH},頻道檔各自刪掉`),
    snippet: hex,
  }))
}

// --- 對外主要進入點 ---------------------------------------------------------

/** 檢查單一檔案,回傳 issues */
export function lintFile(projectRoot, absPath, definedVars) {
  const rel = path.relative(projectRoot, absPath).split(path.sep).join('/')
  if (!fs.existsSync(absPath)) return []
  // 文件路徑(docs / .docs / .acceptance)一律不檢查 —— 見 IGNORED_PATH 的說明
  if (isIgnoredPath(rel)) return []
  // 色票檔本來就該有顏色 —— 它要檢查的是自己的命名與排序,不是「有沒有寫死色碼」。
  // 但已淘汰的 hexToRgb / -rgb 變數連色票檔也不該有,那兩條照跑。
  if (isColorCssPath(rel)) {
    return [
      ...checkColorFile(projectRoot, rel),
      ...checkColorMechanism(rel, fs.readFileSync(absPath, 'utf8')),
    ]
  }

  const raw = fs.readFileSync(absPath, 'utf8')

  // 設定檔(tailwind.extend.js 等)只檢查顏色 —— 下面那些規則講的是 CSS 的結構,
  // 對 js 不成立。先遮掉 // 註解,免得說明文字裡的色碼被當成違規。
  const text = SCAN_CONFIG_FILES.has(path.basename(absPath)) ? maskLineComments(raw) : raw

  const issues = [...checkColors(rel, text, definedVars), ...checkColorMechanism(rel, text)]

  // tailwind 推斷不出型別的三個屬性 —— 在哪裡寫都是錯的,所以不限目錄
  if (rel.endsWith('.vue') || rel.endsWith('.css')) {
    issues.push(...checkTailwindPitfalls(rel, text))
    // 顏色變數的 base 要寫 inherit / transparent,不要用 initial 繞路
    issues.push(...checkColorBase(rel, text))
    // 文字截斷:一律 line-clamp-*,而且不寫在 module 裡
    issues.push(...checkLineClamp(rel, text))
    // 空的規則區塊 —— 產物不會有輸出,存檔時會自動移除
    issues.push(...checkEmptyRule(rel, text))
    // tracking 不開變數 —— 在哪裡寫都是錯的,所以同樣不限目錄
    issues.push(...checkTrackingVariable(rel, text))
    // leading 同理:行高跟著字級走,值又多半是無單位比例
    issues.push(...checkLeadingVariable(rel, text))
    // z-index 同理:疊層是整站一套秩序,寫成常數才看得出誰蓋誰
    issues.push(...checkZIndexVariable(rel, text))
    // 字級變數只有固定位置的元件能建 —— 複用型元件建了就會蓋掉使用端傳的 text-*
    issues.push(...checkTextSizeVariable(rel, text))
    // 規則 6:被 theme 整組覆寫掉而不存在的 class
    issues.push(...checkTailwindTheme(rel, text))
  }

  if (rel.endsWith('.vue')) {
    issues.push(...checkModuleImports(rel, text))
    issues.push(...checkImportOrder(rel, text))
  }

  // module 的變數命名與斷點
  if (rel.startsWith('assets/css/_modules/') && rel.endsWith('.css')) {
    issues.push(...checkModuleVariables(rel, text))
    issues.push(...checkVariableUsage(rel, text))
    issues.push(...checkVariablesFile(rel, text))
    issues.push(...checkLayoutFileValues(rel, text))
    issues.push(...checkBreakpointCoverage(rel, text))
    issues.push(...checkScreenGrouping(rel, text))
  }

  if (rel.startsWith('components/') && rel.endsWith('.vue')) {
    issues.push(...checkTailwindInComponents(rel, text))
    issues.push(...checkStateClassNaming(rel, text))
  }

  return issues
}

export { isDerivedColorVar }
