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
    '[sync] 這支檔案是規範複本。如果這次是在同步,做法固定成三件事:' +
    '(1) 重新讀來源目錄的每一支檔案,逐支比對**整份內容** —— 不靠記憶、不靠上一輪的結果、' +
    '也不看修改時間判斷「這支沒動過」;只比匯出名稱的話,同名函式裡換掉的判斷、常數與正則的內容、' +
    '提示訊息、私有輔助、測試案例全都掃不到,而那幾種都會改變行為。' +
    '(2) 整包覆蓋,取用之後不要改名、不要把這邊多的函式接回去、不要補判斷讓它適用這邊 —— ' +
    '接不上是要回報的事實,不是就地解決的問題。' +
    '(3) 只有設定值可以跟著這個專案調整,而且要先問過開發者;' +
    '判斷邏輯、名稱、檔名的差異一律先列出來問。規則見 .claude/rules/sync-conventions.md。'
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
