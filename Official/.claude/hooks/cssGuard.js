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

/** 各規則對應的修正方式,寫進給 Claude 的指示裡,讓它提得出具體方案 */
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
    'template 只留組件自身 class 與 --modifier。沒有自己 class 的元素要補一個。' +
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
    ':root 變數定;到處複用的組件(按鈕 / mForm / mTag)一律由父系 setClass 傳,' +
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
    '規則 4:命名改成 -w / -h / -p / -m / -border / -text-size;' +
    '尺寸類的值拆成 pc / tablet / mobile 三份。這條多半是機械式改名,可以直接動手。' +
    '順便檢查同一支檔案的其他變數規則:前綴要跟著 class / 資料夾走(mForm/ → --form-*,' +
    '不要在變數名塞 m-);px-[--x] / py- / mx- / my- 的 base 要給 0(沒 base 整條讀不到),' +
    '高度的 base 要給 auto(給 0 會塌),顏色沒有時給 initial;' +
    'hover / focus 一律覆寫基礎變數,不要在 :root 用 var() 做 fallback。' +
    'variables 檔只放「值」(:root 預設值、modifier 的具體值、指向色票的 var(--white));' +
    '「行為」放版型檔 —— 狀態切換(--checked { --x-bg: var(--x-checked-bg) })與' +
    '斷點對應(--x-size: var(--x-pc-size))都要寫在 common.css / <變體>.css。' +
    '判斷方式:這行是在給一個值,還是在切換成自己 module 的另一個變數?',
}

const RULE_TITLE = {
  color: '規則 1 違規 —— 顏色沒有定義在色票檔',
  colorFile: '規則 1 違規 —— 色票檔的命名 / 排序 / 頻道歸屬',
  tailwind: '規則 2 違規 —— template 使用 tailwind class',
  module: '規則 3 違規 —— module css 的結構或引入方式不對',
  variable: '規則 4 違規 —— module 變數的命名或斷點不對',
  import: '規則 5 違規 —— .vue 的 import 順序不對',
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

const onLint = (rel) => {
  const lint = runNode(['.tools/css/lint-css.mjs', '--json', rel])

  let parsed = null
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
        list.slice(0, MAX_LISTED).map((i) => `   L${i.line} ${i.detail}`).join('\n') +
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
      const { messages: lintMessages, issues } = onLint(rel)
      const messages = [sorted, ...lintMessages].filter(Boolean)

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
              '⚠️ **這一輪一定要做的事**:下面有紅色警告,把手上這件事講完之後,' +
              '**必須用 AskUserQuestion 工具**詢問要不要現在協助調整 —— ' +
              '不是在回覆末尾用文字帶一句,是真的呼叫那個工具。\n' +
              '使用者說過「不管任何狀況都要先詢問」,所以這條**沒有例外**:\n' +
              '先前說過「繼續」「整批授權」都不算免問(那是授權做這件工作,不是授權不用問);' +
              '既有存量也要問,只是要講清楚它是存量;' +
              '只有他針對這一筆說過不用,才不再問第二次。\n\n' +
              `[CSS 規範檢查] ${rel}\n${text}\n\n` +
              (hints.length ? `修正方式:\n${hints.map((h) => `- ${h}`).join('\n')}\n\n` : '') +
              '規範見 .claude/rules/css-conventions.md。這是警告不是阻擋。\n\n' +
              '**接下來要做的事**:先把手上這件事講完,然後用 AskUserQuestion 詢問使用者' +
              '要不要現在協助調整成符合規範 —— 附上你打算怎麼改(具體到哪個檔案、加哪個變數、' +
              '搬哪些 class),讓使用者能直接判斷。\n' +
              '若這些違規是「碰到的舊檔案既有存量」而不是這次改出來的,說明清楚是存量再問,' +
              '不要讓使用者誤以為是新問題。使用者說不用就不要再問第二次。',
          },
        })
      )
    } catch {
      // 解析失敗就靜靜跳過:hook 只是提醒,不該影響工作流程
    }
  })
