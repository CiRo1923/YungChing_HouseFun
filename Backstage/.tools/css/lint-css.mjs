#!/usr/bin/env node
// CSS 規範檢查的 CLI(判斷邏輯在 lint-core.mjs):
//   規則 1 —— 顏色一律定義在 assets/css/_common/color*.css
//   規則 2 —— components/ 底下的 .vue,template 的 class 不得使用 tailwind utility
//   規則 3 —— module css 的引入方式與順序
//   規則 4 —— module 變數的命名與斷點
//   規則 5 —— .vue 的 import 順序(css → ./.composables → @js → 其他套件)
//   規則 6 —— 不要用被 theme 整組覆寫掉而不存在的 tailwind class
//
//   node .tools/css/lint-css.mjs                 # 全專案掃描
//   node .tools/css/lint-css.mjs <file> [file..] # 只檢查指定檔案 / 目錄
//   node .tools/css/lint-css.mjs --json          # 以 JSON 輸出,供程式解析
//
// 一律只回報、不改動任何檔案。有違規時 exit 1。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SHARED_COLOR_CSS_PATH, isColorCssPath, loadDefinedColorVars } from './color-order.mjs'
import { SCAN_TARGETS, checkSharedColors, isScannable, lintFile, listFiles } from './lint-core.mjs'

import { BOLD, CYAN, DIM, GREEN, RED, RESET, YELLOW } from './colors.mjs'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../../..')

const args = process.argv.slice(2)
const jsonOut = args.includes('--json')
const fileArgs = args.filter((a) => !a.startsWith('--'))

const definedVars = loadDefinedColorVars(projectRoot)

// 參數可以是檔案或目錄 —— 目錄會遞迴展開,方便一次檢查整個 module 資料夾。
const files = fileArgs.length
  ? fileArgs.flatMap((f) => {
      const abs = path.resolve(projectRoot, f)
      if (!fs.existsSync(abs)) return []
      if (fs.statSync(abs).isDirectory()) {
        return listFiles(projectRoot, path.relative(projectRoot, abs))
      }
      return isScannable(abs) ? [abs] : []
    })
  : SCAN_TARGETS.flatMap((t) => listFiles(projectRoot, t))

const issues = files.flatMap((abs) => lintFile(projectRoot, abs, definedVars))

// 頻道色的收攏檢查是跨檔比對,只在「全專案掃描」或「有色票檔在檢查範圍內」時做
const touchedColorFile = files.some((abs) =>
  isColorCssPath(path.relative(projectRoot, abs).split(path.sep).join('/'))
)

if (!fileArgs.length || touchedColorFile) {
  issues.push(...checkSharedColors(projectRoot))
}

// --- 輸出 -------------------------------------------------------------------

if (jsonOut) {
  process.stdout.write(JSON.stringify({ issues, scanned: files.length }, null, 2))
  process.exit(issues.length ? 1 : 0)
}

const colorIssues = issues.filter((i) => i.rule === 'color')
const colorFileIssues = issues.filter((i) => i.rule === 'colorFile')
const twIssues = issues.filter((i) => i.rule === 'tailwind')
const moduleIssues = issues.filter((i) => i.rule === 'module')
const variableIssues = issues.filter((i) => i.rule === 'variable')
const importIssues = issues.filter((i) => i.rule === 'import')
const themeIssues = issues.filter((i) => i.rule === 'theme')

if (!issues.length) {
  console.log(`${GREEN}✔ CSS 規範檢查通過(掃描 ${files.length} 個檔案)${RESET}`)
  process.exit(0)
}

const printGroup = (title, list, hint) => {
  if (!list.length) return
  const byFile = new Map()
  for (const i of list) {
    if (!byFile.has(i.file)) byFile.set(i.file, [])
    byFile.get(i.file).push(i)
  }
  console.error('')
  console.error(`${RED}${BOLD}⛔ ${title}(${list.length} 筆 / ${byFile.size} 個檔案)${RESET}`)
  console.error(`${DIM}   ${hint}${RESET}`)
  for (const [file, list2] of byFile) {
    console.error('')
    console.error(`   ${CYAN}${file}${RESET}`)
    for (const i of list2) {
      console.error(`     ${RED}✗${RESET} ${DIM}L${i.line}${RESET} ${i.detail}`)
    }
  }
}

printGroup(
  '規則 1 違規:顏色未定義在色票檔',
  colorIssues,
  `顏色一律在 ${SHARED_COLOR_CSS_PATH}(或頻道 color<Channel>.css)建立,使用端只能寫 var(--色名-色碼)。`
)

printGroup(
  '規則 1 違規:色票檔自身的命名 / 排序 / 頻道歸屬',
  colorFileIssues,
  '跨頻道共用的色值要收到 color.css;排序執行 npm run sort:color 自動修正;命名要人工改(牽動使用端)。'
)

printGroup(
  '規則 2 違規:components 的 template 使用 tailwind class',
  twIssues,
  'components/ 底下的 .vue,template class 只能用組件自訂 class 與 --modifier;樣式寫進 assets/css/_modules/。'
)

printGroup(
  '規則 3 違規:module css 的引入方式或順序不對',
  moduleIssues,
  '在 <script setup> 最上方 JS import,順序為 共用變數 → 變體變數 → 共用版型 → 變體樣式。'
)

printGroup(
  '規則 4 違規:module 變數的命名或斷點不對',
  variableIssues,
  '尺寸類的值要拆成 pc / tablet / mobile 三份;命名用 -w / -h / -p 而非 -width / -height / -padding。'
)

printGroup(
  '規則 5 違規:.vue 的 import 順序不對',
  importIssues,
  '順序為 css → ./.composables → @js → 其他套件(@stores / @components 等不參與排序)。'
)

printGroup(
  '規則 6 違規:用到本專案不存在的 tailwind class',
  themeIssues,
  'theme 的 screens / fontSize / boxShadow / fontFamily 是整組覆寫,內建的 key 全部不存在 —— 寫了不報錯但產不出 CSS。'
)

console.error('')
console.error(
  `${YELLOW}共 ${issues.length} 筆違規` +
    `(顏色 ${colorIssues.length} / 色票檔 ${colorFileIssues.length} / tailwind ${twIssues.length}` +
    ` / module ${moduleIssues.length} / 變數 ${variableIssues.length}` +
    ` / import ${importIssues.length} / theme ${themeIssues.length})` +
    `,掃描 ${files.length} 個檔案。${RESET}`
)

process.exit(1)
