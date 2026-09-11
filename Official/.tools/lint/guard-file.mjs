#!/usr/bin/env node
// 存檔時的守門入口(開發伺服器外掛與編輯器的存檔動作都呼叫這支):
//
//   node .tools/lint/guard-file.mjs <檔案>
//   node .tools/lint/guard-file.mjs --write <檔案>   # 只做自動修正,不印檢查結果
//   node .tools/lint/guard-file.mjs --write          # 不指定檔案 → 修正所有色票檔
//
//   1. 色票檔 → 自動排序(只動順序,不動色值),有動就回報
//   2. 任何 .vue / .css → 空的規則區塊自動移除
//   3. 全部規範檢查,違規逐筆印出
//
// 色票檔在哪由 .tools/lint/project-config.mjs 決定,這裡不寫死路徑 ——
// 每個專案的目錄擺法不一樣,寫死之後換一個專案就找不到檔案。
//
// 輸出不上色(colors.mjs 在非 TTY 自動關色),編輯器的輸出面板不吃 ANSI。
//
// exit code 有意義,不要改:違規 → exit 1、通過 → exit 0。
//    編輯器擴充靠它決定要不要把輸出面板彈出來。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildColorCss,
  addColorDecls,
  isColorCssPath,
  loadDefinedColorVars,
  parseColorCss,
  sortDecls,
} from './color-order.mjs'
import {
  RULE_HINT,
  RULE_TITLE,
  checkSharedColors,
  lintFile,
  onFixLegacyRgba,
  onRemoveEmptyRules,
  onSortComposables,
  onSortImports,
  onWrapMountedCalls,
} from './lint-core.mjs'
import { RESET, YELLOW } from './colors.mjs'
import { COLOR_CSS_DIR, PENDING_CACHE_FILE, SCAN_TARGETS, SCANNABLE_RE, isWarn } from './shared.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')

/**
 * 存檔後待處理的檔案清單。
 *
 * 對話層(.claude/hooks/css-guard-prompt.cjs)每一輪都會讀它、重新檢查一次,
 * 只有該檔案已經沒有違規時才會被移除 —— 所以違規沒修掉之前會一直被列出來。
 */
const PENDING_FILE = path.join(root, ...PENDING_CACHE_FILE.split('/'))
const CACHE_DIR = path.dirname(PENDING_FILE)

/**
 * 存檔時間 HH:MM:SS。
 *
 * 通過與違規都要印 —— 輸出面板不會自己清空,沒有時間戳就分不出
 * 「這是剛剛那次存檔的結果」還是「上一次留著沒被捲掉的舊訊息」。
 */
const timeOf = () => new Date().toTimeString().slice(0, 8)

const argv = process.argv.slice(2)
const writeOnly = argv.includes('--write')
const target = argv.find((a) => !a.startsWith('--'))

/**
 * `--write` 沒有指定檔案時,把色票目錄底下所有色票檔都排一次。
 *
 * 色票檔的位置與命名由設定決定(project-config.mjs 的 COLOR_CSS_DIR 與 COLOR_CSS_PREFIX),
 * 呼叫端不必知道那是哪一支 —— 換一個專案時目錄不一樣,寫死路徑就會失效。
 */
/**
 * 把一支色票檔依規則重新排序並寫回,已經是正確順序就不動它。
 *
 * 回傳有沒有實際改動 —— 呼叫端靠它決定要不要印訊息。
 * 只動宣告的順序,不改任何色值;原本的換行格式(CRLF / LF)與結尾換行都保留,
 * 不然每次排序都會順便改掉整份檔案的換行,版本比對會看不出真正的差異。
 */
const onSortOneColorFile = (file) => {
  const original = fs.readFileSync(file, 'utf8')
  const parsed = parseColorCss(original)
  if (!parsed) return false

  let sorted = buildColorCss(parsed, sortDecls(parsed.decls))
  if (parsed.eol === '\r\n') sorted = sorted.split('\n').join('\r\n')
  if (!sorted.endsWith(parsed.eol)) sorted += parsed.eol
  if (sorted.trimEnd() === original.trimEnd()) return false

  fs.writeFileSync(file, sorted, 'utf8')

  return true
}

/** 排序完成的訊息 —— 指定單檔與整批排序印的是同一句話 */
const sortedMessageOf = (rel) =>
  `${rel} 排序不符規則,已自動依「彩虹 + 每類由淺到深」重新排序。`

const onSortAllColorFiles = () => {
  const dir = path.join(root, ...COLOR_CSS_DIR.split('/'))
  if (!fs.existsSync(dir)) return

  for (const name of fs.readdirSync(dir)) {
    const rel = `${COLOR_CSS_DIR}/${name}`
    if (!isColorCssPath(rel)) continue

    if (onSortOneColorFile(path.join(dir, name))) console.error(sortedMessageOf(rel))
  }
}

