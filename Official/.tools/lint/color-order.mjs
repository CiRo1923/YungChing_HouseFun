// 色票檔的解析、命名判定與排序。
//
// 排序規則(見 .claude/skills/color-naming/SKILL.md):
//   大分類依彩虹 —— 紅 → 橙 → 黃 → 綠 → 藍 → 紫 → 金 → 白 → 灰 → 黑
//   每一色類內部由淺到深(感知亮度 0.299R + 0.587G + 0.114B,亮者在前)
//   -rgb 衍生變數緊跟在其基礎變數之後
//
// 只動順序,不動色值。解析不出 :root 結構時整支放過 —— 寧可不修,不要改壞。

import fs from 'node:fs'
import path from 'node:path'
import {
  COLOR_CSS_DIR,
  COLOR_CSS_PREFIX,
  COLOR_HUE_SOURCE,
  COLOR_HUES,
  COLOR_NAME_SEPARATOR,
  COLOR_RGB_SUFFIX,
  COLOR_SUFFIX_PICK,
} from './project-config.mjs'

export { COLOR_CSS_DIR, COLOR_CSS_PREFIX, COLOR_NAME_SEPARATOR }

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * 全站共用色票 —— 跨分組都會用到的色值收在這一支。
 *
 * 目錄與檔名前綴都來自設定,不寫死 —— 每個專案叫什麼不一樣,
 * 寫死之後換一個專案就指到一支不存在的檔案,而規則不會報錯,
 * 只會從此不再認為有任何共用色票。
 */
export const SHARED_COLOR_CSS_PATH = `${COLOR_CSS_DIR}/${COLOR_CSS_PREFIX}.css`

/** 色票檔:目錄底下以設定的前綴開頭的 css(共用那一支與各分組的) */
const COLOR_CSS_RE = new RegExp(
  `^${escapeRe(COLOR_CSS_DIR)}/${escapeRe(COLOR_CSS_PREFIX)}([A-Za-z]*)\\.css$`
)

export const isColorCssPath = (rel) => COLOR_CSS_RE.test(rel)

/**
 * 分組名 —— 前綴後面那一段。
 *
 * 前綴是 `color` 時:`color.css` → `''`(共用);`colorMember.css` → `'Member'`。
 * 不是色票檔就回 null。
 */
export const channelOfColorCss = (rel) => rel.match(COLOR_CSS_RE)?.[1] ?? null

/**
 * 彩虹順序;未知色相排在最後。
 *
 * 清單本身來自設定 —— 每個專案的配色不一樣,有的多粉或棕,有的少金。
 * 寫死在這裡的話,換一個專案就會把它自己的色相全部判定為「認不出」。
 */
export const HUE_ORDER = COLOR_HUES

/** 提示訊息裡列出可用色相時共用這一份字串,不在訊息處另外抄一次清單 */
export const HUE_LIST_TEXT = HUE_ORDER.join(' / ')

const HUE_LABEL = Object.fromEntries(HUE_ORDER.map((h) => [h, h]))

