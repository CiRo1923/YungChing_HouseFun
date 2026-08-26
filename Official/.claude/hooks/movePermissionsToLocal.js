/* 把 .claude/settings.json 長出來的 permissions 搬到 .claude/settings.local.json。

  Claude Code 會把「不再詢問」的授權持久化到專案設定 —— 即使 settings.local.json
  裡已經有同一條規則,它還是往 settings.json 寫(官方文件說寫 local,實作不是)。
  那份清單是個人的:每台機器不同、還混著 scratchpad 的絕對路徑,不該進版控。
  settings.json 只留 hooks(專案共用的規則),permissions 一律搬到 local。

  ⚠️ 只在真的搬動時才輸出 —— PostToolUse 的 stdout 會進 Claude 的 context,
      每次工具呼叫都印一行只是噪音。 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SHARED = path.join(ROOT, '.claude/settings.json')
const LOCAL = path.join(ROOT, '.claude/settings.local.json')

// permissions 底下的清單:allow / deny / ask 都是陣列,其餘鍵(defaultMode…)直接覆蓋
const LISTS = ['allow', 'deny', 'ask']

const onRead = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

const onWrite = (file, data) => fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)

const onMerge = (local = {}, shared = {}) => {
  const next = { ...local, ...shared }

  for (const key of LISTS) {
    const merged = [...(local[key] ?? []), ...(shared[key] ?? [])]
    // 去重但保留先後順序(local 原有的排前面)
    if (merged.length) next[key] = [...new Set(merged)]
    else delete next[key]
  }

  return next
}

const shared = onRead(SHARED)

if (!shared?.permissions) process.exit(0)

const local = onRead(LOCAL) ?? {}
const moved = Object.values(shared.permissions).flat().length

local.permissions = onMerge(local.permissions, shared.permissions)
delete shared.permissions

onWrite(LOCAL, local)
onWrite(SHARED, shared)

console.log(`已把 ${moved} 條 permissions 從 .claude/settings.json 搬到 settings.local.json`)
