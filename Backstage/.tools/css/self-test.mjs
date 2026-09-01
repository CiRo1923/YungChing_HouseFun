#!/usr/bin/env node
// 規則自我驗證 —— 確認每條檢查「真的抓得到違規」,而且「不會誤報合法寫法」。
//
//   npm run test:css
//
// ⚠️ 為什麼需要這個:`npm run lint:css` 通過只代表「現在的程式碼沒有違規」,
//    不代表「規則還有效」。改壞一條 regex 之後全案照樣通過 —— 那條規則從此靜靜失效,
//    等到有人寫出違規才發現,而那時已經散了一堆。
//    這支反過來測工具本身:餵違規進去必須被抓、餵合法寫法進去必須放行。
//
// 走的是 lintFile 的完整路徑(而不是直接呼叫各個 check),所以連「哪個路徑跑哪些檢查」
// 的分派邏輯也一起驗到 —— 例如 docs 底下不檢查、pages 不跑 module 那組。
//
// ⚠️ 探測檔會**實際寫進專案目錄**(檢查依路徑前綴決定要不要跑,不能寫在別處)。
//    每次執行前會先清掉前一次的殘骸,結束時(含中途丟例外)一定會刪除。
//    萬一還是留下了,整個 PROBE_DIR 直接刪掉即可,那裡沒有任何真實程式碼。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadDefinedColorVars } from './color-order.mjs'
import { lintFile } from './lint-core.mjs'
import { BOLD, DIM, GREEN, RED, RESET, YELLOW } from './colors.mjs'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../../..')
const definedVars = loadDefinedColorVars(projectRoot)

/** 探測檔放這裡 —— 名字取得夠特別,誤留下來也一眼看得出是什麼 */
const PROBE_DIRS = [
  'assets/css/_modules/__css-self-test__',
  'components/__css-self-test__',
  'docs/__css-self-test__',
]
const PROBE_VUE = 'pages/__css-self-test__.vue'

/**
 * 每個案例:
 *   file     探測檔的相對路徑(決定哪些檢查會跑)
 *   code     檔案內容
 *   expect   預期抓到幾筆(精確);或 expectMin 至少幾筆
 *   keyword  訊息裡必須出現的關鍵字 —— 確認抓到的是「這條」而不是碰巧被別條抓到
 *
 * ⚠️ CSS 變數一律寫成**多行**:checkModuleVariables 是逐行解析的,
 *    一行擠多個宣告(`:root { --a: 1px; --b: 2px; }`)它抓不到 ——
 *    實務上 prettier 會強制多行,但測試自己寫錯格式會誤判成「規則失效」。
 */
const M = 'assets/css/_modules/__css-self-test__'
const C = 'components/__css-self-test__'

