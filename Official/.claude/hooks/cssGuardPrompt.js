// UserPromptSubmit hook:把「使用者自己在編輯器存檔」造成的 CSS 規範違規帶進對話。
//
// dev server(.vite/css-guard.mjs)與 Run on Save 只能自動排序色票檔、在終端機印警告 ——
// 那兩層是單向的,接不到使用者的回答。這支補上最後一段:
//
//   1. 掃出工作區有改動的 .vue / .css(git status)與還沒修好的檔,色票檔順手自動排序
//   2. 跑規範檢查
//   3. 把違規清單帶進對話,讓 Claude 記著 —— 使用者說「修正」時就能直接動手
//
// ⚠️ **只要還有違規就每一輪都列**,不做「回報過就跳過」的去重 ——
// 使用者明確要求過:沉默會讓違規靜靜留著,以為已經處理完了。
// 要它安靜下來的唯一方式就是把違規修掉。
//
// 但**每輪都列 ≠ 每輪都彈問句** —— 存檔時終端機 / 輸出面板已經顯示過同一份警告,
// 那裡就寫著「要修就打『修正』」,所以這裡只提供清單,不要求 Claude 主動打斷。
//
// 一律不阻擋(exit 0),hook 自己壞掉時安靜結束。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..')
const CACHE_DIR = path.join(PROJECT_ROOT, 'node_modules/.cache/cssGuard')

/**
 * 存檔那層(.tools/css/guard-file.mjs)留下的追蹤清單。
 *
 * **不是讀走就清空** —— 檔案一旦被存過而且有違規,就一直留在這裡,
 * 每一輪對話都重新檢查一次;直到它通過了才移除。
 * 這樣「有違規就每次問」才成立:不修掉就會一直被問。
 */
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

const RULE_TITLE = {
  color: '規則 1 —— 顏色沒有定義在色票檔',
  colorFile: '規則 1 —— 色票檔的命名 / 排序 / 頻道歸屬',
  tailwind: '規則 2 —— components 的 template 使用 tailwind class',
  module: '規則 3 —— module css 的結構或引入方式不對',
  variable: '規則 4 —— module 變數的命名或斷點不對',
  import: '規則 5 —— .vue 的 import 順序不對',
  theme: '規則 6 —— 用到本專案不存在或已淘汰的 tailwind class(產不出任何 CSS)',
}

/**
 * 讀存檔那層留下的追蹤清單(**不清空**)。
 *
 * 為什麼需要:git status 只看得到「內容有變」的檔案,而使用者可能存了檔卻沒改動內容,
 * 或改動早已 commit —— 那些存檔一樣該被追蹤。
 *
 * 清單只在「該檔案已經沒有違規」時才移除(見 onDropClean),
 * 所以違規沒修掉之前,每一輪對話都會再問一次。
 */
const onReadPendingFiles = () => {
  let list

  try {
    list = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'))
  } catch {
    return []
  }

  return Array.isArray(list)
    ? list.filter((p) => typeof p === 'string' && fs.existsSync(path.join(PROJECT_ROOT, p)))
    : []
}

/** 把「已經通過」的檔案從追蹤清單移除 —— 修好了就不必再看它 */
const onDropClean = (pending, issues) => {
  const dirty = new Set(issues.map((i) => i.file))
  const keep = pending.filter((f) => dirty.has(f))

  try {
    if (keep.length) {
      fs.mkdirSync(path.dirname(PENDING_FILE), { recursive: true })
      fs.writeFileSync(PENDING_FILE, JSON.stringify(keep), 'utf8')
    } else {
      fs.rmSync(PENDING_FILE, { force: true })
    }
  } catch {
    // 寫不進快取只會變成多問一次,不是錯誤
  }
}

