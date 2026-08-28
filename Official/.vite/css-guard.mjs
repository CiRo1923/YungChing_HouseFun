// dev server 的 CSS 規範守門員 —— 在編輯器按 Ctrl+S 存檔時即時生效。
//
//   1. 存檔色票檔 assets/css/_common/color*.css → 依規則自動重新排序(只動順序,不動色值)
//   2. 存檔任何 .vue / .css                     → 檢查四條規範,終端機印紅色警告
//
// 規範見 .claude/rules/css-conventions.md,判斷邏輯在 .tools/css/。
// 只在 dev(apply: 'serve')生效,build 不跑,也不會擋掉任何東西。

import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildColorCss,
  isColorCssPath,
  loadDefinedColorVars,
  parseColorCss,
  sortDecls,
} from '../.tools/css/color-order.mjs'
import { checkSharedColors, lintFile } from '../.tools/css/lint-core.mjs'

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const CYAN = '\x1b[36m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

const TAG = `${CYAN}[css-guard]${RESET}`

const toPosix = (p) => p.replaceAll('\\', '/')

/**
 * 一次存檔常常會觸發好幾個 watcher 事件 —— prettier 的 formatOnSave、eslint 的
 * fixAll 各自又寫一次檔,加上編輯器的原子替換(寫暫存檔再 rename)。
 * 不去抖的話同一份警告會連印三四次,把終端機洗掉。
 *
 * 兩道保險:
 *   1. 每個檔案 300ms 內的事件合併成一次
 *   2. 內容沒變就不重複報(hash 比對)
 *
 * ⚠️ 第 2 道有時效(ECHO_WINDOW_MS)—— 只用來擋「同一次存檔的回音」。
 * 沒有時效的話,你按 Ctrl+S 但內容沒改動時會**完全沒有反應**,
 * 看起來就像守門員壞了;而「存檔後想確認有沒有過」正是最常見的用法。
 * 超過這個窗口再存同一份內容,一律視為新的一次存檔,照常回報。
 */
const DEBOUNCE_MS = 300
const ECHO_WINDOW_MS = 2000
const timers = new Map()
const lastSeen = new Map() // file -> { hash, at }

const hashOf = (text) => createHash('sha1').update(text).digest('hex')

function debounce(file, run) {
  clearTimeout(timers.get(file))
  timers.set(
    file,
    setTimeout(() => {
      timers.delete(file)
      run()
    }, DEBOUNCE_MS)
  )
}

/**
 * 依規則重新排序色票檔。回傳是否真的改動了檔案。
 *
 * 排序後的內容會再觸發一次 watcher —— 但那時已符合排序、不會再寫入,
 * 所以最多多跑一輪就收斂,不需要額外的防迴圈旗標。
 */
function onSortColorCss(absPath) {
  const original = fs.readFileSync(absPath, 'utf8')
  const parsed = parseColorCss(original)
  if (!parsed) return false

  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  let sorted = buildColorCss(parsed, sortDecls(parsed.decls)).split('\n').join(eol)
  if (!sorted.endsWith(eol)) sorted += eol

  if (sorted.trimEnd() === original.trimEnd()) return false

  fs.writeFileSync(absPath, sorted, 'utf8')
  return true
}

/**
 * 存檔時間,格式 HH:MM:SS。
 *
 * 每次存檔都要印出來 —— 沒有它就分不出「這是剛剛那次存檔的結果」還是
 * 「上一次留在畫面上沒被捲掉的舊訊息」。
 */
const timeOf = () => new Date().toTimeString().slice(0, 8)

/** 沒有違規時也要說一聲 —— 靜默會讓上一次的紅字被誤讀成「還沒處理」 */
function onReportPass(rel) {
  console.log(`${TAG} ${GREEN}✔ ${rel} 通過${RESET} ${DIM}${timeOf()}${RESET}`)
}

