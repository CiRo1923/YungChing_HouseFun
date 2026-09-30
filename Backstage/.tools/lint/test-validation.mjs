#!/usr/bin/env node
// 驗證表單那幾條格式規則(`_validation.js`)的行為。
//
//   npm run test:validation
//
// 為什麼需要這個:這幾條規則判斷錯了**不會報錯**,只會安靜地走錯邊 ——
// 該擋的放行(錯的資料送到後端才被退),或是該放行的擋下
// (使用者填了正確的值卻送不出去,而畫面上只說格式不對)。
// 規範檢查看的是寫法,看不出一個比對式實際上收了哪些值。
//
// 走的是**真的那條路**:載入那支檔案讓它把規則註冊進 vee-validate,
// 再用 vee-validate 自己的 validate 去驗,與表單執行時完全一樣。
// 不另外複製一份判準來測 —— 複製的那一份改了不會有人發現。
//
// 這支檔案是來源共用的:跟著複製到各專案,兩份範本也要一樣。
// 案例問的是「行為有沒有變」,在哪一個專案跑答案都該相同。

import fs from 'node:fs'
import path from 'node:path'
import { register } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

/* 載入時 node 會提醒「這個 package.json 沒有寫 type: module」—— 那是效能提示,
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

/* 那支檔案在哪一層由專案決定,所以用找的,不寫死路徑 ——
   寫死的話換一種擺法就整支跳過,而且看起來像通過。 */
const SKIP_DIRS = new Set(['node_modules', '.git', '.output', '.nuxt', 'build', 'dist', 'public'])

const findValidation = (dir, found = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue

      findValidation(path.join(dir, entry.name), found)
      continue
    }

    if (entry.name === '_validation.js') found.push(path.join(dir, entry.name))
  }

  return found
}

const files = findValidation(root)

if (!files.length) {
  console.log(`${YELLOW}這個專案沒有 _validation.js,這支檢查整個略過。${RESET}`)
  process.exit(0)
}

if (files.length > 1) {
  console.error(`${RED}✗ 找到不只一支 _validation.js,不知道要驗哪一支${RESET}`)
  for (const one of files) console.error(`    ${path.relative(root, one)}`)
  process.exit(1)
}

const target = files[0]

/* 那支檔案的 import 可能寫成路徑別名(`@js/_prototype.js`),而 node 不認得 ——
   別名接回真實路徑之後才載得起來。對照表從建置設定讀,不寫死。

   **這一段用動態 import 取。** 寫成檔頭的靜態 import 的話,它會在上面那個
   警告過濾註冊**之前**就載入完畢(靜態 import 一律先於模組自己的第一行),
   於是那則提示照樣印出來,把結果訊息擠掉。 */
const { aliasListOf } = await import('./rules-code.mjs')

register('./alias-hooks.mjs', import.meta.url, { data: aliasListOf(root) })

await import(pathToFileURL(target).href)

const { validate } = await import('vee-validate')

/* 參數寫成 `規則:訊息` —— 這幾條規則擋下來時回傳的就是那句話,
   所以「有沒有擋」看的是驗證結果,不是回傳值長什麼樣。 */
const MESSAGE = '格式不對'

const log = []

const onCheck = async (name, rule, value, shouldPass) => {
  const { valid } = await validate(value, `${rule}:${MESSAGE}`)

  log.push([name, valid === shouldPass, valid ? '放行' : '擋下', shouldPass ? '放行' : '擋下'])
}

// ---- 統一發票號碼:兩碼英文字母加八碼數字 ----

await onCheck('invoice 兩碼英文加八碼數字', 'invoice', 'AB12345678', true)
await onCheck('invoice 小寫也收', 'invoice', 'ab12345678', true)
await onCheck('invoice 只有一碼英文要擋', 'invoice', 'A123456789', false)
await onCheck('invoice 數字少一碼要擋', 'invoice', 'AB1234567', false)

// 空值一律在最後那一組一起驗

// ---- 手機條碼載具:斜線開頭加七碼 ----

