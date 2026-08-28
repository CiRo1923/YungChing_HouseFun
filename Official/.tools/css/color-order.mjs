// 色票檔(assets/css/_common/color*.css)的解析、命名驗證、排序與頻道歸屬判斷。
// 由 sort-color-css.mjs(排序/自動修正)與 lint-core.mjs(規範檢查)共用。
//
// 本專案的色票分頻道:
//   color.css        全頻道共用(由 nuxt.config 的 css 陣列載入)
//   color<Channel>.css  單一頻道專用(由 layouts/<channel>.vue 經 channelColor.js 載入)
//
// 同一個色值出現在兩個以上頻道檔 → 應該搬到共用的 color.css(見 findSharedColors)。

import fs from 'node:fs'
import path from 'node:path'

/** 色系排序:紅 → 澄 → 黃 → 綠 → 藍 → 紫 → 金 → 白 → 灰 → 黑 */
export const HUE_ORDER = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'gold',
  'white',
  'gray',
  'black',
]

/** 允許的色系前綴(留 alias 表,之後要收同義字時在這裡加) */
const HUE_ALIAS = Object.fromEntries(HUE_ORDER.map((hue) => [hue, hue]))

/** 色票檔所在目錄 */
export const COLOR_CSS_DIR = 'assets/css/_common'

/** 全頻道共用的色票檔 */
export const SHARED_COLOR_CSS_PATH = `${COLOR_CSS_DIR}/color.css`

/** rel 是否為色票檔(共用或頻道) */
export const isColorCssPath = (rel) =>
  new RegExp(`^${COLOR_CSS_DIR}/color[A-Za-z]*\\.css$`).test(rel)

/** 由色票檔路徑取出頻道名(共用檔回傳 null) */
export function channelOfColorCss(rel) {
  const m = rel.match(/\/color([A-Za-z]*)\.css$/)
  if (!m) return null
  return m[1] ? m[1].toLowerCase() : null
}

/**
 * 列出專案內所有色票檔,共用的排在最前面。
 * 回傳 [{ rel, abs, channel }],channel 為 null 代表共用。
 */
export function listColorCssFiles(projectRoot) {
  const dir = path.join(projectRoot, COLOR_CSS_DIR)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((name) => /^color[A-Za-z]*\.css$/.test(name))
    .map((name) => {
      const rel = `${COLOR_CSS_DIR}/${name}`
      return { rel, abs: path.join(dir, name), channel: channelOfColorCss(rel) }
    })
    .sort((a, b) => {
      if (!a.channel) return -1
      if (!b.channel) return 1
      return a.rel.localeCompare(b.rel)
    })
}

// --- 色值處理 ---------------------------------------------------------------

/** #abc / #aabbcc / #aabbccdd → { r, g, b, a }(a 為 0-255,無 alpha 時 255) */
export function parseHex(hex) {
  let h = hex.replace(/^#/, '').toLowerCase()
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('')
  if (h.length === 6) h += 'ff'
  if (h.length !== 8 || !/^[0-9a-f]{8}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16),
  }
}

/** 把色值正規化成 8 碼 hex,用來比對「是不是同一個顏色」 */
export function normalizeHex(hex) {
  const rgba = parseHex(hex)
  if (!rgba) return null
  return (
    '#' +
    [rgba.r, rgba.g, rgba.b, rgba.a].map((v) => v.toString(16).padStart(2, '0')).join('')
  )
}

