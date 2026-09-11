#!/usr/bin/env node
/**
 * UserPromptSubmit hook — 把「使用者自己在編輯器存檔」造成的規範違規帶進對話。
 *
 * dev server 外掛與編輯器 Run on Save 只能自動修正、在終端機印警告 ——
 * 那兩層是單向的,接不到使用者的回答。這支補上最後一段:
 *
 *   1. 掃出工作區有改動的檔案(git status)與 pending 清單裡還沒修好的檔
 *   2. 跑規範檢查
 *   3. 把違規清單帶進對話,讓 Claude 記著 —— 使用者說「修正」時就能直接動手
 *
 * 只要還有違規就每一輪都列,不做「回報過就跳過」的去重 ——
 *    沉默會讓違規靜靜留著,以為已經處理完了。要它安靜下來的唯一方式是把違規修掉。
 *
 * 但每輪都列 ≠ 每輪都彈問句 —— 存檔時終端機已經顯示過同一份警告,那裡就寫著
 * 「需要協助時輸入修正」,所以這裡只提供清單,不要求 Claude 主動打斷。
 *
 * 一律不阻擋(exit 0),hook 自己壞掉時安靜結束。
 */
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const ROOT = path.resolve(__dirname, '..', '..')

const MAX_LISTED = 12

const ok = (extra) => {
  process.stdout.write(JSON.stringify(extra || {}))
  process.exit(0)
}

const run = (cmd, args) => {
  try {
    return {
      ok: true,
      out: execFileSync(cmd, args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    }
  } catch (err) {
    return { ok: false, out: `${err.stdout || ''}${err.stderr || ''}` }
  }
}

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

/**
 * 工作區有改動(含未追蹤)的檔案,路徑相對專案根。
 *
 * 副檔名範圍由檢查引擎決定,這裡不自己維護一份 —— 兩份清單各自演化之後,
 * 會出現「存檔時被檢查、但改動列進對話時卻被略過」這種落差,
 * 而且沒有任何徵兆,那類檔案只是從此不再出現在提醒裡。
 */
const onListChangedFiles = (isScannable) => {
  const status = run('git', ['status', '--porcelain', '--', '.'])
  if (!status.ok) return []

  return status.out
    .split('\n')
    .map((line) => line.slice(3).trim().replace(/^"|"$/g, ''))
    .filter((p) => isScannable(p))
    .filter((p) => fs.existsSync(path.join(ROOT, p)))
}

const main = async () => {
  const core = await import(pathToFileURL(path.join(ROOT, '.tools/lint/lint-core.mjs')).href)

  /* 待處理清單的位置由引擎決定,這裡不自己寫一份 —— 這是存檔守門與這一層之間
     的唯一接點,兩邊各寫一次的話,改了一邊就完全接不上,而且不會報錯,
     只會變成「存檔時看到的違規再也不進對話」。 */
  const PENDING_FILE = path.join(ROOT, ...core.PENDING_CACHE_FILE.split('/'))
  const CACHE_DIR = path.dirname(PENDING_FILE)

  const pending = readJson(PENDING_FILE, [])
  const files = [...new Set([...onListChangedFiles(core.isScannable), ...pending])].filter((p) =>
    fs.existsSync(path.join(ROOT, p))
  )

  if (!files.length) ok()

  const result = run(process.execPath, [
    path.join(ROOT, '.tools/lint/lint.mjs'),
    '--json',
    ...files,
  ])

  let parsed = { issues: [] }
  try {
    parsed = JSON.parse(result.out)
  } catch {
    ok() // 解析不了就安靜結束,不要讓工具故障變成無法工作
  }

  /* 建議級不進這份清單 —— 這份每一輪都會出現,把「不必改」的東西放進來
     只會讓整份提醒被當成雜訊略過。
     「哪些只是建議」由引擎判斷,這裡不自己比對 level 字串 ——
     各層各比一次的話,level 增加新的值時,各層的行為就開始不一致。 */
  const list = (parsed.issues || []).filter((i) => !core.isWarn(i))

  // pending 只保留「還有違規」的檔案 —— 修好了就移除,所以不修就會一直被列出來
  const stillBad = [...new Set(list.map((i) => i.file))]
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(PENDING_FILE, JSON.stringify(stillBad), 'utf8')
  } catch {
    // 寫不進快取只會變成重複提醒或漏問,不是錯誤
  }

  if (!list.length) ok()

  const byFile = new Map()
  for (const i of list) {
    if (!byFile.has(i.file)) byFile.set(i.file, [])
    byFile.get(i.file).push(i)
  }

  const lines = []
  let listed = 0
  let shownFiles = 0

  for (const [file, group] of byFile) {
    if (listed >= MAX_LISTED) {
      lines.push(`（其餘 ${byFile.size - shownFiles} 個檔案未列出）`)
      break
    }
    lines.push(`- ${file}`)
    shownFiles += 1
    for (const i of group.slice(0, 5)) {
      lines.push(`    L${i.line} [${i.rule}] ${i.detail}`)
      listed += 1
    }
    if (group.length > 5) lines.push(`    …另有 ${group.length - 5} 筆`)
  }

  /* 跨規則的共同前提與各類寫法規範 —— 從目錄長出來,這裡不維護第二份清單。
     手寫一份的話,新增規則檔或 skill 時不會報錯,只是那一份從此不會出現在
     提醒裡,而沒有人會發現它消失了。每一份的說明由它自己的檔頭 summary 提供。 */
  const ruleLines = core
    .listConventionRules(ROOT)
    .map((r) => `- ${r.summary} —— 詳見 ${r.file}（${r.title}）`)

  const skillNames = core
    .listConventionSkills(ROOT)
    .map((s) => (s.summary ? `${s.name}（${s.summary}）` : s.name))

  ok({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext:
        `【規範待處理】工作區目前有 ${list.length} 筆違規（${byFile.size} 個檔案）：\n` +
        `${lines.join('\n')}\n\n` +
        `處理原則：\n` +
        `- 這份清單只要違規還在就每一輪都會出現，不必去重、也不算重複提醒。\n` +
        `- 不要主動彈 AskUserQuestion 問「要不要修」——使用者存檔時終端機已經看過同一份警告。\n` +
        `- 使用者說「修正」「好」「幫我改」時直接動手，不用再問是哪個檔案。\n` +
        `- 但「照著改會動到行為」的那幾筆要先問（例如資料要從頁面搬進 store、\n` +
        `  api 回傳形狀要變、元件介面要改）——只是換寫法的才直接改。\n` +
        `- 修的時候要分清楚哪些是這次改出來的、哪些是碰到的舊檔案存量。\n` +
        `${ruleLines.join('\n')}\n` +
        (skillNames.length ? `- 各類寫法的規範：${skillNames.join('、')}。\n` : ''),
    },
  })
}

// main 會非同步載入檢查引擎,所以錯誤要用 catch 接 —— try/catch 攔不到 rejection,
// 漏接的話 hook 會以非 0 結束,每一輪都在對話裡留下一段錯誤訊息
main().catch(() => ok())
