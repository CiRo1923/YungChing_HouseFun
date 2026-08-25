// build / deploy 成功後,把專案原始碼同步到 Public 側的發布 repo,並留一份 zip 備份。
//
// 路徑不寫死:從目前專案往上找路徑中的 `Dev` 段,換成 `Public`,其餘結構原樣保留。
//   D:/任意路徑/YungChing/Dev/HouseFun/Official
//   → D:/任意路徑/YungChing/Public/HouseFun/Official
// 每台電腦的前綴不同也能對得上。
//
// 同步與壓縮的排除規則不同,刻意分成兩套:
//   同步 —— 只送原始碼,建置產物與依賴由目標端自己產生;
//   壓縮 —— 是整包備份,node_modules 與建置產物都要收進去,能直接還原成可跑的專案。

import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import { spawn } from 'node:child_process'

// 兩邊都不要的項目:AI 工具設定與內部文件,對發布與備份都沒有意義。
// .acceptance 是驗收測試報告(含規格比對與缺陷清單),屬對內資料,不隨原始碼出去。
const TOOLING_NAMES = ['.claude', '.agents', 'docs', '.acceptance']

// 同步時額外排除:建置產物、依賴,以及先前產生的壓縮檔
const SYNC_EXCLUDE_NAMES = new Set([
  ...TOOLING_NAMES,
  '.nuxt',
  '.output',
  '.nitro',
  '.data',
  '.cache',
  'node_modules',
  'dist',
])

// 壓縮時只拿掉工具設定與文件,其餘一律收進壓縮檔
const ARCHIVE_EXCLUDE_NAMES = new Set(TOOLING_NAMES)

// 壓縮檔本身一定要排除,否則會把上一份備份疊進這一份、愈滾愈大
const ARCHIVE_EXTENSION = '.zip'
const EXCLUDE_EXTENSIONS = new Set([ARCHIVE_EXTENSION])

// 目標端獨有、同步時絕對不能碰的項目(否則會毀掉對方的版控與依賴)
const TARGET_KEEP_NAMES = new Set(['.git', 'node_modules'])

const DEV_SEGMENT = 'Dev'
const PUBLIC_SEGMENT = 'Public'

const projectDir = process.cwd()
const projectName = path.basename(projectDir)
// staging 必須放在專案「外面」:fs.cp 不允許目的地是來源的子目錄(EINVAL),
// 放在 .cache 底下會直接失敗。用系統暫存目錄,pid 避免同時跑兩個專案時互相蓋掉。
const stagingDir = path.join(os.tmpdir(), `sync-to-public-${projectName}-${process.pid}`)

function isExcluded(name, excludeNames) {
  return excludeNames.has(name) || EXCLUDE_EXTENSIONS.has(path.extname(name).toLowerCase())
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

// inherit:把子行程的輸出直接接到終端機。push 要用它 —— 傳輸進度要看得到,
// 憑證管理員要跳出來問也才有地方問;代價是拿不到 stdout/stderr 字串。
function runCommand(command, args, options = {}) {
  const { inherit = false, ...spawnOptions } = options

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      ...spawnOptions,
      stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (chunk) => (stdout += chunk))
    child.stderr?.on('data', (chunk) => (stderr += chunk))
    child.on('error', (error) => resolve({ code: 1, stdout, stderr: error.message }))
    child.on('exit', (code) => resolve({ code: code ?? 1, stdout: stdout.trim(), stderr }))
  })
}

async function getBranch(cwd) {
  const { code, stdout } = await runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd })

  return code === 0 ? stdout : null
}

async function hasRef(cwd, ref) {
  const { code } = await runCommand('git', ['rev-parse', '--verify', '--quiet', ref], { cwd })

  return code === 0
}

