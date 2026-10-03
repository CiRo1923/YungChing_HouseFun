#!/usr/bin/env node
// 驗證共用函式 `_prototype.js` 的行為 —— 那一支改壞了沒有任何徵兆。
//
//   npm run test:prototype
//
// 為什麼需要這個:這支檔案裡的函式被頁面與元件大量使用,而它們的產出是
// **畫面上的字**,不是會丟例外的東西 —— 日期算錯只是顯示成別的日期,
// 建置照樣過、規範檢查照樣過、開發伺服器一聲都不吭。
// 規則檢查看的是寫法,看不出一個純函式算出來的值對不對。
//
// 這支檔案是**來源共用**的:它跟著元件一起複製到各專案,兩端範本也要一樣。
// 所以案例問的是「行為有沒有變」,不是「這個專案要不要這樣」——
// 在哪一個專案跑,答案都該相同。下游專案自己加的函式不受這裡約束
// (只驗這裡列出來的那幾支),但列出來的那幾支改了行為就是分岔。
//
// 案例分兩組:
//   現有行為   目前是對的,改完一個都不能變
//   修過的     曾經是錯的,現在修好了 —— 退回去要當場被抓到

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/* 載入時 Node 會提醒「這個 package.json 沒有寫 type: module」—— 那是效能提示,
   與這支要驗的事無關,而且每次都印,會把真正的訊息淹掉。
   只擋這一種,其他警告照常印出來。 */
const defaults = process.listeners('warning')

process.removeAllListeners('warning')
process.on('warning', (warning) => {
  if (warning.code === 'MODULE_TYPELESS_PACKAGE_JSON') return

  for (const listener of defaults) listener(warning)
})

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

const RED = '\u001b[31m'
const GREEN = '\u001b[32m'
const YELLOW = '\u001b[33m'
const RESET = '\u001b[0m'

/* 那支檔案在哪一層由專案決定(有原始碼那一層的專案在 src/ 底下),
   所以用找的,不寫死路徑 —— 寫死的話換一種擺法就整支跳過,而且看起來像通過。 */
const SKIP_DIRS = new Set(['node_modules', '.git', '.output', '.nuxt', 'build', 'dist', 'public'])

const findPrototype = (dir, found = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue

      findPrototype(path.join(dir, entry.name), found)
      continue
    }

    if (entry.name === '_prototype.js') found.push(path.join(dir, entry.name))
  }

  return found
}

const files = findPrototype(root)

if (!files.length) {
  console.log(`${YELLOW}這個專案沒有 _prototype.js,這支檢查整個略過。${RESET}`)
  process.exit(0)
}

if (files.length > 1) {
  console.error(`${RED}✗ 找到不只一支 _prototype.js,不知道要驗哪一支${RESET}`)
  for (const one of files) console.error(`    ${path.relative(root, one)}`)
  process.exit(1)
}

const target = files[0]
const { onFormatDate, onRecursive } = await import(pathToFileURL(target).href)

const log = []
const check = (name, actual, expected) => log.push([name, actual === expected, actual, expected])

// ---- onFormatDate:現有行為,改完一個都不能變 ----

check('純日期字串', onFormatDate('2026-09-30', 'YYYY-MM-DD'), '2026-09-30')
check('斜線分隔', onFormatDate('2026/09/30', 'YYYY/MM/DD'), '2026/09/30')
check('八碼數字', onFormatDate('20260930', 'YYYY-MM-DD'), '2026-09-30')
check('民國年', onFormatDate('2026-09-30', 'YYY-MM-DD'), '115-09-30')
check('不補零的月日', onFormatDate('2026-09-05', 'YYYY/M/D'), '2026/9/5')

check(
  '字串帶時間',
  onFormatDate('2026-09-30 14:05:09', 'YYYY-MM-DD hh:mm:ss'),
  '2026-09-30 14:05:09'
)
check('字串帶時間但只要日期', onFormatDate('2026-09-30 14:05:09', 'YYYY-MM-DD'), '2026-09-30')

/* 沒有時間的字串要求時間 —— 補 00:00:00。
   那個字串講的是一整天,補上當下的時分秒等於無中生有。 */
