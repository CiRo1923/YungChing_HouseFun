#!/usr/bin/env node
// CSS 規範檢查的 CLI(判斷邏輯在 lint-core.mjs):
//
//   node .tools/lint/lint.mjs                 # 全專案掃描
//   node .tools/lint/lint.mjs <file> [file..] # 只檢查指定檔案 / 目錄
//   node .tools/lint/lint.mjs --json          # 以 JSON 輸出,供程式解析
//
// 一律只回報、不改動任何檔案。有違規時 exit 1。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isColorCssPath, loadDefinedColorVars } from './color-order.mjs'
import {
  RULE_HINT,
  RULE_TITLE,
  SCAN_TARGETS,
  checkSharedColors,
  isScannable,
  lintFile,
  listFiles,
  toRel,
} from './lint-core.mjs'
import { onReportPreflight, preflight } from './preflight.mjs'
import { isWarn } from './shared.mjs'
import { BOLD, CYAN, DIM, GREEN, RED, RESET, YELLOW } from './colors.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')

const args = process.argv.slice(2)
const jsonOut = args.includes('--json')
const fileArgs = args.filter((a) => !a.startsWith('--'))

const definedVars = loadDefinedColorVars(root)

// 參數可以是檔案或目錄 —— 目錄會遞迴展開,方便一次檢查整個模組資料夾
const files = fileArgs.length
  ? fileArgs.flatMap((f) => {
      const abs = path.resolve(root, f)
      if (!fs.existsSync(abs)) return []
      if (fs.statSync(abs).isDirectory()) return listFiles(root, toRel(root, abs))
      return isScannable(abs) ? [abs] : []
    })
  : SCAN_TARGETS.flatMap((t) => listFiles(root, t))

const issues = files.flatMap((abs) => lintFile(root, abs, definedVars))

// 分組色的收攏檢查是跨檔比對,只在「全專案掃描」或「有色票檔在範圍內」時做
const touchedColorFile = files.some((abs) => isColorCssPath(toRel(root, abs)))
if (!fileArgs.length || touchedColorFile) issues.push(...checkSharedColors(root))

// --- 輸出 -------------------------------------------------------------------

// 建議級的分開處理 —— 印出來提醒,但不列入阻擋計數、不影響 exit code
const errors = issues.filter((i) => !isWarn(i))
const warns = issues.filter(isWarn)

if (jsonOut) {
  process.stdout.write(
    JSON.stringify({ issues, scanned: files.length, preflight: preflight(root) }, null, 2)
  )
  process.exit(errors.length ? 1 : 0)
}

/**
 * 缺前提的規則要跟著檢查結果一起說 —— 只在全專案掃描時報。
 *
 * 「掃描 300 個檔案全部通過」這句話,在 api 目錄位置設錯的情況下也會一模一樣地印出來。
 * 把「這幾條這次沒有作用」寫在旁邊,看的人才知道那個通過涵蓋了多少範圍。
 * 指定檔案的檢查不報,那是每天存檔都會跑的路徑,重複提醒只會變成噪音。
 */
const onCheckPreflight = () => {
  if (fileArgs.length) return
  onReportPreflight(root)
}

if (!issues.length) {
  console.log(`${GREEN}✔ 規範檢查通過(掃描 ${files.length} 個檔案)${RESET}`)
  onCheckPreflight()
  process.exit(0)
}

/** 依規則分組印出;warn 用不同的符號與顏色,一眼看得出它不擋 */
const onPrintGroup = (list, { level }) => {
  const isWarnGroup = level === 'warn'
  const mark = isWarnGroup ? '⚠' : '⛔'
  const color = isWarnGroup ? YELLOW : RED
  const byRule = new Map()

  for (const i of list) {
    if (!byRule.has(i.rule)) byRule.set(i.rule, [])
    byRule.get(i.rule).push(i)
  }

  for (const [rule, group] of byRule) {
    const byFile = new Map()
    for (const i of group) {
      if (!byFile.has(i.file)) byFile.set(i.file, [])
      byFile.get(i.file).push(i)
    }

    console.error('')
    console.error(
      `${color}${BOLD}${mark} ${RULE_TITLE[rule] ?? rule}(${group.length} 筆 / ${byFile.size} 個檔案)${isWarnGroup ? ' —— 建議,不擋' : ''}${RESET}`
    )
    console.error(`${DIM}   ${RULE_HINT[rule] ?? ''}${RESET}`)

    for (const [file, items] of byFile) {
      console.error('')
      console.error(`   ${CYAN}${file}${RESET}`)
      for (const i of items) {
        console.error(`     ${color}${isWarnGroup ? '!' : '✗'}${RESET} ${DIM}L${i.line}${RESET} ${i.detail}`)
      }
    }
  }

  return byRule
}

const errorRules = errors.length ? onPrintGroup(errors, { level: 'error' }) : new Map()
if (warns.length) onPrintGroup(warns, { level: 'warn' })

console.error('')

if (errors.length) {
  const counts = [...errorRules.entries()].map(([rule, list]) => `${rule} ${list.length}`).join(' / ')
  console.error(`${YELLOW}共 ${errors.length} 筆違規(${counts}),掃描 ${files.length} 個檔案。${RESET}`)
} else {
  console.error(`${GREEN}✔ 沒有要擋的違規(掃描 ${files.length} 個檔案)${RESET}`)
}

if (warns.length) console.error(`${DIM}另有 ${warns.length} 筆建議 —— 不影響檢查結果。${RESET}`)

onCheckPreflight()

process.exit(errors.length ? 1 : 0)