// 把目標端切到跟來源同一條分支;沒有這條分支就開一條。
// 遠端已經有同名分支時從它開,新分支才接得上 origin,之後 push 不用再指定 upstream。
// 不用 -f:目標端若有未提交的東西,寧可停下來讓人看一眼,也不要無聲蓋掉。
async function alignBranch(targetDir, branch) {
  if (await hasRef(targetDir, `refs/heads/${branch}`)) {
    const { code, stderr } = await runCommand('git', ['checkout', branch], { cwd: targetDir })

    if (code !== 0) throw new Error(`目標端切換到 ${branch} 失敗:${stderr.trim() || '未知錯誤'}`)

    return '已切換'
  }

  const fromRemote = await hasRef(targetDir, `refs/remotes/origin/${branch}`)
  const args = fromRemote
    ? ['checkout', '-b', branch, `origin/${branch}`]
    : ['checkout', '-b', branch]

  const { code, stderr } = await runCommand('git', args, { cwd: targetDir })

  if (code !== 0) throw new Error(`目標端建立分支 ${branch} 失敗:${stderr.trim() || '未知錯誤'}`)

  return fromRemote ? '已從 origin 建立' : '已新建'
}

// 問一句 y/N。沒有 TTY(接在 build pipeline 後面、被別的腳本串起來跑)就當作否 ——
// 自動化流程不能卡在等人按 Enter,而 push 這種對外動作也不該無人看管就送出去。
async function confirm(question) {
  if (!process.stdin.isTTY) return false

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(`${question}(y/N) `)

  rl.close()

  return /^y(es)?$/i.test(answer.trim())
}

async function describeSource() {
  const { code, stdout } = await runCommand('git', ['log', '-1', '--format=%h %s'], {
    cwd: projectDir,
  })

  return code === 0 ? stdout : null
}

// 提交並推送目標端。路徑一律限定在這個子專案:發布 repo 底下還有別的專案,
// 不能順手把人家沒完成的東西一起送上去。
async function commitAndPush(targetDir, branch, message) {
  const added = await runCommand('git', ['add', '-A', '--', '.'], { cwd: targetDir })

  if (added.code !== 0) throw new Error(`git add 失敗:${added.stderr.trim() || '未知錯誤'}`)

  const pending = await runCommand('git', ['status', '--porcelain', '--', '.'], { cwd: targetDir })

  if (!pending.stdout) return '目標端沒有變更,不需要提交'

  const committed = await runCommand('git', ['commit', '-m', message], { cwd: targetDir })

  if (committed.code !== 0) {
    throw new Error(`git commit 失敗:${committed.stderr.trim() || committed.stdout || '未知錯誤'}`)
  }

  const pushed = await runCommand('git', ['push', '-u', 'origin', branch], {
    cwd: targetDir,
    inherit: true,
  })

  if (pushed.code !== 0) {
    throw new Error(`git push 失敗。commit 已經留在本地,排除問題後可自行再 push 一次。`)
  }

  return `已提交並推送到 origin/${branch}`
}

// 依排除規則複製整棵目錄。cp 的 filter 是逐項呼叫,回傳 false 該項連同子孫都不複製。
async function copyFiltered(source, destination) {
  await cp(source, destination, {
    recursive: true,
    filter: (src) => !isExcluded(path.basename(src), SYNC_EXCLUDE_NAMES),
  })
}

// 同步前先把目標端清空,再整包複製過去。
// 不逐項比對差異的原因:那只看得到頂層,子目錄裡被刪除 / 改名的檔案清不掉,
// 而 cp 只覆蓋不刪除,殘骸會一直累積(實測 layouts/common.vue 這種已刪檔案還留在目標端)。
// .git 與 node_modules 一律保留 —— 那是目標端自己的東西,砍掉會毀掉對方的版控與依賴。
async function clearTarget(targetDir) {
  const entries = await readdir(targetDir).catch(() => [])
  const cleared = []

  for (const name of entries) {
    if (TARGET_KEEP_NAMES.has(name)) continue

    await rm(path.join(targetDir, name), { recursive: true, force: true })
    cleared.push(name)
  }

  return cleared
}

