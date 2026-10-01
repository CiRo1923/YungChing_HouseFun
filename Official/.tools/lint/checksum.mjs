#!/usr/bin/env node
// 共用規則檔的指紋 —— 產生與比對。
//
//   node .tools/lint/checksum.mjs --write   重新產生(只有來源專案要做)
//   node .tools/lint/checksum.mjs           比對,不符就列出來
//
// 為什麼要這個:規則是每個專案都拿到的同一套。在某個專案改了規則之後,
// 那個專案的檢查結果就與別人不同了 —— 而且改動會在下一次整套更新時被蓋掉,
// 蓋掉的當下沒有人會發現,只知道「本來不報的東西怎麼又開始報了」。
//
// 專案要調整檢查行為時有兩條正當的路,都不必動共用規則:
//    設定值不同        改 project-config.mjs 的值
//    只有這裡要的規範  寫進 rules-project.mjs(代號以 project: 開頭)

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  ACTIONS_DIR_NAME,
  STORE_DIR,
  listFiles,
  readSealedJson,
  toRel,
  writeSealedJson,
} from './shared.mjs'

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')
const dir = path.join(root, '.tools', 'lint')

/** 指紋清單放這裡 —— 跟著規則一起複製到每個專案 */
export const CHECKSUM_FILE = '.tools/lint/.rules-checksum.json'

/**
 * 設定檔 —— 不列入指紋,每個專案的值本來就不一樣。
 */
const CONFIG = 'project-config.mjs'

/**
 * 專案自己的東西:檔名以 `-project.mjs` 結尾的一律不列入指紋。
 *
 * 每個專案除了規則本身之外,還會有只有它要的東西 —— 自己的規則
 * (`rules-project.mjs`)、自己的小工具。那些不在來源裡,列入指紋的話
 * 會被報成「是多出來的」,而那個專案其實一點問題也沒有。
 *
 * 用檔名判斷而不是設定清單:清單交給專案自己填的話,把共用規則填進去
 * 就繞過了整道保護,而從設定看不出那是繞過還是正當的一項。
 * 改名想繞過也不行 —— 原本那支會被報成「被刪掉了」。
 *
 * **產生指紋的這一支自己要列入。** 排除它的話,改掉它就能讓比對永遠通過,
 * 那是一道只有知道的人才找得到的後門,而保護在那之後看起來仍然正常。
 * 列入它不會有循環問題:封存寫的是 json,這支 .mjs 的內容不會因此改變。
 */
const PROJECT_OWN_SUFFIX = '-project.mjs'

/**
 * 這支檔案該不該列入指紋。
 *
 * 對外提供是為了讓自我驗證直接驗這個判斷 —— 那邊自己再寫一次的話,
 * 兩份會有一天對不上,而驗證顯示通過的同時,實際的排除範圍已經變了。
 */
export const isSkipped = (name) => name === CONFIG || name.endsWith(PROJECT_OWN_SUFFIX)

/**
 * 來源共用的**產品程式碼** —— 與規則檔是同一種東西:整支跟著來源。
 *
 * 那幾支是元件在用的共用函式、表單的格式規則,以及共用的那一組狀態與行為。
 * 在某個專案就地加了自己的函式進去**不會報錯**,而下一次整套更新
 * 會把整支覆蓋掉 —— 那幾個函式安靜地消失,使用端變成「某個名字不存在」,
 * 而訊息不會說那是被覆蓋掉的。改了既有函式的行為更難發現:
 * 那個專案的日期、驗證從此與別人不同,而畫面上看不出來。
 *
 * 專案自己的另外開一支,檔名接 `Project`(`_prototypeProject.js`)——
 * 那幾支不列入指紋,與規則檔的 `-project.mjs` 是同一條路。
 *
 * 位置不寫死:這幾支在哪一層由專案的擺法決定,所以用找的。
 */
