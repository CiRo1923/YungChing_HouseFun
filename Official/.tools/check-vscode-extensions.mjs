#!/usr/bin/env node
// npm install 後檢查:CSS 規範守門用的 VSCode 擴充有沒有裝。
//
// 為什麼要在這裡吵:存檔那一層(.vscode/settings.json 的 emeraldwalk.runonsave)
// 是整套守門裡**唯一在你打字的當下就回報**的機制。沒裝的話，違規要等到
// 下一次跟 Claude 說話、或 git commit 時才會浮出來，中間可能已經寫了一大段。
//
// 一律 exit 0 —— 這是提醒不是關卡，擋住 npm install 只會讓人想繞過。
//
// 沒有安裝 VSCode(找不到擴充目錄)就安靜結束，CI 與非 VSCode 使用者不該被吵。

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { BOLD, DIM, RESET, YELLOW } from './css/colors.mjs'

/** 要檢查的擴充:id 用資料夾前綴比對(擴充目錄名是 <id>-<版本>) */
const REQUIRED = [
  {
    id: 'emeraldwalk.runonsave',
    name: 'Run on Save',
    why: '存檔時即時檢查 CSS 規範:色票檔自動排序、違規逐筆列出並自動彈出輸出面板。',
    lose: '存檔當下不會有任何回饋 —— 違規要等到下次跟 Claude 說話或 git commit 才會出現。',
  },
]

/**
 * VSCode 的擴充目錄。桌面版與 Insiders 分開放,兩個都看。
 * 找不到任何一個 = 沒裝 VSCode(或用別的編輯器),不該吵。
 */
const extensionDirs = () =>
  ['.vscode', '.vscode-insiders', '.vscode-server']
    .map((d) => path.join(os.homedir(), d, 'extensions'))
    .filter((d) => fs.existsSync(d))

const installedIds = (dirs) =>
  dirs.flatMap((dir) => {
    try {
      return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    } catch {
      return []
    }
  })

const main = () => {
  const dirs = extensionDirs()
  if (!dirs.length) return // 沒裝 VSCode —— 安靜結束

  const installed = installedIds(dirs)
  const missing = REQUIRED.filter(
    (ext) => !installed.some((name) => name.toLowerCase().startsWith(`${ext.id.toLowerCase()}-`))
  )

  if (!missing.length) return

  const out = []
  out.push('')
  out.push(`${YELLOW}${BOLD}⚠ 缺少 CSS 規範守門用的 VSCode 擴充${RESET}`)
  out.push('')

  for (const ext of missing) {
    out.push(`${YELLOW}  ✗ ${ext.name}${RESET} ${DIM}(${ext.id})${RESET}`)
    out.push(`      用途:${ext.why}`)
    out.push(`      沒裝會怎樣:${ext.lose}`)
    out.push('')
    out.push(`      安裝:${BOLD}code --install-extension ${ext.id}${RESET}`)
    out.push(`      ${DIM}或在 VSCode 的擴充頁搜尋「${ext.name}」${RESET}`)
    out.push('')
  }

  out.push(`${DIM}  設定已經寫好在 .vscode/settings.json,裝完重開視窗就會生效。${RESET}`)
  out.push(`${DIM}  規範見 .claude/rules/css-conventions.md 的「四層守門」。${RESET}`)
  out.push('')

  console.error(out.join('\n'))
}

try {
  main()
} catch {
  // 這只是提醒,自己壞掉不該影響 npm install
}