/** 從色值取出 hex —— 值可能是 #xxx,也可能是 hexToRgb(#xxx) */
export const hexOf = (value) => value.match(/#([0-9a-fA-F]{3,8})/)?.[1] ?? null

/** 感知亮度 0–255;取不到 hex 回傳 null(排序時排在該色相最後) */
export const luminanceOf = (value) => {
  const hex = hexOf(value)
  if (!hex) return null

  const base = hex.length === 8 ? hex.slice(0, 6) : hex
  const full =
    base.length === 3 || base.length === 4
      ? [...base.slice(0, 3)].map((c) => c + c).join('')
      : base.slice(0, 6)

  if (full.length !== 6) return null

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * 色相環上各色的角度範圍(起 <= 角度 < 迄,紅跨越 0 度所以分兩段寫)。
 *
 * 這是色彩學的分段,與專案無關 —— 從色值算色相時用。
 * `gold` 不在這裡:金在色相環上就是橘,分不出來,那是人給的語意分類。
 */
const HUE_ANGLES = [
  ['red', 345, 360],
  ['red', 0, 15],
  ['orange', 15, 45],
  ['yellow', 45, 70],
  ['green', 70, 170],
  ['blue', 170, 260],
  ['purple', 260, 345],
]

/**
 * 飽和度低到這個程度就不算有顏色,改看亮度歸到白 / 灰 / 黑。
 *
 * `#f1f1f1` 的飽和度是 0,`#ced4da` 只有 0.14 —— 後者看起來仍是灰,
 * 所以門檻不能訂太低。訂太高則會把淡色系整批吃進灰。
 */
const NEUTRAL_SATURATION = 0.15

/** 無彩色的亮度分界:高於上界是白,低於下界是黑,中間是灰 */
const NEUTRAL_LIGHTNESS = { white: 0.93, black: 0.12 }

/** 色值轉成色相角、飽和度、亮度;算不出來時色相角是 null */
const hslOf = (hex) => {
  const base =
    hex.length === 8
      ? hex.slice(0, 6)
      : hex.length === 3 || hex.length === 4
        ? [...hex.slice(0, 3)].map((c) => c + c).join('')
        : hex.slice(0, 6)

  if (base.length !== 6) return null

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(base.slice(i, i + 2), 16) / 255)
  if ([r, g, b].some(Number.isNaN)) return null

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min

  if (d === 0) return { h: null, s: 0, l }

  const s = d / (1 - Math.abs(2 * l - 1))
  const h =
    max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4)

  return { h: (h + 360) % 360, s, l }
}

/** 從色值算色相;算出來的分類不在設定的清單裡時回傳 null(排序時排在最後) */
const hueByValue = (value) => {
  const hex = hexOf(value)
  const hsl = hex ? hslOf(hex) : null
  if (!hsl) return null

  const { h, s, l } = hsl

  const name =
    h === null || s < NEUTRAL_SATURATION
      ? l > NEUTRAL_LIGHTNESS.white
        ? 'white'
        : l < NEUTRAL_LIGHTNESS.black
          ? 'black'
          : 'gray'
      : (HUE_ANGLES.find(([, from, to]) => h >= from && h < to)?.[0] ?? null)

  return name && HUE_ORDER.includes(name) ? name : null
}

/** 從變數名認色相;認不出來回傳 null */
const hueByName = (name) => {
  const body = name.replace(/^--/, '')
  return HUE_ORDER.find((h) => body === h || body.startsWith(`${h}${COLOR_NAME_SEPARATOR}`)) ?? null
}

/**
 * 變數屬於哪一個色相;認不出來回傳 null。
 *
 * 從名字認還是從色值算,由設定的 COLOR_HUE_SOURCE 決定 ——
 * 名字帶色相字樣的專案用名字(那是人做過的判斷),語意命名的專案只能從色值算。
 *
 * `source` 平常不用傳,用設定值就好。它存在是為了讓驗證能兩種來源都測 ——
 * 設定是整支檔案共用的常數,不傳參數的話,一次只驗得到專案當下的那一種,
 * 另一種要等到換專案才會第一次被執行到。
 */
export const hueOf = (name, value, source = COLOR_HUE_SOURCE) =>
  source === 'value' ? hueByValue(value) : hueByName(name)

/** 取碼命名這條規則這次適不適用 —— 名字不帶色相的專案,拿取碼規則去對沒有意義 */
export const isSuffixNamingChecked = COLOR_HUE_SOURCE !== 'value'

/**
 * 一份色票宣告裡,兩種命名方式各有幾個。
 *
 *   hued      名字帶色相字樣(`--red-e01a`、`--white`)
 *   semantic  語意名,名字看不出顏色(`--title-color`、`--btn-hover`)
 *
 * 衍生變數不算 —— 它的名字跟著基礎變數走,不是獨立的命名決定。
 *
 * 判定一律用「從名字認」,與設定的 COLOR_HUE_SOURCE 無關:
 * 這裡問的是「名字裡有沒有色相」,不是「這個色屬於哪一類」。
 * 跟著設定走的話,value 模式下每一個名字都算得出色相,兩種就再也分不開了。
 */