export const SHARED_SOURCE_FILES = [
  '_prototype.js',
  '_validation.js',
  /* 共用的那一組狀態與行為。每個專案的載入中、斷點都讀它們,
     而三種「關掉載入中」的做法也定義在那裡 —— 各專案挑一種用,
     但那幾支函式本身不各自長一份。

     這兩項寫完整路徑(其餘兩項只寫檔名):`common.js` 是個通用的名字,
     只比檔名的話,專案裡別處一支同名的檔案會被當成它。 */
  `${STORE_DIR}/common.js`,
  `${STORE_DIR}/${ACTIONS_DIR_NAME}/useCommonActions.js`,
]

/**
 * 這個相對路徑是不是清單裡的那一支。
 *
 * 只寫檔名的那幾項比對路徑的結尾(位置隨專案的擺法不同),
 * 寫了路徑的則要整段對上。
 */
const isSharedSource = (rel, item) => rel === item || rel.endsWith(`/${item}`)

/* 指紋清單的 key 是檔名(那幾支在全案唯一,撞名時另外會講出來),
   所以判斷「這個 key 是不是共用的產品程式碼」要拿檔名比對。 */
const SHARED_SOURCE_NAMES = new Set(SHARED_SOURCE_FILES.map((one) => path.basename(one)))

/**
 * 找出這個專案實際有的那幾支,以及同名撞在一起的。
 *
 * 撞名時**不安靜地挑一支** —— 挑到哪一支決定了守的是誰,
 * 而從結果完全看不出來:比對照樣通過,只是守錯了檔案。
 */
export const sharedSourceFiles = () => {
  const found = new Map()
  const clashes = new Map()

  for (const abs of listFiles(root, '.')) {
    const rel = toRel(root, abs)

    if (!SHARED_SOURCE_FILES.some((one) => isSharedSource(rel, one))) continue

    const name = path.basename(abs)

    if (found.has(name)) {
      clashes.set(name, [...(clashes.get(name) ?? [found.get(name)]), abs])
      continue
    }

    found.set(name, abs)
  }

  return { found, clashes }
}

/**
 * 一支檔案的指紋。
 *
 * 換行先正規化成 \n —— 同一份內容在 Windows 與 macOS 取出來的位元組不同,
 * 不正規化的話,光是在另一台機器 checkout 一次就會全部對不上。
 */
const fingerprintOf = (file) =>
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'))
    .digest('hex')
    .slice(0, 16)

/** 現在這些共用規則檔與共用產品程式碼的指紋 */
export const currentFingerprints = () => {
  const rules = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.mjs') && !isSkipped(name))
    .sort()
    .map((name) => [name, fingerprintOf(path.join(dir, name))])

  const shared = [...sharedSourceFiles().found]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, abs]) => [name, fingerprintOf(abs)])

  return Object.fromEntries([...rules, ...shared])
}

/**
 * 跟著來源的檔案有哪幾支(路徑相對專案根)—— 同步時要帶的就是這一份。
 *
 * **不是「那幾層目錄」。** 規範工具那幾層整層跟著來源,而共用的產品程式碼
 * 散在原始碼底下:同一層裡還有這個專案自己的東西(api 定義就在那一層),
 * 整層同步會把專案自己的檔案蓋掉。
 *
 * 同步工具各專案自己寫(它要知道來源在哪、怎麼取),但「要帶哪幾支」
 * 不該由它自己維護一份 —— 那份清單與這裡對不上的時候,
 * 少帶的那幾支每次檢查都被報成「內容被改過」,而那個專案一個字都沒動。
 */
export const trackedFiles = () => {
  const rules = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.mjs') && !isSkipped(name))
    .map((name) => `${path.relative(root, dir).split(path.sep).join('/')}/${name}`)

  const shared = [...sharedSourceFiles().found.values()].map((abs) =>
    path.relative(root, abs).split(path.sep).join('/')
  )

  return [...rules, ...shared].sort()
}

