#!/usr/bin/env node
// 比對兩份「產物 CSS」的語意差異 —— 重構樣式後用它確認畫面沒有跑版。
//
//   node .tools/css/diff-output.mjs --collect <輸出檔>   # 把 .output 的 CSS 收成一份
//   node .tools/css/diff-output.mjs <舊> <新>            # 比對兩份
//
// 比對的是「每個 (media query, selector) 底下有哪些宣告」——
// 忽略空白、宣告順序、規則出現順序,只看樣式的實質內容。
//
// ⚠️ 為什麼要比產物而不是比原始碼:module 的重構(變數化、合併 @screen、
//    調整巢狀結構)在原始碼上是大改動,但產物往往一個位元組都沒變。
//    反過來,看起來無害的一行也可能讓某個斷點整條宣告失效 ——
//    只有產物看得出來。
//
// 完整流程(⚠️ 第 2 步有個會咬人的坑,見下):
//
//   1. npm run build && node .tools/css/diff-output.mjs --collect /tmp/new.css
//   2. git checkout <基準 commit> -- .        # 取出重構前的原始碼
//      npm run build && node .tools/css/diff-output.mjs --collect /tmp/old.css
//   3. git checkout HEAD -- .                 # 還原
//   4. node .tools/css/diff-output.mjs /tmp/old.css /tmp/new.css
//
// ⚠️ 第 3 步的 `git checkout HEAD -- .` **只會還原 HEAD 裡有的檔案** ——
//    基準 commit 有、而 HEAD 已經刪掉的檔案會留在工作區(而且是 staged 的新增)。
//    還原後一定要看 `git status`:多出來的檔案要自己刪掉。
//    實際踩過:一次比對把 276 支早已刪除的第三方語言檔帶了回來。

import fs from 'node:fs'
import path from 'node:path'

/** 把 .output 底下所有 .css 串成一份 */
const onCollect = (outFile) => {
  const walk = (d, acc = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p, acc)
      else if (e.name.endsWith('.css')) acc.push(p)
    }
    return acc
  }

  if (!fs.existsSync('.output')) {
    console.error('✗ 找不到 .output —— 先跑 npm run build')
    process.exit(1)
  }

  const files = walk('.output')
  const css = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n')
  fs.writeFileSync(outFile, css, 'utf8')
  console.log(`✔ 收集 ${files.length} 個 css 檔、${css.length} 字元 → ${outFile}`)
}

/** 解析成 Map<"media||selector", Set<declaration>> */
const parse = (css) => {
  const rules = new Map()
  const stack = []
  let i = 0

  const readPrelude = () => {
    const start = i
    let depth = 0
    while (i < css.length) {
      const c = css[i]
      if (c === '(') depth++
      else if (c === ')') depth--
      else if (depth === 0 && '{};'.includes(c)) break
      i++
    }
    return css.slice(start, i)
  }

  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) i++
    if (i >= css.length) break

    if (css[i] === '}') {
      i++
      stack.pop()
      continue
    }

    const prelude = readPrelude().trim()
    if (i >= css.length) break
    if (css[i] === ';') {
      i++
      continue // @import / @charset
    }
    i++ // {

    // at-rule(media / supports / layer …)→ 進堆疊,內容繼續解析
    if (
      prelude.startsWith('@') &&
      !/^@(font-face|page|counter-style|property|keyframes)/.test(prelude)
    ) {
      stack.push(prelude.replace(/\s+/g, ' '))
      continue
    }

    // 一般規則:吃到配對的 }
    const bodyStart = i
    let depth = 1
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
      i++
    }
    const body = css.slice(bodyStart, i - 1)
    const media = stack.join(' && ')

    // ⚠️ 選擇器不能直接 split(',') —— class 名裡可能有轉義的逗號
    // (例如 tailwind 的 shadow-[0_2px_4px_rgba(0,0,0,.3)])。只在未轉義處切。
    for (const sel of prelude.split(/(?<!\\),/)) {
      const key = `${media}||${sel.trim().replace(/\s+/g, ' ')}`
      if (!rules.has(key)) rules.set(key, new Set())
      const set = rules.get(key)
      for (const d of body.split(';')) {
        const decl = d.trim().replace(/\s+/g, ' ')
        if (decl) set.add(decl)
      }
    }
  }
  return rules
}

const onDiff = (oldFile, newFile) => {
  const a = parse(fs.readFileSync(oldFile, 'utf8'))
  const b = parse(fs.readFileSync(newFile, 'utf8'))

  const gone = []
  const added = []
  const changed = []

  for (const [k, decls] of a) {
    if (!b.has(k)) {
      gone.push(k)
      continue
    }
    const n = b.get(k)
    const lost = [...decls].filter((d) => !n.has(d))
    const got = [...n].filter((d) => !decls.has(d))
    if (lost.length || got.length) changed.push({ k, lost, got })
  }
  for (const k of b.keys()) if (!a.has(k)) added.push(k)

  console.log(`規則數:${a.size} → ${b.size}`)
  console.log(`消失 ${gone.length} 條 / 新增 ${added.length} 條 / 宣告有變 ${changed.length} 條`)

  const show = (title, list, fmt) => {
    if (!list.length) return
    console.log(`\n── ${title}(${list.length})──`)
    for (const x of list) console.log('  ' + fmt(x))
  }

  show('消失', gone, (k) => k.replace('||', '  ▸  '))
  show('新增', added, (k) => k.replace('||', '  ▸  '))
  show('宣告有變', changed, ({ k, lost, got }) =>
    [
      k.replace('||', '  ▸  '),
      lost.length ? `      − ${lost.join(' | ')}` : '',
      got.length ? `      + ${got.join(' | ')}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  )

  if (!gone.length && !added.length && !changed.length) {
    console.log('\n✔ 產物完全相同 —— 這次重構沒有動到任何樣式。')
    return
  }

  console.log(
    '\n⚠️ 有差異就要逐條確認是不是預期的:' +
      '\n   「寫死值 → 變數」要核對變數的值與原本一致(注意 px 會被轉成 rem);' +
      '\n   「消失」要對得上刻意刪除的 modifier;' +
      '\n   「新增」通常是新變數的定義與斷點對應,不該有意外的樣式宣告。'
  )
}

const args = process.argv.slice(2)

if (args[0] === '--collect') {
  if (!args[1]) {
    console.error('✗ 用法:node .tools/css/diff-output.mjs --collect <輸出檔>')
    process.exit(1)
  }
  onCollect(args[1])
} else if (args.length === 2) {
  onDiff(args[0], args[1])
} else {
  console.error(
    '用法:\n' +
      '  node .tools/css/diff-output.mjs --collect <輸出檔>   # 收集 .output 的 CSS\n' +
      '  node .tools/css/diff-output.mjs <舊> <新>            # 比對兩份'
  )
  process.exit(1)
}
