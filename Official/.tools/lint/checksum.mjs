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

const root = path.resolve(fileURLToPath(import.meta.url), '../../..')
const dir = path.join(root, '.tools', 'lint')

/** 指紋清單放這裡 —— 跟著規則一起複製到每個專案 */
export const CHECKSUM_FILE = '.tools/lint/.rules-checksum.json'

/**
 * 不列入指紋的檔案 —— 只有這兩支,其餘(含這支自己)全部列入。
 *
 *   project-config.mjs  設定,每個專案的值本來就不一樣
 *   rules-project.mjs   專案自己的規則,本來就只有這個專案有
 *
 * **產生指紋的這一支自己也要列入。** 排除它的話,改掉它就能讓比對永遠通過 ——
 * 那等於留一道只有知道的人才找得到的後門,而保護在那之後看起來仍然正常。
 * 列入它不會有循環問題:封存寫的是 json,這支 .mjs 的內容不會因此改變。
 */
const SKIP = new Set(['project-config.mjs', 'rules-project.mjs'])

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

/** 現在這些共用規則檔的指紋 */
export const currentFingerprints = () =>
  Object.fromEntries(
    fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.mjs') && !SKIP.has(name))
      .sort()
      .map((name) => [name, fingerprintOf(path.join(dir, name))])
  )

/** 清單裡記的指紋;沒有清單時回 null(那時不比對,見 rules-global 的說明) */
export const recordedFingerprints = () => {
  const file = path.join(root, ...CHECKSUM_FILE.split('/'))
  if (!fs.existsSync(file)) return null

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null // 清單壞掉等同沒有 —— 寧可不比對,也不要每一支檔案都報一次
  }
}

/** 對不上的那幾支:改過的、多出來的、少掉的 */
export const fingerprintDiff = () => {
  const recorded = recordedFingerprints()
  if (!recorded) return []

  const current = currentFingerprints()
  const names = [...new Set([...Object.keys(recorded), ...Object.keys(current)])].sort()

  return names
    .filter((name) => recorded[name] !== current[name])
    .map((name) => ({
      name,
      state: !current[name] ? '被刪掉了' : !recorded[name] ? '是多出來的' : '內容被改過',
    }))
}

if (process.argv.includes('--write')) {
  const file = path.join(root, ...CHECKSUM_FILE.split('/'))
  fs.writeFileSync(file, `${JSON.stringify(currentFingerprints(), null, 2)}\n`, 'utf8')
  console.log(`已更新 ${CHECKSUM_FILE}(${Object.keys(currentFingerprints()).length} 支規則檔)`)
} else if (process.argv[1]?.endsWith('checksum.mjs')) {
  const diff = fingerprintDiff()

  if (!diff.length) {
    console.log('共用規則檔與指紋清單一致')
  } else {
    console.error('以下共用規則檔與指紋清單對不上:')
    for (const d of diff) console.error(`  ${d.name} ${d.state}`)
    process.exit(1)
  }
}
