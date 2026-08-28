#!/usr/bin/env node
// 把 git 的 hooksPath 指到 repo 根的 .githooks/,讓 pre-commit 進版控、跨電腦一致。
// 由 npm run hooks:install 呼叫,postinstall 也會自動跑一次。
//
// ⚠️ 這個 repo 同時放 Official 與 Backstage,而 core.hooksPath 是 repo 層級的設定,
//    只能指向一個目錄 —— 所以 hook 收在 repo 根共用一份,由它依 staged 路徑分派給
//    各專案的 .tools/css/。兩邊都執行這支不會互相覆蓋,設的是同一個值。
//
// 不是 git repo、或 git 不可用時安靜跳過 —— 裝不上 hook 不該讓 npm install 失敗。

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(fileURLToPath(import.meta.url), '../..')

const HOOKS_DIR = '.githooks' // 相對 repo 根 —— hooksPath 的相對路徑就是相對 repo 根

const onGit = (args) =>
  execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

try {
  const repoRoot = onGit(['rev-parse', '--show-toplevel'])

  // hook 本體不在就不要設 —— 設了只會讓 git 找不到 hook 而靜靜什麼都不做
  if (!fs.existsSync(path.join(repoRoot, HOOKS_DIR, 'pre-commit'))) {
    console.log(`⚠ 找不到 ${HOOKS_DIR}/pre-commit,略過 git hooks 安裝`)
    process.exit(0)
  }

  const current = (() => {
    try {
      return onGit(['config', 'core.hooksPath'])
    } catch {
      return ''
    }
  })()

  if (current === HOOKS_DIR) process.exit(0)

  if (current) {
    console.log(`⚠ git core.hooksPath 目前是 ${current},將改為 ${HOOKS_DIR}(repo 根共用一份)`)
  }

  onGit(['config', 'core.hooksPath', HOOKS_DIR])
  console.log(`✔ git hooks 已指向 ${HOOKS_DIR}`)
} catch {
  // 不是 git repo / 沒有 git,安靜結束
}
