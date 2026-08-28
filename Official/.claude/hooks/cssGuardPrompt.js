// UserPromptSubmit hook:把「使用者自己在編輯器存檔」造成的 CSS 規範違規帶進對話。
//
// dev server(.vite/css-guard.mjs)與 Run on Save 只能自動排序色票檔、在終端機印警告 ——
// 那兩層沒辦法「問」使用者要不要修。這支補上最後一段:
//
//   1. 掃出工作區有改動的 .vue / .css(git status),色票檔順手自動排序
//   2. 跑規範檢查,只報「上次還沒報過」的違規
//   3. 要求 Claude 主動用 AskUserQuestion 詢問要不要現在修
//
// 報過的違規會記在 node_modules/.cache/ 裡,不會每輪對話重複煩人。
// 一律不阻擋(exit 0),hook 自己壞掉時安靜結束。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..')
const CACHE_DIR = path.join(PROJECT_ROOT, 'node_modules/.cache/cssGuard')
const CACHE_FILE = path.join(CACHE_DIR, 'reported.json')

/** 存檔那層(.tools/css/guard-file.mjs)留下的待問清單 —— 讀走就清空 */
const PENDING_FILE = path.join(CACHE_DIR, 'pending.json')

const MAX_LISTED = 10

const isColorCss = (rel) => /^assets\/css\/_common\/color[A-Za-z]*\.css$/.test(rel)

const run = (cmd, args) => {
  try {
    return {
      ok: true,
      out: execFileSync(cmd, args, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    }
  } catch (err) {
    return { ok: false, out: `${err.stdout ?? ''}${err.stderr ?? ''}` }
  }
}

/** 工作區有改動(含未追蹤)的 .vue / .css,路徑相對本專案 */
const onListChangedFiles = () => {
  const top = run('git', ['rev-parse', '--show-toplevel'])
  if (!top.ok) return []

  // --porcelain 的路徑一律相對 repo 根;這個 repo 根還放著別的專案,要自己剝掉前綴
  const prefix = path
    .relative(top.out.trim(), PROJECT_ROOT)
    .split(path.sep)
    .filter(Boolean)
    .join('/')

  const status = run('git', ['status', '--porcelain', '--', '.'])
  if (!status.ok) return []

  return status.out
    .split('\n')
    .map((line) => line.slice(3).trim().replace(/^"|"$/g, ''))
    .map((p) => (prefix && p.startsWith(`${prefix}/`) ? p.slice(prefix.length + 1) : p))
    .filter((p) => /\.(vue|css)$/.test(p))
    .filter((p) => fs.existsSync(path.join(PROJECT_ROOT, p)))
}

/** 色票檔順手排序,回傳被排序過的檔案 */
const onSortColorFiles = (files) => {
  const sorted = []

  for (const rel of files.filter(isColorCss)) {
    const abs = path.join(PROJECT_ROOT, rel)
    const before = fs.readFileSync(abs, 'utf8')
    run(process.execPath, ['.tools/css/sort-color-css.mjs', '--write', rel])
    if (fs.readFileSync(abs, 'utf8') !== before) sorted.push(rel)
  }

  return sorted
}

const onLint = (files) => {
  const lint = run(process.execPath, ['.tools/css/lint-css.mjs', '--json', ...files])
  try {
    return JSON.parse(lint.out)?.issues ?? []
  } catch {
    return []
  }
}

/** 讀 / 寫「已回報過」的違規指紋 */
const readReported = () => {
  try {
    return new Set(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')))
  } catch {
    return new Set()
  }
}

const writeReported = (set) => {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true })
    fs.writeFileSync(CACHE_FILE, JSON.stringify([...set]), 'utf8')
  } catch {
    // 寫不進快取只會變成重複提醒,不是錯誤
  }
}

const fingerprint = (i) => `${i.file}:${i.line}:${i.detail}`

const RULE_TITLE = {
  color: '規則 1 —— 顏色沒有定義在色票檔',
  colorFile: '規則 1 —— 色票檔的命名 / 排序 / 頻道歸屬',
  tailwind: '規則 2 —— components 的 template 使用 tailwind class',
  module: '規則 3 —— module css 的結構或引入方式不對',
  variable: '規則 4 —— module 變數的命名或斷點不對',
  import: '規則 5 —— .vue 的 import 順序不對',
}

/**
 * 讀走存檔那層留下的待問清單並清空。
 *
 * 為什麼需要:git status 只看得到「內容有變」的檔案,而使用者可能存了檔卻沒改動內容,
 * 或改動早已 commit —— 那些存檔一樣該被問。存檔那層會把檔案記進 pending.json,
 * 這裡接手,讀完就清掉(沒再存檔就不會重複問)。
 */
const onTakePendingFiles = () => {
  let list = []

  try {
    list = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'))
  } catch {
    return []
  }

  try {
    fs.rmSync(PENDING_FILE, { force: true })
  } catch {
    // 清不掉只會多問一次,不是錯誤
  }

  return Array.isArray(list)
    ? list.filter((p) => typeof p === 'string' && fs.existsSync(path.join(PROJECT_ROOT, p)))
    : []
}