check(
  '純日期要求時間補零',
  onFormatDate('2026-09-30', 'YYYY-MM-DD hh:mm:ss'),
  '2026-09-30 00:00:00'
)

check('空值回空字串', onFormatDate('', 'YYYY-MM-DD'), '')
check('null 回空字串', onFormatDate(null, 'YYYY-MM-DD'), '')
check('解析不了回空字串', onFormatDate('不是日期', 'YYYY-MM-DD'), '')

// ---- onFormatDate:修過的,退回去要當場被抓到 ----

const fixed = new Date(2026, 8, 30, 14, 5, 9)

/* 時分秒取自解析出來的那個時間點,與年月日同一個來源。
   先前是拿原始輸入去撈 `HH:MM:SS` 那串字 —— 時間戳與 Date 物件裡沒有那串字,
   所以格式寫了 hh:mm:ss 也只會拿到 00:00:00,而畫面上每一筆都是午夜。 */
check('時間戳要拿得到時分秒', onFormatDate(+fixed, 'YYYY-MM-DD hh:mm:ss'), '2026-09-30 14:05:09')
check('Date 物件要拿得到時分秒', onFormatDate(fixed, 'YYYY-MM-DD hh:mm:ss'), '2026-09-30 14:05:09')

/* 沒給格式時回傳的東西,要能再被自己解析回來 ——
   回傳字串的話,下一輪收到 '1790748309000' 解析不了,
   日期選擇器的上下限會變成沒有設定,而且不報錯。 */
const roundTrip = onFormatDate('2026-09-30', '')

check('沒給格式時回傳數字', typeof roundTrip, 'number')
check('回傳的值自己解析得回來', onFormatDate(roundTrip, 'YYYY-MM-DD'), '2026-09-30')

/* 沒有時區的 ISO(`2026-09-30T14:05:09.9170000`)是 .NET 後端很常見的輸出。
   先前的比對式要求一定要有 Z 或 +08:00,那一種整個解析不了 ——
   那類日期欄位在畫面上是空白的,而且不報錯。 */
check(
  '沒時區帶小數秒的 ISO',
  onFormatDate('2026-09-30T14:05:09.9170000', 'YYYY-MM-DD hh:mm:ss'),
  '2026-09-30 14:05:09'
)
check(
  '帶時區的 ISO 仍然要正常',
  onFormatDate('2026-09-30T14:05:09+08:00', 'YYYY-MM-DD'),
  '2026-09-30'
)

// ---- onRecursive ----

/* 使用端常常把 store 的欄位直接傳進來,而那些欄位在後端回來之前就是 null。
   沒有這個保護的話,那一刻整個畫面會掛掉,而訊息指的是函式內部,
   看不出是「資料還沒到」。 */
const noThrow = (fn) => {
  try {
    fn()

    return '沒有丟例外'
  } catch (error) {
    return `丟了例外:${error.message}`
  }
}

check(
  '傳 null 進去不會丟例外',
  noThrow(() => onRecursive(null, 'children', () => {})),
  '沒有丟例外'
)
check(
  '傳 undefined 進去不會丟例外',
  noThrow(() => onRecursive(undefined, 'children', () => {})),
  '沒有丟例外'
)

// 正常的資料照樣走得完 —— 上面那個保護不能把整支擋掉
const walked = []

onRecursive({ id: 1, children: [{ id: 2 }, { id: 3 }] }, 'children', (node) => walked.push(node.id))

check('正常的資料照樣走得完', walked.join(','), '1,2,3')

let failed = 0

for (const [name, ok, actual, expected] of log) {
  if (ok) continue

  console.error(`${RED}✗ ${name}${RESET}`)
  console.error(`    得到 ${JSON.stringify(actual)},預期 ${JSON.stringify(expected)}`)
  failed += 1
}

if (failed) {
  console.error(
    `\n${RED}${failed} / ${log.length} 沒有通過 —— ${path.relative(root, target)}${RESET}`
  )
  process.exit(1)
}

console.log(`${GREEN}✔ 共用函式的行為沒有變(${log.length} 個案例)${RESET}`)
