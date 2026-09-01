#!/usr/bin/env node
// 移除 CSS 檔裡「空的規則區塊」—— 給 hook 與存檔守門呼叫。
//
//   node .tools/css/clean-empty-rules.mjs <檔案>
//
// 空區塊(`.foo {}` / `@screen m {}`)在產物裡不會有任何輸出,留著只有壞處:
// 讀的人以為樣式被誤刪、或把 `@screen m {}` 讀成「手機刻意不設定」。
//
// ⚠️ 只刪「大括號內完全空白」的 —— 帶註解的區塊不算空,那是有意留的位置。
//
// 有改動回 exit 0 並印出檔名;沒有可刪的也回 0(靜默)。判斷邏輯共用 lint-core,
// 檢查與自動修正才不會分岔。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { onRemoveEmptyRules } from './lint-core.mjs'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../../..')
const target = process.argv[2]

if (!target) process.exit(0)

const abs = path.resolve(projectRoot, target)
const rel = path.relative(projectRoot, abs).split(path.sep).join('/')

if (rel.startsWith('..') || !/\.(css|vue)$/.test(rel) || !fs.existsSync(abs)) process.exit(0)

try {
  const original = fs.readFileSync(abs, 'utf8')
  const cleaned = onRemoveEmptyRules(original, { isVue: rel.endsWith('.vue') })
  if (cleaned) {
    fs.writeFileSync(abs, cleaned, 'utf8')
    console.log(rel)
  }
} catch {
  // 工具自己壞掉不要擋住寫檔
}

process.exit(0)