await onCheck('barcode 斜線加七碼', 'barcode', '/ABC1234', true)
await onCheck('barcode 帶 + . - 的也收', 'barcode', '/AB+.-12', true)
await onCheck('barcode 沒有斜線要擋', 'barcode', 'ABC1234', false)
await onCheck('barcode 小寫要擋', 'barcode', '/abc1234', false)
await onCheck('barcode 長度不對要擋', 'barcode', '/ABC123', false)

/* 逗號要擋 —— 字元類裡的減號寫在中間時(`+-.`)它是「範圍」的意思,
   那一段包含逗號,於是這一筆會被放行,要送到後端才被退回來。 */
await onCheck('barcode 逗號要擋', 'barcode', '/ABC,123', false)

// 空值一律在最後那一組一起驗

// ---- 統一編號:八碼數字,而且要通過檢查碼 ----

await onCheck('tax 檢查碼算得過', 'tax', '22099131', true)

// 第七碼是 7 的那一種有兩種拆法,兩種都要認 —— 只認一種會擋下真的存在的公司
await onCheck('tax 第七碼是 7 的另一種算法也算過', 'tax', '12345675', true)

await onCheck('tax 檢查碼不過要擋', 'tax', '12345678', false)
await onCheck('tax 全 0 要擋', 'tax', '00000000', false)
await onCheck('tax 全 1 要擋', 'tax', '11111111', false)
await onCheck('tax 不足八碼要擋', 'tax', '1234567', false)
await onCheck('tax 有英文要擋', 'tax', '2209913A', false)
// ---- 只能填英文字母 ----

await onCheck('english 純字母', 'english', 'abcXYZ', true)
await onCheck('english 帶數字要擋', 'english', 'abc123', false)
await onCheck('english 帶符號要擋', 'english', 'a-b_c', false)
await onCheck('english 中文要擋', 'english', '中文', false)

/* 全形英文字母要擋 —— 它看起來像英文,貼進網址卻是另一串字。
   這一條與 halfWidth 的差別就在這裡:那一條只問「有沒有全形字」。 */
await onCheck('english 全形字母要擋', 'english', 'ａｂｃ', false)

// ---- 半形字元 ----

/* exception 是「這幾個字元不算」:先拿掉再檢查。

   那一行原本把替換字串傳給了 RegExp(它只吃兩個參數,第三個被無聲忽略),
   於是 replace 少了第二個參數 —— JS 把 undefined 當成字串填進去,
   `Ａ-Ｂ` 會變成 `Ａundefined Ｂ`,而那一串裡的全形字還在,所以照樣被擋下。
   多數情況下結果剛好相同,要到例外字元本身是全形時才看得出行為不同。 */
await onCheck('halfWidth 純半形放行', 'halfWidth', 'abc123', true)
await onCheck('halfWidth 有全形要擋', 'halfWidth', 'ａbc', false)

// ---- 空值一律不歸格式規則管 ----

/* 那是 required 的事。格式規則只回答「**填了的話**形狀對不對」。

  少寫那個 `value &&` 的規則會把留空的選填欄位擋下來,而畫面上只說格式不對 ——
  填表的人看不出那個欄位其實可以不填,而且怎麼改都送不出去。
  實際發生過:tel 少了它,選填的市話欄位留空就送不出去。

  **每一條都問一次**,不是只問新加的那幾條。這種漏寫每加一條規則就多一次機會,
  而且加的時候不會有人想到要驗空值 —— 一次全問就不必記得。 */
const FORMAT_RULES = [
  'chinese',
  'phone',
  'tel',
  'bothTelPhone',
  'number',
  'english',
  'email',
  'invoice',
  'barcode',
  'tax',
]

for (const rule of FORMAT_RULES) {
  await onCheck(`${rule} 空值不歸這條管`, rule, '', true)
}

let failed = 0

for (const [name, ok, actual, expected] of log) {
  if (ok) continue

  console.error(`${RED}✗ ${name}${RESET}`)
  console.error(`    這一筆被${actual},預期要被${expected}`)
  failed += 1
}

if (failed) {
  console.error(
    `\n${RED}${failed} / ${log.length} 沒有通過 —— ${path.relative(root, target)}${RESET}`
  )
  process.exit(1)
}

console.log(`${GREEN}✔ 表單格式規則的行為沒有變(${log.length} 個案例)${RESET}`)