// 用 Windows 內建的 tar(bsdtar / libarchive)產生 zip。PowerShell 那兩條路都不行:
//   Compress-Archive 以 `目錄\*` 當來源時只收頂層項目,子目錄不會遞迴進去(實測 pages/ 整個消失);
//   [System.IO.Compression.ZipFile] 在 Windows PowerShell 5.1 底下的 .NET Framework,
//   會把 entry 名稱寫成反斜線,違反 ZIP 規範(規範要求 `/`)。解壓工具會把
//   `pages\buy\index.vue` 整串當成一個檔名,還原出一堆沒有目錄結構的平坦檔案。
// tar.exe 自 Windows 10 1803 起內建,同樣不需要 7-Zip / WinRAR。
// 壓縮前先把先前留下的壓縮檔清掉:檔名帶時間戳,不清的話每跑一次就多囤一份近百 MB。
async function removeOldArchives() {
  const entries = await readdir(projectDir)
  const stale = entries.filter((name) => path.extname(name).toLowerCase() === ARCHIVE_EXTENSION)

  for (const name of stale) {
    await rm(path.join(projectDir, name), { force: true })
  }

  return stale
}

// 傳頂層項目而不是 `.`,是為了讓壓縮檔內的路徑不帶 `./` 前綴;
// 同時也是排除規則的落點 —— 被排除的項目根本不會出現在參數裡。
async function createArchive(zipPath) {
  const entries = (await readdir(projectDir)).filter(
    (name) => !isExcluded(name, ARCHIVE_EXCLUDE_NAMES),
  )

  if (!entries.length) throw new Error('壓縮失敗:沒有可打包的內容。')

  const { code, stderr } = await runCommand('tar.exe', [
    '-a',
    '-c',
    '-f',
    zipPath,
    '-C',
    projectDir,
    ...entries,
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

  // 分支不一致就先把目標端對齊,再開始同步 —— 不然會把 B 分支的內容蓋到 A 分支上。
  const branchAction = sourceBranch === targetBranch ? null : await alignBranch(targetDir, sourceBranch)

  // 先壓縮再同步:壓縮直接讀專案目錄,萬一失敗就不會動到目標端的工作區。
  // zip 放專案根目錄。它已列在排除規則裡,不會被打包進下一次的壓縮檔,也不會同步到目標端;
  // 版控則由 .gitignore 的 *.zip 擋掉。
  const zipName = `${projectName}_${sourceBranch}_${formatTimestamp()}${ARCHIVE_EXTENSION}`
  const zipPath = path.join(projectDir, zipName)
  const oldArchives = await removeOldArchives()

  await createArchive(zipPath)

  // staging 是「套用同步排除規則後的乾淨副本」:先備妥它,再清空目標端,
  // 這樣目標端被清空到重建之間的空窗最短,中途失敗也還留著 staging 可用。
  await rm(stagingDir, { recursive: true, force: true })
  await mkdir(path.dirname(stagingDir), { recursive: true })
  await copyFiltered(projectDir, stagingDir)

  const cleared = await clearTarget(targetDir)

  await cp(stagingDir, targetDir, { recursive: true, force: true })
  await rm(stagingDir, { recursive: true, force: true })

  const { size } = await stat(zipPath)

  console.log(`[sync-to-public] 完成(分支 ${sourceBranch})`)
  console.log(`  壓縮檔:${path.relative(projectDir, zipPath)}(${(size / 1024 ** 2).toFixed(1)} MB)`)
  console.log(`  已同步:${targetDir}`)
  console.log(`  同步前清除項目:${cleared.length}(保留 ${[...TARGET_KEEP_NAMES].join(' / ')})`)

  if (oldArchives.length) {
    console.log(`  已刪除舊壓縮檔:${oldArchives.join(', ')}`)
  }

  if (branchAction) {
    console.log(`  目標端分支:${targetBranch} → ${sourceBranch}(${branchAction})`)
  }

  // 同步只把檔案放到目標端的工作區,推不推上去是另一個決定,問過再說。
  const source = await describeSource()

  if (!(await confirm(`\n要把 ${PUBLIC_SEGMENT} 側的變更 commit + push 到 origin/${sourceBranch} 嗎?`))) {
    console.log(`  發布:略過。變更留在 ${targetDir},可自行提交。`)
    return
  }

  const message = source ? `Sync ${projectName} from ${DEV_SEGMENT} @ ${source}` : `Sync ${projectName}`

  console.log(`  發布:${await commitAndPush(targetDir, sourceBranch, message)}`)
}

main().catch((error) => {
  console.error('[sync-to-public] 執行失敗。')
  console.error(error)
  process.exitCode = 1
})
