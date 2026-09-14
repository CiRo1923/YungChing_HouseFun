#!/usr/bin/env node
// 驗證「同一份案例在不同的專案擺法下結果相同」。
//
//   npm run test:shapes
//
// 為什麼需要這個:規則的驗證案例會寫出探測檔,而探測檔的位置是用設定組出來的。
// 設定在每個專案長得不一樣,而**來源專案只有一種擺法,自己跑永遠不會遇到別種** ——
// 要到另一個專案複製過去跑起來才會發現,而那時看到的是「規則好像壞了」。
//
// 兩種會讓案例失準的差異:
//
//   原始碼放在哪     有原始碼那一層的專案,專案根不是原始碼,探測檔不會被
//                    原始碼那幾條規則掃到;原始碼直接放專案根的則會被一起掃
//   目錄值幾段       帶著路徑的值,與只有一段的值 —— 案例挑了某一個設定項
//                    來造內容時,那一項在另一種專案可能短到規則刻意不抓,
//                    於是永遠驗不到東西
//
// 兩件事要一起換才是真實的擺法:原始碼直接放專案根的專案,目錄值本來就不會
// 帶著原始碼那一層。只換一半會造出不存在的組合,而那時失敗的每一則都是假的。
//
// 每一種擺法都跑在**複製出來的一份空骨架**上,不碰這個專案:
//
//   - 專案自己的設定檔完全不動 —— 中途失敗也不會留下被改過的設定
//   - 探測檔不會寫進這個專案的目錄
//   - 換了目錄設定之後,規則指向的是空的位置,對每一種擺法都一樣
//
// 骨架裡沒有這個專案的頁面、色票與規範文件,所以有幾則在**每一種**擺法都不會過。
// 那不是這支要找的東西 —— 要找的是「只在某幾種擺法沒過」的那幾則,
// 多半是案例沒有指定 `rule`(只計自己那一條),或是內容挑了某一個設定項來造。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CONVENTION_RULES_DIR,
  CONVENTION_SKILLS_DIR,
  STYLE_CONFIG_FILES,
} from './project-config.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

/**
 * 骨架裡要一起帶過去的專案內容 —— **與目錄擺法無關的那幾樣**。
 *
 * 有幾條規則是拿檔案跟專案現況比對的:規範文件要讀得到才知道有哪幾份共同前提,
 * 樣式設定檔要讀得到才知道 theme 覆寫了什麼。這些東西擺在哪裡不隨擺法改變,
 * 帶過去之後那幾則在每一種擺法都驗得到,不會因為骨架是空的而一律失敗。
 *
 * 會跟著擺法改變的(頁面、色票、建置設定)刻意不帶 ——
 * 那些的位置由設定決定,帶過去只會落在新設定找不到的地方,而驗證本來就會
 * 照當下的設定把它們建起來。
 */
const CARRIED = [CONVENTION_RULES_DIR, CONVENTION_SKILLS_DIR, ...STYLE_CONFIG_FILES]

/**
 * 假想擺法裡各個目錄叫什麼 —— 兩種擺法共用這一份。
 *
 * 這些名字不是任何專案的設定來源,是為了造出「目錄值只有一段」那種形狀而取的。
 * 專案換了目錄不必回來改這裡,這裡改了也不會影響任何專案的檢查範圍。
 */
const DIR_NAMES = {
  VIEWS_DIR: 'views',
  STORE_DIR: 'stores',
  API_DIR: 'api',
  COMPONENTS_DIR: 'components',
  COMPONENT_DIRS: ['components', 'containers', 'layout'],
  CSS_MODULES_DIR: 'modules',
  COLOR_CSS_DIR: 'colors',
}

/** 有原始碼那一層的專案,把它加在每一個目錄前面 —— 兩種擺法的差別只有這件事 */
const SRC_LAYER = 'src'
const under = (value) =>
  Array.isArray(value)
    ? value.map((one) => `${SRC_LAYER}/${one}`)
    : `${SRC_LAYER}/${value}`

const nestedDirs = Object.fromEntries(
  Object.entries(DIR_NAMES).map(([name, value]) => [name, under(value)])
)

/**
 * 要試的幾種擺法。
 *
 * `config` 是要改寫的設定項,寫 null 代表照這個專案原本的設定跑 ——
 * 專案自己那一種一定要在裡面,不然驗的全是假想的擺法。
 *
 * 空字串與 `.` 都代表「原始碼放在專案根」,兩種寫法都有專案在用,
 * 而規則是用同一個判斷認出它們的,所以試一種就夠。
 */
const SHAPES = [
  { label: '本專案自己的擺法', config: null },
  {
    label: '原始碼自成一層,目錄值帶著它',
    config: { SRC_DIR: SRC_LAYER, ...nestedDirs },
  },
  {
    label: '原始碼放在專案根,目錄值只有一段',
    config: { SRC_DIR: '', ...DIR_NAMES },
  },
]