const main = () => {
  // 存檔清單優先 —— 那是使用者剛動過的檔案,一定要問
  const files = [...new Set([...onTakePendingFiles(), ...onListChangedFiles()])]
  if (!files.length) return

  const sorted = onSortColorFiles(files)
  const issues = onLint(files)

  const reported = readReported()
  const fresh = issues.filter((i) => !reported.has(fingerprint(i)))

  if (!sorted.length && !fresh.length) return

  for (const i of fresh) reported.add(fingerprint(i))
  writeReported(reported)

  const blocks = []

  if (sorted.length) {
    blocks.push(
      `🔧 色票檔排序不符規則,已自動依「紅澄黃綠藍紫金白灰黑 + 由淺至深」重新排序:\n` +
        sorted.map((f) => `   ${f}`).join('\n')
    )
  }

  const byRule = new Map()
  for (const i of fresh) {
    if (!byRule.has(i.rule)) byRule.set(i.rule, [])
    byRule.get(i.rule).push(i)
  }

  for (const [rule, list] of byRule) {
    blocks.push(
      `⛔ ${RULE_TITLE[rule] ?? rule}(${list.length} 筆):\n` +
        list
          .slice(0, MAX_LISTED)
          .map((i) => `   ${i.file}:${i.line} ${i.detail}`)
          .join('\n') +
        (list.length > MAX_LISTED ? `\n   …另有 ${list.length - MAX_LISTED} 筆` : '')
    )
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext:
          '⚠️ **這一輪一定要做的事**:下面有紅色警告,回答使用者當下的問題之後,' +
          '**必須用 AskUserQuestion 工具**詢問要不要現在協助調整 —— ' +
          '不是在回覆末尾用文字帶一句,是真的呼叫那個工具。\n' +
          '附上你打算怎麼改(哪個檔案、加哪個變數、搬哪些 class),讓使用者能直接判斷。\n' +
          '使用者說過「不管任何狀況都要先詢問」,所以這條**沒有例外**:\n' +
          '先前說過「繼續」「整批授權」都不算免問(那是授權做這件工作,不是授權不用問);' +
          '既有存量也要問,只是要講清楚它是存量;' +
          '只有他針對這一筆說過不用,才不再問第二次。\n\n' +
          `[CSS 規範檢查 —— 剛存檔 / 工作區有改動的 .vue / .css]\n${blocks.join('\n\n')}\n\n` +
          '規範見 .claude/rules/css-conventions.md。這是警告不是阻擋。\n\n' +
          '顏色是 module 的職責:使用端在 setClass.main 寫 text-[--gray-999] 是錯的,' +
          '要在 module 補顏色 modifier(--text-gray-999)讓使用端改用,' +
          '不要把 module 的顏色宣告條件化來讓使用端自訂。\n\n' +
          'module 變數的規則:前綴跟著 class / 資料夾走(mForm/ → --form-*,不要塞 m-);' +
          '命名用 -w / -h / -p / -m / -border / -text-size;尺寸值拆 pc / tablet / mobile 三份;' +
          'px-[--x] / py- / mx- / my- 的 base 給 0(沒 base 整條讀不到),高度給 auto,顏色給 initial;' +
          'hover / focus 覆寫基礎變數而非在 :root 做 var() fallback;' +
          '同組 module 內不同元素撞 class 名時不要硬合併。\n' +
          'variables 檔只放「值」(:root 預設值、modifier 的具體值、指向色票的 var(--white));' +
          '「行為」放版型檔 —— 狀態切換(--checked { --x-bg: var(--x-checked-bg) })與' +
          '斷點對應(--x-size: var(--x-pc-size))都要寫在 common.css / <變體>.css。\n\n' +
          'modifier 的命名 = tailwind utility 加 -- 前綴(--border-b 不是 --has-border-b);' +
          '--oval / --checked 這種 tailwind 沒有對應的狀態開關才用專案自己的說法。' +
          '狀態一律 -- 開頭(--readonly / --error / --disabled / --active / --curr),' +
          '不要用 is-active / has-label 這種裸前綴。\n\n' +
          'module 分共用 / 群組 / 變體三層:兩個以上變體共用的放群組層(mForm 的 selection.* ' +
          '是 checkbox + radio 共用),import 順序為 共用變數 → 群組變數 → 變體變數 → ' +
          '共用版型 → 群組版型 → 變體樣式。\n' +
          '拆 module 時注意「變數建在用到的最小單位上」:padding / margin / border-radius ' +
          '只要用到一個以上的層級(整體 / 軸向 / 單邊 / 單角),就拆到最細那層 —— ' +
          '--p-* 與 --px-* 併存就建 -pt / -pr / -pb / -pl,--rounded-* 與 --rounded-b-* ' +
          '併存就建 -rounded-t / -rounded-b;使用端已用 tailwind 傳細粒度時要補對應 modifier。\n' +
          '字級:固定位置的組件(麵包屑 / 分頁器 / mNav / mFooter)可在 module 用 :root 變數定;' +
          '到處複用的組件(按鈕 / mForm / mTag)一律由父系 setClass 傳,沒有 key 就補一個,' +
          '並把原本的值補回每一個使用端。\n' +
          '有幾個屬性不能用 tailwind 寫、而且都不報錯:border-width 與 box-shadow 一律寫原生 CSS 屬性' +
          '(shadow-[--x] 會被當成 shadow color,box-shadow 根本不出現);font-size 要寫 ' +
          'text-[length:--x];border-color 與 gap-x-[var(--x,0px)] 則沒問題。' +
          'transition-property: transform 不要換成 transition-transform(會連帶塞 duration-150 與 ' +
          'cubic-bezier,timing-function 蓋不掉、手感會變),transform: translate3d(0,0,0) 同理維持原生。\n\n' +
          '**接下來要做的事**:先回答使用者當下的問題,然後用 AskUserQuestion 詢問要不要現在' +
          '協助把上面這些調整成符合規範 —— 附上你打算怎麼改(具體到哪個檔案、加哪個變數、' +
          '搬哪些 class),讓使用者能直接判斷。\n' +
          '若違規是「碰到的舊檔案既有存量」而不是這次改出來的,說明清楚是存量再問。\n' +
          '同一筆違規只會出現一次,使用者說不用就不要再追問。',
      },
    })
  )
}

try {
  main()
} catch {
  // hook 只是提醒,不該影響工作流程
}
