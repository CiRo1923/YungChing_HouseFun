#!/usr/bin/env node
// 檢查 / 自動修正色票檔(assets/css/_common/color*.css)的變數排序與命名,
// 並找出「該搬到共用 color.css」的頻道色。
//
//   node .tools/css/sort-color-css.mjs           # 檢查,不改檔(不符規則時 exit 1)
//   node .tools/css/sort-color-css.mjs --write   # 直接依規則重新排序寫回
//   node .tools/css/sort-color-css.mjs <file>    # 只處理指定的色票檔
//
// 只調整順序與空行,不會改動任何變數名或色值。
// 命名不符規則、頻道色重複這兩類以警告列出,不自動修 —— 改名與搬家都會牽動使用端。
// :root 內的註解會跟著它下方的變數一起移動,不會被吃掉。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SHARED_COLOR_CSS_PATH,
  buildColorCss,
  expectedSuffix,
  hexOfValue,
  hueOf,
  isDerivedColorVar,
  listColorCssFiles,
  findSharedColors,
  parseColorCss,
  sortDecls,
  suffixOf,
} from './color-order.mjs'

import { CYAN, DIM, GREEN, RED, RESET, YELLOW } from './colors.mjs'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../../..')
const args = process.argv.slice(2)
const write = args.includes('--write')
const fileArgs = args.filter((a) => !a.startsWith('--'))

const allFiles = listColorCssFiles(projectRoot)

const targets = fileArgs.length
  ? allFiles.filter((f) => {
      const wanted = fileArgs.map((a) =>
        path.relative(projectRoot, path.resolve(projectRoot, a)).split(path.sep).join('/')
      )
      return wanted.includes(f.rel)
    })
  : allFiles

if (!targets.length) {
  console.error(`${RED}找不到色票檔(${SHARED_COLOR_CSS_PATH} 等)${RESET}`)
  process.exit(1)
}

let exitCode = 0

// --- 逐檔:命名檢查 + 排序 --------------------------------------------------

for (const { rel, abs } of targets) {
  const original = fs.readFileSync(abs, 'utf8')
  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  const parsed = parseColorCss(original)

  if (!parsed) {
    console.error(`${RED}${rel} 結構無法解析(需要單層 :root { ... })${RESET}`)
    exitCode = 1
    continue
  }

  const decls = parsed.decls

  // 命名檢查
  const namingIssues = []
  for (const d of decls) {
    const hue = hueOf(d.name)
    if (!hue) {
      namingIssues.push(`${d.name} 的色系前綴不在允許清單內(紅澄黃綠藍紫金白灰黑)`)
      continue
    }
    // --white-rgb 這類衍生變數跟著本體命名,不套色碼縮寫規則
    if (isDerivedColorVar(d.name)) continue

    const hex = hexOfValue(d.value)
    if (!hex) continue // 計算值交由人工判斷

    const expect = expectedSuffix(hex)
    const actual = suffixOf(d.name)
    if (expect === null) continue
    if (actual !== expect) {
      const should = expect === '' ? `--${hue}` : `--${hue}-${expect}`
      namingIssues.push(`${d.name}: ${hex} 依命名規則應為 ${should}`)
    }
  }

  // 排序
  const sortedText = buildColorCss(parsed, sortDecls(decls)).split('\n').join(eol)
  const normalizedOriginal = original.split(/\r?\n/).join(eol)
  const orderChanged = sortedText.trimEnd() !== normalizedOriginal.trimEnd()

  if (namingIssues.length) {
    console.error(`${RED}⛔ ${rel} 命名不符規則(${namingIssues.length} 筆,不自動修正)${RESET}`)
    for (const msg of namingIssues) console.error(`   ${RED}✗${RESET} ${msg}`)
    console.error(
      `${DIM}   命名規則:6 碼取第 1、3、5 + 第 6 碼;純灰取前 2 碼;純黑白不加色碼;帶 alpha 再接 alpha 兩碼。${RESET}`
    )
    exitCode = 1
  }

  if (orderChanged) {
    if (write) {
      fs.writeFileSync(abs, sortedText.endsWith(eol) ? sortedText : sortedText + eol, 'utf8')
      console.log(
        `${GREEN}✔ 已依「紅澄黃綠藍紫金白灰黑 + 由淺至深」重新排序 ${rel}${RESET}`
      )
    } else {
      console.error(`${RED}⛔ ${rel} 排序不符規則${RESET}`)
      console.error(`${YELLOW}   執行 npm run sort:color 自動排序${RESET}`)
      exitCode = 1
    }
  }
}

// --- 跨檔:頻道色是否該搬到共用 color.css -----------------------------------

const shared = findSharedColors(projectRoot)

if (shared.length) {
  console.error('')
  console.error(`${RED}⛔ 有 ${shared.length} 個色值該收攏到 ${SHARED_COLOR_CSS_PATH}(不自動搬)${RESET}`)

  for (const { hex, kind, entries } of shared) {
    const where = entries.map((e) => `${e.name} @ ${e.rel}`).join('、')
    const why =
      kind === 'duplicate-shared'
        ? '共用色票已有同色值,頻道檔那份是多餘的 → 刪掉頻道檔的,使用端改用共用變數'
        : '同一色值用在兩個以上頻道 → 搬到共用色票,頻道檔各自刪掉'
    console.error(`   ${RED}✗${RESET} ${CYAN}${hex}${RESET} ${where}`)
    console.error(`     ${DIM}${why}${RESET}`)
  }

  exitCode = 1
}

if (exitCode === 0) {
  console.log(
    `${GREEN}✔ 色票排序、命名與頻道歸屬皆符合規則(${targets.length} 個檔案)${RESET}`
  )
}

process.exit(exitCode)