/**
 * 驗證輸出裡代表「沒通過」的那個記號。
 *
 * 寫成跳脫碼而不是字元本身 —— 這裡要的是一個用來比對的值,
 * 不是要印出去的狀態記號,寫成字元會讓人以為這支檔案自己在印它。
 */
const FAIL_MARK = '✗'

/** 把一項設定改寫成指定的值;找不到那一行就是設定檔的形狀變了,要講出來 */
const rewrite = (text, name, value) => {
  const literal = Array.isArray(value)
    ? `[${value.map((one) => `'${one}'`).join(', ')}]`
    : `'${value}'`

  // 陣列的值會跨好幾行,所以兩種形狀都要認
  const re = Array.isArray(value)
    ? new RegExp(`^export const ${name} = \\[[\\s\\S]*?\\]$`, 'm')
    : new RegExp(`^export const ${name} = .*$`, 'm')

  if (!re.test(text)) {
    console.error(`設定檔裡找不到 ${name} 的那一行,無法切換擺法。`)
    process.exit(1)
  }

  return text.replace(re, `export const ${name} = ${literal}`)
}

/**
 * 跑一次驗證,回傳沒通過的案例名稱。
 *
 * 骨架是一個空目錄,裡面只放規範工具自己那一層 —— 驗證會把它要比對的東西
 * (頁面資料夾、色票、建置設定)自己建起來,所以不必把專案搬過去。
 */
const failuresOf = ({ config }) => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-shapes-'))
  const toolDir = path.join(sandbox, '.tools', 'lint')

  try {
    fs.mkdirSync(path.dirname(toolDir), { recursive: true })
    fs.cpSync(here, toolDir, { recursive: true })

    for (const rel of CARRIED) {
      const from = path.join(root, ...rel.split('/'))
      if (!fs.existsSync(from)) continue

      fs.cpSync(from, path.join(sandbox, ...rel.split('/')), { recursive: true })
    }

    if (config) {
      const configFile = path.join(toolDir, 'project-config.mjs')
      let text = fs.readFileSync(configFile, 'utf8')

      for (const [name, value] of Object.entries(config)) text = rewrite(text, name, value)
      fs.writeFileSync(configFile, text, 'utf8')
    }

    let out = ''
    try {
      /* 子行程的輸出全部收進來,不讓它直接印到畫面 ——
         每一種擺法都印一整份的話,這支自己要講的那幾行會被淹掉。 */
      out = execFileSync(process.execPath, [path.join(toolDir, 'self-test.mjs')], {
        cwd: sandbox,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (err) {
      // 有案例沒通過時會以非零結束,輸出仍然要拿來比對
      out = `${err.stdout ?? ''}${err.stderr ?? ''}`
    }

    /* 取記號之後的那一段當案例名稱。
       終端機的顏色碼不特別清掉 —— 每一次執行的顏色完全一樣,比對不受影響,
       而為了清它去比對控制字元,反而讓這支檔案多一段看不見的東西。 */
    return out
      .split('\n')
      .filter((line) => line.includes(FAIL_MARK))
      .map((line) => line.slice(line.indexOf(FAIL_MARK) + FAIL_MARK.length).trim())
      .filter(Boolean)
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true })
  }
}

/* 指紋那一則不列入比對:骨架是複製過來的,規則改完還沒重新封存時它一定會失敗,
   而且每一種擺法都一樣 —— 列進來只會讓訊息多一筆雜訊。
   真正要看的是「哪幾則只在某幾種擺法失敗」。 */
const isShapeIssue = (name) => !name.includes('指紋')

/** 案例名稱 → 它在哪幾種擺法沒通過 */
const failedIn = new Map()

for (const shape of SHAPES) {
  const failed = failuresOf(shape).filter(isShapeIssue)

  console.log(`${shape.label}:${failed.length ? `${failed.length} 則沒通過` : '全部通過'}`)

  for (const name of failed) {
    if (!failedIn.has(name)) failedIn.set(name, [])
    failedIn.get(name).push(shape.label)
  }
}

/* 每一種擺法都沒過的那幾則,差的是骨架裡沒有專案內容,不是擺法 ——
   那種在這個專案的自我驗證裡照樣每次都跑得到(npm run test:css)。 */
const inconsistent = [...failedIn].filter(([, labels]) => labels.length !== SHAPES.length)

if (!inconsistent.length) {
  console.log('\n每一種擺法的結果都相同')
  process.exit(0)
}

console.error('\n以下案例的結果會隨專案擺法而不同:')

for (const [name, labels] of inconsistent) {
  console.error(`\n  ${name}`)
  console.error(`    只在這幾種擺法沒通過:${labels.join('、')}`)
}

console.error(
  '\n兩種常見的成因:' +
    '\n  案例沒有指定 rule —— 探針常常同時命中好幾條規則,' +
    '不指定的話,另一種擺法多命中的那一條會被算進期待值裡' +
    '\n  案例內容挑了某一個設定項來造 —— 那一項在別的專案可能是另一種形狀,' +
    '於是在那種專案永遠驗不到東西'
)
process.exit(1)
