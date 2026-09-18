// 列出「複製這支元件時,要一起帶走哪幾支檔案」。
//
// 有些元件不是一個自足的資料夾:彈窗、浮層這類要先掛在版面上才會顯示的,
// 完整的一套是元件本身、它讀的那個 store,加上掛在版面上的那幾支容器。
// 只複製元件資料夾的話,搬過去不會報錯 —— 只是永遠不顯示。
//
// 用法(元件的資料夾名或主檔路徑都可以):
//
//   npm run deps <元件資料夾名>
//   npm run deps <元件主檔的路徑>
//
// 算法與規則 componentDeps 是同一份(componentDepsOf)——
// 兩邊各算一次的話,指令印的與規則要求的會有一天對不上。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { componentDepsOf } from './lint/rules-code.mjs'
import { COMPONENTS_DIR, listFiles, toRel } from './lint/shared.mjs'
import { BOLD, DIM, RED, RESET, YELLOW } from './lint/colors.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../..')
const [target] = process.argv.slice(2)

if (!target) {
  console.error('用法:npm run deps <元件>(資料夾名或主檔路徑都可以)')
  process.exit(1)
}

/** 目標可以是完整路徑,也可以只給資料夾名 —— 後者找那個資料夾底下的每一支 */
const resolveTargets = () => {
  const all = listFiles(root, COMPONENTS_DIR)
    .filter((abs) => abs.endsWith('.vue'))
    .map((abs) => toRel(root, abs))

  const asPath = target.split(path.sep).join('/')
  const exact = all.filter((rel) => rel === asPath)
  if (exact.length) return exact

  return all.filter((rel) => rel.split('/').includes(target))
}

const targets = resolveTargets()

if (!targets.length) {
  console.error(`${RED}找不到 ${target}${RESET} —— 共用元件目錄底下沒有這個名字`)
  process.exit(1)
}

let found = false

for (const rel of targets) {
  const deps = componentDepsOf(root, rel, fs.readFileSync(path.join(root, rel), 'utf8'))
  if (!deps.length) continue

  found = true
  console.log(`\n${BOLD}${rel}${RESET}`)
  console.log(`${DIM}複製這支元件時,下面這幾支要一起帶走:${RESET}`)
  deps.forEach((file) => console.log(`  ${file}`))
}

if (!found) {
  console.log(`${target} 是自足的 —— 複製它的資料夾就完整了`)
} else {
  console.log(
    `\n${YELLOW}這份清單也要寫在元件主檔的檔頭(component-deps),複製過去的人才看得到${RESET}`
  )
}
