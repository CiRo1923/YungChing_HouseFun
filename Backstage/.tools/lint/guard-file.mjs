#!/usr/bin/env node
// 存檔時的守門入口 —— 開發伺服器的外掛與編輯器的存檔動作都執行這支。
//
//   node .tools/lint/guard-file.mjs <檔案>
//   node .tools/lint/guard-file.mjs --write <檔案>   # 只做自動修正,不印檢查結果
//   node .tools/lint/guard-file.mjs --write          # 不指定檔案 → 修正所有色票檔
//
// **那兩層走的是這個命令列介面,不是 import 這支檔案的函式。**
//    import 的話,這裡調整任何一個函式的名稱或參數,那一層就會在載入當下失敗;
//    而那種失敗沒有人會即時發現 —— 存檔守門平常沒有人盯著它有沒有活著,
//    要到有人主動測試才會看到,中間所有的存檔都沒有被檢查過。
//    命令列介面只有「吃一個檔案路徑、把結果印到標準輸出」這一個約定,
//    內部怎麼改都不會波及到它們。
//
// 存檔時做的事,依序:
//
//   1. 色票檔 → 依規則重新排序(只動順序,不動色值)
//   2. 已廢除的 rgba 寫法 → 轉成 8 碼色票變數。色票裡還沒有那個顏色時一併補進去,
//      色值變了連帶要改名的,全站使用端一起換 —— **這一項會動到別的檔案**
//   3. 任何 .vue / .css → 空的規則區塊移除;.vue 的畫面區段還會清掉空的 class 屬性
//   4. 宣告順序與 import 分組 → 重新排好
//   5. onMounted 裡的請求 → 用並行載入的包裝函式包起來
//   6. 從 apiDefault 還原的地方 → 補上深拷貝
//   7. 剩下的規範檢查,違規逐筆印出
//
// **前面六項會直接改寫檔案內容,不只是提醒。** 規則訊息裡寫著
// 「存檔時會自動包好」「存檔時自動排序」的那幾條,講的就是這一層;
// 存檔守門沒有接上的話,那幾句話不成立,而訊息還是照樣那樣寫。
//
// 色票檔在哪由 .tools/lint/project-config.mjs 決定,這裡不寫死路徑 ——
// 每個專案的目錄擺法不一樣,寫死之後換一個專案就找不到檔案。
//
// 輸出不上色(colors.mjs 在非 TTY 自動關色),編輯器的輸出面板不吃 ANSI。
//
// exit code 有意義,不要改:違規 → exit 1、通過 → exit 0。
//    編輯器擴充靠它決定要不要把輸出面板彈出來。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  addColorDecls,
  isColorCssPath,
  loadDefinedColorVars,
  sortColorCss,
} from './color-order.mjs'
import {
  RULE_HINT,
  RULE_TITLE,
  checkSharedColors,
  lintFile,
  onCloneApiDefault,
  onFixLegacyRgba,
  onRemoveEmptyClassAttr,
  onRemoveEmptyRules,
  onSortComposables,
  onSortImports,
  onWrapMountedCalls,
} from './lint-core.mjs'
import { RESET, YELLOW } from './colors.mjs'
import { COLOR_CSS_DIR, PENDING_CACHE_FILE, SCAN_TARGETS, SCANNABLE_RE, isWarn } from './shared.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')

/**
 * 存檔後待處理的檔案清單。
 *
 * 對話層(.claude/hooks/css-guard-prompt.cjs)每一輪都會讀它、重新檢查一次,
 * 只有該檔案已經沒有違規時才會被移除 —— 所以違規沒修掉之前會一直被列出來。
 */
const PENDING_FILE = path.join(root, ...PENDING_CACHE_FILE.split('/'))
const CACHE_DIR = path.dirname(PENDING_FILE)

/**
 * 存檔時間 HH:MM:SS。
 *
 * 通過與違規都要印 —— 輸出面板不會自己清空,沒有時間戳就分不出
 * 「這是剛剛那次存檔的結果」還是「上一次留著沒被捲掉的舊訊息」。
 */
const timeOf = () => new Date().toTimeString().slice(0, 8)

const argv = process.argv.slice(2)
const writeOnly = argv.includes('--write')
const target = argv.find((a) => !a.startsWith('--'))

