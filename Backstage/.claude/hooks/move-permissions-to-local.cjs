#!/usr/bin/env node
/**
 * PostToolUse(Bash) + Stop hook — 把 .claude/settings.json 的 permissions
 * 自動搬回 settings.local.json。
 *
 * 起因:允許新指令時,Claude Code 會把 permissions.allow 寫進「專案」的
 *       settings.json(已實測,非 local),導致該檔每個 session 都在長,
 *       產生持續的 git diff 噪音 —— 那些一次性 shell 指令對其他人零價值。
 *
 * 為何不是 PreToolUse:Claude Code 寫入 permissions 走的是內部流程,
 *       不經過 Write/Edit 工具,PreToolUse 攔不到,只能事後歸位。
 *
 * 兩個觸發點,共用這一支(冪等,重複跑無副作用):
 *   PostToolUse(matcher: Bash, async):寫入正是發生在 Bash 執行的當下,
 *     指令跑完立刻歸位,settings.json 幾乎不會處於髒狀態。async 為背景執行,
 *     不拖慢每次 Bash。
 *   Stop:兜底 —— 接住非 Bash 路徑的寫入,以及 async 來不及跑完的情況。
 *
 * 不掛 ConfigChange —— 本 hook 自己會改寫 settings.json,會造成無限迴圈。
 *
 * 行為:settings.json 的 permissions 各陣列(allow/deny/ask/additionalDirectories)
 *       併入 local 對應陣列,保序去重(local 原有順序在前);純量鍵(如 defaultMode)
 *       僅在 local 未定義時才帶過去,不覆蓋個人設定。搬完從 settings.json 移除
 *       permissions,其餘鍵原樣保留。
 *
 * 完全靜默:掛在 PostToolUse(Bash) 後執行頻率高,任何輸出都會變成噪音,
 *       故一律不輸出、不回報。要確認是否生效看 git status,或手動執行:
 *       echo '{}' | node .claude/hooks/move-permissions-to-local.cjs
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..', '..')
const PROJECT = path.join(ROOT, '.claude', 'settings.json')
const LOCAL = path.join(ROOT, '.claude', 'settings.local.json')

// hook 不該因為自己出錯而中斷使用者的工作,一律靜默結束。
function bail() {
  process.exit(0)
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return fallback
  }
}

// 保序去重:local 原有的排前面,專案端新增的接在後面。
function mergeList(localList, projectList) {
  const seen = new Set()
  const result = []
  for (const item of [...localList, ...projectList]) {
    const key = JSON.stringify(item)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

const project = readJson(PROJECT, null)
if (!project || !project.permissions) bail()

const moved = project.permissions
const local = readJson(LOCAL, {})
if (!local.permissions) local.permissions = {}

for (const [key, value] of Object.entries(moved)) {
  if (Array.isArray(value)) {
    local.permissions[key] = mergeList(local.permissions[key] || [], value)
    continue
  }

  // defaultMode 這類純量:不覆蓋 local 既有的個人選擇。
  if (!(key in local.permissions)) local.permissions[key] = value
}

delete project.permissions

try {
  fs.writeFileSync(LOCAL, `${JSON.stringify(local, null, 2)}\n`, 'utf-8')
  fs.writeFileSync(PROJECT, `${JSON.stringify(project, null, 2)}\n`, 'utf-8')
} catch {
  bail()
}