/** 清單裡記的指紋;沒有清單時回 null(那時不比對,見 rules-global 的說明) */
/* 讀取與寫入走共用的那一份 —— 兩種封存清單(這一份指紋、元件介面的名單)
   對「檔案不在或壞掉時怎麼辦」的答案必須一樣:一律不比對。
   各寫一次的話,其中一邊改了做法,另一邊還是舊的。 */
export const recordedFingerprints = () => readSealedJson(root, CHECKSUM_FILE)

/** 對不上的那幾支:改過的、多出來的、少掉的 */
export const fingerprintDiff = () => {
  const recorded = recordedFingerprints()
  if (!recorded) return []

  const current = currentFingerprints()
  const names = [...new Set([...Object.keys(recorded), ...Object.keys(current)])].sort()

  return (
    names
      .filter((name) => recorded[name] !== current[name])
      /* 共用的產品程式碼**不是每個專案都要有**(沒有表單的專案就沒有那一支),
         所以那幾支「這裡沒有」不算少掉 —— 報的話那種專案每次都看到一筆,
         而他們一點問題也沒有。規則檔少一支則是真的有問題:那條規則被拿掉了。 */
      .filter((name) => !(SHARED_SOURCE_NAMES.has(name) && !current[name]))
      .map((name) => ({
        name,
        state: !current[name] ? '被刪掉了' : !recorded[name] ? '是多出來的' : '內容被改過',
      }))
  )
}

/* 只有「直接執行這一支」才動指紋清單。
   少了這個判斷的話,任何帶 --write 的指令(例如色票排序)只要 import 了這支,
   就會順手把現在的內容封存起來 —— 被改過的共用規則因此被蓋章,
   下一次比對當然一致,而保護就這樣安靜地失效了。 */
const isMain = process.argv[1]?.endsWith('checksum.mjs')

/* 同名撞在一起時一律講出來 —— 封存與比對都講。
   只在其中一邊講的話,封存時守的是 A、比對時守的是 B,而兩邊都顯示正常。 */
if (isMain) {
  for (const [name, list] of sharedSourceFiles().clashes) {
    console.error(`找到不只一支 ${name},指紋只守得了其中一支:`)
    for (const abs of list) console.error(`  ${path.relative(root, abs)}`)
  }
}

if (isMain && process.argv.includes('--list')) {
  const files = trackedFiles()

  console.log(`跟著來源的檔案共 ${files.length} 支 —— 同步時要帶的就是這幾支:`)
  for (const one of files) console.log(`  ${one}`)
  console.log('\n這份清單以外的檔案歸這個專案所有,同步不要碰它們。')
} else if (isMain && process.argv.includes('--write')) {
  const sealed = currentFingerprints()
  const shared = Object.keys(sealed).filter((name) => SHARED_SOURCE_NAMES.has(name))

  writeSealedJson(root, CHECKSUM_FILE, sealed)

  /* 兩類分開數 —— 合成一個數字的話,共用程式碼有沒有被收進來看不出來,
     而那幾支正是「少收了也不會有任何徵兆」的那一種。 */
  console.log(
    `已更新 ${CHECKSUM_FILE}(${Object.keys(sealed).length - shared.length} 支規則檔、${shared.length} 支共用程式碼)`
  )
} else if (isMain) {
  const diff = fingerprintDiff()

  /* 沒有清單與比對通過是兩件事,訊息要分得開 —— 都說「一致」的話,
     還沒封存過的專案會以為保護已經生效,而它其實一支都沒比對。 */
  if (!recordedFingerprints()) {
    console.log(`還沒有指紋清單(${CHECKSUM_FILE}),這次沒有比對任何一支規則檔。`)
    console.log('清單由規範工具的來源跑 npm run rules:seal 產生,跟著規則一起複製過來。')
  } else if (!diff.length) {
    console.log('共用規則檔與指紋清單一致')
  } else {
    console.error('以下共用規則檔與指紋清單對不上:')
    for (const d of diff) console.error(`  ${d.name} ${d.state}`)
    process.exit(1)
  }
}
