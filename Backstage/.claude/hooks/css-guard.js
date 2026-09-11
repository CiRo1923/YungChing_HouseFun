// PostToolUse hook:寫入 .vue / .css 後檢查 CSS 規範。
//
//   1. 寫到色票檔 assets/css/_common/color*.css → 自動依規則重新排序(只動順序,不動色值)
//   2. 寫到任何 .vue / .css                     → 檢查四條規範,違規時紅色警告
//
// 一律不阻擋寫入(exit 0),只回報 —— 重構舊檔案時中途卡住比警告更礙事。
// 對應的完整規則:.claude/rules/css-conventions.md
//
// package.json 是 "type": "module",所以這裡用 ESM 語法(與 conventions.js 一致)。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROJECT_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..')

const isColorCss = (rel) => /^assets\/css\/_common\/color[A-Za-z]*\.css$/.test(rel)

const runNode = (args) => {
  try {
    return {
      ok: true,
      out: execFileSync(process.execPath, args, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    }
  } catch (err) {
    return { ok: false, out: `${err.stdout ?? ''}${err.stderr ?? ''}` }
  }
}

/**
 * 各規則對應的修正方式,寫進給 Claude 的指示裡,讓它提得出具體方案。
 *
 * ⛔ 寫這些文字(以及規範、.tools/css/ 的註解)時**不可以出現任何專案名稱** ——
 *    規則本體是各自的複本、移植時整份複製,寫死對方的名字複製過去就變成錯的敘述。
 *    有差異時只描述「本專案的事實」與「移植時要重新確認什麼」。
 */
const FIX_HINTS = {
  color:
    '規則 1:先到 assets/css/_common/color.css(跨頻道共用)或 color<Channel>.css(單一頻道)' +
    '建立變數(命名規則見規範,排序會自動修正),再把使用端換成 var(--色名-色碼) / text-[--色名-色碼]。' +
    '注意:組件的顏色是 module 的職責 —— 使用端在 setClass.main 寫 text-[--gray-999] 是錯的,' +
    '要在 module 補顏色 modifier(--text-gray-999)讓使用端改用,' +
    '不要把 module 的顏色宣告用 :is() 條件化來讓使用端自訂。',
  colorFile:
    '規則 1:色票檔本身 —— 跨頻道共用的色值搬到 color.css;命名要人工改(會牽動使用端);' +
    '排序執行 npm run sort:color 即可。',
  tailwind:
    '規則 2:把 template 的 tailwind class 搬進 assets/css/_modules/<頻道>/<組件>/,' +
    'template 只留組件自身 class 與 --modifier。沒有自己 class 的 div / span 要補一個。但 strong / em / small 這種語意標籤**先問使用者要不要給 class** —— 後代選擇器 .m-x > strong 是 (0,1,1),會蓋掉使用端 setClass 傳的 (0,1,0) utility,使用端就再也改不動;要能傳就補 setClass key 用 :class 綁、module 不設那個屬性。' +
    'modifier 的命名 = tailwind utility 加 -- 前綴(--border-b 不是 --has-border-b、' +
    '--rounded-20、--px-15);--oval / --checked / --align-top 這種 tailwind 沒有對應的' +
    '狀態或語意開關才用專案自己的說法。' +
    '狀態一律 -- 開頭(--readonly / --error / --disabled / --active / --curr / --checked),' +
    '不要用 is-active / has-label 這種裸前綴;jFormValid 那類純給 JS 抓的 hook class 不在此限。',
  module:
    '規則 3:樣式拆進 assets/css/_modules/<頻道>/<組件>/,' +
    '在 <script setup> 最上方 JS import(順序:共用變數 → 群組變數 → 變體變數 → ' +
    '共用版型 → 群組版型 → 變體樣式)。' +
    '兩個以上變體共用的東西放「群組層」(如 mForm 的 selection.css / selectionVariables.css ' +
    '是 checkbox + radio 共用),不要在各變體檔各寫一份,更不要留在 template。' +
    '拆的時候注意「變數建在用到的最小單位上」:padding / margin / border-radius 只要用到' +
    '一個以上的層級(整體 / 軸向 / 單邊 / 單角),就要拆到最細那層 —— ' +
    '例如 --p-* 與 --px-* 併存就建 -pt / -pr / -pb / -pl,--rounded-* 與 --rounded-b-* ' +
    '併存就建 -rounded-t / -rounded-b,common.css 也用最細的 utility 分開取。' +
    '使用端若已用 tailwind 傳細粒度(m:rounded-b-[20px]),要補對應 modifier 給它,' +
    '不要讓兩邊在同一個優先權上打架。' +
    '字級看組件性質:固定位置的組件(麵包屑 / 分頁器 / mNav / mFooter)可以在 module 用 ' +
    ':root 變數定;非固定位置(到處複用)的組件(按鈕 / mForm / mTag)一律由父系 setClass 傳,而且**連 --x-text-size 變數都不要建**(建了就會蓋掉使用端),' +
    'module 不要定 text-*,沒有對應 setClass key 就補一個並把值補回每一個使用端。' +
    '有幾個屬性不能用 tailwind 寫、而且都不報錯:border-width 與 box-shadow 一律寫原生 CSS 屬性' +
    '(shadow-[--x] 會被當成 shadow color,box-shadow 根本不出現);font-size 要寫 ' +
    'text-[length:--x];border-color 與 gap-x-[var(--x,0px)] 則沒問題。' +
    'transition-property: transform 不要換成 transition-transform(會連帶塞 duration-150 與 ' +
    'cubic-bezier,timing-function 蓋不掉、手感會變),transform: translate3d(0,0,0) 同理維持原生。',
  import:
    '規則 5:<script setup> 的 import 順序為 css → ./.composables → @js → 其他套件,' +
    '類別之間空一行;同類別內維持既有順序(css 之間的先後有意義)。' +
    '@stores / @components 等不參與排序檢查。',
  variable:
    '規則 4:命名改成 -w / -h / -p / -m / -border / -text-size,寬高相同的元素(icon 多半是正方形)用 -size 一個變數、不同才拆 -w / -h;' +
    '帶 px 的值一律開變數(1px 線寬、2px 內距也算,「感覺是造型」不是豁免理由;明確不開的:z-index、leading(行高)、tracking(字距)、0/auto/none、以及 font-weight(不是父系帶入就是寫死,直接 @apply font-medium / font-normal)——這四個都有對應的檢查函式(checkZIndexVariable / checkLeadingVariable / checkTrackingVariable)。100% 三個斷點沒差別時直接用 tailwind 的 w-full / h-full / max-w-full / min-w-full / min-h-full,不要寫 w-[100%] 也不要繞變數,只有真的分斷點不同才開變數),值拆成 pc / tablet / mobile 三份,而且要成套(有 -pc-X 就必須有 -tablet-X / -mobile-X,漏一個那斷點會靜靜讀不到值);版型檔不可直接吃 --x-pc-y,要吃中性變數再由 @screen p / t / m 各段對應(但已包在 @screen p 裡面直接吃 -pc- 是合理的,只抓斷點對不上與沒包在斷點區塊裡;複合斷點 pt / tm 裡一律不能直接吃單一斷點的值),同一支檔案的頂層 @screen p / t / m 各自只寫一組(checkScreenGrouping 會抓;巢狀寫法不受限,真要分開就標 /* lint-screen-group-exempt: 理由 */),例外寫 /* lint-breakpoint-exempt: 理由 */。這條多半是機械式改名,可以直接動手。' +
    '順便檢查同一支檔案的其他變數規則:前綴要跟著 class / 資料夾走(mForm/ → --form-*,' +
    '不要在變數名塞 m-);px-[--x] / py- / mx- / my- 的 base 要給 0(沒 base 整條讀不到),' +
    '高度的 base 要給 auto(給 0 會塌),顏色的 base 不要用 initial —— 文字色給 inherit、背景 / 邊框色給 transparent(checkColorBase 會抓);' +
    'hover / focus 一律覆寫基礎變數,不要在 :root 用 var() 做 fallback。hover 的固定寫法(參考 mAnchor):modifier 帶 hover: 前綴、包在 variables.css 的 &:hover 內(hover:--bg-gray-333),不要建 --x-hover-bg-color 專用變數(直接覆寫 --x-bg-color 本身),版型檔也不要寫 &:hover(否則使用端沒帶 modifier 也會觸發)。' +
    'variables 檔只放「值」(:root 預設值、modifier 的具體值、指向色票的 var(--white));' +
    '「行為」放版型檔 —— 狀態切換(--checked { --x-bg: var(--x-checked-bg) })與' +
    '斷點對應(--x-size: var(--x-pc-size))都要寫在 common.css / <變體>.css。' +
    '反過來也成立:variables.css / *Variables.css 以外的檔案,變數宣告右邊一定是 var(…),' +
    '看到 --tag-px: 0 這種常值就是放錯地方(base 值屬於 variables 的 :root)。' +
    '另外空字串是無效 CSS 值、整條宣告會被丟棄,高度寫 auto、圓角寫 0、陰影寫 none。' +
    '判斷方式:這行是在給一個值,還是在切換成自己 module 的另一個變數?',
  theme:
    '規則 6:tailwind.config.js 的 theme 有四組是**整組覆寫**(寫在 theme 而非 theme.extend),' +
    '內建的 key 因此完全不存在,寫了不報錯但產不出任何 CSS —— ' +
    'screens 只有 m / t / p / tm / pt / pMin / pMax(所以 sm: md: lg: xl: 2xl: 都無效),' +
    'fontSize 只有 vmp / vmt / vmm / vmmls(字級一律寫 text-[值] 或 text-[length:--變數]),' +
    'boxShadow 一個 preset 都沒有(tailwind.extend.js 刻意不放陰影)—— ' +
    '陰影一律走原生 box-shadow: var(--x-shadow) + module 自己的斷點變數,' +
    'fontFamily 只有 font-default。' +
    '另外 *-hexa 已淘汰(2026-08-31 起改用 8 碼 hex 色票),transition-property 定義的是複數' +
    '(transition-widths / heights / sizes,不是單數)。' +
    '這條是機械式替換,可以直接動手 —— 但要先確認原本想要的效果是什麼(那個 class 一直沒生效)。',
}

const RULE_TITLE = {
  color: '規則 1 違規 —— 顏色沒有定義在色票檔',
  colorFile: '規則 1 違規 —— 色票檔的命名 / 排序 / 頻道歸屬',
  tailwind: '規則 2 違規 —— template 使用 tailwind class',
  module: '規則 3 違規 —— module css 的結構或引入方式不對',
  variable: '規則 4 違規 —— module 變數的命名或斷點不對',
  import: '規則 5 違規 —— .vue 的 import 順序不對',
  theme: '規則 6 違規 —— 用到本專案不存在或已淘汰的 tailwind class',
}

const MAX_LISTED = 12

const onSortColorCss = (rel, absPath) => {
  if (!isColorCss(rel)) return null

  const before = fs.readFileSync(absPath, 'utf8')
  runNode(['.tools/css/sort-color-css.mjs', '--write', rel])
  const after = fs.readFileSync(absPath, 'utf8')

  if (before === after) return null

  return `🔧 ${rel} 排序不符規則,已自動依「紅澄黃綠藍紫金白灰黑 + 由淺至深」重新排序。`
}

/**
 * 空的規則區塊 —— 直接刪掉,連同後面的空行。
 *
 * 與色票排序同一層級的「自動修正」:空區塊在產物裡沒有任何輸出,
 * 留著只會讓下一個人以為樣式被誤刪。帶註解的不算空,不會被動到。
 */
const onCleanEmptyRules = (rel, absPath) => {
  const before = fs.readFileSync(absPath, 'utf8')
  const after = runNode(['.tools/css/clean-empty-rules.mjs', rel])
  if (!after.ok) return null
  if (fs.readFileSync(absPath, 'utf8') === before) return null

  return rel.endsWith('.vue')
    ? `🔧 ${rel} 有空的 <style> 區塊,已自動移除。`
    : `🔧 ${rel} 有空的規則區塊(產物不會有輸出),已自動移除。`
}

const onLint = (rel) => {
  const lint = runNode(['.tools/css/lint-css.mjs', '--json', rel])

  let parsed
  try {
    parsed = JSON.parse(lint.out)
  } catch {
    return { messages: [], issues: [] } // lint 自己壞掉時不要吵
  }

  const issues = parsed?.issues ?? []
  const messages = []

  for (const rule of Object.keys(RULE_TITLE)) {
    const list = issues.filter((i) => i.rule === rule)
    if (!list.length) continue

    messages.push(
      `⛔ ${RULE_TITLE[rule]}(${rel},${list.length} 筆):\n` +
        list
          .slice(0, MAX_LISTED)
          .map((i) => `   L${i.line} ${i.detail}`)
          .join('\n') +
        (list.length > MAX_LISTED ? `\n   …另有 ${list.length - MAX_LISTED} 筆` : '')
    )
  }

  return { messages, issues }
}

let input = ''

process.stdin
  .on('data', (chunk) => (input += chunk))
  .on('end', () => {
    try {
      const data = JSON.parse(input)
      const filePath = data?.tool_input?.file_path || data?.tool_response?.filePath || ''

      if (!filePath) return

      const ext = path.extname(filePath)
      if (ext !== '.vue' && ext !== '.css') return

      const absPath = path.resolve(filePath)
      const rel = path.relative(PROJECT_ROOT, absPath).split(path.sep).join('/')

      if (rel.startsWith('..')) return // 專案外的檔案不管
      if (!fs.existsSync(absPath)) return

      const sorted = onSortColorCss(rel, absPath)
      const cleaned = onCleanEmptyRules(rel, absPath)
      const { messages: lintMessages, issues } = onLint(rel)
      const messages = [sorted, cleaned, ...lintMessages].filter(Boolean)

      if (!messages.length) return

      const text = messages.join('\n\n')
      const hints = [...new Set(issues.map((i) => i.rule))]
        .map((rule) => FIX_HINTS[rule])
        .filter(Boolean)

      process.stdout.write(
        JSON.stringify({
          systemMessage: text,
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            additionalContext:
              '📋 下面是 CSS 規範違規清單 —— **這是背景資訊,不要主動跳 AskUserQuestion 打斷使用者**。\n' +
              '同一份警告使用者存檔時已經在終端機 / 輸出面板看過了,那裡寫著「要修就打『修正』」。\n\n' +
              '**你要做的事**:把清單記著,照常回答使用者當下的問題。\n' +
              '等他說「修正」「好」「幫我改」之類的話,就直接動手修下面列出的違規 —— ' +
              '不用再問一次是哪個檔案,清單就在下面。\n' +
              '他沒開口就不要修、也不要催 —— 主動權在他手上。\n\n' +
              `[CSS 規範檢查] ${rel}\n${text}\n\n` +
              (hints.length ? `修正方式:\n${hints.map((h) => `- ${h}`).join('\n')}\n\n` : '') +
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
              '**再說一次**:不要主動彈 AskUserQuestion 問「要不要修」—— 等使用者開口。\n' +
              '他說「修正」時就直接動手,不用再確認一次;修的時候要說清楚哪些是這次改出來的、' +
              '哪些是碰到的舊檔案既有存量,不要讓他誤以為都是新問題。\n' +
              '只要違規還在,下一輪這份清單照樣會出現 —— 修掉才會停。',
          },
        })
      )
    } catch {
      // 解析失敗就靜靜跳過:hook 只是提醒,不該影響工作流程
    }
  })