const CASES = [
  // ---------- 規則 1:顏色 ----------
  {
    name: '規則 1 寫死色碼',
    file: `${M}/a.css`,
    code: `.m-probe { @apply text-[#333]; }`,
    expect: 1,
    keyword: '色碼',
  },
  {
    name: '規則 1 rgba 字面值',
    file: `${M}/a.css`,
    code: `.m-probe { background: rgba(0, 0, 0, 0.5); }`,
    expect: 1,
    keyword: 'rgba',
  },
  {
    name: '規則 1 tailwind 內建色票',
    file: `${M}/a.css`,
    code: `.m-probe { @apply text-red-500; }`,
    expect: 1,
    keyword: 'tailwind',
  },
  {
    name: '規則 1 取用未定義的色票變數',
    file: `${M}/a.css`,
    code: `.m-probe { @apply text-[--blue-does-not-exist]; }`,
    expect: 1,
    keyword: '未定義',
  },
  {
    name: '規則 1 hexToRgb 呼叫端',
    file: `${M}/a.css`,
    code: `:root {\n  --x: hexToRgb(#fff);\n}\n`,
    expectMin: 1,
    keyword: 'hexToRgb',
  },

  // ---------- 規則 2:components 的 template ----------
  {
    name: '規則 2 template 用 tailwind',
    file: `${C}/A.vue`,
    code: `<template>\n  <div class="flex items-center gap-x-[8px]">x</div>\n</template>\n`,
    expectMin: 1,
    keyword: 'tailwind',
  },
  {
    name: '規則 2 狀態用 is- 裸前綴',
    file: `${C}/A.vue`,
    code: `<template>\n  <div class="m-probe" :class="{ 'is-active': x }">y</div>\n</template>\n`,
    expectMin: 1,
    keyword: '--',
  },

  // ---------- 規則 3:tailwind 寫法陷阱 ----------
  {
    name: '規則 3 border-width 用 @apply',
    file: `${M}/a.css`,
    code: `.m-probe { @apply border-[--probe-border]; }`,
    expect: 1,
    keyword: 'border',
  },
  {
    name: '規則 3 shadow 單一 token',
    file: `${M}/a.css`,
    code: `.m-probe { @apply shadow-[--probe-shadow]; }`,
    expect: 1,
    keyword: 'shadow color',
  },
  {
    name: '規則 3 字級漏了 length:',
    file: `${M}/a.css`,
    code: `.m-probe { @apply text-[--probe-text-size]; }`,
    expect: 1,
    keyword: 'length',
  },

  // ---------- 規則 4:變數 ----------
  {
    name: '規則 4 命名用 -width',
    file: `${M}/variables.css`,
    code: `:root {\n  /* lint-same-value: 只驗命名 */\n  --probe-width: 10px;\n}\n`,
    expectMin: 1,
    keyword: '命名',
  },
  {
    name: '規則 4 尺寸單值沒拆也沒標',
    file: `${M}/variables.css`,
    code: `:root {\n  --probe-p: 12px;\n}\n`,
    expect: 1,
    keyword: '尺寸類單值',
  },
  {
    name: '規則 4 斷點不成套(缺 mobile)',
    file: `${M}/variables.css`,
    code: `:root {\n  --probe-pc-gap-x: 8px;\n  --probe-tablet-gap-x: 8px;\n}\n`,
    expectMin: 1,
    keyword: 'mobile',
  },
  {
    name: '規則 4 版型檔直接吃 -pc- 變數',
    file: `${M}/common.css`,
    code: `.m-probe { @apply p-[--probe-pc-p]; }`,
    expectMin: 1,
    keyword: 'pc',
  },
  {
    name: '規則 4 variables 檔寫了版型',
    file: `${M}/variables.css`,
    code: `.m-probe { @apply flex items-center; }`,
    expectMin: 1,
    keyword: 'variables',
  },
  {
    name: '規則 4 版型檔寫死常值',
    file: `${M}/common.css`,
    code: `.m-probe { --probe-px: 12px; }`,
    expectMin: 1,
    keyword: 'var',
  },
  {
    name: '規則 4 名實不符(-w 套在 h 上)',
    file: `${M}/common.css`,
    code: `.m-probe { @apply h-[--probe-w]; }`,
    expectMin: 1,
    keyword: 'h-',
  },
  {
    name: '規則 4 100% 繞變數',
    file: `${M}/variables.css`,
    code: `:root {\n  --probe-w: 100%;\n}\n`,
    expect: 1,
    keyword: 'full',
  },

  // ---------- @screen 分組 ----------
  {
    name: '@screen 頂層重複',
    file: `${M}/common.css`,
    code: `@screen p {\n  .m-probe {\n    --probe-a: var(--probe-pc-a);\n  }\n}\n\n@screen p {\n  .m-probe-b {\n    @apply flex;\n  }\n}\n`,
    expectMin: 1,
    keyword: '第二次',
  },
  {
    name: '@screen 巢狀重複',
    file: `${M}/common.css`,
    code: `.m-a {\n  @screen p {\n    @apply flex;\n  }\n}\n\n.m-b {\n  @screen p {\n    @apply block;\n  }\n}\n`,
    expectMin: 1,
    keyword: '第二次',
  },

  // ---------- 不開變數的那幾個 ----------
  {
    name: 'tracking 開變數',
    file: `${M}/variables.css`,
    code: `:root {\n  --probe-tracking: 0.06em;\n}\n`,
    expectMin: 1,
    keyword: '字距',
  },
  {
    name: 'leading 開變數',
    file: `${M}/variables.css`,
    code: `:root {\n  --probe-leading: 1.5;\n}\n`,
    expectMin: 1,
    keyword: '行高',
  },
  {
    name: 'z-index 開變數',
    file: `${M}/variables.css`,
    code: `:root {\n  --probe-z: 3;\n}\n`,
    expectMin: 1,
    keyword: 'z-index',
  },
  {
    name: 'z-index 無前綴變數',
    file: `${M}/variables.css`,
    code: `:root {\n  --z-index: 5;\n}\n`,
    expectMin: 1,
    keyword: 'z-index',
  },

  // ---------- 顏色 base ----------
  {
    name: '顏色 base 用 initial',
    file: `${M}/variables.css`,
    code: `:root {\n  --probe-color: initial;\n}\n`,
    expect: 1,
    keyword: 'inherit',
  },
  {
    name: '背景 base 用 initial',
    file: `${M}/variables.css`,
    code: `:root {\n  --probe-bg-color: initial;\n}\n`,
    expect: 1,
    keyword: 'transparent',
  },

  // ---------- 規則 6:theme 覆寫掉而不存在的 class ----------
  {
    name: '規則 6 不存在的斷點前綴',
    file: `${M}/common.css`,
    code: `.m-probe { @apply md:flex; }`,
    expect: 1,
    keyword: '斷點前綴',
  },
  {
    name: '規則 6 不存在的字級',
    file: `${M}/common.css`,
    code: `.m-probe { @apply text-sm; }`,
    expect: 1,
    keyword: '字級',
  },
  {
    name: '規則 6 不存在的陰影',
    file: `${M}/common.css`,
    code: `.m-probe { @apply shadow-md; }`,
    expect: 1,
    keyword: 'shadow',
  },
  {
    name: '規則 6 不存在的字族',
    file: `${M}/common.css`,
    code: `.m-probe { @apply font-sans; }`,
    expect: 1,
    keyword: '字族',
  },
  {
    name: '規則 6 已淘汰的 hexa',
    file: `${M}/common.css`,
    code: `.m-probe { @apply bg-hexa-[--black,0.7]; }`,
    expectMin: 1,
    keyword: '淘汰',
  },
  {
    name: '規則 6 transition 單數',
    file: `${M}/common.css`,
    code: `.m-probe { @apply transition-width; }`,
    expect: 1,
    keyword: '複數',
  },

  // ---------- 空區塊 ----------
  {
    name: '空的規則區塊',
    file: `${M}/common.css`,
    code: `.m-probe {\n}\n`,
    expect: 1,
    keyword: '空的規則',
  },
  {
    name: '空的 style 區塊(.vue)',
    file: PROBE_VUE,
    code: `<template>\n  <p>x</p>\n</template>\n\n<style lang="postcss"></style>\n`,
    expectMin: 1,
    keyword: '空的 <style>',
  },

  // ---------- line-clamp ----------
  {
    name: 'module 寫 line-clamp',
    file: `${M}/common.css`,
    code: `.m-probe { @apply line-clamp-2; }`,
    expect: 1,
    keyword: '使用位置',
  },
  {
    name: 'module 寫 truncate',
    file: `${M}/common.css`,
    code: `.m-probe { @apply truncate; }`,
    expectMin: 1,
    keyword: 'line-clamp-1',
  },

  // ---------- 規則 5:import 順序 ----------
  {
    name: '規則 5 import 順序顛倒',
    file: `${C}/B.vue`,
    code: `<script setup>\nimport { ref } from 'vue'\n\nimport '@css/_modules/common/mProbe/common.css'\n</script>\n`,
    expectMin: 1,
    keyword: '順序',
  },

  // ================= 合法寫法:一筆都不該報 =================
  {
    name: '✓ 完整值的 shadow arbitrary value',
    file: `${M}/common.css`,
    code: `.m-probe { @apply shadow-[0_2px_4px_var(--black-33)]; }`,
    expect: 0,
  },
  {
    name: '✓ 標了 lint-same-value 的單值',
    file: `${M}/variables.css`,
    code: `:root {\n  /* lint-same-value: 三端同值,已與設計確認 */\n  --probe-border: 1px;\n}\n`,
    expect: 0,
  },
  {
    name: '✓ 標了 lint-screen-group-exempt 的第二段',
    file: `${M}/common.css`,
    code: `@screen m {\n  .m-a {\n    @apply flex;\n  }\n}\n\n/* lint-screen-group-exempt: 變數與版型分開寫 */\n@screen m {\n  .m-b {\n    @apply block;\n  }\n}\n`,
    expect: 0,
  },
  {
    name: '✓ 帶註解的區塊不算空',
    file: `${M}/common.css`,
    code: `.m-probe {\n  /* 之後補手機版 */\n}\n`,
    expect: 0,
  },
  {
    name: '✓ pages 寫 line-clamp',
    file: PROBE_VUE,
    code: `<template>\n  <p class="line-clamp-1">x</p>\n</template>\n`,
    expect: 0,
  },
  {
    name: '✓ @screen p 內直接吃 -pc-',
    file: `${M}/common.css`,
    code: `@screen p {\n  .m-probe {\n    @apply max-w-[--probe-pc-max-w];\n  }\n}\n`,
    expect: 0,
  },
  {
    name: '✓ 顏色 base 用 inherit / transparent',
    file: `${M}/variables.css`,
    code: `:root {\n  --probe-color: inherit;\n  --probe-bg-color: transparent;\n}\n`,
    expect: 0,
  },
  {
    name: '✓ 文件路徑不檢查',
    file: 'docs/__css-self-test__/a.css',
    code: `.doc { color: #333; background: rgba(0, 0, 0, 0.5); }`,
    expect: 0,
  },
]

