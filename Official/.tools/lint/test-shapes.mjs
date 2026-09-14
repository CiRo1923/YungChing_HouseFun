#!/usr/bin/env node
// 驗證「同一份案例在不同的專案擺法下結果相同」。
//
//   npm run test:shapes
//
// 為什麼需要這個:規則的驗證案例會寫出探測檔,而探測檔放在哪一層是固定的 ——
// 樣式設定檔的探測檔必須放專案根(規則就是去那裡找設定,放別處驗不到)。
//
// 問題是「專案根」在不同專案代表不同意思:
//
//   有 src 那一層     專案根不是原始碼,探測檔不會被原始碼那幾條規則掃到
//   原始碼放專案根    專案根就是原始碼,探測檔會被一起掃
//
// 後者的案例會多報幾筆,而那幾筆與案例要驗的規則無關。
// **來源專案只有一種擺法,所以自己跑永遠不會遇到** —— 要到另一個專案
// 複製過去跑起來才會發現,而那時看到的是「規則好像壞了」。
//
// 這支把兩種擺法各跑一次,比對結果是不是一樣。不一樣的那幾則,
// 多半是案例沒有指定 `rule`(只計自己那一條),於是探針多命中的規則被算進去了。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const configFile = path.join(here, 'project-config.mjs')
const selfTest = path.join(here, 'self-test.mjs')

/**
 * 要試的幾種擺法 —— 值是 SRC_DIR 會被換成什麼。
 *
 * 空字串與 `.` 都代表「原始碼放在專案根」,兩種寫法都有專案在用,
 * 而規則是用同一個判斷認出它們的,所以試一種就夠。
 */
const SHAPES = [
  { label: '原始碼放在 src 底下', srcDir: 'src' },
  { label: '原始碼放在專案根', srcDir: '' },
]

const SRC_DIR_RE = /^export const SRC_DIR = .*$/m

/**
 * 驗證輸出裡代表「沒通過」的那個記號。
 *
 * 寫成跳脫碼而不是字元本身 —— 這裡要的是一個用來比對的值,
 * 不是要印出去的狀態記號,寫成字元會讓人以為這支檔案自己在印它。
 */
const FAIL_MARK = '\u2717'

const original = fs.readFileSync(configFile, 'utf8')

if (!SRC_DIR_RE.test(original)) {
  console.error('找不到 SRC_DIR 的那一行,無法切換擺法。')
  process.exit(1)
}

/** 跑一次驗證,回傳沒通過的案例名稱 */
const failuresOf = (srcDir) => {
  fs.writeFileSync(configFile, original.replace(SRC_DIR_RE, `export const SRC_DIR = '${srcDir}'`), 'utf8')

  let out = ''
  try {
    out = execFileSync(process.execPath, [selfTest], { cwd: root, encoding: 'utf8' })
  } catch (err) {
    // 有案例沒通過時會以非零結束,輸出仍然要拿來比對
    out = `${err.stdout ?? ''}${err.stderr ?? ''}`
  }

  /* 取記號之後的那一段當案例名稱。
     終端機的顏色碼不特別清掉 —— 兩次執行的顏色完全一樣,比對不受影響,
     而為了清它去比對控制字元,反而讓這支檔案多一段看不見的東西。 */
  return out
    .split('\n')
    .filter((line) => line.includes(FAIL_MARK))
    .map((line) => line.slice(line.indexOf(FAIL_MARK) + FAIL_MARK.length).trim())
    .filter(Boolean)
}

const results = new Map()

try {
  for (const shape of SHAPES) results.set(shape.label, failuresOf(shape.srcDir))
} finally {
  /* 一定要把設定放回去 —— 中途失敗而留下被改過的設定的話,
     之後每一次檢查都在錯的範圍上跑,而看的人不知道為什麼。 */
  fs.writeFileSync(configFile, original, 'utf8')

  if (fs.readFileSync(configFile, 'utf8') !== original) {
    console.error('設定檔還原失敗 —— 請用版本控制檢查專案設定檔')
    process.exit(1)
  }
}

/* 指紋那一則不列入比對:切換擺法會改寫設定檔,而設定檔不列入指紋,
   所以它在兩種擺法的結果本來就相同 —— 列進來只會讓訊息多一筆雜訊。
   真正要看的是「哪幾則只在某一種擺法失敗」。 */
const isShapeIssue = (name) => !name.includes('指紋')

const [first, second] = SHAPES.map((s) => results.get(s.label).filter(isShapeIssue))
const onlyIn = (a, b) => a.filter((name) => !b.includes(name))

const extra = [
  { shape: SHAPES[0].label, names: onlyIn(first, second) },
  { shape: SHAPES[1].label, names: onlyIn(second, first) },
].filter((x) => x.names.length)

for (const shape of SHAPES) {
  const failed = results.get(shape.label).filter(isShapeIssue)
  console.log(`${shape.label}:${failed.length ? `${failed.length} 則沒通過` : '全部通過'}`)
}

if (!extra.length) {
  console.log('\n兩種擺法的結果相同')
  process.exit(0)
}

console.error('\n以下案例的結果會隨專案擺法而不同:')

for (const { shape, names } of extra) {
  console.error(`\n  只在「${shape}」沒通過:`)
  for (const name of names) console.error(`    ${name}`)
}

console.error(
  '\n多半是案例沒有指定 rule —— 探針常常同時命中好幾條規則,' +
    '\n不指定的話,另一種擺法多命中的那一條會被算進期待值裡。'
)
process.exit(1)
