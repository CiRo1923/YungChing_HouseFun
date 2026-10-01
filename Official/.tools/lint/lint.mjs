#!/usr/bin/env node
// CSS 規範檢查的 CLI(判斷邏輯在 lint-core.mjs):
//
//   node .tools/lint/lint.mjs                 # 全專案掃描
//   node .tools/lint/lint.mjs <file> [file..] # 只檢查指定檔案 / 目錄
//   node .tools/lint/lint.mjs --json          # 以 JSON 輸出,供程式解析
//
// 一律只回報、不改動任何檔案。
//
// 有違規時的離開碼看專案的設定(LINT_BLOCKS_COMMIT):
//   1  只提醒 —— commit 前那一層印出來就放行(預設)
//   2  要擋   —— 存量清完的專案把設定改成 true 之後是這個
// commit 前那一層靠這個碼分辨,自己不必再讀一次設定(省一次 node 啟動)。
// `--json` 那條路不受影響:機器讀的,沒有「擋不擋」的問題。

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
import { LINT_BLOCKS_COMMIT, MISSING_CONFIG_ITEMS, isWarn } from './shared.mjs'
import { BOLD, CYAN, DIM, GREEN, RED, RESET, YELLOW } from './colors.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')

/* 設定檔少了規則要讀的項目 —— 在跑任何檢查之前就停下來。

  那幾項拿到的是 undefined,而規則拿 undefined 去比對路徑、去 some()、
  去展開陣列,結果是一整片「規則執行失敗」—— 幾百筆訊息,
  每一筆都在講症狀,沒有一筆講得出原因。

  所以這裡先問一次:缺了就只講這一件事,不往下跑。 */
if (MISSING_CONFIG_ITEMS.length) {
  console.error('')
  console.error(
    `${RED}✗ 設定檔(.tools/lint/project-config.mjs)缺少 ${MISSING_CONFIG_ITEMS.length} 項,檢查沒有跑${RESET}`
  )
  console.error('')
  for (const name of MISSING_CONFIG_ITEMS) console.error(`    ${name}`)
  console.error('')
  console.error('  這幾項是規則要讀的。跟規範工具的來源要同一版的設定檔,')
  console.error('  把缺的那幾項補進去 —— 名字照來源,值填這個專案自己的。')
  console.error('')
  process.exit(1)
}

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
        console.error(
          `     ${color}${isWarnGroup ? '!' : '✗'}${RESET} ${DIM}L${i.line}${RESET} ${i.detail}`
        )
      }
    }
  }

  return byRule
}

const errorRules = errors.length ? onPrintGroup(errors, { level: 'error' }) : new Map()
if (warns.length) onPrintGroup(warns, { level: 'warn' })

console.error('')

if (errors.length) {
  const counts = [...errorRules.entries()]
    .map(([rule, list]) => `${rule} ${list.length}`)
    .join(' / ')
  console.error(
    `${YELLOW}共 ${errors.length} 筆違規(${counts}),掃描 ${files.length} 個檔案。${RESET}`
  )
} else {
  console.error(`${GREEN}✔ 沒有要擋的違規(掃描 ${files.length} 個檔案)${RESET}`)
}

if (warns.length) console.error(`${DIM}另有 ${warns.length} 筆建議 —— 不影響檢查結果。${RESET}`)

onCheckPreflight()

/* 2 = 這個專案已經把「違規就擋」打開了(存量清完之後的狀態)。
  commit 前那一層看碼決定要印黃字放行還是紅字停下來 —— 判斷在設定檔那一份,
  不在 hook 裡(hook 整支跟著來源,在那裡改會被同步蓋回去)。 */
process.exit(errors.length ? (LINT_BLOCKS_COMMIT ? 2 : 1) : 0)