if (!target) {
  if (writeOnly) onSortAllColorFiles()
  process.exit(0)
}

const abs = path.resolve(root, target)
const rel = path.relative(root, abs).split(path.sep).join('/')

// 副檔名範圍定義在 project-config.mjs,五層守門共用同一份 ——
// 各自寫一份的話,漏列一種副檔名時那類檔案就靜靜地不再被檢查
if (rel.startsWith('..') || !SCANNABLE_RE.test(rel) || !fs.existsSync(abs)) {
  process.exit(0)
}

const lines = []

/**
 * 把一個 CSS 變數改名,掃過原始碼底下每一支會用到它的檔案。
 *
 * 比對帶後界 —— 沒有它的話 `--black-30` 會吃到 `--black-300` 的前半段,
 * 改出一個誰都沒定義的名字,而畫面上只是那個顏色讀不到,不會報錯。
 *
 * 回傳實際改動的檔案清單。
 */
const onRenameVarEverywhere = (from, to) => {
  const re = new RegExp(`${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'g')
  const touched = []

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!/\.(css|vue|js)$/i.test(entry.name)) continue

      const before = fs.readFileSync(full, 'utf8')
      const after = before.replace(re, to)
      if (after === before) continue

      fs.writeFileSync(full, after, 'utf8')
      touched.push(path.relative(root, full).split(path.sep).join('/'))
    }
  }

  for (const target of SCAN_TARGETS) {
    const dir = path.join(root, ...target.split('/'))
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) walk(dir)
  }

  return touched
}

/**
 * 已廢除的透明度寫法 —— 存檔時直接轉成 8 碼。
 *
 * 色值與透明度都是現成的,算得出唯一的結果,所以直接改,不報違規。
 * 色票裡還沒有那個顏色時一併補進去 —— 只換使用端而不補變數的話,
 * 那一行會指向一個沒有定義的變數,畫面上不會報錯,顏色就是不見了。
 */
const onConvertLegacyRgba = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const result = onFixLegacyRgba(original, rel, { definedVars: loadDefinedColorVars(root) })
  if (!result) return

  fs.writeFileSync(abs, result.text, 'utf8')
  lines.push(`${rel} 的 rgba 寫法已自動改成 8 碼色票變數。`)

  /** 新變數補進基礎色所在的那一支色票 —— 用得到基礎色的範圍才用得到它的半透明版 */
  const byFile = new Map()
  for (const a of result.added) byFile.set(a.file, [...(byFile.get(a.file) ?? []), a])

  for (const [colorRel, decls] of byFile) {
    const colorAbs = path.join(root, ...colorRel.split('/'))
    const next = addColorDecls(fs.readFileSync(colorAbs, 'utf8'), decls)
    if (!next) continue

    fs.writeFileSync(colorAbs, next, 'utf8')
    lines.push(`  ${colorRel} 新增 ${decls.map((d) => d.name).join('、')}`)
  }

  /*
   * 色票裡改了名字的變數,全站使用端要跟著換。
   *
   * 名字是從色值算出來的,色值變了名字就不再對得上,所以改值一定伴隨改名。
   * 只改色票不改使用端的話,那些地方會指向一個沒有定義的變數 ——
   * 畫面上不會報錯,顏色就是不見了,而且很難查。
   */
  for (const { from, to } of result.renamed) {
    const touched = onRenameVarEverywhere(from, to)
    lines.push(
      touched.length
        ? `  ${from} 改名為 ${to},同步 ${touched.length} 支檔案`
        : `  ${from} 改名為 ${to}(沒有其他檔案用到)`
    )
  }

  lines.push('')
}

/** 色票檔:依規則重新排序 */
const onSortColorCss = () => {
  if (onSortOneColorFile(abs)) lines.push(sortedMessageOf(rel), '')
}

/** 空的規則區塊 —— 產物不會有輸出,留著只會讓人以為樣式被誤刪 */
const onCleanEmptyRules = () => {
  const isVue = /\.vue$/i.test(rel)
  const original = fs.readFileSync(abs, 'utf8')
  const cleaned = onRemoveEmptyRules(original, { rel })
  if (!cleaned) return

  fs.writeFileSync(abs, cleaned, 'utf8')
  lines.push(
    isVue
      ? `${rel} 有空的 <style> 區塊,已自動移除。`
      : `${rel} 有空的規則區塊(產物不會有輸出),已自動移除。`,
    ''
  )
}

/**
 * store / actions 的宣告順序 —— 存檔時直接排好,不報違規。
 *
 * 順序是機械式的規則,讓人照著訊息一行一行搬只是浪費時間,
 * 而且搬的過程比工具更容易出錯。
 */
const onSortDeclarations = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const sorted = onSortComposables(original, rel)
  if (!sorted) return

  fs.writeFileSync(abs, sorted, 'utf8')
  lines.push(`${rel} store / actions 的宣告順序已自動排好。`, '')
}

/**
 * 元件的 import 分組順序 —— 存檔時直接排好,不報違規。
 *
 * 順序是機械式的規則,讓人照著訊息一行一行搬只是浪費時間,
 * 而且搬的過程比工具更容易出錯。
 *
 * 「元件沒有載入樣式」那一條不在這裡 —— 工具看不出這支元件的樣式
 * 該放在哪一支 CSS 模組,自動補一行等於替開發者決定檔案要叫什麼,
 * 所以那一條照樣報違規由人處理。
 */
const onSortComponentImports = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const sorted = onSortImports(original, rel)
  if (!sorted) return

  fs.writeFileSync(abs, sorted, 'utf8')
  lines.push(`${rel} 元件的 import 順序已自動排好。`, '')
}

/**
 * 進入頁面要拿的資料 —— 存檔時包成一起發出。
 *
 * 一支一支等的話,使用者等的是每一支的時間加總;一起發出等的是最慢的那一支。
 * 只在確定不改變結果時才動手(形狀單純的整行 await、後面沒用到前面的結果),
 * 判斷不出來的整段留著由規則報出來。
 */
const onWrapMounted = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const wrapped = onWrapMountedCalls(original, rel)
  if (!wrapped) return

  fs.writeFileSync(abs, wrapped, 'utf8')
  lines.push(`${rel} 進入頁面要拿的資料已自動包成一起發出。`, '')
}

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

/**
 * 記下「剛存了這個檔、而且有違規」,讓對話層接得到。
 *
 * 終端機與輸出面板是單向的,接不到使用者的回答;這份清單就是兩者之間的接力棒。
 * 檔案會一直留著,每一輪重新檢查,直到違規修掉才移除。
 */
const onMarkPending = () => {
  const pending = new Set(readJson(PENDING_FILE, []))
  pending.add(rel)

  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(PENDING_FILE, JSON.stringify([...pending]), 'utf8')
  } catch {
    // 寫不進快取只會變成重複提醒或漏問,不是錯誤
  }
}

/** 依規則分組,逐筆列出 */
const onPushGroup = (list, mark) => {
  const byRule = new Map()
  for (const i of list) {
    if (!byRule.has(i.rule)) byRule.set(i.rule, [])
    byRule.get(i.rule).push(i)
  }

  for (const [rule, group] of byRule) {
    lines.push(`  ${RULE_TITLE[rule] ?? rule}(${group.length} 筆) —— ${RULE_HINT[rule] ?? ''}`)
    for (const i of group) lines.push(`    ${mark} L${i.line} ${i.detail}`)
  }
}

const onLint = () => {
  const issues = isColorCssPath(rel)
    ? [...lintFile(root, abs, loadDefinedColorVars(root)), ...checkSharedColors(root)]
    : lintFile(root, abs, loadDefinedColorVars(root))

  // 建議級只提醒,不列入阻擋計數、不進待處理清單 —— 進了清單就會每一輪都被問一次
  const errors = issues.filter((i) => !isWarn(i))
  const warns = issues.filter(isWarn)

  if (!errors.length) {
    lines.push(`✔ ${rel} 規範檢查通過  ${timeOf()}`)
    if (warns.length) {
      lines.push('')
      lines.push(`⚠ ${rel}(${warns.length} 筆建議,不擋)`)
      onPushGroup(warns, '!')
    }
    return
  }

  onMarkPending()

  lines.push(`⛔ ${rel}(共 ${errors.length} 筆)  ${timeOf()}`)
  onPushGroup(errors, '✗')

  if (warns.length) {
    lines.push('')
    lines.push(`⚠ 另有 ${warns.length} 筆建議(不擋)`)
    onPushGroup(warns, '!')
  }

  lines.push('')
  lines.push(
    `${YELLOW}  需要協助時,在 Claude Code 對話框輸入「修正」或「好」,Claude Code 會接手處理`
  )
  lines.push('     (它已經知道是哪個檔案、哪幾行)。')
  lines.push(`     此訊息僅為提醒,不會影響儲存;為了讓寫法保持一致,建議找時間調整。${RESET}`)
}

try {
  onConvertLegacyRgba()
  if (isColorCssPath(rel)) onSortColorCss()
  onCleanEmptyRules()

  /* 宣告順序只在存檔時排,commit 前不動 ——
     commit 那一刻改動檔案,人會提交到自己沒看過的內容。 */
  if (!writeOnly) {
    onSortDeclarations()
    onSortComponentImports()
    onWrapMounted()
  }

  if (!writeOnly) onLint()
} catch (err) {
  console.error(`[css-guard] 檢查失敗:${err.message}`)
  process.exit(0) // 工具自己壞掉不要吵
}

if (lines.length) console.error(lines.join('\n'))

process.exit(lines.some((l) => l.startsWith('⛔')) ? 1 : 0)
