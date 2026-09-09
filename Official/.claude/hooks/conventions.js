// PostToolUse hook:檢查專案慣例,只提醒、不阻擋。
//
// 對應的完整規則:
//   .claude/skills/store-conventions/SKILL.md
//   .claude/skills/routing-conventions/SKILL.md
//
// 跨電腦共用 → 腳本放在專案內並進版控,settings.json 只負責呼叫。
// package.json 是 "type": "module",所以這裡用 ESM 語法。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

// 規則 1:Actions 只放執行事件,常數宣告要回到 stores/*.js
const onCheckActionsReadonly = (filePath) => {
  if (!/Actions\.js$/.test(filePath)) return null

  let content

  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch {
    // 檔案讀不到(已刪除 / 權限)就跳過,hook 只是提醒
    return null
  }

  if (!/readonly\(/.test(content)) return null

  return '[store-conventions] Actions 只放執行事件:readonly 常數請宣告在對應的 stores/*.js,再從 action 引用(例如 memberUpgrade.apiDefault)。'
}

// 規則 2:pages/ 下的路由檔名一律全小寫(_components 內是元件,PascalCase 才對)
const onCheckPageFileName = (filePath) => {
  // 統一成正斜線再判斷,Windows 的反斜線路徑才比對得到
  const path = filePath.replaceAll('\\', '/')

  if (!/\/pages\//.test(path) || !path.endsWith('.vue')) return null
  if (path.includes('/_components/')) return null

  const fileName = path.split('/').pop()

  if (!/[A-Z]/.test(fileName)) return null

  return `[routing-conventions] pages/ 下的檔名會原樣變成 URL(不轉大小寫):「${fileName}」含大寫字母,使用者手打小寫網址會 404。請改為全小寫、多字用連字號。`
}

// 規則 3:mForm / mPopup / ImgSrc / SvgIcon 是 Backstage / Official 兩邊共用的元件,
// 功能必須一致(樣式各自照設計走)
const SHARED_COMPONENTS = [
  { pattern: /\/components\/common\/mForm\//, name: 'mForm' },
  { pattern: /\/components\/common\/mPopup\//, name: 'mPopup' },
  { pattern: /\/components\/common\/ImgSrc\.vue$/, name: 'ImgSrc' },
  { pattern: /\/components\/common\/SvgIcon\.vue$/, name: 'SvgIcon' },
]

const onCheckSharedComponent = (filePath) => {
  const path = filePath.replaceAll('\\', '/')
  const matched = SHARED_COMPONENTS.find((item) => item.pattern.test(path))

  if (!matched) return null

  return `[shared-components-sync] ${matched.name} 是 Backstage / Official 共用元件。這次若動到「功能」(config / props / emits / 行為),要同步到另一個專案;純樣式調整則不用。規則見 .claude/skills/shared-components-sync/SKILL.md。`
}

// 規則 4:新檔案就是「新結構」—— 沿用既有的板,不要自己發明
//
// 對應規則:.claude/rules/no-invention.md
//
// 判斷方式是「git 還不認識這個檔案」。改既有檔案不會觸發,只有真的多開一支才會 ——
// 這正是最容易自己發明結構的時刻(順手拆一個元件、多開一層資料夾)。
// 使用者明確要求開的檔案也會被提醒,那沒關係:確認過就忽略一行字。
const onCheckNewFile = (filePath) => {
  const path = filePath.replaceAll('\\', '/')

  if (!/\.(vue|js|mjs|css)$/.test(path)) return null
  // 規則講的是產品程式碼的結構,工具與設定不在此限
  if (/(^|\/)(\.claude|\.tools|\.vite|node_modules)\//.test(path)) return null

  let isTracked = true

  try {
    execFileSync('git', ['ls-files', '--error-unmatch', filePath], { stdio: 'ignore' })
  } catch (error) {
    // exit 1 才是「git 不認識這個檔案」。其他失敗(128 = 不是 repo、
    // ENOENT = 找不到 git)代表**無法判斷**,那就當既有檔案處理 ——
    // 提醒錯了比漏提醒更糟:每次寫檔都跳一次,很快就會被當雜訊忽略。
    isTracked = error.status !== 1
  }

  if (isTracked) return null

  const fileName = path.split('/').pop()

  return (
    `[no-invention] 「${fileName}」是新檔案 —— 也就是新結構。` +
    `動手前先 grep 既有的同類頁面 / 元件怎麼做,找到就照抄那個板(連文案與 config 欄位名都照抄);` +
    `找不到或有兩種以上做法就**停下來問**,不要自己選。規則見 .claude/rules/no-invention.md。`
  )
}

// 以下兩條都要看檔案內容。讀不到就跳過(hook 只是提醒),並排除工具與依賴目錄。
const CONTENT_EXTENSIONS = /\.(vue|js|mjs|ts|css|md)$/
const CONTENT_SKIP_DIRS = /(^|\/)(node_modules|\.output|\.nuxt|dist)\//

const onReadContent = (filePath) => {
  const path = filePath.replaceAll('\\', '/')

  if (!CONTENT_EXTENSIONS.test(path) || CONTENT_SKIP_DIRS.test(path)) return null

  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch {
    return null
  }
}

// 規則 5:這是與客戶共同開發的專案 —— 註解與文件只記錄「邏輯」,
// 不記錄「誰弄錯了什麼」。
//
// 對方讀得到這個 repo,而「規格上一版寫錯、設計稿是錯的、某天更正」這類敘述,
// 對讀程式的人沒有任何幫助(要知道的是現在的行為與為什麼這樣做),
// 卻會變成翻舊帳的紀錄。判斷方式:把那句話唸給客戶聽,會不會尷尬。
//
// 需要記「還沒定案 / 待確認」是可以的 —— 那是待辦,寫成「要問後端能不能提供 X」,
// 而不是「後端漏了 X」。
const BLAME_WORDS = [
  '誤寫',
  '寫錯',
  '標錯',
  '轉譯錯誤',
  '是錯的',
  '是錯誤的',
  '設計稿錯',
  '規格錯',
  '早一版',
  '舊版規格',
  '後端漏',
  '沒寫清楚',
]

const onCheckClientBlame = (content) => {
  if (!content) return null

  const hits = BLAME_WORDS.filter((word) => content.includes(word))

  if (!hits.length) return null

  return (
    `[client-tone] 這個 repo 與客戶共同開發 —— 註解與文件只記錄邏輯,不記錄「哪一版寫錯、誰弄錯」。` +
    `這次寫入含有:${hits.join('、')}。` +
    `改成描述「現在的行為與為什麼」;若是待確認事項,寫成「要問後端能不能提供 X」而不是「後端漏了 X」。`
  )
}

// 規則 6:盡可能不要用 emoji —— 註解、文件、訊息都一樣。
//
// 它在等寬字型下寬度不一致(對齊會歪)、終端機與 diff 常顯示成豆腐或問號,
// 而且傳達不了任何程式資訊:該強調就把話寫清楚。
// 需要視覺分級時用文字前綴(「注意:」「必讀:」)。
const EMOJI_RE = /[\p{Extended_Pictographic}\u2713\u2714\u2717\u2718]/gu

const onCheckEmoji = (content) => {
  if (!content) return null

  // 去掉 U+FE0F(變體選擇子):它不會單獨出現,跟在符號後面才變成彩色 emoji,
  // 留著會讓訊息多印一個看不見的字元。
  const hits = [
    ...new Set((content.match(EMOJI_RE) ?? []).map((char) => char.replace(/\uFE0F/g, ''))),
  ]

  if (!hits.length) return null

  return (
    `[no-emoji] 盡可能不要用 emoji 符號。這次寫入含有:${hits.join(' ')}。` +
    `請刪掉,需要強調就用文字(「注意:」「必讀:」)—— emoji 在等寬字型下寬度不一致,` +
    `終端機與 diff 也常顯示不出來。`
  )
}

let input = ''

process.stdin
  .on('data', (chunk) => (input += chunk))
  .on('end', () => {
    try {
      const data = JSON.parse(input)
      const filePath = data?.tool_input?.file_path || data?.tool_response?.filePath || ''

      if (!filePath) return

      const content = onReadContent(filePath)
      const messages = [
        onCheckActionsReadonly(filePath),
        onCheckPageFileName(filePath),
        onCheckSharedComponent(filePath),
        onCheckNewFile(filePath),
        onCheckClientBlame(content),
        onCheckEmoji(content),
      ].filter(Boolean)

      if (!messages.length) return

      process.stdout.write(JSON.stringify({ systemMessage: messages.join('\n') }))
    } catch {
      // 解析失敗就靜靜跳過:hook 只是提醒,不該影響工作流程
    }
  })
