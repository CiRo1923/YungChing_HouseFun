// PostToolUse hook:檢查專案慣例,只提醒、不阻擋。
//
// 對應的完整規則:
//   .claude/skills/store-conventions/SKILL.md
//   .claude/skills/routing-conventions/SKILL.md
//
// 跨電腦共用 → 腳本放在專案內並進版控,settings.json 只負責呼叫。
// package.json 是 "type": "module",所以這裡用 ESM 語法。

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

let input = ''

process.stdin
  .on('data', (chunk) => (input += chunk))
  .on('end', () => {
    try {
      const data = JSON.parse(input)
      const filePath = data?.tool_input?.file_path || data?.tool_response?.filePath || ''

      if (!filePath) return

      const messages = [onCheckActionsReadonly(filePath), onCheckPageFileName(filePath)].filter(
        Boolean
      )

      if (!messages.length) return

      process.stdout.write(JSON.stringify({ systemMessage: messages.join('\n') }))
    } catch {
      // 解析失敗就靜靜跳過:hook 只是提醒,不該影響工作流程
    }
  })
