#!/usr/bin/env node
// 把 git 的 hooksPath 指到本專案的 .githooks/,讓 pre-commit 進版控、跨電腦一致。
// 由 npm run hooks:install 呼叫,postinstall 也會自動跑一次。
//
// hooksPath 的相對路徑是相對 **repo 根**,不是相對專案 —— 所以兩種擺法算出來的值不同:
//
//   a. 開發機:repo 根是 Dev/HouseFun,底下放 Official/ 與 Backstage/ → `Backstage/.githooks`
//   b. 正式站:專案自己就是一個 repo(兩邊的 git 位置不同)         → `.githooks`
//
// ⚠️ a 的情況下 core.hooksPath 是 repo 層級設定、**只能指向一個目錄** ——
//    兩個專案都跑這支的話,**誰最後跑誰生效**。所以兩邊的 .githooks/pre-commit
//    內容要保持一致(各自一份複本),誰生效結果都一樣;被改掉時這裡會印訊息說明。
//
// 不是 git repo、或 git 不可用時安靜跳過 —— 裝不上 hook 不該讓 npm install 失敗。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../..')

const onGit = (args) =>
  execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

try {
  const repoRoot = onGit(['rev-parse', '--show-toplevel'])
  const prefix = path.relative(repoRoot, projectRoot).split(path.sep).filter(Boolean).join('/')
  const hooksDir = prefix ? `${prefix}/.githooks` : '.githooks'

  // hook 本體不在就不要設 —— 設了只會讓 git 找不到 hook 而靜靜什麼都不做
  if (!fs.existsSync(path.join(projectRoot, '.githooks', 'pre-commit'))) {
    console.log(`⚠ 找不到 ${hooksDir}/pre-commit,略過 git hooks 安裝`)
    process.exit(0)
  }

  const current = (() => {
    try {
      return onGit(['config', 'core.hooksPath'])
    } catch {
      return ''
    }
  })()

  if (current === hooksDir) process.exit(0)

  if (current) {
    console.log(
      `⚠ git core.hooksPath 目前是 ${current},改為 ${hooksDir} ——` +
        ' 這個 repo 只能有一份 hook,兩個專案的 pre-commit 內容一致,誰生效結果都一樣'
    )
  }

  onGit(['config', 'core.hooksPath', hooksDir])
  console.log(`✔ git hooks 已指向 ${hooksDir}`)
} catch {
  // 不是 git repo / 沒有 git,安靜結束
}
