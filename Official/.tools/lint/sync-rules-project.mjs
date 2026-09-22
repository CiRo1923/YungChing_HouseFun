#!/usr/bin/env node
// 把規範系統從它的來源整套複製過來 —— 規則、skills、hooks、編輯器設定。
//
//   node .tools/lint/sync-rules-project.mjs <來源專案根>          # 只看會動到什麼,不寫入
//   node .tools/lint/sync-rules-project.mjs <來源專案根> --apply  # 實際複製
//
// 來源路徑每台機器都不一樣,所以由參數給,也可以設環境變數 RULES_SOURCE 省掉每次打。
//
// **比對一律算檔案內容的雜湊,不看修改時間。** 時間戳只說明檔案什麼時候被寫過:
// 複製、簽出、編輯器存檔都會更新它,而內容可能一個位元組都沒變;反過來,
// 兩支時間相同的檔案內容也可能不同。拿時間當依據會兩種方向都出錯,
// 而且錯的時候完全沒有徵兆 —— 只是某幾條規則悄悄停在舊版本。
//
// **複製完要再比對一次。** 來源是活的,同步進行到一半它就可能又更新;
// 只看複製當下的結果,回報的「已同步」可能在說出口時就過期了。
// 這支程式的 --apply 跑完會自動再比一次,兩份結果都印出來。

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

/** 要同步的目錄。規範系統就是這四層,其餘(原始碼、建置設定)各專案自己的。 */
const SYNC_DIRS = ['.claude', '.tools', '.githooks', '.vscode']

/**
 * 這幾支由本專案自己維護,來源整套覆蓋時不能動到。
 *
 * 判準是「這一份的內容由誰決定」:規則與 skills 由來源決定,所以照抄;
 * 下面這些的內容講的是**這個專案自己的事**,抄過來就是錯的資料。
 */
const KEEP_OURS = [
  // 規範工具的專案設定:項目由來源決定,值填自己的(見 .claude/rules/config-values-only.md)
  '.tools/lint/project-config.mjs',
  // 編輯器與本機設定
  '.claude/settings.json',
  '.claude/settings.local.json',
  '.claude/launch.json',
  // 這四支記的是各專案自己的網址、待辦與既有違規數字
  '.claude/docs/wiki-正式網站.md',
  '.claude/docs/wiki-測試網站.md',
  '.claude/docs/待辦事項.md',
  '.claude/docs/規範存量.md',
]

/**
 * 自我驗證跑的時候才存在的探針目錄,跑完就刪。
 *
 * 比對剛好撞上它還在的那一刻,那幾十支暫存檔就會被當成規範檔案搬過來 ——
 * 而且來源那邊早就沒有了,下一次比對會報成「只有本專案有」。
 */
const TRANSIENT_RE = /__css-self-test__/

const ROOT = path.resolve(process.argv[1], '../../..')

const hashOf = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

const isKept = (rel) =>
  KEEP_OURS.includes(rel) || rel.endsWith('-project.mjs') || TRANSIENT_RE.test(rel)

/** 收集一個根目錄底下那幾層的所有檔案,回傳 { 相對路徑: 內容雜湊 } */
const collect = (root) => {
  const map = new Map()

  const walk = (dir) => {
    if (!fs.existsSync(dir)) return

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(full)
        continue
      }

      map.set(path.relative(root, full).split(path.sep).join('/'), hashOf(full))
    }
  }

  SYNC_DIRS.forEach((sub) => walk(path.join(root, sub)))

  return map
}

const compare = (sourceRoot) => {
  const source = collect(sourceRoot)
  const ours = collect(ROOT)
  const result = { same: 0, onlySource: [], onlyOurs: [], different: [], kept: [] }

  for (const [rel, hash] of source) {
    if (isKept(rel)) {
      result.kept.push(rel)
      continue
    }

    if (!ours.has(rel)) result.onlySource.push(rel)
    else if (ours.get(rel) !== hash) result.different.push(rel)
    else result.same += 1
  }

  for (const rel of ours.keys()) {
    if (!source.has(rel) && !isKept(rel)) result.onlyOurs.push(rel)
  }

  return result
}

const report = (title, result) => {
  console.log(`\n${title}`)
  console.log(`  內容相同:${result.same} 支`)
  console.log(`  本專案缺:${result.onlySource.length} 支`)
  result.onlySource.sort().forEach((rel) => console.log(`    ${rel}`))
  console.log(`  內容不同:${result.different.length} 支`)
  result.different.sort().forEach((rel) => console.log(`    ${rel}`))
  console.log(`  只有本專案有(來源沒有,不刪):${result.onlyOurs.length} 支`)
  result.onlyOurs.sort().forEach((rel) => console.log(`    ${rel}`))
  console.log(`  保留本專案的:${result.kept.length} 支`)
  result.kept.sort().forEach((rel) => console.log(`    ${rel}`))
}

/**
 * 設定項的清單由來源決定,值由專案填。
 *
 * 來源新增一項而這邊沒跟上時,規則 import 不到那個名字,整套工具**載入就掛**;
 * 少掉一項則是那條規則安靜地不再檢查任何東西。兩種都要在同步完當場知道。
 */
const compareConfigItems = (sourceRoot) => {
  const rel = '.tools/lint/project-config.mjs'
  const nameOf = (file) =>
    [...fs.readFileSync(file, 'utf8').matchAll(/^export const (\w+)/gm)].map((m) => m[1])

  const source = nameOf(path.join(sourceRoot, rel))
  const ours = nameOf(path.join(ROOT, rel))
  const missing = source.filter((name) => !ours.includes(name))
  const extra = ours.filter((name) => !source.includes(name))

  console.log(`\n設定項(${rel})`)

  if (!missing.length && !extra.length) {
    console.log(`  與來源完全一致(${source.length} 項)`)

    return
  }

  missing.forEach((name) => console.log(`  ✗ 來源有、本專案缺:${name} —— 要補上,值填本專案的`))
  extra.forEach((name) => console.log(`  ✗ 本專案多出來:${name} —— 沒有任何規則會讀它`))
}

const copyAll = (sourceRoot, result) => {
  const files = [...result.onlySource, ...result.different]

  files.forEach((rel) => {
    const target = path.join(ROOT, rel)

    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.copyFileSync(path.join(sourceRoot, rel), target)
  })

  console.log(`\n已複製 ${files.length} 支`)
}

const main = () => {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const sourceRoot = args.find((arg) => !arg.startsWith('--')) ?? process.env.RULES_SOURCE

  if (!sourceRoot) {
    console.error('要給來源專案的根目錄:')
    console.error('  node .tools/lint/sync-rules-project.mjs <來源專案根> [--apply]')
    console.error('或設環境變數 RULES_SOURCE 指向它。')
    process.exit(1)
  }

  if (!fs.existsSync(sourceRoot)) {
    console.error(`來源不存在:${sourceRoot}`)
    process.exit(1)
  }

  console.log(`來源:${sourceRoot}`)

  const before = compare(sourceRoot)
  report('=== 同步前 ===', before)

  if (!apply) {
    console.log('\n(只看不寫。要實際複製請加 --apply)')
    compareConfigItems(sourceRoot)

    return
  }

  copyAll(sourceRoot, before)

  // 來源是活的,複製到一半它可能又更新了 —— 所以當場再比一次,不要拿上面那份結果交差。
  report('=== 複製後重新比對 ===', compare(sourceRoot))
  compareConfigItems(sourceRoot)
}

main()
