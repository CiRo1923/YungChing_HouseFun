#!/usr/bin/env node
// 存檔時的守門入口(給 .vscode 的 Run on Save 用):
//
//   node .tools/css/guard-file.mjs <檔案>
//
//   1. 色票檔 → 自動排序(只動順序,不動色值),有動就回報
//   2. 任何 .vue / .css → 四條規範全部檢查,違規逐筆印出
//
// 輸出**不上色**(見 colors.mjs —— 非 TTY 自動關色),VSCode 的輸出面板不吃 ANSI。
// 也**不主動彈出面板**(.vscode/settings.json 沒設 autoShowOutputPanel)——
// 訊息留在「Run On Save」輸出面板,要看的時候自己切過去。
//
// 有違規時 exit 1,方便之後想改回自動彈面板時直接用。

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
import { checkSharedColors, lintFile } from './lint-core.mjs'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../../..')
const CACHE_DIR = path.join(projectRoot, 'node_modules/.cache/cssGuard')

/** 存檔後待 Claude 詢問的檔案清單(由 .claude/hooks/cssGuardPrompt.js 讀走並清空) */
const PENDING_FILE = path.join(CACHE_DIR, 'pending.json')

/** 已回報過的違規指紋(同一筆不重複問) */
const REPORTED_FILE = path.join(CACHE_DIR, 'reported.json')

const RULE_TITLE = {
  color: '規則 1 顏色未定義在色票檔',
  colorFile: '規則 1 色票檔的命名 / 排序 / 頻道歸屬',
  tailwind: '規則 2 template 使用 tailwind class',
  module: '規則 3 module css 的引入方式或順序',
  variable: '規則 4 module 變數的命名或斷點',
  import: '規則 5 .vue 的 import 順序',
}

const RULE_HINT = {
  color: '改用 var(--色名-色碼)',
  colorFile: '跨頻道共用的搬到 color.css;命名要人工改',
  tailwind: '樣式移到 assets/css/_modules/',
  module: '<script setup> 最上方 JS import;變數建在用到的最小單位上',
  variable: '-w / -h / -p,尺寸分 pc / tablet / mobile 三份',
  import: 'css → ./.composables → @js → 其他套件',
}

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
 * 同時把這個檔案的舊指紋從 reported 移除 —— 你又存了它一次,視為重新關注,
 * 即使同一筆違規之前問過也該再問一次。沒再存檔就不會重複吵。
 */
const onMarkPending = () => {
  const pending = new Set(readJson(PENDING_FILE, []))
  pending.add(rel)
  writeJson(PENDING_FILE, [...pending])

  const reported = readJson(REPORTED_FILE, [])
  if (Array.isArray(reported) && reported.length) {
    writeJson(
      REPORTED_FILE,
      reported.filter((fp) => typeof fp === 'string' && !fp.startsWith(`${rel}:`))
    )
  }
}

/** 四條規範檢查 —— 逐筆印出,不過濾 */
const onLint = () => {
  const issues = isColorCssPath(rel)
    ? [...lintFile(projectRoot, abs, new Map()), ...checkSharedColors(projectRoot)]
    : lintFile(projectRoot, abs, loadDefinedColorVars(projectRoot))

  if (!issues.length) {
    lines.push(`✔ ${rel} CSS 規範檢查通過`)
    return
  }

  const byRule = new Map()
  for (const i of issues) {
    if (!byRule.has(i.rule)) byRule.set(i.rule, [])
    byRule.get(i.rule).push(i)
  }

  onMarkPending()

  lines.push(`⛔ ${rel}(共 ${issues.length} 筆)`)
  for (const [rule, list] of byRule) {
    lines.push(`  ${RULE_TITLE[rule] ?? rule}(${list.length} 筆) —— ${RULE_HINT[rule] ?? ''}`)
    for (const i of list) lines.push(`    ✗ L${i.line} ${i.detail}`)
  }
  lines.push('')
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
