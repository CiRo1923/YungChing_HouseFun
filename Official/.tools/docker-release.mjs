/**
 * 建置後的 Docker 發布流程（取代 src/docker/**\/*.bat 的手動操作）
 *
 * 用法：node tools/docker-release.mjs <產出目錄>
 *   dist  → deploy 模式產物（SIT）
 *   build → build 模式產物（正式）
 *
 * AppServiceName 由產出目錄內的 .bat 解析（vite-plugin-static-copy 會把
 * src/docker/<dir>/ 整包複製過去），維持與 .bat 單一來源、不重複定義。
 *
 * 略過 docker 流程：SKIP_DOCKER=1 npm run build
 */
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { spawnSync } from 'node:child_process'

const REGISTRY = 'sugarfun.azurecr.io'
const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[41;97m',
  yellow: '\x1b[43;97m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
}

const die = (msg) => {
  console.error(`\n${C.red} ${msg} ${C.reset}\n`)
  process.exit(1)
}

const outDir = process.argv[2]
if (!outDir) die('未指定產出目錄，用法：node tools/docker-release.mjs <dist|build>')

const root = process.cwd()
const context = path.resolve(root, outDir)

if (process.env.SKIP_DOCKER === '1') {
  console.log(`${C.dim}[docker-release] SKIP_DOCKER=1，略過 docker 流程${C.reset}`)
  process.exit(0)
}

if (!fs.existsSync(context)) die(`找不到產出目錄 ${outDir}，請先執行建置。`)
if (!fs.existsSync(path.join(context, 'Dockerfile')))
  die(`${outDir}/ 內沒有 Dockerfile，請確認 vite-plugin-static-copy 有複製 src/docker/${outDir}/。`)

// 從 .bat 解析 AppServiceName（單一來源）
const bat = fs.readdirSync(context).find((f) => /\.bat$/i.test(f))
if (!bat) die(`${outDir}/ 內找不到 .bat，無法取得 AppServiceName。`)

const batContent = fs.readFileSync(path.join(context, bat), 'utf8')
const matched = batContent.match(/set\s+AppServiceName=(\S+)/i)
if (!matched) die(`${bat} 內解析不到 set AppServiceName=，請確認格式。`)

const appServiceName = matched[1].trim()
const image = `${REGISTRY}/${appServiceName}:latest`

console.log('')
console.log(`${C.cyan}──────── Docker 發布確認 ────────${C.reset}`)
console.log(`  產出目錄     : ${outDir}/`)
console.log(`  來源 .bat    : ${bat}`)
console.log(`  App Service  : ${C.yellow} ${appServiceName} ${C.reset}`)
console.log(`  Image        : ${image}`)
console.log(
  `  動作         : docker build → docker push${C.dim}（會覆蓋 ACR 上的 latest）${C.reset}`
)
console.log(`${C.cyan}─────────────────────────────────${C.reset}`)

// 非互動環境（CI、被其他程式呼叫）一律中止，避免在沒人確認的情況下推上去
if (!process.stdin.isTTY) {
  console.log('')
  console.log(`${C.dim}非互動環境，未執行 docker。要略過此步驟請設 SKIP_DOCKER=1。${C.reset}`)
  process.exit(0)
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const answer = await new Promise((resolve) =>
  rl.question(`\n確認發布到 ${C.yellow} ${appServiceName} ${C.reset}？(y/N) `, resolve)
)
rl.close()

if (!/^y(es)?$/i.test(answer.trim())) {
  console.log(`\n${C.dim}已取消，未執行 docker。${C.reset}\n`)
  process.exit(0)
}

const run = (label, args) => {
  console.log(`\n${C.cyan}▸ ${label}${C.reset}`)
  const res = spawnSync('docker', args, { cwd: context, stdio: 'inherit', shell: false })

  if (res.error) die(`${label} 失敗：${res.error.message}`)
  if (res.status !== 0) {
    const hint = label === 'docker push' ? `\n若是認證失敗，請先執行：docker login ${REGISTRY}` : ''
    die(`${label} 失敗（exit ${res.status}）。${hint}`)
  }
}

run('docker build', ['build', '-t', image, '.'])
run('docker push', ['push', image])

console.log('')
console.log(`${C.green}✓ 已推送 ${image}${C.reset}`)
console.log(`${C.yellow} 請手動重啟 Azure App Service ${appServiceName} ${C.reset}`)
console.log('')
