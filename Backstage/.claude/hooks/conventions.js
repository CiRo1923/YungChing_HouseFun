// PostToolUse hook:檢查專案慣例,只提醒、不阻擋。
//
// 對應的完整規則:
//   .claude/skills/routing-conventions/SKILL.md
//   .claude/skills/shared-components-sync/SKILL.md
//
// 跨電腦共用 → 腳本放在專案內並進版控,settings.json 只負責呼叫。
// package.json 是 "type": "module",所以這裡用 ESM 語法。

// 規則 1:pages/ 下的路由檔名一律全小寫(_components 內是元件,PascalCase 才對)
const onCheckPageFileName = (filePath) => {
  // 統一成正斜線再判斷,Windows 的反斜線路徑才比對得到
  const path = filePath.replaceAll('\\', '/')

  if (!/\/pages\//.test(path) || !path.endsWith('.vue')) return null
  if (path.includes('/_components/')) return null

  const fileName = path.split('/').pop()

  if (!/[A-Z]/.test(fileName)) return null

  return `[routing-conventions] pages/ 下的檔名會原樣變成 URL(不轉大小寫):「${fileName}」含大寫字母,使用者手打小寫網址會 404。請改為全小寫、多字用連字號。`
}

// 規則 2:mForm / mPopup / ImgSrc / SvgIcon 是 Backstage / Official 兩邊共用的元件,
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

let input = ''

process.stdin
  .on('data', (chunk) => (input += chunk))
  .on('end', () => {
    try {
      const data = JSON.parse(input)
      const filePath = data?.tool_input?.file_path || data?.tool_response?.filePath || ''

      if (!filePath) return

      const messages = [onCheckPageFileName(filePath), onCheckSharedComponent(filePath)].filter(
        Boolean
      )

      if (!messages.length) return

      process.stdout.write(JSON.stringify({ systemMessage: messages.join('\n') }))
    } catch {
      // 解析失敗就靜靜跳過:hook 只是提醒,不該影響工作流程
    }
  })