/**
 * `--write` 沒有指定檔案時,把色票目錄底下所有色票檔都排一次。
 *
 * 色票檔的位置與命名由設定決定(project-config.mjs 的 COLOR_CSS_DIR 與 COLOR_CSS_PREFIX),
 * 呼叫端不必知道那是哪一支 —— 換一個專案時目錄不一樣,寫死路徑就會失效。
 */
/**
 * 把一支色票檔依規則重新排序並寫回,已經是正確順序就不動它。
 *
 * 回傳有沒有實際改動 —— 呼叫端靠它決定要不要印訊息。
 * 只動宣告的順序,不改任何色值;原本的換行格式(CRLF / LF)與結尾換行都保留,
 * 不然每次排序都會順便改掉整份檔案的換行,版本比對會看不出真正的差異。
 */
const onSortOneColorFile = (file) => {
  const original = fs.readFileSync(file, 'utf8')

  /* 排序以「一組」為單位:一支色票可能只有一組(:root),也可能有深淺兩組主題。
     每一組各自排好,組與組之間、以及區塊外的內容都不動。 */
  let sorted = sortColorCss(original)
  if (!sorted) return false

  const eol = original.includes('\r\n') ? '\r\n' : '\n'
  if (eol === '\r\n') sorted = sorted.split('\n').join('\r\n')
  if (!sorted.endsWith(eol)) sorted += eol
  if (sorted.trimEnd() === original.trimEnd()) return false

  fs.writeFileSync(file, sorted, 'utf8')

  return true
}

/** 排序完成的訊息 —— 指定單檔與整批排序印的是同一句話 */
const sortedMessageOf = (rel) => `${rel} 排序不符規則,已自動依「彩虹 + 每類由淺到深」重新排序。`

const onSortAllColorFiles = () => {
  const dir = path.join(root, ...COLOR_CSS_DIR.split('/'))
  if (!fs.existsSync(dir)) return

  for (const name of fs.readdirSync(dir)) {
    const rel = `${COLOR_CSS_DIR}/${name}`
    if (!isColorCssPath(rel)) continue

    if (onSortOneColorFile(path.join(dir, name))) console.error(sortedMessageOf(rel))
  }
}

if (!target) {
  if (writeOnly) onSortAllColorFiles()
  process.exit(0)
}

const abs = path.resolve(root, target)
const rel = path.relative(root, abs).split(path.sep).join('/')

// 副檔名範圍定義在 project-config.mjs,五層守門共用同一份 ——
// 各自寫一份的話,漏列一種副檔名時那類檔案就靜靜地不再被檢查
if (rel.startsWith('..') || !SCANNABLE_RE.test(rel) || !fs.existsSync(abs)) {
  process.exit(0)
}

const lines = []

/**
 * 把一個 CSS 變數改名,掃過原始碼底下每一支會用到它的檔案。
 *
 * 比對帶後界 —— 沒有它的話 `--black-30` 會吃到 `--black-300` 的前半段,
 * 改出一個誰都沒定義的名字,而畫面上只是那個顏色讀不到,不會報錯。
 *
 * 回傳實際改動的檔案清單。
 */
