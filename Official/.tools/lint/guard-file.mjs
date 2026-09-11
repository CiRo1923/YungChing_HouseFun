#!/usr/bin/env node
// 存檔時的守門入口(給 .vscode 的 Run on Save 用):
//
//   node .tools/lint/guard-file.mjs <檔案>
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
import {
  buildColorCss,
  isColorCssPath,
  loadDefinedColorVars,
  parseColorCss,
  sortDecls,
} from './color-order.mjs'
import { RESET, YELLOW } from './colors.mjs'
/* 規則標題與修正提示也從這裡拿,不要各層自己寫一份 —— 加了新規則只改其中一層的話,
  其他層會顯示原始代號而不是看得懂的標題,而那不會報錯,只是訊息變得難懂。 */
import {
  RULE_HINT,
  RULE_TITLE,
  checkSharedColors,
  isScannable,
  lintFile,
  onRemoveEmptyRules,
  onSortComposables,
  onWrapMountedCalls,
} from './lint-core.mjs'
/* 專案根與快取路徑一律 import,不要自己算 ——
  對話那層(.claude/hooks/css-guard-prompt.js)讀的是同一份常數,
  兩邊各自拼路徑的話對不上就等於接力棒斷了,而且**兩邊都不會報錯**。 */
import { PENDING_FILE, PROJECT_ROOT as projectRoot } from './paths.mjs'




/**
 * 存檔時間,格式 HH:MM:SS。
 *
 * 通過與違規都要印 —— 輸出面板不會自己清空,沒有時間戳就分不出
 * 「這是剛剛那次存檔的結果」還是「上一次留著沒被捲掉的舊訊息」。
 */
const timeOf = () => new Date().toTimeString().slice(0, 8)

const args = process.argv.slice(2)
const target = args.find((a) => !a.startsWith('--'))

/* --write:只做自動修正,不排宣告順序也不報違規。commit 那一層用這個。

   宣告順序與並行載入的包裝會改動程式碼的結構,在 commit 當下做的話,
   人會提交到自己沒看過的內容 —— 那比順序不對嚴重。
   排序與清空區塊則是純格式,沒有判斷空間,commit 時修掉是安全的。 */
const writeOnly = args.includes('--write')
if (!target) process.exit(0)

const abs = path.resolve(projectRoot, target)
const rel = path.relative(projectRoot, abs).split(path.sep).join('/')

if (rel.startsWith('..')) process.exit(0)
/* 範圍與其他四層一致 —— 走引擎的 isScannable(讀 SCANNABLE_EXTENSIONS)。
  自己寫一份副檔名判斷的話,規則涵蓋 .js / .mjs / .md 之後這一層還停在
  只看 .vue / .css,那些檔案存檔時就完全沒有守門,而且不會有任何徵兆。 */
if (!isScannable(abs)) process.exit(0)
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

/**
 * 空的規則區塊(`.foo {}` / `@screen m {}`)—— 直接刪掉,連同後面的空行。
 *
 * 和色票排序一樣是「自動修正」:它沒有任何判斷空間(空區塊在產物裡不會有輸出),
 * 留著只會讓人以為樣式被誤刪了。帶註解的區塊不算空,不會被動到。
 */
const onCleanEmptyRules = () => {
  const isVue = rel.endsWith('.vue')

  const original = fs.readFileSync(abs, 'utf8')
  const cleaned = onRemoveEmptyRules(original, { rel })
  if (!cleaned) return

  fs.writeFileSync(abs, cleaned, 'utf8')
  lines.push(
    isVue
      ? `🔧 ${rel} 有空的 <style> 區塊,已自動移除。`
      : `🔧 ${rel} 有空的規則區塊(產物不會有輸出),已自動移除。`
  )
  lines.push('')
}

/**
 * 進入頁面要拿的資料,包成一起發出。
 *
 * 一支一支 await 的話,第二支要等第一支回來才開始,使用者等的是每一支的時間加總;
 * 包在一起則是同時發出,等的是最慢的那一支。
 *
 * 有三種情況不會動:後面那支拿前面的結果當參數、那一行接收了回傳值、
 * 中間夾了別的語句 —— 那些都代表有順序安排,合併會打散它。
 */
const onWrapMounted = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const wrapped = onWrapMountedCalls(original, rel)
  if (!wrapped) return

  fs.writeFileSync(abs, wrapped, 'utf8')
  lines.push(`[自動修正] ${rel} 進入頁面要拿的資料已自動包成一起發出。`, '')
}

/** store / actions 的宣告順序,依規範排好(純粹換位置,不改任何行為) */
const onSortDeclarations = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const sorted = onSortComposables(original, rel)
  if (!sorted) return

  fs.writeFileSync(abs, sorted, 'utf8')
  lines.push(`[自動修正] ${rel} store / actions 的宣告順序已自動排好。`, '')
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
 * hook(.claude/hooks/css-guard-prompt.js),它跑的時機是「你送出訊息」而不是存檔。
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
  onCleanEmptyRules()

  if (!writeOnly) {
    onSortDeclarations()
    onWrapMounted()
    onLint()
  }
} catch (err) {
  console.error(`[css-guard] 檢查失敗:${err.message}`)
  process.exit(0) // 工具自己壞掉不要吵
}

console.error(lines.join('\n'))
process.exit(lines.some((l) => l.startsWith('⛔')) ? 1 : 0)
