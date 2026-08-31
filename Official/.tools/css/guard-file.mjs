#!/usr/bin/env node
// 存檔時的守門入口(給 .vscode 的 Run on Save 用):
//
//   node .tools/css/guard-file.mjs <檔案>
//
//   1. 色票檔 → 自動排序(只動順序,不動色值),有動就回報
//   2. 任何 .vue / .css → 四條規範全部檢查,違規逐筆印出
//
// 輸出**不上色**(見 colors.mjs —— 非 TTY 自動關色),VSCode 的輸出面板不吃 ANSI。
//
// ⚠️ exit code 有意義,不要改:
//   違規 → exit 1、通過 → exit 0。
// .vscode/settings.json 的 "autoShowOutputPanel": "error" 就是靠這個決定要不要把
// 「Run On Save」面板彈出來 —— 有違規才跳出來打擾你,通過只默默印一行 ✔。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildColorCss,
  isColorCssPath,
  loadDefinedColorVars,
  parseColorCss,
  sortDecls,
} from './color-order.mjs'
import { RESET, YELLOW } from './colors.mjs'
import { checkSharedColors, lintFile } from './lint-core.mjs'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../../..')
const CACHE_DIR = path.join(projectRoot, 'node_modules/.cache/cssGuard')

/**
 * 存檔後待 Claude 詢問的檔案清單。
 *
 * .claude/hooks/cssGuardPrompt.js 每一輪對話都會讀它、重新檢查一次,
 * **只有該檔案已經沒有違規時才會被移除** —— 所以違規沒修掉之前會一直被問。
 */
const PENDING_FILE = path.join(CACHE_DIR, 'pending.json')

const RULE_TITLE = {
  color: '規則 1 顏色未定義在色票檔',
  colorFile: '規則 1 色票檔的命名 / 排序 / 頻道歸屬',
  tailwind: '規則 2 template 使用 tailwind class',
  module: '規則 3 module css 的引入方式或順序',
  variable: '規則 4 module 變數的命名或斷點',
  import: '規則 5 .vue 的 import 順序',
  theme: '規則 6 用到不存在或已淘汰的 tailwind class',
}

const RULE_HINT = {
  color: '改用 var(--色名-色碼)',
  colorFile: '跨頻道共用的搬到 color.css;命名要人工改',
  tailwind: '樣式移到 assets/css/_modules/',
  module: '<script setup> 最上方 JS import;變數建在用到的最小單位上',
  variable: '-w / -h / -p,尺寸分 pc / tablet / mobile 三份',
  import: 'css → ./.composables → @js → 其他套件',
  theme: 'text-sm / shadow-md / font-sans / md: 產不出任何 CSS',
}

/**
 * 存檔時間,格式 HH:MM:SS。
 *
 * 通過與違規都要印 —— 輸出面板不會自己清空,沒有時間戳就分不出
 * 「這是剛剛那次存檔的結果」還是「上一次留著沒被捲掉的舊訊息」。
 */
const timeOf = () => new Date().toTimeString().slice(0, 8)

const target = process.argv.slice(2).find((a) => !a.startsWith('--'))
if (!target) process.exit(0)

const abs = path.resolve(projectRoot, target)
const rel = path.relative(projectRoot, abs).split(path.sep).join('/')

if (rel.startsWith('..')) process.exit(0)
if (!/\.(vue|css)$/.test(rel)) process.exit(0)
if (!fs.existsSync(abs)) process.exit(0)

const lines = []

/** 色票檔:依規則重新排序 */
const onSortColorCss = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const parsed = parseColorCss(original)
  if (!parsed) return

  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  let sorted = buildColorCss(parsed, sortDecls(parsed.decls)).split('\n').join(eol)
  if (!sorted.endsWith(eol)) sorted += eol
  if (sorted.trimEnd() === original.trimEnd()) return

  fs.writeFileSync(abs, sorted, 'utf8')
  lines.push(`🔧 ${rel} 排序不符規則,已自動依「紅澄黃綠藍紫金白灰黑 + 由淺至深」重新排序。`)
  lines.push('')
}

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

const writeJson = (file, value) => {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(value), 'utf8')
  } catch {
    // 寫不進快取只會變成重複提醒或漏問,不是錯誤
  }
}

/**
 * 把「剛存了這個檔、而且有違規」記下來,讓 Claude 在你下一次說話時主動問要不要修。
 *
 * 終端機與輸出面板沒辦法互動,提問只能發生在對話裡;而對話那層是 UserPromptSubmit
 * hook(.claude/hooks/cssGuardPrompt.js),它跑的時機是「你送出訊息」而不是存檔。
 * 這份 pending 清單就是兩者之間的接力棒。
 *
 * 檔案會**一直留在清單裡**,每一輪對話重新檢查一次,直到違規修掉才移除 ——
 * 「有違規就每次問」靠的就是這個,不做「問過了就跳過」的去重。
 */
const onMarkPending = () => {
  const pending = new Set(readJson(PENDING_FILE, []))
  pending.add(rel)
  writeJson(PENDING_FILE, [...pending])
}

/** 四條規範檢查 —— 逐筆印出,不過濾 */
const onLint = () => {
  const issues = isColorCssPath(rel)
    ? [...lintFile(projectRoot, abs, new Map()), ...checkSharedColors(projectRoot)]
    : lintFile(projectRoot, abs, loadDefinedColorVars(projectRoot))

  if (!issues.length) {
    lines.push(`✔ ${rel} CSS 規範檢查通過  ${timeOf()}`)
    return
  }

  const byRule = new Map()
  for (const i of issues) {
    if (!byRule.has(i.rule)) byRule.set(i.rule, [])
    byRule.get(i.rule).push(i)
  }

  onMarkPending()

  lines.push(`⛔ ${rel}(共 ${issues.length} 筆)  ${timeOf()}`)
  for (const [rule, list] of byRule) {
    lines.push(`  ${RULE_TITLE[rule] ?? rule}(${list.length} 筆) —— ${RULE_HINT[rule] ?? ''}`)
    for (const i of list) lines.push(`    ✗ L${i.line} ${i.detail}`)
  }
  lines.push('')
  lines.push(
    `  ${YELLOW}👉 要協助修正的話,到 Claude Code 對話框打「修正」或「好」就會處理` +
      `(它已經知道是哪個檔案、哪幾行)。${RESET}`
  )
  lines.push('     不想修就不用理它 —— 主動權在你手上。')
  lines.push('  規範見 .claude/rules/css-conventions.md(只警告不阻擋)')
}

try {
  if (isColorCssPath(rel)) onSortColorCss()
  onLint()
} catch (err) {
  console.error(`[css-guard] 檢查失敗:${err.message}`)
  process.exit(0) // 工具自己壞掉不要吵
}

console.error(lines.join('\n'))
process.exit(lines.some((l) => l.startsWith('⛔')) ? 1 : 0)