const onRenameVarEverywhere = (from, to) => {
  const re = new RegExp(`${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'g')
  const touched = []

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!/\.(css|vue|js)$/i.test(entry.name)) continue

      const before = fs.readFileSync(full, 'utf8')
      const after = before.replace(re, to)
      if (after === before) continue

      fs.writeFileSync(full, after, 'utf8')
      touched.push(path.relative(root, full).split(path.sep).join('/'))
    }
  }

  for (const target of SCAN_TARGETS) {
    const dir = path.join(root, ...target.split('/'))
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) walk(dir)
  }

  return touched
}

/**
 * 已廢除的透明度寫法 —— 存檔時直接轉成 8 碼。
 *
 * 色值與透明度都是現成的,算得出唯一的結果,所以直接改,不報違規。
 * 色票裡還沒有那個顏色時一併補進去 —— 只換使用端而不補變數的話,
 * 那一行會指向一個沒有定義的變數,畫面上不會報錯,顏色就是不見了。
 */
const onConvertLegacyRgba = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const result = onFixLegacyRgba(original, rel, { definedVars: loadDefinedColorVars(root) })
  if (!result) return

  fs.writeFileSync(abs, result.text, 'utf8')
  lines.push(`${rel} 的 rgba 寫法已自動改成 8 碼色票變數。`)

  /** 新變數補進基礎色所在的那一支色票 —— 用得到基礎色的範圍才用得到它的半透明版 */
  const byFile = new Map()
  for (const a of result.added) byFile.set(a.file, [...(byFile.get(a.file) ?? []), a])

  for (const [colorRel, decls] of byFile) {
    const colorAbs = path.join(root, ...colorRel.split('/'))
    const next = addColorDecls(fs.readFileSync(colorAbs, 'utf8'), decls)
    if (!next) continue

    fs.writeFileSync(colorAbs, next, 'utf8')
    lines.push(`  ${colorRel} 新增 ${decls.map((d) => d.name).join('、')}`)
  }

  /*
   * 色票裡改了名字的變數,全站使用端要跟著換。
   *
   * 名字是從色值算出來的,色值變了名字就不再對得上,所以改值一定伴隨改名。
   * 只改色票不改使用端的話,那些地方會指向一個沒有定義的變數 ——
   * 畫面上不會報錯,顏色就是不見了,而且很難查。
   */
  for (const { from, to } of result.renamed) {
    const touched = onRenameVarEverywhere(from, to)
    lines.push(
      touched.length
        ? `  ${from} 改名為 ${to},同步 ${touched.length} 支檔案`
        : `  ${from} 改名為 ${to}(沒有其他檔案用到)`
    )
  }

  lines.push('')
}

/** 色票檔:依規則重新排序 */
const onSortColorCss = () => {
  if (onSortOneColorFile(abs)) lines.push(sortedMessageOf(rel), '')
}

/** 空的規則區塊 —— 產物不會有輸出,留著只會讓人以為樣式被誤刪 */
const onCleanEmptyRules = () => {
  const isVue = /\.vue$/i.test(rel)
  const original = fs.readFileSync(abs, 'utf8')

  /* 兩件事接在一起做:空的規則區塊、空的 class 屬性。
     各自寫一次檔的話,存檔守門會印兩段訊息、也會讓編輯器重載兩次。 */
  const withoutRules = onRemoveEmptyRules(original, { rel })
  const base = withoutRules ?? original
  const withoutClass = onRemoveEmptyClassAttr(base, { rel })

  const cleaned = withoutClass ?? withoutRules
  if (!cleaned) return

  fs.writeFileSync(abs, cleaned, 'utf8')

  if (withoutRules)
    lines.push(
      isVue
        ? `${rel} 有空的 <style> 區塊,已自動移除。`
        : `${rel} 有空的規則區塊(產物不會有輸出),已自動移除。`
    )

  if (withoutClass) lines.push(`${rel} 有空的 class 屬性,已自動移除。`)

  lines.push('')
}

/**
 * store / actions 的宣告順序 —— 存檔時直接排好,不報違規。
 *
 * 順序是機械式的規則,讓人照著訊息一行一行搬只是浪費時間,
 * 而且搬的過程比工具更容易出錯。
 */
const onSortDeclarations = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const sorted = onSortComposables(original, rel)
  if (!sorted) return

  fs.writeFileSync(abs, sorted, 'utf8')
  lines.push(`${rel} store / actions 的宣告順序已自動排好。`, '')
}

/**
 * 元件的 import 分組順序 —— 存檔時直接排好,不報違規。
 *
 * 順序是機械式的規則,讓人照著訊息一行一行搬只是浪費時間,
 * 而且搬的過程比工具更容易出錯。
 *
 * 「元件沒有載入樣式」那一條不在這裡 —— 工具看不出這支元件的樣式
 * 該放在哪一支 CSS 模組,自動補一行等於替開發者決定檔案要叫什麼,
 * 所以那一條照樣報違規由人處理。
 */
const onSortComponentImports = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const sorted = onSortImports(original, rel)
  if (!sorted) return

  fs.writeFileSync(abs, sorted, 'utf8')
  lines.push(`${rel} 元件的 import 順序已自動排好。`, '')
}

/**
 * 進入頁面要拿的資料 —— 存檔時包成一起發出。
 *
 * 一支一支等的話,使用者等的是每一支的時間加總;一起發出等的是最慢的那一支。
 * 只在確定不改變結果時才動手(形狀單純的整行 await、後面沒用到前面的結果),
 * 判斷不出來的整段留著由規則報出來。
 */
const onWrapMounted = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const wrapped = onWrapMountedCalls(original, rel)
  if (!wrapped) return

  fs.writeFileSync(abs, wrapped, 'utf8')
  lines.push(`${rel} 進入頁面要拿的資料已自動包成一起發出。`, '')
}

/**
 * 從 apiDefault 還原送出參數 —— 存檔時換成深拷貝。
 *
 * apiDefault 是唯讀的而且是深層的,展開一層只複製到最外面那一層:
 * 裡面的陣列還是原本那一個唯讀的陣列,還原之後 push 進不去,
 * 而且正式版沒有任何徵兆。補不上那支函式的 import 時整個不動。
 */
const onCloneDefaults = () => {
  const original = fs.readFileSync(abs, 'utf8')
  const cloned = onCloneApiDefault(original, rel)
  if (!cloned) return

  fs.writeFileSync(abs, cloned, 'utf8')
  lines.push(`${rel} 從 apiDefault 還原的地方已自動改成深拷貝。`, '')
}

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

/**
 * 記下「剛存了這個檔、而且有違規」,讓對話層接得到。
 *
 * 終端機與輸出面板是單向的,接不到使用者的回答;這份清單就是兩者之間的接力棒。
 * 檔案會一直留著,每一輪重新檢查,直到違規修掉才移除。
 */
const onMarkPending = () => {
  const pending = new Set(readJson(PENDING_FILE, []))
  pending.add(rel)

  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(PENDING_FILE, JSON.stringify([...pending]), 'utf8')
  } catch {
    // 寫不進快取只會變成重複提醒或漏問,不是錯誤
  }
}

/** 依規則分組,逐筆列出 */
const onPushGroup = (list, mark) => {
  const byRule = new Map()
  for (const i of list) {
    if (!byRule.has(i.rule)) byRule.set(i.rule, [])
    byRule.get(i.rule).push(i)
  }

  for (const [rule, group] of byRule) {
    lines.push(`  ${RULE_TITLE[rule] ?? rule}(${group.length} 筆) —— ${RULE_HINT[rule] ?? ''}`)
    for (const i of group) lines.push(`    ${mark} L${i.line} ${i.detail}`)
  }
}

const onLint = () => {
  const issues = isColorCssPath(rel)
    ? [...lintFile(root, abs, loadDefinedColorVars(root)), ...checkSharedColors(root)]
    : lintFile(root, abs, loadDefinedColorVars(root))

  // 建議級只提醒,不列入阻擋計數、不進待處理清單 —— 進了清單就會每一輪都被問一次
  const errors = issues.filter((i) => !isWarn(i))
  const warns = issues.filter(isWarn)

  if (!errors.length) {
    lines.push(`✔ ${rel} 規範檢查通過  ${timeOf()}`)
    if (warns.length) {
      lines.push('')
      lines.push(`⚠ ${rel}(${warns.length} 筆建議,不擋)`)
      onPushGroup(warns, '!')
    }
    return
  }

  onMarkPending()

  lines.push(`⛔ ${rel}(共 ${errors.length} 筆)  ${timeOf()}`)
  onPushGroup(errors, '✗')

  if (warns.length) {
    lines.push('')
    lines.push(`⚠ 另有 ${warns.length} 筆建議(不擋)`)
    onPushGroup(warns, '!')
  }

  /* 兩條路都要寫出來,而且不指名任何一個產品 ——
     自己照訊息改的人要知道「每一筆都寫了怎麼改」,
     用 AI 面板的人要知道可以直接交給它。只寫其中一條的話,
     另一種人每次存檔都被指到一個與他無關的地方。 */
  lines.push('')
  lines.push(`${YELLOW}  怎麼修:每一筆後面都寫了要改成什麼,照著改就對了。`)
  lines.push('  用 AI 面板的話:把這段貼進去,或直接說「修正」。')
  lines.push('  再看一次:npm run lint:css <檔案>')
  lines.push(`     此訊息僅為提醒,不會影響儲存;為了讓寫法保持一致,建議找時間調整。${RESET}`)
}

try {
  onConvertLegacyRgba()
  if (isColorCssPath(rel)) onSortColorCss()
  onCleanEmptyRules()

  /* 宣告順序只在存檔時排,commit 前不動 ——
     commit 那一刻改動檔案,人會提交到自己沒看過的內容。 */
  if (!writeOnly) {
    onSortDeclarations()
    onSortComponentImports()
    onWrapMounted()
    onCloneDefaults()
  }

  if (!writeOnly) onLint()
} catch (err) {
  console.error(`[css-guard] 檢查失敗:${err.message}`)
  process.exit(0) // 工具自己壞掉不要吵
}

if (lines.length) console.error(lines.join('\n'))

process.exit(lines.some((l) => l.startsWith('⛔')) ? 1 : 0)