/** 把 issues 印成紅色警告 */
function onReportIssues(rel, issues) {
  console.log('')
  console.log(`${TAG} ${RED}${BOLD}⛔ ${rel}${RESET} ${DIM}${timeOf()}${RESET}`)

  const printList = (title, rule, hint) => {
    const list = issues.filter((i) => i.rule === rule)
    if (!list.length) return
    console.log(`  ${RED}${title}(${list.length} 筆)${RESET} ${DIM}${hint}${RESET}`)
    for (const i of list.slice(0, 15)) {
      console.log(`    ${RED}✗${RESET} ${DIM}L${i.line}${RESET} ${i.detail}`)
    }
    if (list.length > 15) console.log(`    ${DIM}…另有 ${list.length - 15} 筆${RESET}`)
  }

  printList('規則 1 顏色未定義在色票檔', 'color', '改用 var(--色名-色碼)')
  printList('規則 1 色票檔的命名 / 排序 / 頻道歸屬', 'colorFile', '跨頻道共用的搬到 color.css')
  printList('規則 2 template 使用 tailwind class', 'tailwind', '樣式移到 assets/css/_modules/')
  printList('規則 3 module css 的引入方式或順序', 'module', '<script setup> 最上方 JS import')
  printList('規則 4 module 變數的命名或斷點', 'variable', '-w / -h / -p,尺寸分三個斷點')
  console.log(
    `  ${YELLOW}👉 要協助修正的話,到 Claude Code 對話框打「修正」或「好」就會處理` +
      `(它已經知道是哪個檔案、哪幾行)。${RESET}`
  )
  console.log('')
}

function onFileChange(projectRoot, file) {
  const ext = path.extname(file)
  if (ext !== '.vue' && ext !== '.css') return

  const rel = toPosix(path.relative(projectRoot, file))
  if (rel.startsWith('..')) return // 專案外的檔案不管
  if (!fs.existsSync(file)) return

  try {
    // 內容跟「剛剛」處理過的一樣 → 是同一次存檔的回音(formatOnSave / 原子替換),跳過。
    // 隔了一段時間才又存同一份內容,那是使用者刻意再存一次,要照常回報。
    const hash = hashOf(fs.readFileSync(file, 'utf8'))
    const seen = lastSeen.get(file)
    if (seen?.hash === hash && Date.now() - seen.at < ECHO_WINDOW_MS) return
    lastSeen.set(file, { hash, at: Date.now() })

    // 色票檔:先自動排序,再檢查命名與頻道歸屬
    if (isColorCssPath(rel)) {
      if (onSortColorCss(file)) {
        // 排序寫檔會再觸發一次 watcher —— 先把排序後的 hash 記下來,省掉那一輪
        lastSeen.set(file, { hash: hashOf(fs.readFileSync(file, 'utf8')), at: Date.now() })
        console.log('')
        console.log(
          `${TAG} ${GREEN}🔧 ${rel} 排序不符規則,已自動依「紅澄黃綠藍紫金白灰黑 + 由淺至深」重新排序。${RESET}`
        )
        console.log('')
      }

      const issues = [
        ...lintFile(projectRoot, file, new Map()),
        ...checkSharedColors(projectRoot),
      ]
      if (issues.length) onReportIssues(rel, issues)
      else onReportPass(rel)
      return
    }

    // 其他 .vue / .css:規範檢查
    const issues = lintFile(projectRoot, file, loadDefinedColorVars(projectRoot))
    if (issues.length) onReportIssues(rel, issues)
    else onReportPass(rel)
  } catch (err) {
    console.log(`${TAG} ${YELLOW}檢查失敗:${err.message}${RESET}`)
  }
}

export default function CssGuardPlugin() {
  let projectRoot = process.cwd()

  return {
    name: 'css-guard',
    apply: 'serve',

    configResolved(config) {
      projectRoot = config.root ?? projectRoot
    },

    // 用 watcher 而不是 handleHotUpdate —— 後者只對「已進模組圖」的檔案觸發,
    // 存到當前頁面沒載入的組件時完全不會有反應;watcher 收得到所有存檔。
    configureServer(server) {
      server.watcher.on('change', (file) =>
        debounce(file, () => onFileChange(projectRoot, file))
      )
    },
  }
}
