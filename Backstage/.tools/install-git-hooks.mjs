#!/usr/bin/env node
// 把 git 的 hooksPath 指到本專案的 .githooks/,讓 pre-commit 進版控、跨電腦一致。
// 由 npm run hooks:install 呼叫,postinstall 也會自動跑一次。
//
// hooksPath 的相對路徑是相對 repo 根,不是相對專案 —— 專案位於 repo 底下的子目錄時
// 算出來的值會帶前綴。
//
// core.hooksPath 是 repo 層級設定、只能指向一個目錄。一個 repo 底下放多個專案時,
//    誰最後跑誰生效 —— 那種情況要讓各專案的 .githooks/pre-commit 內容保持一致。
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
    console.log(`⚠ git core.hooksPath 目前是 ${current},改為 ${hooksDir}`)
  }

  onGit(['config', 'core.hooksPath', hooksDir])
  console.log(`✔ git hooks 已指向 ${hooksDir}`)
} catch {
  // 不是 git repo / 沒有 git,安靜結束
}