/** 清掉探測檔與(空的)探測目錄 —— 開頭與結束都會呼叫 */
const onCleanup = () => {
  fs.rmSync(path.join(projectRoot, PROBE_VUE), { force: true })
  for (const d of PROBE_DIRS) {
    fs.rmSync(path.join(projectRoot, d), { recursive: true, force: true })
  }
}

let pass = 0
const fails = []

onCleanup() // 先清前一次的殘骸

try {
  for (const c of CASES) {
    const abs = path.join(projectRoot, c.file)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, c.code, 'utf8')

    let issues = []
    try {
      issues = lintFile(projectRoot, abs, definedVars)
    } catch (err) {
      fails.push(`${c.name}\n      工具丟出例外:${err.message}`)
      continue
    } finally {
      fs.rmSync(abs, { force: true })
    }

    const n = issues.length
    const okCount = c.expect !== undefined ? n === c.expect : n >= (c.expectMin ?? 1)
    const okWord = !c.keyword || issues.some((i) => i.detail.includes(c.keyword))

    if (okCount && okWord) {
      pass++
      continue
    }

    fails.push(
      `${c.name}\n      抓到 ${n} 筆` +
        (c.expect !== undefined ? `(預期 ${c.expect})` : `(預期至少 ${c.expectMin ?? 1})`) +
        (c.keyword && !okWord ? `,訊息不含「${c.keyword}」` : '') +
        (n ? `\n      實際:${issues.map((i) => i.detail.slice(0, 72)).join('\n            ')}` : '')
    )
  }
} finally {
  onCleanup()
}

console.log('')
if (!fails.length) {
  console.log(`${GREEN}✔ 規則自我驗證通過(${pass} / ${CASES.length})${RESET}`)
  console.log(`${DIM}   每條規則都確實抓得到違規,合法寫法也沒有誤報。${RESET}`)
  process.exit(0)
}

console.error(`${RED}${BOLD}⛔ 規則自我驗證失敗(${pass} / ${CASES.length} 通過)${RESET}`)
console.error('')
for (const f of fails) console.error(`  ${RED}✗${RESET} ${f}\n`)
console.error(
  `${YELLOW}這代表「規則本身」壞了,不是程式碼有問題 —— ` +
    `改過 .tools/css/lint-core.mjs 之後最容易發生。${RESET}`
)
process.exit(1)