/** WCAG 相對亮度(0=黑 1=白)。跨色相比較用,不會把黃色誤判成深色。 */
export function relativeLuminance({ r, g, b }) {
  const lin = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// --- 命名規則 ---------------------------------------------------------------

/**
 * 依色值推導出「應該的」色碼縮寫。
 *
 *   6 碼、三組不同 → 第 1、3、5 碼 + 第 6 碼        #374151 → 3451
 *   6 碼、純灰     → 前 2 碼                        #f9f9f9 → f9
 *   3 碼 hex       → 原樣                           #eee    → eee
 *   純黑白         → 不加色碼                       #fff    → (空)
 *   帶 alpha       → 上述縮寫再「-」接 alpha 兩碼   #0087dc1a → 08dc-1a
 *                    純黑白則只留 alpha 兩碼        #0000001a → 1a
 *
 * alpha 之所以用連字號隔開,是因為黏在一起會分不出哪幾碼是色碼、哪幾碼是透明度 ——
 * --gray-33-4d 到底是「#33334d」還是「#333333 + 4d」?加了 - 就沒有歧義。
 * 純黑白本來就沒有色碼縮寫,不會混淆,維持 --black-1a 不加。
 */
export function expectedSuffix(rawHex) {
  const raw = rawHex.replace(/^#/, '').toLowerCase()
  const rgba = parseHex(rawHex)
  if (!rgba) return null

  const hasAlpha = rgba.a !== 255
  const alphaHex = rgba.a.toString(16).padStart(2, '0')

  // 3 碼 hex 且不帶 alpha → 原樣照抄
  if (raw.length === 3) {
    if (raw === 'fff' || raw === '000') return ''
    return raw
  }

  const isPureWhite = rgba.r === 255 && rgba.g === 255 && rgba.b === 255
  const isPureBlack = rgba.r === 0 && rgba.g === 0 && rgba.b === 0
  const isGray = rgba.r === rgba.g && rgba.g === rgba.b

  // 純黑白:不帶色碼縮寫,帶 alpha 時只接 alpha 兩碼
  if (isPureWhite || isPureBlack) return hasAlpha ? alphaHex : ''

  const six = raw.slice(0, 6)
  // 純灰:取前 2 碼
  const base = isGray ? six.slice(0, 2) : six[0] + six[2] + six[4] + six[5]
  return hasAlpha ? `${base}-${alphaHex}` : base
}

/** 由變數名取出色系,不在清單內回傳 null */
export function hueOf(varName) {
  const m = varName.replace(/^--/, '').match(/^([a-z]+)/)
  if (!m) return null
  return HUE_ALIAS[m[1]] ?? null
}

/** 由變數名取出色碼縮寫(色系前綴之後的部分,無則為空字串) */
export function suffixOf(varName) {
  const body = varName.replace(/^--/, '')
  const hue = hueOf(varName)
  if (!hue) return null
  return body.slice(hue.length).replace(/^-/, '')
}

/**
 * `--white-rgb: hexToRgb(#fff)` 這類衍生變數不套色碼縮寫規則 ——
 * 它的名字要跟著本體(`--white`)走,不是獨立命名。
 */
export const isDerivedColorVar = (varName) => /-rgb$/.test(varName)

// --- 色票檔解析 -------------------------------------------------------------

const DECL_RE = /^(\s*)(--[a-z0-9-]+)\s*:\s*([^;]+);\s*$/i

/** 色系標籤註解的中文對照(colorBuy.css 用 `/* 紅色 *\/` 這種分組標頭) */
const HUE_LABEL_ALIAS = {
  紅: 'red', 澄: 'orange', 橙: 'orange', 黃: 'yellow', 綠: 'green',
  藍: 'blue', 紫: 'purple', 金: 'gold', 白: 'white', 灰: 'gray', 黑: 'black',
}

/**
 * 判斷一行註解是不是「色系分組標頭」(`/* 紅色 *\/`、`/* blue *\/`)。
 * 是的話回傳色系名 —— 這種註解要固定留在該色系組的最前面,
 * 不能跟著某個變數一起被搬走。
 */
function hueLabelOf(commentLine) {
  const m = commentLine.match(/^\s*\/\*\s*([^*\s]+?)\s*(?:色)?\s*\*\/\s*$/)
  if (!m) return null
  const key = m[1]
  return HUE_LABEL_ALIAS[key] ?? (HUE_ALIAS[key.toLowerCase()] ?? null)
}

/**
 * 解析色票檔,回傳 { header, decls, tail, footer }。
 *
 * `:root` 內的註解與空行不參與排序,而是**附著到下一筆宣告**(leading)一起搬動 ——
 * 直接丟掉會無聲吃掉「/* CommonMHeader 用色 *\/」這類說明。
 * 尾端沒有後續宣告的註解收在 tail。
 *
 * 只處理單層 :root;檔案結構不符時回傳 null,由呼叫端決定如何處理。
 */
export function parseColorCss(text) {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => /^\s*:root\s*\{/.test(l))
  if (start === -1) return null
  const end = lines.findIndex((l, i) => i > start && /^\s*\}\s*$/.test(l))
  if (end === -1) return null

  const decls = []
  const hueLabels = new Map()
  let pending = []

  for (let i = start + 1; i < end; i += 1) {
    const line = lines[i]
    const m = line.match(DECL_RE)

    if (!m) {
      // 空行不保留(色系之間的空行由 buildColorCss 重新產生),註解要留
      if (line.trim() === '') continue
      const hue = hueLabelOf(line)
      // 色系標頭記在 hueLabels,重建時放回該色系組的最前面
      if (hue) hueLabels.set(hue, line)
      else pending.push(line)
      continue
    }

    decls.push({ line, name: m[2], value: m[3].trim(), indent: m[1], leading: pending })
    pending = []
  }

  return {
    header: lines.slice(0, start + 1),
    decls,
    hueLabels,
    tail: pending,
    footer: lines.slice(end),
  }
}

/** 取出色值中的 hex(含 hexToRgb(#xxx) 的內層);取不到回傳 null */
export function hexOfValue(value) {
  const m = value.match(/#[0-9a-fA-F]{3,8}\b/)
  return m ? m[0] : null
}

/**
 * 排序宣告。
 * 規則:色系依 HUE_ORDER,同色系內由淺至深(相對亮度高者在前);
 * 亮度相同(例如同一色的不同透明度)時,alpha 低者(較淺)在前。
 * 認不出色系或色值的宣告一律排在最後,維持原有相對順序。
 */
export function sortDecls(decls) {
  const keyed = decls.map((d, idx) => {
    const hue = hueOf(d.name)
    const hex = hexOfValue(d.value)
    const rgba = hex ? parseHex(hex) : null
    return {
      d,
      idx,
      hueIdx: hue ? HUE_ORDER.indexOf(hue) : Number.MAX_SAFE_INTEGER,
      lum: rgba ? relativeLuminance(rgba) : -1,
      alpha: rgba ? rgba.a : 255,
      sortable: Boolean(hue && rgba),
    }
  })

  keyed.sort((a, b) => {
    if (a.sortable !== b.sortable) return a.sortable ? -1 : 1
    if (!a.sortable) return a.idx - b.idx
    if (a.hueIdx !== b.hueIdx) return a.hueIdx - b.hueIdx
    if (a.lum !== b.lum) return b.lum - a.lum // 亮(淺)在前
    if (a.alpha !== b.alpha) return a.alpha - b.alpha // 同色:透明度低(淺)在前
    return a.idx - b.idx // 同色同透明度(例如 --white 與 --white-rgb)維持原序
  })

  return keyed.map((k) => k.d)
}

/** 依排序結果重建整份色票檔文字;色系之間插入空行 */
export function buildColorCss(parsed, sortedDecls) {
  const out = [...parsed.header]
  let prevHue = null

  for (const d of sortedDecls) {
    const hue = hueOf(d.name)
    if (prevHue !== hue) {
      if (prevHue !== null) out.push('')
      // 原檔有這個色系的分組標頭就放回組首
      const label = parsed.hueLabels?.get(hue)
      if (label) out.push(label)
    }
    out.push(...(d.leading ?? []))
    out.push(d.line)
    prevHue = hue
  }

  out.push(...(parsed.tail ?? []))
  out.push(...parsed.footer)
  return out.join('\n')
}

// --- 跨檔查詢 ---------------------------------------------------------------

/**
 * 讀出所有色票檔已定義的顏色變數。
 * 回傳 Map<varName, { rel, channel, value, hex }>;同名變數以先掃到的(共用檔優先)為準。
 */
export function loadDefinedColorVars(projectRoot) {
  const map = new Map()

  for (const { rel, abs, channel } of listColorCssFiles(projectRoot)) {
    const text = fs.readFileSync(abs, 'utf8')
    const parsed = parseColorCss(text)
    const decls = parsed?.decls ?? []

    for (const d of decls) {
      if (map.has(d.name)) continue
      map.set(d.name, { rel, channel, value: d.value, hex: hexOfValue(d.value) })
    }
  }

  return map
}

/**
 * 找出「該搬到共用 color.css」的色值:
 *   a. 同一個色值出現在兩個以上頻道檔 → 已經是跨頻道共用
 *   b. 頻道檔的色值與共用 color.css 重複 → 頻道檔那份是多餘的
 *
 * 回傳 [{ hex, kind: 'cross-channel' | 'duplicate-shared', entries: [{ rel, channel, name }] }]
 */
export function findSharedColors(projectRoot) {
  const byHex = new Map()

  for (const { rel, abs, channel } of listColorCssFiles(projectRoot)) {
    const parsed = parseColorCss(fs.readFileSync(abs, 'utf8'))
    for (const d of parsed?.decls ?? []) {
      if (isDerivedColorVar(d.name)) continue
      const hex = hexOfValue(d.value)
      const key = hex ? normalizeHex(hex) : null
      if (!key) continue
      if (!byHex.has(key)) byHex.set(key, [])
      byHex.get(key).push({ rel, channel, name: d.name })
    }
  }

  const results = []

  for (const [hex, entries] of byHex) {
    const channels = new Set(entries.filter((e) => e.channel).map((e) => e.channel))
    const inShared = entries.some((e) => !e.channel)

    if (inShared && channels.size > 0) {
      results.push({ hex, kind: 'duplicate-shared', entries })
    } else if (channels.size > 1) {
      results.push({ hex, kind: 'cross-channel', entries })
    }
  }

  return results
}
