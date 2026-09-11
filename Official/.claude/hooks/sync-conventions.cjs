#!/usr/bin/env node
/**
 * PostToolUse hook —— 寫入規範複本時提醒同步的做法,只提醒、不阻擋。
 *
 * 這支是這個專案自己的,不在規範複本的範圍內。
 * 規範複本那幾支(enforce-conventions / css-guard-prompt / move-permissions-to-local)
 * 一律整包取用,不在裡面加規則 —— 加了就再也說不出「兩邊一樣」是什麼意思。
 *
 * 對應規則:.claude/rules/sync-conventions.md
 */
const fs = require('node:fs')
const path = require('node:path')

/* 規範複本的範圍。這幾個目錄底下的檔案一律整包取用,不做任何改寫。 */
const SYNC_SCOPE = /(^|\/)(\.claude\/(rules|skills|hooks)|\.tools\/lint|\.githooks)\//

/* 這幾支是這個專案自己的,不在複本範圍內 —— 寫它們不必提醒。 */
const LOCAL_ONLY = [
  '.claude/hooks/sync-conventions.cjs',
  '.claude/rules/sync-conventions.md',
  '.tools/lint/project-config.mjs',
  '.tools/lint/diff-output.mjs',
  '.githooks/pre-commit',
]

const onCheckSyncScope = (filePath) => {
  const p = filePath.replaceAll('\\', '/')

  if (!SYNC_SCOPE.test(p)) return null
  if (LOCAL_ONLY.some((rel) => p.endsWith(rel))) return null

  return (
    '[sync] 這支檔案是規範複本。**同步就是完全複製** —— 來源目錄底下的每一支整份覆蓋過來,' +
    '一個字都不改,複製完與來源同名的每一支要逐位元組相同。做之前先讀 ' +
    '.claude/rules/sync-conventions.md,不要憑記憶。三件事:' +
    '(1) 重新讀來源目錄的每一支檔案,逐支比對整份內容 —— 不靠記憶、不靠上一輪的結果、' +
    '也不看修改時間判斷「這支沒動過」;只比匯出名稱的話,同名函式裡換掉的判斷、常數與正則、' +
    '提示訊息、私有輔助、測試案例全都掃不到。來源有而這邊沒有的檔案也要一起複製。' +
    '(2) 整份覆蓋,不做任何改寫 —— 不要改名、不要把這邊多的函式接回去、不要補判斷讓它適用這邊、' +
    '不要只挑看起來需要的那幾支。複製之後接不上是要回報的事實,不是就地解決的問題。' +
    '(3) 複製完跑 npm run lint:css 與 npm run test:css;掃描檔案數變少或出現「前提不存在」' +
    '就是設定與這個專案對不上。必須不同的地方(含 project-config.mjs 的值)列出來問開發者,' +
    '寫清楚哪一支檔案、複製之後實際發生什麼、要改哪一行,附上工具的實際輸出。'
  )
}

let input = ''

process.stdin.on('data', (chunk) => {
  input += chunk
})

process.stdin.on('end', () => {
  let filePath

  try {
    filePath = JSON.parse(input)?.tool_input?.file_path
  } catch {
    // 讀不到輸入就安靜跳過 —— 這支只是提醒,不該因為自己壞掉而擋住任何事
    process.exit(0)
  }

  if (!filePath || !fs.existsSync(path.resolve(filePath))) process.exit(0)

  const message = onCheckSyncScope(filePath)

  if (!message) process.exit(0)

  console.error(message)
  process.exit(0)
})
