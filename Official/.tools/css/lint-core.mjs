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
]

export const SCAN_EXT = new Set(['.vue', '.css'])

// --- 顏色偵測用的樣式 -------------------------------------------------------

/** CSS 具名色(常見的一批;完整 148 色沒必要,誤報成本高於漏報) */
const NAMED_COLORS = new Set([
  'white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
  'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy',
  'teal', 'olive', 'maroon', 'silver', 'aqua', 'fuchsia', 'gold', 'beige',
  'ivory', 'khaki', 'salmon', 'coral', 'crimson', 'indigo', 'violet',
  'turquoise', 'tan', 'plum', 'orchid', 'lavender', 'wheat', 'azure',
])

/** tailwind 內建色票的色名(搭配數字階層或直接使用) */
const TW_PALETTE = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber',
  'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
  'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'white', 'black',
]

/** 會吃顏色的 tailwind utility 前綴 */
const TW_COLOR_UTIL = [
  'text', 'bg', 'border', 'ring', 'divide', 'outline', 'shadow', 'accent',
  'caret', 'decoration', 'fill', 'stroke', 'from', 'via', 'to', 'placeholder',
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
  'flex', 'grid', 'block', 'inline', 'inline-block', 'inline-flex', 'inline-grid',
  'hidden', 'contents', 'table', 'flow-root', 'list-item',
  'absolute', 'relative', 'fixed', 'sticky', 'static',
  'truncate', 'italic', 'underline', 'overline', 'uppercase', 'lowercase',
  'capitalize', 'invisible', 'visible', 'collapse', 'isolate',
  'grow', 'shrink', 'antialiased', 'subpixel-antialiased',
  'sr-only', 'not-sr-only', 'container', 'group', 'peer',
  'border', 'rounded', 'shadow', 'ring', 'outline', 'filter', 'blur',
  'transition', 'transform', 'appearance-none', 'resize', 'overflow-hidden',
  'overflow-auto', 'overflow-visible', 'overflow-scroll',
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
  'fill-', 'stroke-', 'backdrop-', 'blur-', 'brightness-', 'contrast-',
  'grayscale-', 'invert-', 'saturate-', 'sepia-', 'drop-shadow-',
  'accent-', 'caret-', 'placeholder-', 'from-', 'via-', 'to-',
  'float-', 'clear-', 'box-', 'table-', 'caption-', 'border-spacing-',
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

export function listFiles(projectRoot, target) {
  const abs = path.join(projectRoot, target)
  if (!fs.existsSync(abs)) return []
  if (fs.statSync(abs).isFile()) return SCAN_EXT.has(path.extname(abs)) ? [abs] : []
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
    const candidates = isDynamic
      ? [...raw.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1])
      : [raw]

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
  const imports = [
    ...text.matchAll(/^\s*import\s+["'][^"']*_modules\/(.+)\/([^/"']+\.css)["']/gm),
  ]

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
  'active', 'curr', 'current', 'checked', 'selected', 'disabled', 'readonly',
  'focus', 'open', 'opened', 'close', 'closed', 'show', 'hidden', 'error',
  'loading', 'draggable', 'fixed',
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
    issues.push({ rule: 'tailwind', file: relPath, line: lineOf(text, offset + index), detail, snippet: name })
  }

  // is-x / has-x 這種裸前綴,不論在 class 屬性還是 css 選擇器裡
  for (const m of body.matchAll(/(?<![-\w.])(is|has)-([a-z][a-z0-9-]*)/g)) {
    const name = `${m[1]}-${m[2]}`
    add(name, m.index, `狀態 class ${name} 要寫成 --${name}(狀態一律 -- 開頭,不用裸的 is- / has- 前綴)`)
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

/** 這些值即使是尺寸也不必分斷點 —— 純結構性、不隨裝置調整 */
const STRUCTURAL_VALUES = new Set(['0', '0px', 'auto', 'inherit', 'initial', 'none', 'transparent'])

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

    // 4-b 尺寸類要分斷點
    if (name.includes('-pc-') || name.includes('-tablet-') || name.includes('-mobile-')) continue
    if (STRUCTURAL_VALUES.has(value)) continue
    if (!SIZE_VALUE_RE.test(value)) continue

    // 已經有對應的斷點版本就不算(base 值,例如 --anchor-px: 0 搭配 modifier)
    const hasBreakpointSibling = names.some(
      (n) => n.replace(/-(pc|tablet|mobile)-/, '-') === name && n !== name
    )
    if (hasBreakpointSibling) continue

    add(
      line,
      `${name}: ${value} 是尺寸類單值,要拆成 pc / tablet / mobile 三份(即使三個值一樣)`,
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
export function checkVariablesFile(relPath, text) {
  if (!/(^|\/)([a-z][A-Za-z]*)?[Vv]ariables\.css$/.test(relPath)) return []

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
   * variables 檔放的是「值」:`:root` 的預設值、modifier 對應的具體值、@screen 的斷點值。
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
        '(:root 預設值、modifier 的具體值、@screen 斷點值),' +
        '把 module 自己的變數指向自己另一個變數要寫在版型檔',
      snippet: name,
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
  'rounded-t', 'rounded-r', 'rounded-b', 'rounded-l', 'rounded',
  'min-w', 'max-w', 'min-h', 'max-h',
  'gap-x', 'gap-y', 'gap',
  'px', 'py', 'pt', 'pr', 'pb', 'pl', 'p',
  'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'm',
  'w', 'h', 'border',
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
  // 色票檔本來就該有顏色 —— 它要檢查的是自己的命名與排序,不是「有沒有寫死色碼」
  if (isColorCssPath(rel)) return checkColorFile(projectRoot, rel)

  const text = fs.readFileSync(absPath, 'utf8')
  const issues = checkColors(rel, text, definedVars)

  if (rel.endsWith('.vue')) {
    issues.push(...checkModuleImports(rel, text))
    issues.push(...checkImportOrder(rel, text))
  }

  // module 的變數命名與斷點
  if (rel.startsWith('assets/css/_modules/') && rel.endsWith('.css')) {
    issues.push(...checkModuleVariables(rel, text))
    issues.push(...checkVariableUsage(rel, text))
    issues.push(...checkVariablesFile(rel, text))
  }

  if (rel.startsWith('components/') && rel.endsWith('.vue')) {
    issues.push(...checkTailwindInComponents(rel, text))
    issues.push(...checkStateClassNaming(rel, text))
  }

  return issues
}

export { isDerivedColorVar }
