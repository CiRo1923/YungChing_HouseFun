// build / deploy 成功後,把專案原始碼同步到 Public 側的發布 repo,並留一份 zip 備份。
//
// 路徑不寫死:從目前專案往上找路徑中的 `Dev` 段,換成 `Public`,其餘結構原樣保留。
//   D:/任意路徑/YungChing/Dev/HouseFun/Official
//   → D:/任意路徑/YungChing/Public/HouseFun/Official
// 每台電腦的前綴不同也能對得上。
//
// 壓縮用 PowerShell 內建的 Compress-Archive,不依賴 7-Zip / WinRAR
// (兩者在不同電腦上未必都裝,裝的也未必是同一套)。

import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

// 不同步、也不打包的項目:工具設定、文件、建置產物、依賴、以及先前產生的壓縮檔
const EXCLUDE_NAMES = new Set([
  '.claude',
  'docs',
  '.nuxt',
  '.output',
  '.nitro',
  '.data',
  '.cache',
  'node_modules',
  'dist',
])
const EXCLUDE_EXTENSIONS = new Set(['.zip'])

// 目標端獨有、同步時絕對不能碰的項目(否則會毀掉對方的版控與依賴)
const TARGET_KEEP_NAMES = new Set(['.git', 'node_modules'])

const DEV_SEGMENT = 'Dev'
const PUBLIC_SEGMENT = 'Public'

const projectDir = process.cwd()
const projectName = path.basename(projectDir)
// staging 必須放在專案「外面」:fs.cp 不允許目的地是來源的子目錄(EINVAL),
// 放在 .cache 底下會直接失敗。用系統暫存目錄,pid 避免同時跑兩個專案時互相蓋掉。
const stagingDir = path.join(os.tmpdir(), `sync-to-public-${projectName}-${process.pid}`)

function isExcluded(name) {
  return EXCLUDE_NAMES.has(name) || EXCLUDE_EXTENSIONS.has(path.extname(name).toLowerCase())
}

// 把 Dev 換成 Public。取「最後一個」相符的段:路徑前綴若剛好也有同名資料夾,
// 要換掉的是離專案最近的那一個。
function resolveTargetDir() {
  const segments = projectDir.split(path.sep)
  const devIndex = segments.lastIndexOf(DEV_SEGMENT)

  if (devIndex === -1) return null

  segments[devIndex] = PUBLIC_SEGMENT

  return segments.join(path.sep)
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    child.on('error', (error) => resolve({ code: 1, stdout, stderr: error.message }))
    child.on('exit', (code) => resolve({ code: code ?? 1, stdout: stdout.trim(), stderr }))
  })
}

async function getBranch(cwd) {
  const { code, stdout } = await runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd })

  return code === 0 ? stdout : null
}

// 依排除規則複製整棵目錄。cp 的 filter 是逐項呼叫,回傳 false 該項連同子孫都不複製。
async function copyFiltered(source, destination) {
  await cp(source, destination, {
    recursive: true,
    filter: (src) => !isExcluded(path.basename(src)),
  })
}

// 刪掉目標端「來源已經沒有」的項目,否則改名 / 刪除過的檔案會一直殘留。
// .git 與 node_modules 一律保留 —— 那是目標端自己的東西。
async function removeStaleEntries(targetDir, sourceDir) {
  const targetEntries = await readdir(targetDir).catch(() => [])
  const sourceEntries = new Set(await readdir(sourceDir).catch(() => []))
  const removed = []

  for (const name of targetEntries) {
    if (TARGET_KEEP_NAMES.has(name) || sourceEntries.has(name)) continue

    await rm(path.join(targetDir, name), { recursive: true, force: true })
    removed.push(name)
  }

  return removed
}

// 用 .NET 的 ZipFile 而不是 Compress-Archive:後者以 `目錄\*` 當來源時只收頂層項目,
// 子目錄不會遞迴進去(實測 pages/ 整個消失)。CreateFromDirectory 會完整遞迴,
// 且壓縮檔內不多包一層目錄名。兩者都是系統內建,不需要 7-Zip / WinRAR。
async function createArchive(zipPath) {
  await rm(zipPath, { force: true })

  const { code, stderr } = await runCommand('powershell', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    [
      'Add-Type -AssemblyName System.IO.Compression.FileSystem;',
      `[System.IO.Compression.ZipFile]::CreateFromDirectory('${stagingDir}', '${zipPath}')`,
    ].join(' '),
  ])

  if (code !== 0) throw new Error(`壓縮失敗:${stderr.trim() || '未知錯誤'}`)
}

function formatTimestamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
  ].join('')
}

async function main() {
  const targetDir = resolveTargetDir()

  if (!targetDir) {
    console.error(`[sync-to-public] 中止:路徑中找不到 \`${DEV_SEGMENT}\` 這一段,無法推出目標位置。`)
    console.error(`  目前位置:${projectDir}`)
    process.exitCode = 1
    return
  }

  const targetStats = await stat(targetDir).catch(() => null)

  if (!targetStats?.isDirectory()) {
    console.error(`[sync-to-public] 中止:目標目錄不存在。`)
    console.error(`  ${targetDir}`)
    console.error(`  請先 clone 發布用的 repo 到 ${PUBLIC_SEGMENT} 側。`)
    process.exitCode = 1
    return
  }

  const [sourceBranch, targetBranch] = await Promise.all([
    getBranch(projectDir),
    getBranch(targetDir),
  ])

  if (!targetBranch) {
    console.error(`[sync-to-public] 中止:目標端不是 git repo。`)
    console.error(`  ${targetDir}`)
    process.exitCode = 1
    return
  }

  if (sourceBranch !== targetBranch) {
    console.error(`[sync-to-public] 中止:分支不一致,不動目標端的工作區。`)
    console.error(`  來源 ${projectName}:${sourceBranch}`)
    console.error(`  目標 ${PUBLIC_SEGMENT}:${targetBranch}`)
    console.error(`  請先把目標端切到 ${sourceBranch} 再重跑。`)
    process.exitCode = 1
    return
  }

  // staging 是「套用排除規則後的乾淨副本」:壓縮與同步都以它為準,來源只遍歷一次
  await rm(stagingDir, { recursive: true, force: true })
  await mkdir(path.dirname(stagingDir), { recursive: true })
  await copyFiltered(projectDir, stagingDir)

  // zip 放專案根目錄。它已列在排除規則裡,不會被打包進下一次的壓縮檔,也不會同步到目標端;
  // 版控則由 .gitignore 的 *.zip 擋掉。
  const zipName = `${projectName}_${sourceBranch}_${formatTimestamp()}.zip`
  const zipPath = path.join(projectDir, zipName)

  await createArchive(zipPath)

  const removed = await removeStaleEntries(targetDir, stagingDir)

  await cp(stagingDir, targetDir, { recursive: true, force: true })
  await rm(stagingDir, { recursive: true, force: true })

  console.log(`[sync-to-public] 完成(分支 ${sourceBranch})`)
  console.log(`  壓縮檔:${path.relative(projectDir, zipPath)}`)
  console.log(`  已同步:${targetDir}`)

  if (removed.length) {
    console.log(`  已移除目標端多餘項目:${removed.join(', ')}`)
  }
}

main().catch((error) => {
  console.error('[sync-to-public] 執行失敗。')
  console.error(error)
  process.exitCode = 1
})