export const namingStyleOf = (decls) => {
  let hued = 0
  let semantic = 0

  for (const d of decls) {
    if (isRgbVar(d.name)) continue
    if (hueOf(d.name, d.value, 'name') !== null) hued += 1
    else semantic += 1
  }

  return { hued, semantic }
}

/** 整個專案的色票命名統計(所有色票檔加總) */
export const projectNamingStyle = (root) => {
  const dir = path.join(root, ...COLOR_CSS_DIR.split('/'))
  const total = { hued: 0, semantic: 0 }

  if (!fs.existsSync(dir)) return total

  for (const name of fs.readdirSync(dir)) {
    const rel = `${COLOR_CSS_DIR}/${name}`
    if (!isColorCssPath(rel)) continue

    const parsed = parseColorCss(fs.readFileSync(path.join(dir, name), 'utf8'))
    const { hued, semantic } = namingStyleOf(parsed?.decls ?? [])

    total.hued += hued
    total.semantic += semantic
  }

  return total
}

/**
 * 設定選的色相來源,與專案實際的命名大宗對不對得上。
 *
 * 大宗是「超過一半的那一種」。設定與大宗不符時,那一大批變數會走錯路徑:
 * 設定是 name 卻多數是語意名 —— 那一批每一個都被報「認不出色相前綴」,
 * 而且排序會把它們全部歸成未知色重排一次。
 * 設定是 value 卻多數帶色相 —— 人給的語意分類(例如把橘定義為金)會被色值算的結果蓋掉。
 */
export const majorityHueSource = ({ hued, semantic }) => {
  if (hued + semantic === 0) return null
  return hued > semantic ? 'name' : 'value'
}

export const isHueSourceFit = (root) => {
  const majority = majorityHueSource(projectNamingStyle(root))
  return majority === null || majority === COLOR_HUE_SOURCE
}

const RGB_SUFFIX_RE = new RegExp(`${escapeRe(COLOR_RGB_SUFFIX)}$`)

export const isRgbVar = (name) => RGB_SUFFIX_RE.test(name)

/** 衍生變數對應的基礎變數 —— 後綴是 `-rgb` 時,`--gold-c948-rgb` 得到 `--gold-c948` */
export const baseNameOf = (name) => name.replace(RGB_SUFFIX_RE, '')

/**
 * 已廢除的透明度寫法。
 *
 * 這三種是同一條鏈:`hexToRgb()` 把色碼拆成三個數字存進衍生變數,
 * 衍生變數再餵給 `rgba()` 補上透明度。
 *
 *   --x-rgb: hexToRgb(#hex);        色票裡的衍生變數
 *   rgba(var(--x-rgb), 0.4)         使用端
 *   rgba(#hex, 0.4)                 色碼直接進 rgba(建置時才會被展開)
 *
 * 改成透明度直接寫進色票的 8 碼 hex:`--black-b3: #000000b3;`,使用端只寫
 * `var(--black-b3)`。一個顏色就是一個變數,看名字就知道是什麼色、多透明;
 * 而且那是標準 CSS,不必靠建置工具轉換 —— 少一層轉換就少一個會出錯的地方。
 */
