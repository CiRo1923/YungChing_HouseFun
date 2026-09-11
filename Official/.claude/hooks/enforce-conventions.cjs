#!/usr/bin/env node
/**
 * PreToolUse hook — 寫入前檢查規範,阻擋式。
 *
 * 取代原本五支各自為政的 enforce-*.cjs:判斷邏輯**全部委派給 .tools/lint 引擎**,
 * 所以這裡沒有任何規則判斷。規則有兩份實作的話遲早會漂移,而且漂移的那段時間
 * 沒有人會發現 —— AI 寫檔被擋、但人自己存檔通過,或反過來。
 *
 * 只擋「這次寫入**新增**的違規」,不擋既有存量。
 *    存量有一千多筆,全擋的話 AI 連碰都不能碰既有檔案;
 *    但新增的違規要當下擋住,否則存量只會愈滾愈大。
 *
 * 比對方式:同一支檔案,寫入前 vs 寫入後各跑一次引擎,
 * 用「規則 + 訊息」當識別,只列出寫入後才出現的那幾筆。
 * 行號不列入識別 —— 前面插幾行會讓既有違規的行號整批位移,那不是新增的違規。
 */
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

/**
 * 路徑正規化 —— 同一個位置從不同來源取得時,字面上不一定相同
 * (hook 傳入的路徑 vs __dirname 算出來的,大小寫可能有差)。
 *
 * 不正規化的話 path.relative 會算出「跳出專案」的路徑,整個檢查靜靜失效 ——
 * 不會報錯,只是每次都放行。
 */
const canon = (p) => {
  const r = path.resolve(p)
  return /^[a-z]:/.test(r) ? r[0].toUpperCase() + r.slice(1) : r
}

const ROOT = canon(path.resolve(__dirname, '..', '..'))

const ok = (extra) => {
  process.stdout.write(JSON.stringify(extra || {}))
  process.exit(0)
}

/** Edit:讀磁碟現況,套用 old_string → new_string 後重建完整內容 */
const reconstructForEdit = (abs, ti) => {
  let current = ''

  try {
    current = fs.readFileSync(abs, 'utf8')
  } catch {
    return null
  }

  const oldStr = ti.old_string
  const newStr = typeof ti.new_string === 'string' ? ti.new_string : ''

  if (typeof oldStr !== 'string' || !current.includes(oldStr)) return null

  return {
    before: current,
    after: ti.replace_all ? current.split(oldStr).join(newStr) : current.replace(oldStr, newStr),
  }
}

const readStdin = () => {
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

const main = async () => {
  let input = {}

  try {
    input = JSON.parse(readStdin() || '{}')
  } catch {
    ok()
  }

  const ti = input?.tool_input || {}
  const file = ti.file_path
  if (!file) ok()

  const abs = canon(file)
  const rel = path.relative(ROOT, abs).split(path.sep).join('/')

  // 專案外的檔案一律放行
  if (rel.startsWith('..')) ok()

  /* 副檔名範圍由引擎決定,這裡不自己維護一份 ——
    兩份清單各自演化之後,會出現「存檔時被檢查、AI 寫的時候卻沒被檢查」
    這種只有在特定路徑才發現得了的落差。 */
  const core = await import(pathToFileURL(path.join(ROOT, '.tools/lint/lint-core.mjs')).href)
  if (!core.isScannable(rel)) ok()

  let before = ''
  let after = ''

  if (typeof ti.content === 'string') {
    // Write:新檔案的話 before 是空字串
    before = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : ''
    after = ti.content
  } else {
    const rebuilt = reconstructForEdit(abs, ti)
    if (!rebuilt) ok() // 重建不了就別猜,放行

    before = rebuilt.before
    after = rebuilt.after
  }

  const colorOrder = await import(
    pathToFileURL(path.join(ROOT, '.tools/lint/color-order.mjs')).href
  )

  const definedVars = colorOrder.loadDefinedColorVars(ROOT)

  const keyOf = (i) => `${i.rule}::${i.detail}`

  const existing = new Set(core.lintText(ROOT, rel, before, definedVars).map(keyOf))

  // 建議級不擋寫入 —— 它的用意是提醒人想一下,不是要求非改不可;
  // 擋在這裡的話 AI 會為了通過而繞路,反而寫出更奇怪的程式碼。
  const added = core
    .lintText(ROOT, rel, after, definedVars)
    /* 「哪些只是建議、不擋」由引擎判斷,這裡不自己比對 level 字串 ——
       各層各比一次的話,level 增加新的值時,各層的行為就開始不一致 */
    .filter((i) => !core.isWarn(i) && !existing.has(keyOf(i)))

  if (!added.length) ok()

  const byRule = new Map()
  for (const i of added) {
    if (!byRule.has(i.rule)) byRule.set(i.rule, [])
    byRule.get(i.rule).push(i)
  }

  const detail = [...byRule.entries()]
    .map(([rule, list]) => {
      const title = core.RULE_TITLE[rule] ?? rule
      const hint = core.RULE_HINT[rule] ?? ''
      const lines = list.map((i) => `    L${i.line} ${i.detail}`).join('\n')

      return `  ${title} —— ${hint}\n${lines}`
    })
    .join('\n')

  /* 跨規則的共同前提 —— 從目錄長出來,這裡不維護第二份清單。
     手寫一份的話,新增規則檔時不會報錯,只是那一份從此不會出現在擋下的訊息裡。
     每一份的說明由它自己的檔頭 summary 提供,順序依檔頭的 priority。 */
  const rules = core
    .listConventionRules(ROOT)
    .map((r) => `  · ${r.summary}\n    詳見 ${r.file}(${r.title})`)
    .join('\n')

  ok({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `已擋下寫入 ${rel} —— 這次改動**新增**了 ${added.length} 筆規範違規:\n${detail}\n\n` +
        `⚠️ 改之前先看這幾條共同前提:\n${rules}\n\n` +
        `既有存量不在此限,只有這次新增的要處理。判斷邏輯與存檔 / commit 那幾層完全相同,` +
        `本機可執行 node .tools/lint/lint.mjs ${rel} 覆核。`,
    },
  })
}

main().catch(() => ok())