const main = () => {
  // 追蹤清單(存過檔且還沒修好的)+ 工作區有改動的
  const pending = onReadPendingFiles()
  const files = [...new Set([...pending, ...onListChangedFiles()])]
  if (!files.length) return

  const sorted = onSortColorFiles(files)
  const issues = onLint(files)

  // 修好的檔案退出追蹤;還有違規的留著,下一輪繼續問
  onDropClean(pending, issues)

  // ⚠️ 不做去重 —— 只要還有違規就每一輪都報。
  // 使用者要求過:沉默會讓人以為已經處理完了,要它安靜的唯一方式是把違規修掉。
  if (!sorted.length && !issues.length) return

  const fresh = issues
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
          '📋 下面是 CSS 規範違規清單 —— **這是背景資訊,不要主動跳 AskUserQuestion 打斷使用者**。\n' +
          '同一份警告使用者存檔時已經在終端機 / 輸出面板看過了,那裡寫著「要修就打『修正』」。\n\n' +
          '**你要做的事**:把清單記著,照常回答使用者當下的問題。\n' +
          '等他說「修正」「好」「幫我改」之類的話,就直接動手修下面列出的違規 —— ' +
          '不用再問一次是哪個檔案,清單就在下面。\n' +
          '他沒開口就不要修、也不要催 —— 主動權在他手上。\n\n' +
          `[CSS 規範檢查 —— 剛存檔 / 工作區有改動的 .vue / .css]\n${blocks.join('\n\n')}\n\n` +
          '規範見 .claude/rules/css-conventions.md。這是警告不是阻擋。\n\n' +
          '⚠️ **判斷不出來就問,不要猜** —— 不只「要不要修」要問,' +
          '「這件事該怎麼做」不確定時也要問。一律問、不要自己決定的岔路:' +
          '屬性要不要開 modifier、字級歸 module 還是父系 setClass、語意標籤要不要給 class、' +
          '某斷點沒設定是例外還是漏寫、非 px 值(duration-* / rounded-full)要不要變數化、' +
          '死檔要重寫還是刪、沒人用的 modifier 要留還是刪、' +
          'template 綁了 class 但沒有對應 CSS 是刻意還是漏掉。\n' +
          '猜錯的代價不對稱:要回頭改 module + template + 每一個使用端。' +
          '問法是直說「這個我判斷不出來」並列出選項與後果,' +
          '不要假裝有把握然後埋一句「暫時這樣」。\n\n' +
          '顏色是 module 的職責:使用端在 setClass.main 寫 text-[--gray-999] 是錯的,' +
          '要在 module 補顏色 modifier(--text-gray-999)讓使用端改用,' +
          '不要把 module 的顏色宣告條件化來讓使用端自訂。\n\n' +
          'module 變數的規則:前綴跟著 class / 資料夾走(mForm/ → --form-*,不要塞 m-);' +
          '命名用 -w / -h / -p / -m / -border / -text-size,寬高相同的元素(icon 多半是正方形)用 -size 一個變數、不同才拆 -w / -h;帶 px 的值一律開變數(1px / 2px 也算,例外是 z-index、0/auto/none、font-weight(不是父系帶入就是寫死);100% 直接用 w-full / h-full / max-w-full 等,不要繞變數),拆 pc / tablet / mobile 三份且要成套(有 -pc-X 就必須有 -tablet-X / -mobile-X);版型檔不可直接吃 --x-pc-y,要吃中性變數再由 @screen p / t / m 各段對應(已包在 @screen p 裡面直接吃 -pc- 是合理的),同一支檔案的頂層 @screen p / t / m 各自只寫一組(checkScreenGrouping 會抓;巢狀寫法不受限,真要分開就標 /* lint-screen-group-exempt: 理由 */);' +
          'px-[--x] / py- / mx- / my- 的 base 給 0(沒 base 整條讀不到),高度給 auto,顏色的 base 不要用 initial —— 文字色給 inherit(沒指定就跟父層)、背景 / 邊框色給 transparent(沒指定就是沒有顏色);' +
          'hover / focus 覆寫基礎變數而非在 :root 做 var() fallback,且 hover 用帶 hover: 前綴的 modifier 包在 variables.css 的 &:hover 內、不建 hover 專用變數、版型檔不寫 &:hover(參考 mAnchor);' +
          '同組 module 內不同元素撞 class 名時不要硬合併。\n' +
          'variables 檔只放「值」(:root 預設值、modifier 的具體值、指向色票的 var(--white));' +
          '「行為」放版型檔 —— 狀態切換(--checked { --x-bg: var(--x-checked-bg) })與' +
          '斷點對應(--x-size: var(--x-pc-size))都要寫在 common.css / <變體>.css。\n' +
          '反過來也成立:variables.css / *Variables.css 以外的檔案,變數宣告右邊一定是 var(…),' +
          '看到 --tag-px: 0 這種常值就是放錯地方(base 值屬於 variables 的 :root)。' +
          '另外空字串是無效 CSS 值、整條宣告會被丟棄,高度寫 auto、圓角寫 0、陰影寫 none。\n\n' +
          '搬 template 時,沒有自己 class 的 div / span 要補一個;但 strong / em / small ' +
          '這種語意標籤**先問使用者要不要給 class** —— 後代選擇器 .m-x > strong 是 (0,1,1),' +
          '會蓋掉使用端 setClass 傳的 (0,1,0) utility,使用端就再也改不動。' +
          '要能傳就補 setClass key 用 :class 綁、module 不設那個屬性。\n\n' +
          'modifier 的命名 = tailwind utility 加 -- 前綴(--border-b 不是 --has-border-b);' +
          '--oval / --checked 這種 tailwind 沒有對應的狀態開關才用專案自己的說法。' +
          '狀態一律 -- 開頭(--readonly / --error / --disabled / --active / --curr),' +
          '不要用 is-active / has-label 這種裸前綴。\n\n' +
          '資料夾名跟著 class 前綴走不是組件檔名;組件放在某個 module 的子資料夾底下時' +
          '(components/buy/mItem/SwitchItem.vue),它是那個母體的變體 —— 資料夾用 mItem/、' +
          '檔名用 switchItem.css、class 也要收斂成 m-item-switch-*,三者要對齊,' +
          '只搬資料夾而 class 不動就失去「看到 class 就找到檔案」的意義。\n' +
          'module 分共用 / 群組 / 變體三層:兩個以上變體共用的放群組層(mForm 的 selection.* ' +
          '是 checkbox + radio 共用),import 順序為 共用變數 → 群組變數 → 變體變數 → ' +
          '共用版型 → 群組版型 → 變體樣式。\n' +
          '拆 module 時注意「變數建在用到的最小單位上」:padding / margin / border-radius ' +
          '只要用到一個以上的層級(整體 / 軸向 / 單邊 / 單角),就拆到最細那層 —— ' +
          '--p-* 與 --px-* 併存就建 -pt / -pr / -pb / -pl,--rounded-* 與 --rounded-b-* ' +
          '併存就建 -rounded-t / -rounded-b;使用端已用 tailwind 傳細粒度時要補對應 modifier。\n' +
          '字級一律 text-[length:--x-text-size],不要寫原生 font-size: var()(少了 length: 會被當成 color)。一支檔案有多個變數要分斷點就吃中性變數、@screen p / t / m 各段集中對應;只有一個就直接在 @screen p / t / m 內吃 -pc- / -tablet- / -mobile-。字級:固定位置的組件(麵包屑 / 分頁器 / mNav / mFooter)可在 module 用 :root 變數定;' +
          '非固定位置(到處複用)的組件(按鈕 / mForm / mTag)一律由父系 setClass 傳,沒有 key 就補一個,而且**連 --x-text-size 變數都不要建** —— 建了 module 就會 @apply 它,一輸出就蓋掉使用端傳的 text-*,交給父系等於白做;' +
          '並把原本的值補回每一個使用端。' +
          '(唯一的特例是 mForm 的 .m-form-error —— 全系列統一、又是 module 自己渲染的節點,' +
          '字級留在 module 用 --form-error-text-size。)\n' +
          'z-index 一律直接寫數字(@apply z-[3]),不開變數也不分斷點 —— 疊層是整站一套秩序,' +
          '寫成常數才能 grep 一眼看出誰蓋誰;lint 會抓 --x-z / z-[--x] / z-index: var(…) 三種寫法。' +
          'leading 與 tracking 同理不開變數(行高跟著字級走、值多半是無單位比例),' +
          '直接寫 @apply leading-[1.5] / tracking-[0.06em]。\n' +
          '**動 CSS 前先讀 tailwind.config.js**:本專案把 screens / fontSize / boxShadow / fontFamily ' +
          '直接寫在 theme(不是 extend),tailwind 預設整組被換掉 —— 沒有 text-sm / text-base、' +
          '沒有 sm / md / lg / xl、沒有 shadow-sm / shadow-md / shadow-none、沒有 font-sans,' +
          '字級一律 arbitrary value;斷點是 m / t / p / tm / pt / pMin / pMax / mLandscape,' +
          '全部是 raw media query;陰影只有 shadow-black-y2-b4 / shadow-dropdown / shadow-card 三個。' +
          '這些由規則 6 守門(checkTailwindTheme)。\n' +
          '同一個 @apply 裡字級與文字顏色**可以併存**(text-[length:--a] text-[--b] 會產出 ' +
          'font-size 與 color 兩條,已用 npx tailwindcss 驗過實際產物),不要為此退回原生 color:。\n' +
          '有幾個屬性不能用 tailwind 寫、而且都不報錯:border-width 與 box-shadow 一律寫原生 CSS 屬性' +
          '(shadow-[--x] 會被當成 shadow color,box-shadow 根本不出現);font-size 要寫 ' +
          'text-[length:--x];border-color 與 gap-x-[var(--x,0px)] 則沒問題。' +
          'transition-property: transform 不要換成 transition-transform(會連帶塞 duration-150 與 ' +
          'cubic-bezier,timing-function 蓋不掉、手感會變),transform: translate3d(0,0,0) 同理維持原生。\n\n' +
          '⛔ **要不要分斷點,一定要先問設計者,不可以自己判斷** —— 三個斷點同值時可以只寫一個變數' +
          '(標 /* lint-same-value: 理由 */),但那是設計決定不是工程判斷。' +
          'box-shadow / border-width 這類造型屬性最常被問到,' +
          '而工具只抓得到單一數值的尺寸、複合值(陰影)一律漏抓,所以更要先問。\n\n' +
          '⛔ **嚴禁在規則本體與 .tools/css/ 的註解裡寫死專案名稱** —— 不論本專案、姊妹專案還是參考專案的名字都不行。這份規範與工具是各自的複本、移植時整份複製,寫死對方的名字複製過去就變成錯的敘述(「與 A 的差異」抄到 A 專案會變成「與自己的差異」)。兩邊真的有差異時,只描述**本專案的事實**與**移植時要重新確認什麼**,不要提對方是誰 —— 例如「本專案的 tailwind.extend.js 有三個 boxShadow preset,所以只抓內建的 key;若對方的 extend 不放陰影,要改成抓任何 shadow-*」。專案名只能出現在規範最後的「本專案現況」一章,以及專門講跨專案同步的 skill。\n\n' +
          '**再說一次**:不要主動彈 AskUserQuestion 問「要不要修」—— 等使用者開口。\n' +
          '他說「修正」時就直接動手,不用再確認一次;修的時候要說清楚哪些是這次改出來的、' +
          '哪些是碰到的舊檔案既有存量,不要讓他誤以為都是新問題。\n' +
          '只要違規還在,下一輪這份清單照樣會出現 —— 修掉才會停。',
      },
    })
  )
}

try {
  main()
} catch {
  // hook 只是提醒,不該影響工作流程
}