export const LEGACY_RGB_RE = /hexToRgb\s*\(|rgba\(\s*(?:var\(|#)/

export const LEGACY_RGB_HINT =
  '透明度一律寫進色票的 8 碼 hex(例如 --black-b3: #000000b3),使用端只寫 var(--xxx)'

/**
 * 把透明度併進色值,得到 8 碼 hex。
 *
 * 透明度是 0 到 1 的小數,8 碼 hex 的最後兩碼是 0 到 255 的整數,
 * 所以換算會取最接近的那一個整數:0.5 得到 80(也就是 128/255 = 0.502)。
 * 差距在螢幕上看不出來,但那確實是換了一個值,不是等價改寫。
 */
export const withAlpha = (hexInput, alpha) => {
  const hex = hexOf(hexInput)
  if (!hex) return null

  const base =
    hex.length === 3 || hex.length === 4
      ? [...hex.slice(0, 3)].map((c) => c + c).join('')
      : hex.slice(0, 6)

  if (base.length !== 6) return null

  const a = Number(alpha)
  if (!Number.isFinite(a) || a < 0 || a > 1) return null

  const aa = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0')

  return `#${base}${aa}`.toLowerCase()
}

/**
 * 反查表:變數名 -> { hex, file }。
 *
 * 吃 loadDefinedColorVars 的結果轉出來,不另外讀一次檔 ——
 * 「哪些檔案算色票檔」那個判斷只能有一份,各自讀檔的話,
 * 改了其中一處,兩邊看到的色票就不一樣了。
 */
export const varIndexOf = (defined) => {
  const index = new Map()

  for (const [hex, list] of defined) {
    for (const v of list) index.set(v.name, { hex, file: v.file })
  }

  return index
}

/**
 * 變數名去掉開頭的 `--` 與結尾的衍生後綴,剩下「色相 + 分隔符 + 取碼」那一段。
 *
 * `--gold-c948-rgb` 得到 `gold-c948`。判斷取碼對不對時比對的就是這一段。
 */
export const bodyOf = (name) => baseNameOf(name).replace(/^--/, '')

/**
 * 取哪幾碼 —— 位置由 1 起算。位置超出範圍(設定與色值長度對不上)回傳 null。
 */
const pickChars = (hex, positions) => {
  if (!Array.isArray(positions) || !positions.length) return null
  if (positions.some((p) => !Number.isInteger(p) || p < 1 || p > hex.length)) return null

  return positions.map((p) => hex[p - 1]).join('')
}

/**
 * 純黑與純白用語意名(`--black` / `--white`),沒有取碼後綴。
 *
 * 取碼的用途是「在同一個色相裡區別不同的色」。純黑與純白各自只有一個,
 * 沒有要區別的對象,所以名字就是色相本身 —— 帶透明度時也只接 alpha,
 * 寫成 `--black-b3`,不是 `--black-00b3`。
 */
const SEMANTIC_BASES = new Set(['000000', 'ffffff'])

/** 三碼與四碼 hex 展開成六碼(`#999` 與 `#999f` 的底色都是 `999999`) */
const expandShortHex = (hex) => [...hex.slice(0, 3)].map((c) => c + c).join('')

/**
 * 依命名規則算出「這個色值應該用的後綴」。
 *
 * 取哪幾碼、帶透明度時 alpha 怎麼接,都來自設定(COLOR_SUFFIX_PICK)——
 * 多數專案用預設那一套,慣例不同的專案改設定就好。用預設值的結果是:
 *
 *   一般 6 碼     取第 1,3,5,6 碼       #e2001a   → e01a
 *   灰階 r=g=b    取第 1,2 碼           #9e9e9e   → 9e
 *   3 碼          三碼都用              #999      → 999
 *   帶透明度 8 碼  取碼後接 alpha 兩碼   #e5e5e566 → e566
 *   純黑 / 純白    只有 alpha            #000000b3 → b3
 *
 * 撞碼時允許微調取碼位置,所以這只是「建議值」,不符合時給提示而非斷定錯誤。
 */
export const expectedSuffix = (value) => {
  const hex = hexOf(value)
  if (!hex) return null

  const alpha = hex.length === 8 ? hex.slice(6, 8).toLowerCase() : ''
  const base = (hex.length === 8 ? hex.slice(0, 6) : hex).toLowerCase()

  const { normal, grayscale, short, alphaSeparator } = COLOR_SUFFIX_PICK

  let core = null

  if (base.length === 3) {
    core = SEMANTIC_BASES.has(expandShortHex(base)) ? '' : pickChars(base, short)
  } else if (base.length === 6) {
    const [r, g, b] = [0, 2, 4].map((i) => base.slice(i, i + 2))
    core = SEMANTIC_BASES.has(base)
      ? ''
      : pickChars(base, r === g && g === b ? grayscale : normal)
  }

  if (core === null) return null
  if (!alpha) return core

  // 取碼是空的(純黑 / 純白)時不放分隔符 —— 放了就成了 `--black--b3` 那種怪名字
  return core ? `${core}${alphaSeparator}${alpha}` : alpha
}

/**
 * 解析色票檔。
 *
 * 回傳 { head, tail, decls, eol };head 是 `:root {` 之前(含)的內容,
 * tail 是 `}` 之後。decls 內保留原始行號,回報違規時要用。
 * 解析不出來回傳 null。
 */
export const parseColorCss = (text) => {
  const m = text.match(/(:root\s*\{)([\s\S]*?)(\n?\})/)
  if (!m) return null

  const bodyStart = m.index + m[1].length
  const before = text.slice(0, bodyStart)
  const baseLine = before.split('\n').length

  const decls = []
  m[2].split('\n').forEach((raw, i) => {
    const line = raw.trim()
    if (!line.startsWith('--')) return

    const [name, ...rest] = line.replace(/;\s*$/, '').split(':')
    decls.push({
      name: name.trim(),
      value: rest.join(':').trim(),
      line: baseLine + i,
    })
  })

  return {
    head: before,
    tail: text.slice(m.index + m[0].length),
    decls,
    eol: text.includes('\r\n') ? '\r\n' : '\n',
  }
}

/**
 * 排序:色相 → 亮度(淺到深)→ -rgb 緊跟基礎變數。
 *
 * -rgb 的處理方式是「先把它從序列裡拿掉,排完再插回基礎變數後面」;
 * 沒有對應基礎變數的 -rgb(例如只用在 rgba() 的色)視為獨立變數,照自己的值排。
 */
export const sortDecls = (decls) => {
  const byName = new Map(decls.map((d) => [d.name, d]))
  const followers = new Map()

  const standalone = decls.filter((d) => {
    if (isRgbVar(d.name) && byName.has(baseNameOf(d.name))) {
      const key = baseNameOf(d.name)
      followers.set(key, [...(followers.get(key) ?? []), d])
      return false
    }
    return true
  })

  const rank = (d) => {
    const hue = hueOf(d.name, d.value)
    return hue === null ? HUE_ORDER.length : HUE_ORDER.indexOf(hue)
  }

  const sorted = [...standalone].sort((a, b) => {
    const d = rank(a) - rank(b)
    if (d !== 0) return d

    const la = luminanceOf(a.value)
    const lb = luminanceOf(b.value)
    if (la === null && lb === null) return 0
    if (la === null) return 1
    if (lb === null) return -1
    return lb - la // 亮 → 暗
  })

  return sorted.flatMap((d) => [d, ...(followers.get(d.name) ?? [])])
}

/** 依排序結果重建檔案內容;同色相之間插入 /* 色相 *​/ 註解 */
export const buildColorCss = (parsed, decls) => {
  const lines = []
  let currentHue

  for (const d of decls) {
    const hue = hueOf(d.name, d.value)
    const label = hue === null ? 'other' : HUE_LABEL[hue]

    if (label !== currentHue) {
      if (lines.length) lines.push('')
      lines.push(`  /* ${label} */`)
      currentHue = label
    }

    lines.push(`  ${d.name}: ${d.value};`)
  }

  return `${parsed.head}\n${lines.join('\n')}\n}${parsed.tail}`
}

/**
 * 把幾個變數加進色票內容,並重新排序。
 *
 * 名稱已經存在的直接略過 —— 同一個名字定義兩次,改了一處另一處不會跟著變,
 * 兩個地方的顏色就會慢慢分岔。
 *
 * 沒有東西要加、或解析不出 :root 結構時回傳 null(那支檔案完全不動)。
 */
export const addColorDecls = (text, decls) => {
  const parsed = parseColorCss(text)
  if (!parsed) return null

  const existing = new Set(parsed.decls.map((d) => d.name))
  const fresh = decls.filter((d) => !existing.has(d.name))
  if (!fresh.length) return null

  return buildColorCss(parsed, sortDecls([...parsed.decls, ...fresh]))
}

/**
 * 檔案內容是否已符合排序 —— 用來判斷要不要寫檔。
 *
 * 比對前要把換行正規化:buildColorCss 一律吐 \n,而檔案可能是 \r\n。
 *    不正規化的話,CRLF 檔案排序完仍會被判定為「未排序」,每次存檔都重報一次。
 */
const toLf = (text) => text.replace(/\r\n/g, '\n')

export const isSorted = (text) => {
  const parsed = parseColorCss(text)
  if (!parsed) return true

  const built = buildColorCss(parsed, sortDecls(parsed.decls))
  return toLf(built).trimEnd() === toLf(text).trimEnd()
}

/**
 * 色票命名的設定,與專案實際的命名對不對得上。
 *
 * 回傳兩組統計,每組是 { total, matched }:
 *   plain      不帶透明度的變數
 *   withAlpha  帶透明度的變數(8 碼 hex)
 *
 * 分兩組是必要的。設定裡的色相清單與分隔符影響每一個變數,設錯就全部對不上;
 * 但透明度那兩碼怎麼接(alphaSeparator)只影響帶透明度的那一小群 ——
 * 合在一起算的話,其他變數照樣對得上,「全部對不上」永遠不成立,
 * 而那正是各專案最常見的落差,反而抓不到。
 *
 * 納入統計的是「應該要有取碼後綴」的變數。這三種排除在外:
 *   語意名(`--white`、`--black` 這種只有色相、沒有取碼的)
 *   衍生變數(它的名字跟著基礎變數走,不是獨立命名)
 *   取不到 hex 的(算不出建議值,無從比對)
 *
 * 「對得上」只看形狀,不看取碼位置 —— 撞碼時允許微調取碼位置,
 * 那種情況長度仍然相同,不算對不上。
 *
 * 這份統計是給前提檢查用的。專案的命名慣例與設定不同時,取碼檢查會整類
 *    沒有結果,而畫面上看起來是全部通過。有了這份統計,那種情況會被講出來。
 */
export const colorNamingFit = (root) => {
  const dir = path.join(root, ...COLOR_CSS_DIR.split('/'))
  const fit = { plain: { total: 0, matched: 0 }, withAlpha: { total: 0, matched: 0 } }

  // 色相從色值算的專案不檢查取碼命名,這份統計也就沒有比對的對象
  if (!isSuffixNamingChecked) return fit
  if (!fs.existsSync(dir)) return fit

  for (const name of fs.readdirSync(dir)) {
    const rel = `${COLOR_CSS_DIR}/${name}`
    if (!isColorCssPath(rel)) continue

    const parsed = parseColorCss(fs.readFileSync(path.join(dir, name), 'utf8'))

    for (const d of parsed?.decls ?? []) {
      if (isRgbVar(d.name)) continue

      const hue = hueOf(d.name, d.value)
      const body = bodyOf(d.name)

      // 色相認得出、但只有色相沒有取碼 —— 那是語意名,不納入
      if (hue !== null && body === hue) continue

      const expected = expectedSuffix(d.value)
      if (hue !== null && !expected) continue

      const group = hexOf(d.value)?.length === 8 ? fit.withAlpha : fit.plain
      group.total += 1

      if (hue === null) continue

      const suffix = body.slice(hue.length + COLOR_NAME_SEPARATOR.length)
      if (suffix.length === expected.length) group.matched += 1
    }
  }

  return fit
}

/** 有樣本、而且一個都對不上 —— 那是設定與專案對不上,不是個別變數命名不符 */
const isGroupUnfit = ({ total, matched }) => total > 0 && matched === 0

/** 色票命名設定是否與專案對得上(兩組任一組整組落空就是對不上) */
export const isColorNamingConfigFit = (root) => {
  const { plain, withAlpha } = colorNamingFit(root)
  return !isGroupUnfit(plain) && !isGroupUnfit(withAlpha)
}

/**
 * 載入所有色票檔已定義的變數。
 *
 * 回傳 Map<小寫色值, { name, file, line, isRgb }[]> —— 同一個色值可能被多支檔案
 * 各定義一次,所以每個色值對應的是一份清單,不是單一筆。
 *
 * 兩種檢查共用這一份:
 *   「硬寫色碼」要知道這個色值有沒有現成的變數,好把變數名寫進提示訊息
 *   「分組檔與共用檔撞色」要知道同一個色值被哪幾支檔案定義
 * 各載入一次的話,「哪些檔案算色票檔」這個判斷就會有兩份,改了一處另一處不會跟著變。
 */
export const loadDefinedColorVars = (root) => {
  const dir = path.join(root, ...COLOR_CSS_DIR.split('/'))
  const map = new Map()

  if (!fs.existsSync(dir)) return map

  for (const name of fs.readdirSync(dir)) {
    const rel = `${COLOR_CSS_DIR}/${name}`
    if (!isColorCssPath(rel)) continue

    const parsed = parseColorCss(fs.readFileSync(path.join(dir, name), 'utf8'))

    for (const d of parsed?.decls ?? []) {
      const hex = hexOf(d.value)
      if (!hex) continue

      const key = `#${hex.toLowerCase()}`
      map.set(key, [
        ...(map.get(key) ?? []),
        { name: d.name, file: rel, line: d.line, isRgb: isRgbVar(d.name) },
      ])
    }
  }

  return map
}

/* ---------------------------------------------------------------------------
   以下是本專案特有的:同一個色值出現在多個分組檔時要收攏到共用色票檔。

   分組(本專案叫頻道)各自有一支色票檔,共用的那一支全域載入。
   同一個色值在兩支分組檔各定義一次時,改了一邊沒改另一邊,
   兩個分組的同一個顏色就會不一樣 —— 而且畫面上不會報錯,只是顏色對不起來。
   --------------------------------------------------------------------------- */

/** 色值正規化:3 碼展開成 6 碼、補滿 alpha,好讓不同寫法的同一個色比對得起來 */
const normalizeHex = (hex) => {
  const h = hex.replace(/^#/, '').toLowerCase()
  const six = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6)
  const alpha = h.length === 8 ? h.slice(6, 8) : 'ff'

  return six + alpha
}

/** 色票目錄底下的所有色票檔,共用那一支排在最前面 */
export const listColorCssFiles = (projectRoot) => {
  const dir = path.join(projectRoot, ...COLOR_CSS_DIR.split('/'))
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .map((name) => ({ name, rel: `${COLOR_CSS_DIR}/${name}` }))
    .filter(({ rel }) => isColorCssPath(rel))
    .map(({ name, rel }) => ({
      rel,
      abs: path.join(dir, name),
      channel: channelOfColorCss(rel),
    }))
    .sort((a, b) => {
      if (!a.channel) return -1
      if (!b.channel) return 1
      return a.rel.localeCompare(b.rel)
    })
}

/**
 * 同一個色值被定義了幾次、定義在哪裡。
 *
 * 兩種要回報:
 *   duplicate-shared  共用檔已經有了,分組檔又定義一次 —— 分組那份是多餘的
 *   cross-channel     兩個以上分組檔各定義一次 —— 應該收到共用檔
 *
 * 衍生變數不算(它的名字跟著基礎變數走,不是獨立的定義)。
 */
export const findSharedColors = (projectRoot) => {
  const byHex = new Map()

  for (const { rel, abs, channel } of listColorCssFiles(projectRoot)) {
    const parsed = parseColorCss(fs.readFileSync(abs, 'utf8'))

    for (const d of parsed?.decls ?? []) {
      if (isRgbVar(d.name)) continue

      const hex = hexOf(d.value)
      if (!hex) continue

      const key = normalizeHex(hex)
      if (!byHex.has(key)) byHex.set(key, [])
      byHex.get(key).push({ rel, channel, name: d.name })
    }
  }

  const results = []

  for (const [hex, entries] of byHex) {
    const channels = new Set(entries.filter((e) => e.channel).map((e) => e.channel))
    const inShared = entries.some((e) => !e.channel)

    if (inShared && channels.size > 0) results.push({ hex, kind: 'duplicate-shared', entries })
    else if (channels.size > 1) results.push({ hex, kind: 'cross-channel', entries })
  }

  return results
}
